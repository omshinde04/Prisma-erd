import { z } from 'zod';

export const erdNodeSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['model', 'enum', 'composite']),
  label: z.string().min(1),
  data: z.record(z.string(), z.unknown()),
});

export const erdEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['relation']),
  data: z.record(z.string(), z.unknown()),
});

export const erdGraphSchema = z.object({
  nodes: z.array(erdNodeSchema),
  edges: z.array(erdEdgeSchema),
  metadata: z.object({
    generatedAt: z.string().datetime(),
    nodeCount: z.number().int().nonnegative(),
    edgeCount: z.number().int().nonnegative(),
  }),
});

export function createEmptyErdGraph() {
  return erdGraphSchema.parse({
    nodes: [],
    edges: [],
    metadata: {
      generatedAt: new Date().toISOString(),
      nodeCount: 0,
      edgeCount: 0,
    },
  });
}
