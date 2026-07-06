import { z } from 'zod';
import { SCHEMA_SOURCE_TYPES } from '../core/constants.js';

const schemaSourceTypeSchema = z.enum([
  SCHEMA_SOURCE_TYPES.INLINE,
  SCHEMA_SOURCE_TYPES.FILE,
]);

export const schemaSourceSchema = z.object({
  type: schemaSourceTypeSchema,
  content: z.string().min(1, 'Schema content cannot be empty.'),
  origin: z.string().min(1, 'Schema origin cannot be empty.'),
  filePath: z.string().min(1).nullable(),
  encoding: z.string().min(1, 'Schema encoding cannot be empty.'),
});

export const parsePrismaSchemaRequestSchema = z.object({
  source: schemaSourceSchema,
});

export const parsePrismaSchemaResultSchema = z.object({
  source: schemaSourceSchema,
  models: z.array(z.object({
    name: z.string(),
  })),
  enums: z.array(z.object({
    name: z.string(),
  })),
  compositeTypes: z.array(z.object({
    name: z.string(),
  })),
  relations: z.array(z.object({
    from: z.string(),
    to: z.string(),
    field: z.string(),
  })),
  indexes: z.array(z.object({
    model: z.string(),
    fields: z.array(z.string()),
  })),
  constraints: z.array(z.object({
    model: z.string(),
    type: z.string(),
    fields: z.array(z.string()),
  })),
  metadata: z.object({
    contentLength: z.number().int().nonnegative(),
  }),
});

export function createInitialParseResult(source) {
  return parsePrismaSchemaResultSchema.parse({
    source,
    models: [],
    enums: [],
    compositeTypes: [],
    relations: [],
    indexes: [],
    constraints: [],
    metadata: {
      contentLength: source.content.length,
    },
  });
}
