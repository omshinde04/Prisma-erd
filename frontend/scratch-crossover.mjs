import ELK from "elkjs/lib/elk.bundled.js";
import { generateBrowserErd } from "./src/lib/browser-erd-generator.js";
import { mapGraphToReactFlow } from "./src/lib/react-flow-mapper.js";

function generateSyntheticSchema(modelCount, fieldsPerModel = 6, fkFanout = 2) {
  const lines = [];
  for (let i = 0; i < modelCount; i += 1) {
    lines.push(`model model_${i} {`);
    lines.push(`  id String @id @default(uuid()) @db.Uuid`);
    for (let f = 0; f < fieldsPerModel; f += 1) lines.push(`  attr_${f} String?`);
    const fkTargets = [];
    for (let k = 0; k < fkFanout; k += 1) {
      const targetIndex = Math.max(0, i - 1 - k * 3);
      if (targetIndex !== i) fkTargets.push(targetIndex);
    }
    for (const targetIndex of [...new Set(fkTargets)]) {
      lines.push(`  ref_${targetIndex}_id String? @db.Uuid`);
      lines.push(`  rel_${targetIndex} model_${targetIndex}? @relation("rel_${i}_${targetIndex}", fields: [ref_${targetIndex}_id], references: [id])`);
    }
    lines.push(`}`, "");
  }
  const reverseFieldsByModel = new Map();
  for (let i = 0; i < modelCount; i += 1) {
    for (let k = 0; k < fkFanout; k += 1) {
      const targetIndex = Math.max(0, i - 1 - k * 3);
      if (targetIndex !== i) {
        if (!reverseFieldsByModel.has(targetIndex)) reverseFieldsByModel.set(targetIndex, []);
        reverseFieldsByModel.get(targetIndex).push(i);
      }
    }
  }
  const fullText = lines.join("\n");
  return fullText.replace(/model (model_\d+) \{([\s\S]*?)\}/g, (match, name, body) => {
    const index = Number(name.split("_")[1]);
    const reverseSources = [...new Set(reverseFieldsByModel.get(index) ?? [])];
    const reverseLines = reverseSources
      .map((sourceIndex) => `  reverse_${sourceIndex} model_${sourceIndex}[] @relation("rel_${sourceIndex}_${index}")`)
      .join("\n");
    return `model ${name} {${body}${reverseLines ? reverseLines + "\n" : ""}}`;
  });
}

async function timeAt(modelCount, strategy) {
  const schemaText = generateSyntheticSchema(modelCount);
  const { graph } = await generateBrowserErd(schemaText);
  const mappedGraph = mapGraphToReactFlow(graph);
  const elk = new ELK();
  const elkGraph = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "RIGHT",
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.layered.nodePlacement.strategy": strategy,
      "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
      "elk.layered.cycleBreaking.strategy": "GREEDY",
      "elk.spacing.nodeNode": "42",
      "elk.layered.spacing.nodeNodeBetweenLayers": "84",
    },
    children: mappedGraph.nodes.map((node) => ({ id: node.id, width: 360, height: 220 })),
    edges: mappedGraph.edges.map((edge) => ({ id: edge.id, sources: [edge.source], targets: [edge.target] })),
  };
  const start = performance.now();
  await elk.layout(elkGraph);
  return performance.now() - start;
}

for (const modelCount of [50, 88, 120, 150, 200]) {
  const ns = await timeAt(modelCount, "NETWORK_SIMPLEX");
  const simple = await timeAt(modelCount, "SIMPLE");
  console.log(`${modelCount} models: NETWORK_SIMPLEX=${ns.toFixed(0)}ms  SIMPLE=${simple.toFixed(0)}ms`);
}
