import { z } from "zod";
import { SCHEMA_SOURCE_TYPES } from "../core/constants.js";

const schemaSourceTypeSchema = z.enum([
  SCHEMA_SOURCE_TYPES.INLINE,
  SCHEMA_SOURCE_TYPES.FILE,
]);

const fieldKindSchema = z.enum(["scalar", "relation", "unknown"]);
const relationAritySchema = z.enum(["one", "many"]);

export const schemaSourceSchema = z.object({
  type: schemaSourceTypeSchema,
  content: z.string().min(1, "Schema content cannot be empty."),
  origin: z.string().min(1, "Schema origin cannot be empty."),
  filePath: z.string().min(1).nullable(),
  encoding: z.string().min(1, "Schema encoding cannot be empty."),
});

export const parsePrismaSchemaRequestSchema = z.object({
  source: schemaSourceSchema,
});

export const prismaFieldSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  kind: fieldKindSchema,
  isList: z.boolean(),
  isOptional: z.boolean(),
  attributes: z.array(z.string()),
});

export const prismaModelSchema = z.object({
  name: z.string().min(1),
  fields: z.array(prismaFieldSchema),
  blockAttributes: z.array(z.string()),
});

export const prismaEnumValueSchema = z.object({
  name: z.string().min(1),
});

export const prismaEnumSchema = z.object({
  name: z.string().min(1),
  values: z.array(prismaEnumValueSchema),
});

export const prismaCompositeTypeSchema = z.object({
  name: z.string().min(1),
});

export const prismaRelationSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  field: z.string().min(1),
  arity: relationAritySchema,
  attributes: z.array(z.string()),
});

export const prismaIndexSchema = z.object({
  model: z.string().min(1),
  fields: z.array(z.string()),
});

export const prismaConstraintSchema = z.object({
  model: z.string().min(1),
  type: z.string().min(1),
  fields: z.array(z.string()),
});

export const parsePrismaSchemaResultSchema = z.object({
  source: schemaSourceSchema,
  models: z.array(prismaModelSchema),
  enums: z.array(prismaEnumSchema),
  compositeTypes: z.array(prismaCompositeTypeSchema),
  relations: z.array(prismaRelationSchema),
  indexes: z.array(prismaIndexSchema),
  constraints: z.array(prismaConstraintSchema),
  metadata: z.object({
    contentLength: z.number().int().nonnegative(),
    modelCount: z.number().int().nonnegative(),
    enumCount: z.number().int().nonnegative(),
    relationCount: z.number().int().nonnegative(),
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
      modelCount: 0,
      enumCount: 0,
      relationCount: 0,
    },
  });
}
