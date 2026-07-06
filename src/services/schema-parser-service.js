import { parsePrismaSchema } from '../parser/prisma-schema-parser.js';
import { parsePrismaSchemaRequestSchema } from '../parser/parser-contracts.js';

export async function parseSchemaSource(source) {
  const request = parsePrismaSchemaRequestSchema.parse({ source });
  return parsePrismaSchema(request);
}
