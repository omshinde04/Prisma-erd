export function buildRelationEdge(relation) {
  return {
    id: `relation:${relation.from}:${relation.field}:${relation.to}`,
    source: `model:${relation.from}`,
    target: `model:${relation.to}`,
    label: relation.field,
    type: 'relation',
    data: {
      from: relation.from,
      to: relation.to,
      field: relation.field,
      arity: relation.arity,
      attributes: relation.attributes,
    },
  };
}

export function buildGraphEdges(parseResult) {
  return parseResult.relations.map(buildRelationEdge);
}
