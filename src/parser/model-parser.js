const SCALAR_TYPES = new Set([
  'String',
  'Boolean',
  'Int',
  'BigInt',
  'Float',
  'Decimal',
  'DateTime',
  'Json',
  'Bytes',
  'Unsupported',
]);

function normalizeFieldType(typeToken) {
  return typeToken.replace(/[?\[\]]/g, '');
}

function getFieldKind(typeToken) {
  const normalizedType = normalizeFieldType(typeToken);

  if (SCALAR_TYPES.has(normalizedType)) {
    return 'scalar';
  }

  return /^[A-Z]/.test(normalizedType) ? 'relation' : 'unknown';
}

function parseFieldLine(line) {
  const trimmedLine = line.trim();

  if (!trimmedLine || trimmedLine.startsWith('//')) {
    return null;
  }

  if (trimmedLine.startsWith('@@')) {
    return {
      type: 'block-attribute',
      value: trimmedLine,
    };
  }

  const tokens = trimmedLine.split(/\s+/);

  if (tokens.length < 2) {
    return null;
  }

  const [name, typeToken, ...attributeTokens] = tokens;

  if (name.startsWith('@')) {
    return null;
  }

  return {
    type: 'field',
    value: {
      name,
      type: normalizeFieldType(typeToken),
      kind: getFieldKind(typeToken),
      isList: typeToken.includes('[]'),
      isOptional: typeToken.includes('?'),
      attributes: attributeTokens,
    },
  };
}

export function parseModelBlock(block) {
  const lines = block.body.split('\n');
  const fields = [];
  const blockAttributes = [];

  for (const line of lines) {
    const parsedLine = parseFieldLine(line);

    if (!parsedLine) {
      continue;
    }

    if (parsedLine.type === 'block-attribute') {
      blockAttributes.push(parsedLine.value);
      continue;
    }

    fields.push(parsedLine.value);
  }

  return {
    name: block.name,
    fields,
    blockAttributes,
  };
}
