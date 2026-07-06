import ELK from "elkjs/lib/elk.bundled.js";

const elk = new ELK();

const DEFAULT_NODE_WIDTH = 360;
const DEFAULT_NODE_HEIGHT = 220;

export function estimateNodeHeight(node) {
  const sections = Array.isArray(node.data.sections) ? node.data.sections : [];
  const enumValues = Array.isArray(node.data.enumValues)
    ? node.data.enumValues
    : [];
  const footer = node.data.footer ?? null;

  if (enumValues.length > 0) {
    return Math.max(170, 84 + enumValues.length * 28);
  }

  const estimatedSectionHeight = sections.reduce((total, section) => {
    const fieldCount = Array.isArray(section.fields)
      ? section.fields.length
      : 0;
    const visibleFieldCount = section.collapsed
      ? Math.min(fieldCount, 6)
      : fieldCount;
    const tableHeadHeight = section.id === "columns" ? 34 : 0;
    return total + 36 + tableHeadHeight + Math.max(visibleFieldCount, 1) * 42;
  }, 0);

  const footerHeight = footer ? 96 : 0;

  return Math.max(
    DEFAULT_NODE_HEIGHT,
    78 + estimatedSectionHeight + footerHeight,
  );
}

// Node placement strategy benchmarked against synthetic schemas of 50-4000
// models: NETWORK_SIMPLEX produces marginally more balanced layouts but scales
// near-quadratically (10s+ at 600 models, 30s+ and stack-overflow risk at
// 1000+). SIMPLE is 5-46x faster at every tested scale with no observed
// layout-quality regression worth the cost. Do not revert without re-running
// that benchmark.
export async function layoutGraph(graph) {
  const elkGraph = {
    id: "prisma-erd-root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "RIGHT",
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.layered.nodePlacement.strategy": "SIMPLE",
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
    },
    children: graph.nodes.map((node) => ({
      id: node.id,
      width: Number(node.style?.width ?? DEFAULT_NODE_WIDTH),
      height: estimateNodeHeight(node),
    })),
    edges: graph.edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };

  const layoutedGraph = await elk.layout(elkGraph);

  const nodes = graph.nodes.map((node) => {
    const layoutedNode = layoutedGraph.children.find(
      (child) => child.id === node.id,
    );

    return {
      ...node,
      position: {
        x: layoutedNode?.x ?? 0,
        y: layoutedNode?.y ?? 0,
      },
    };
  });

  return {
    nodes,
    edges: graph.edges,
  };
}
