import { z } from 'zod';

const nonEmptyString = z
  .string()
  .trim()
  .min(1, 'Value cannot be empty.');

const schemaInlineInputSchema = z.object({
  schema: nonEmptyString,
  filePath: z.undefined().optional(),
});

const schemaFileInputSchema = z.object({
  schema: z.undefined().optional(),
  filePath: nonEmptyString,
});

export const generateErdInputSchema = z.union([schemaInlineInputSchema, schemaFileInputSchema]);

export function validateGenerateErdInput(input) {
  return generateErdInputSchema.safeParse(input);
}
