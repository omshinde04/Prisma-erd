import ELK from "elkjs/lib/elk.bundled.js";
import { generateBrowserErd } from "./src/lib/browser-erd-generator.js";
import { mapGraphToReactFlow } from "./src/lib/react-flow-mapper.js";

function generateSyntheticSchema(modelCount, fieldsPerModel = 6, fkFanout = 2) {
  const lines = [];

  for (let i = 0; i < modelCount; i += 1) {
    const modelName = `model_${i}`;
    lines.push(`model ${modelName} {`);
    lines.push(`  id String @id @default(uuid()) @db.Uuid`);
    for (let f = 0; f < fieldsPerModel; f += 1) {
      lines.push(`  attr_${f} String?`);
    }
    const fkTargets = [];
    for (let k = 0; k < fkFanout; k += 1) {
      const targetIndex = Math.max(0, i - 1 - k * 3);
      if (targetIndex !== i) fkTargets.push(targetIndex);
    }
    for (const targetIndex of [...new Set(fkTargets)]) {
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
  const modelBlockPattern = /model (model_\d+) \{([\s\S]*?)\}/g;
  return fullText.replace(modelBlockPattern, (match, name, body) => {
    const index = Number(name.split("_")[1]);
    const reverseSources = [...new Set(reverseFieldsByModel.get(index) ?? [])];
    const reverseLines = reverseSources
      .map((sourceIndex) => `  reverse_${sourceIndex} model_${sourceIndex}[] @relation("rel_${sourceIndex}_${index}")`)
      .join("\n");
    return `model ${name} {${body}${reverseLines ? reverseLines + "\n" : ""}}`;
  });
}

const MODEL_COUNT = 600;
const schemaText = generateSyntheticSchema(MODEL_COUNT);
const { graph } = await generateBrowserErd(schemaText);
const mappedGraph = mapGraphToReactFlow(graph);

const DEFAULT_NODE_WIDTH = 360;
const DEFAULT_NODE_HEIGHT = 220;

function toElkGraph(graph, layoutOptions) {
  return {
    id: "root",
    layoutOptions,
    children: graph.nodes.map((node) => ({
      id: node.id,
      width: Number(node.style?.width ?? DEFAULT_NODE_WIDTH),
      height: DEFAULT_NODE_HEIGHT,
    })),
    edges: graph.edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };
}

async function timeLayout(label, layoutOptions) {
  const elk = new ELK();
  const elkGraph = toElkGraph(mappedGraph, layoutOptions);
  const start = performance.now();
  await elk.layout(elkGraph);
  const end = performance.now();
  console.log(`${label}: ${(end - start).toFixed(1)} ms`);
}

console.log(`Benchmarking ELK layout options at ${MODEL_COUNT} models / ${mappedGraph.edges.length} edges\n`);

await timeLayout("Baseline (current app settings, ORTHOGONAL)", {
  "elk.algorithm": "layered",
  "elk.direction": "RIGHT",
  "elk.edgeRouting": "ORTHOGONAL",
  "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
  "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
  "elk.layered.crossingMinimization.semiInteractive": "true",
  "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
  "elk.layered.cycleBreaking.strategy": "GREEDY",
  "elk.layered.spacing.nodeNodeBetweenLayers": "84",
  "elk.layered.spacing.edgeNodeBetweenLayers": "34",
  "elk.layered.spacing.edgeEdgeBetweenLayers": "20",
  "elk.layered.unnecessaryBendpoints": "false",
  "elk.spacing.nodeNode": "42",
});

await timeLayout("POLYLINE edge routing instead of ORTHOGONAL", {
  "elk.algorithm": "layered",
  "elk.direction": "RIGHT",
  "elk.edgeRouting": "POLYLINE",
  "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
  "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
  "elk.layered.cycleBreaking.strategy": "GREEDY",
  "elk.spacing.nodeNode": "42",
});

await timeLayout("ORTHOGONAL, semiInteractive OFF", {
  "elk.algorithm": "layered",
  "elk.direction": "RIGHT",
  "elk.edgeRouting": "ORTHOGONAL",
  "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
  "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
  "elk.layered.cycleBreaking.strategy": "GREEDY",
  "elk.spacing.nodeNode": "42",
});

await timeLayout("ORTHOGONAL, SIMPLE nodePlacement (cheaper than NETWORK_SIMPLEX)", {
  "elk.algorithm": "layered",
  "elk.direction": "RIGHT",
  "elk.edgeRouting": "ORTHOGONAL",
  "elk.layered.nodePlacement.strategy": "SIMPLE",
  "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
  "elk.layered.cycleBreaking.strategy": "GREEDY",
  "elk.spacing.nodeNode": "42",
});

await timeLayout("mrtree algorithm (tree-like, much cheaper)", {
  "elk.algorithm": "mrtree",
  "elk.direction": "RIGHT",
  "elk.spacing.nodeNode": "42",
});
