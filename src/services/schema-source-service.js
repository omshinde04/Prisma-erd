import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { DEFAULT_SCHEMA_ENCODING, SCHEMA_SOURCE_TYPES } from '../core/constants.js';
import { validateGenerateErdInput } from '../tools/generate-erd-input.js';
import { schemaSourceSchema } from '../parser/parser-contracts.js';
import { AppError } from '../utils/errors.js';

export class SchemaSourceError extends AppError {
  constructor(message, options = {}) {
    super(message, {
      ...options,
      code: options.code ?? 'SCHEMA_SOURCE_ERROR',
    });
  }
}

function createInputValidationError(error) {
  const details = error.issues.map((issue) => ({
    path: issue.path.length > 0 ? issue.path.join('.') : 'input',
    message: issue.message,
  }));

  return new SchemaSourceError('Invalid ERD generation input', {
    code: 'SCHEMA_SOURCE_INPUT_INVALID',
    details,
    cause: error,
  });
}

function buildInlineSource(schema) {
  return schemaSourceSchema.parse({
    type: SCHEMA_SOURCE_TYPES.INLINE,
    content: schema,
    origin: 'inline-schema',
    filePath: null,
    encoding: DEFAULT_SCHEMA_ENCODING,
  });
}

function buildFileSource(filePath, content) {
  return schemaSourceSchema.parse({
    type: SCHEMA_SOURCE_TYPES.FILE,
    content,
    origin: resolve(filePath),
    filePath: resolve(filePath),
    encoding: DEFAULT_SCHEMA_ENCODING,
  });
}

export async function loadSchemaSource(input) {
  const parsedInput = validateGenerateErdInput(input);

  if (!parsedInput.success) {
    throw createInputValidationError(parsedInput.error);
  }

  if ('schema' in parsedInput.data) {
    return buildInlineSource(parsedInput.data.schema);
  }

  const filePath = parsedInput.data.filePath;
  let content;

  try {
    content = await readFile(filePath, DEFAULT_SCHEMA_ENCODING);
  } catch (error) {
    throw new SchemaSourceError(`Unable to read Prisma schema file at ${resolve(filePath)}.`, {
      code: 'SCHEMA_SOURCE_FILE_READ_FAILED',
      cause: error,
    });
  }

  if (content.trim().length === 0) {
    throw new SchemaSourceError(`Prisma schema file is empty at ${resolve(filePath)}.`, {
      code: 'SCHEMA_SOURCE_FILE_EMPTY',
    });
  }

  return buildFileSource(filePath, content);
}
