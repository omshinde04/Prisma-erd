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

function buildOptions(nodePlacementStrategy) {
  return {
    "elk.algorithm": "layered",
    "elk.direction": "RIGHT",
    "elk.edgeRouting": "ORTHOGONAL",
    "elk.layered.nodePlacement.strategy": nodePlacementStrategy,
    "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
    "elk.layered.crossingMinimization.semiInteractive": "true",
    "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
    "elk.layered.cycleBreaking.strategy": "GREEDY",
    "elk.layered.spacing.nodeNodeBetweenLayers": "84",
    "elk.layered.spacing.edgeNodeBetweenLayers": "34",
    "elk.layered.spacing.edgeEdgeBetweenLayers": "20",
    "elk.layered.unnecessaryBendpoints": "false",
    "elk.spacing.nodeNode": "42",
    "elk.padding": "[top=48,left=48,bottom=48,right=48]",
  };
}

async function timeAt(modelCount, nodePlacementStrategy) {
  const schemaText = generateSyntheticSchema(modelCount);
  const { graph } = await generateBrowserErd(schemaText);
  const mappedGraph = mapGraphToReactFlow(graph);
  const elk = new ELK();
  const elkGraph = {
    id: "root",
    layoutOptions: buildOptions(nodePlacementStrategy),
    children: mappedGraph.nodes.map((node) => ({
      id: node.id,
      width: Number(node.style?.width ?? 360),
      height: 220,
    })),
    edges: mappedGraph.edges.map((edge) => ({ id: edge.id, sources: [edge.source], targets: [edge.target] })),
  };
  const start = performance.now();
  await elk.layout(elkGraph);
  const end = performance.now();
  return end - start;
}

for (const modelCount of [100, 300, 600, 1000]) {
  const networkSimplexTime = await timeAt(modelCount, "NETWORK_SIMPLEX");
  const simpleTime = await timeAt(modelCount, "SIMPLE");
  console.log(
    `${modelCount} models: NETWORK_SIMPLEX=${networkSimplexTime.toFixed(0)}ms  SIMPLE=${simpleTime.toFixed(0)}ms  speedup=${(networkSimplexTime / simpleTime).toFixed(1)}x`,
  );
}
