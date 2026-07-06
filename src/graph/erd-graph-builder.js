import { erdGraphSchema } from './graph-contracts.js';
import { buildGraphNodes } from './node-builder.js';
import { buildGraphEdges } from './edge-builder.js';

export function buildErdGraph(parseResult) {
  const nodes = buildGraphNodes(parseResult);
  const edges = buildGraphEdges(parseResult);

  return erdGraphSchema.parse({
    nodes,
    edges,
    metadata: {
      generatedAt: new Date().toISOString(),
      nodeCount: nodes.length,
      edgeCount: edges.length,
    },
  });
}
