import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { SCHEMA_SOURCE_TYPES } from '../src/core/constants.js';
import { loadSchemaSource, SchemaSourceError } from '../src/services/schema-source-service.js';
import { createInitialParseResult } from '../src/parser/parser-contracts.js';
import { createEmptyErdGraph } from '../src/graph/graph-contracts.js';

const SAMPLE_SCHEMA = `model User {
  id Int @id
  email String @unique
}`;

test('loadSchemaSource returns normalized inline schema input', async () => {
  const source = await loadSchemaSource({ schema: SAMPLE_SCHEMA });

  assert.equal(source.type, SCHEMA_SOURCE_TYPES.INLINE);
  assert.equal(source.content, SAMPLE_SCHEMA);
  assert.equal(source.origin, 'inline-schema');
  assert.equal(source.filePath, null);
});

test('loadSchemaSource reads schema from file path', async () => {
  const tempDirectory = await mkdtemp(join(tmpdir(), 'prisma-erd-'));
  const schemaPath = join(tempDirectory, 'schema.prisma');

  await writeFile(schemaPath, SAMPLE_SCHEMA, 'utf8');

  const source = await loadSchemaSource({ filePath: schemaPath });

  assert.equal(source.type, SCHEMA_SOURCE_TYPES.FILE);
  assert.equal(source.content, SAMPLE_SCHEMA);
  assert.equal(source.filePath, schemaPath);
  assert.equal(source.origin, schemaPath);
});

test('loadSchemaSource rejects invalid input shape', async () => {
  await assert.rejects(
    () => loadSchemaSource({}),
    (error) => {
      assert.ok(error instanceof SchemaSourceError);
      assert.equal(error.code, 'SCHEMA_SOURCE_INPUT_INVALID');
      assert.match(error.message, /Invalid ERD generation input/);
      return true;
    }
  );
});

test('loadSchemaSource rejects unreadable files', async () => {
  await assert.rejects(
    () => loadSchemaSource({ filePath: './missing/schema.prisma' }),
    (error) => {
      assert.ok(error instanceof SchemaSourceError);
      assert.equal(error.code, 'SCHEMA_SOURCE_FILE_READ_FAILED');
      return true;
    }
  );
});

test('createInitialParseResult returns empty normalized parse result', async () => {
  const source = await loadSchemaSource({ schema: SAMPLE_SCHEMA });
  const parseResult = createInitialParseResult(source);

  assert.deepEqual(parseResult.models, []);
  assert.deepEqual(parseResult.enums, []);
  assert.deepEqual(parseResult.compositeTypes, []);
  assert.equal(parseResult.metadata.contentLength, SAMPLE_SCHEMA.length);
});

test('createEmptyErdGraph returns valid empty graph structure', () => {
  const graph = createEmptyErdGraph();

  assert.deepEqual(graph.nodes, []);
  assert.deepEqual(graph.edges, []);
  assert.equal(graph.metadata.nodeCount, 0);
  assert.equal(graph.metadata.edgeCount, 0);
});
