import test from 'node:test';
import assert from 'node:assert/strict';

import { generateErdGraph } from '../src/services/erd-generation-service.js';

const SCHEMA = `enum Role {
  USER
  ADMIN
}

model User {
  id Int @id
  email String @unique
  role Role
  posts Post[]
}

model Post {
  id Int @id
  title String
  user User @relation(fields: [userId], references: [id])
  userId Int
}`;

test('generateErdGraph builds diagram-ready nodes and edges from inline schema', async () => {
  const result = await generateErdGraph({ schema: SCHEMA });

  assert.equal(result.source.type, 'inline');
  assert.equal(result.parseResult.models.length, 2);
  assert.equal(result.parseResult.enums.length, 1);
  assert.equal(result.graph.metadata.nodeCount, 3);
  assert.equal(result.graph.metadata.edgeCount, 2);

  const modelNode = result.graph.nodes.find((node) => node.id === 'model:User');
  assert.ok(modelNode);
  assert.equal(modelNode.type, 'model');
  assert.equal(modelNode.label, 'User');
  assert.deepEqual(
    modelNode.data.fields.map((field) => field.name),
    ['id', 'email', 'role', 'posts']
  );

  const enumNode = result.graph.nodes.find((node) => node.id === 'enum:Role');
  assert.ok(enumNode);
  assert.equal(enumNode.type, 'enum');
  assert.deepEqual(enumNode.data.values, ['USER', 'ADMIN']);

  assert.deepEqual(result.graph.edges, [
    {
      id: 'relation:User:posts:Post',
      source: 'model:User',
      target: 'model:Post',
      label: 'posts',
      type: 'relation',
      data: {
        from: 'User',
        to: 'Post',
        field: 'posts',
        arity: 'many',
        attributes: [],
      },
    },
    {
      id: 'relation:Post:user:User',
      source: 'model:Post',
      target: 'model:User',
      label: 'user',
      type: 'relation',
      data: {
        from: 'Post',
        to: 'User',
        field: 'user',
        arity: 'one',
        attributes: ['@relation(fields:', '[userId],', 'references:', '[id])'],
      },
    },
  ]);
});

test('generateErdGraph returns graph without edges for schema that has no relations', async () => {
  const result = await generateErdGraph({
    schema: `model Category {
  id Int @id
  name String
}`,
  });

  assert.equal(result.graph.metadata.nodeCount, 1);
  assert.equal(result.graph.metadata.edgeCount, 0);
  assert.deepEqual(result.graph.edges, []);
});
