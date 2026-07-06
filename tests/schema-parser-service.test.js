import test from 'node:test';
import assert from 'node:assert/strict';

import { loadSchemaSource } from '../src/services/schema-source-service.js';
import { parseSchemaSource } from '../src/services/schema-parser-service.js';

const RELATIONAL_SCHEMA = `enum Role {
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

test('parseSchemaSource extracts models, fields, enums, and relations', async () => {
  const source = await loadSchemaSource({ schema: RELATIONAL_SCHEMA });
  const result = await parseSchemaSource(source);

  assert.equal(result.models.length, 2);
  assert.equal(result.enums.length, 1);
  assert.equal(result.relations.length, 2);
  assert.equal(result.metadata.modelCount, 2);
  assert.equal(result.metadata.enumCount, 1);
  assert.equal(result.metadata.relationCount, 2);

  const userModel = result.models.find((model) => model.name === 'User');
  assert.ok(userModel);
  assert.equal(userModel.fields.length, 4);
  assert.deepEqual(
    userModel.fields.map((field) => ({ name: field.name, kind: field.kind })),
    [
      { name: 'id', kind: 'scalar' },
      { name: 'email', kind: 'scalar' },
      { name: 'role', kind: 'relation' },
      { name: 'posts', kind: 'relation' },
    ]
  );

  const roleEnum = result.enums.find((entry) => entry.name === 'Role');
  assert.ok(roleEnum);
  assert.deepEqual(roleEnum.values.map((value) => value.name), ['USER', 'ADMIN']);

  assert.deepEqual(result.relations, [
    {
      from: 'User',
      to: 'Post',
      field: 'posts',
      arity: 'many',
      attributes: [],
    },
    {
      from: 'Post',
      to: 'User',
      field: 'user',
      arity: 'one',
      attributes: ['@relation(fields:', '[userId],', 'references:', '[id])'],
    },
  ]);
});

test('parseSchemaSource returns empty parsed structures for schema without model or enum blocks', async () => {
  const source = await loadSchemaSource({ schema: 'generator client { provider = "prisma-client-js" }' });
  const result = await parseSchemaSource(source);

  assert.deepEqual(result.models, []);
  assert.deepEqual(result.enums, []);
  assert.deepEqual(result.relations, []);
  assert.equal(result.metadata.modelCount, 0);
  assert.equal(result.metadata.enumCount, 0);
  assert.equal(result.metadata.relationCount, 0);
});
