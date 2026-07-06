import { parsePrismaSchemaRequestSchema, parsePrismaSchemaResultSchema } from './parser-contracts.js';
import { parseModelBlock } from './model-parser.js';
import { parseEnumBlock } from './enum-parser.js';
import { extractRelations } from './relation-parser.js';

const BLOCK_PATTERN = /(model|enum)\s+(\w+)\s*\{([\s\S]*?)\}/g;

function extractBlocks(schemaContent) {
  const blocks = [];

  for (const match of schemaContent.matchAll(BLOCK_PATTERN)) {
    const [, type, name, body] = match;

    blocks.push({
      type,
      name,
      body: body.trim(),
    });
  }

  return blocks;
}

export function parsePrismaSchema(request) {
  const parsedRequest = parsePrismaSchemaRequestSchema.parse(request);
  const blocks = extractBlocks(parsedRequest.source.content);

  const modelBlocks = blocks.filter((block) => block.type === 'model');
  const enumBlocks = blocks.filter((block) => block.type === 'enum');

  const models = modelBlocks.map(parseModelBlock);
  const enums = enumBlocks.map(parseEnumBlock);
  const relations = extractRelations(models);

  return parsePrismaSchemaResultSchema.parse({
    source: parsedRequest.source,
    models,
    enums,
    compositeTypes: [],
    relations,
    indexes: [],
    constraints: [],
    metadata: {
      contentLength: parsedRequest.source.content.length,
      modelCount: models.length,
      enumCount: enums.length,
      relationCount: relations.length,
    },
  });
}
