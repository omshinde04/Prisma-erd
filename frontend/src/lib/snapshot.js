import { z } from 'zod';

const fieldSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  kind: z.enum(['scalar', 'relation', 'unknown']),
  isList: z.boolean(),
  isOptional: z.boolean(),
  attributes: z.array(z.string()),
});

const parseResultSchema = z.object({
  source: z.object({
    type: z.enum(['inline', 'file']),
    content: z.string().min(1),
    origin: z.string().min(1),
    filePath: z.string().nullable(),
    encoding: z.string().min(1),
  }),
  models: z.array(
    z.object({
      name: z.string().min(1),
      fields: z.array(fieldSchema),
      blockAttributes: z.array(z.string()),
    })
  ),
  enums: z.array(
    z.object({
      name: z.string().min(1),
      values: z.array(z.object({ name: z.string().min(1) })),
    })
  ),
  compositeTypes: z.array(z.object({ name: z.string().min(1) })),
  relations: z.array(
    z.object({
      from: z.string().min(1),
      to: z.string().min(1),
      field: z.string().min(1),
      arity: z.enum(['one', 'many']),
      attributes: z.array(z.string()),
    })
  ),
  indexes: z.array(z.object({ model: z.string().min(1), fields: z.array(z.string()) })),
  constraints: z.array(
    z.object({
      model: z.string().min(1),
      type: z.string().min(1),
      fields: z.array(z.string()),
    })
  ),
  metadata: z.object({
    contentLength: z.number().int().nonnegative(),
    modelCount: z.number().int().nonnegative(),
    enumCount: z.number().int().nonnegative(),
    relationCount: z.number().int().nonnegative(),
  }),
});

const graphSchema = z.object({
  nodes: z.array(
    z.object({
      id: z.string().min(1),
      type: z.enum(['model', 'enum', 'composite']),
      label: z.string().min(1),
      data: z.record(z.string(), z.unknown()),
    })
  ),
  edges: z.array(
    z.object({
      id: z.string().min(1),
      source: z.string().min(1),
      target: z.string().min(1),
      label: z.string().min(1),
      type: z.enum(['relation']),
      data: z.record(z.string(), z.unknown()),
    })
  ),
  metadata: z.object({
    generatedAt: z.string().datetime(),
    nodeCount: z.number().int().nonnegative(),
    edgeCount: z.number().int().nonnegative(),
  }),
});

const snapshotSchema = z.object({
  version: z.literal(1),
  schema: z.string().min(1),
  parseResult: parseResultSchema,
  graph: graphSchema,
  metadata: z.object({
    exportedAt: z.string().datetime(),
    source: z.literal('prisma-erd'),
  }),
});

export function createSnapshot({ schema, parseResult, graph }) {
  return snapshotSchema.parse({
    version: 1,
    schema,
    parseResult,
    graph,
    metadata: {
      exportedAt: new Date().toISOString(),
      source: 'prisma-erd',
    },
  });
}

export async function loadSnapshotFromFile(file) {
  const content = await file.text();
  const parsed = JSON.parse(content);
  return snapshotSchema.parse(parsed);
}
