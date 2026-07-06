import { loadSchemaSource } from './schema-source-service.js';
import { parseSchemaSource } from './schema-parser-service.js';
import { buildErdGraph } from '../graph/erd-graph-builder.js';

export async function generateErdGraph(input) {
  const source = await loadSchemaSource(input);
  const parseResult = await parseSchemaSource(source);
  const graph = buildErdGraph(parseResult);

  return {
    source,
    parseResult,
    graph,
  };
}
