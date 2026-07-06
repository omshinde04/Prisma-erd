function buildModelNameSet(models) {
  return new Set(models.map((model) => model.name));
}

function createRelation(modelName, field, modelNameSet) {
  if (field.kind !== 'relation') {
    return null;
  }

  if (!modelNameSet.has(field.type)) {
    return null;
  }

  return {
    from: modelName,
    to: field.type,
    field: field.name,
    arity: field.isList ? 'many' : 'one',
    attributes: field.attributes,
  };
}

export function extractRelations(models) {
  const modelNameSet = buildModelNameSet(models);
  const relations = [];

  for (const model of models) {
    for (const field of model.fields) {
      const relation = createRelation(model.name, field, modelNameSet);

      if (relation) {
        relations.push(relation);
      }
    }
  }

  return relations;
}
