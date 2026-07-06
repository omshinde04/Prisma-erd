function buildFieldSummary(field) {
  return {
    name: field.name,
    type: field.type,
    kind: field.kind,
    isList: field.isList,
    isOptional: field.isOptional,
    attributes: field.attributes,
  };
}

export function buildModelNode(model) {
  return {
    id: `model:${model.name}`,
    type: 'model',
    label: model.name,
    data: {
      name: model.name,
      fields: model.fields.map(buildFieldSummary),
      blockAttributes: model.blockAttributes,
    },
  };
}

export function buildEnumNode(entry) {
  return {
    id: `enum:${entry.name}`,
    type: 'enum',
    label: entry.name,
    data: {
      name: entry.name,
      values: entry.values.map((value) => value.name),
    },
  };
}

export function buildGraphNodes(parseResult) {
  const modelNodes = parseResult.models.map(buildModelNode);
  const enumNodes = parseResult.enums.map(buildEnumNode);

  return [...modelNodes, ...enumNodes];
}
