import { generateBrowserErd } from "./src/lib/browser-erd-generator.js";
import { mapGraphToReactFlow } from "./src/lib/react-flow-mapper.js";
import { layoutGraph } from "./src/lib/elk-layout.js";

function generateSyntheticSchema(modelCount, fieldsPerModel = 6, fkFanout = 2) {
  const lines = [];

  for (let i = 0; i < modelCount; i += 1) {
    const modelName = `model_${i}`;
    lines.push(`model ${modelName} {`);
    lines.push(`  id String @id @default(uuid()) @db.Uuid`);

    for (let f = 0; f < fieldsPerModel; f += 1) {
      lines.push(`  attr_${f} String?`);
    }

    // Each model gets FKs pointing "backward" to a few earlier models,
    // simulating a realistic dense relational schema (not a simple chain).
    const fkTargets = [];
    for (let k = 0; k < fkFanout; k += 1) {
      const targetIndex = Math.max(0, i - 1 - k * 3);
      if (targetIndex !== i) {
        fkTargets.push(targetIndex);
      }
    }

    const uniqueTargets = [...new Set(fkTargets)];
    for (const targetIndex of uniqueTargets) {
      const targetModel = `model_${targetIndex}`;
      const fkFieldName = `ref_${targetIndex}_id`;
      lines.push(`  ${fkFieldName} String? @db.Uuid`);
      lines.push(
        `  rel_${targetIndex} ${targetModel}? @relation("rel_${i}_${targetIndex}", fields: [${fkFieldName}], references: [id])`,
      );
    }

    lines.push(`}`);
    lines.push("");
  }

  // Add reverse list fields so relations are bidirectionally declared,
  // matching realistic Prisma schema shape.
  const reverseFieldsByModel = new Map();
  for (let i = 0; i < modelCount; i += 1) {
    for (let k = 0; k < fkFanout; k += 1) {
      const targetIndex = Math.max(0, i - 1 - k * 3);
      if (targetIndex !== i) {
        if (!reverseFieldsByModel.has(targetIndex)) {
          reverseFieldsByModel.set(targetIndex, []);
        }
        reverseFieldsByModel.get(targetIndex).push(i);
      }
    }
  }

  const fullText = lines.join("\n");

  // Inject reverse relation fields right before the closing brace of each target model.
  const modelBlockPattern = /model (model_\d+) \{([\s\S]*?)\}/g;
  const rebuilt = fullText.replace(modelBlockPattern, (match, name, body) => {
    const index = Number(name.split("_")[1]);
    const reverseSources = [...new Set(reverseFieldsByModel.get(index) ?? [])];
    const reverseLines = reverseSources
      .map(
        (sourceIndex) =>
          `  reverse_${sourceIndex} model_${sourceIndex}[] @relation("rel_${sourceIndex}_${index}")`,
      )
      .join("\n");

    return `model ${name} {${body}${reverseLines ? reverseLines + "\n" : ""}}`;
  });

  return rebuilt;
}

async function runScaleTest(modelCount) {
  const schemaText = generateSyntheticSchema(modelCount);

  const parseStart = performance.now();
  const { parseResult, graph } = await generateBrowserErd(schemaText);
  const parseEnd = performance.now();

  const mapStart = performance.now();
  const mappedGraph = mapGraphToReactFlow(graph);
  const mapEnd = performance.now();

  const layoutStart = performance.now();
  const layoutedGraph = await layoutGraph(mappedGraph);
  const layoutEnd = performance.now();

  console.log(`\n=== ${modelCount} models ===`);
  console.log("models:", parseResult.metadata.modelCount);
  console.log("relations:", parseResult.metadata.relationCount);
  console.log("nodes:", layoutedGraph.nodes.length);
  console.log("edges:", layoutedGraph.edges.length);
  console.log("parse+graph time:", (parseEnd - parseStart).toFixed(1), "ms");
  console.log("react-flow mapping time:", (mapEnd - mapStart).toFixed(1), "ms");
  console.log("ELK layout time:", (layoutEnd - layoutStart).toFixed(1), "ms");
  console.log(
    "TOTAL time:",
    (layoutEnd - parseStart).toFixed(1),
    "ms",
  );
}

for (const count of [100, 300, 600, 1000]) {
  await runScaleTest(count);
}
