function getNodeClassName(node) {
  return node.type === "enum"
    ? "diagram-node diagram-node--enum"
    : "diagram-node diagram-node--model";
}

function extractMappedName(node) {
  const attributes = Array.isArray(node.data?.blockAttributes)
    ? node.data.blockAttributes
    : [];
  const mappedAttribute = attributes.find((attribute) =>
    attribute.startsWith("@@map("),
  );

  if (!mappedAttribute) {
    return null;
  }

  const match = mappedAttribute.match(/@@map\((?:name:\s*)?"([^"]+)"\)/);
  return match?.[1] ?? null;
}

function extractIndexMetadata(node) {
  const attributes = Array.isArray(node.data?.blockAttributes)
    ? node.data.blockAttributes
    : [];

  return attributes.reduce(
    (accumulator, attribute) => {
      if (attribute.startsWith("@@index")) {
        accumulator.indexes.push(attribute);
      }

      if (attribute.startsWith("@@unique")) {
        accumulator.uniques.push(attribute);
      }

      return accumulator;
    },
    { indexes: [], uniques: [] },
  );
}

function buildFieldBadges(field) {
  const badges = [];

  if (field.isPrimaryKey) {
    badges.push("PK");
  }

  if (field.isForeignKey) {
    badges.push("FK");
  }

  if (field.isUnique) {
    badges.push("UQ");
  }

  return badges;
}

function buildFieldPresentation(field) {
  return {
    name: field.name,
    typeLabel: `${field.type}${field.isList ? "[]" : ""}${field.isOptional ? "?" : ""}`,
    badges: buildFieldBadges(field),
    attributes: field.attributes,
    isPrimaryKey: field.isPrimaryKey,
    isForeignKey: field.isForeignKey,
    isRelation: field.kind === "relation",
    isOptional: field.isOptional,
  };
}

function createModelSections(fields) {
  const presentedFields = fields.map(buildFieldPresentation);

  return [
    {
      id: "columns",
      title: "Columns",
      emptyMessage: "No columns",
      collapsed: false,
      fields: presentedFields.filter((field) => !field.isRelation),
    },
    {
      id: "relations",
      title: "Relations",
      emptyMessage: "No relations",
      collapsed: presentedFields.length > 28,
      fields: presentedFields.filter((field) => field.isRelation),
    },
  ];
}

function getRelationTheme(edge) {
  const isSelfRelation = edge.source === edge.target;
  const isManyToMany =
    edge.data.arity === "many" && edge.data.constraintType === "implicit";

  if (isSelfRelation) {
    return {
      stroke: "#f59e0b",
      width: 2.3,
      dasharray: "6 4",
      labelClassName: "diagram-edge-label diagram-edge-label--self",
      badge: "SELF",
      markerClassName: "diagram-edge-marker diagram-edge-marker--self",
      kind: "self",
    };
  }

  if (isManyToMany) {
    return {
      stroke: "#8b5cf6",
      width: 2.2,
      dasharray: "7 5",
      labelClassName: "diagram-edge-label diagram-edge-label--many-to-many",
      badge: "M:N",
      markerClassName: "diagram-edge-marker diagram-edge-marker--many-to-many",
      kind: "many-to-many",
    };
  }

  if (edge.data.constraintType === "explicit" && edge.data.arity === "many") {
    return {
      stroke: "#06b6d4",
      width: 2.6,
      dasharray: undefined,
      labelClassName: "diagram-edge-label diagram-edge-label--fk-many",
      badge: "FK 1:N",
      markerClassName: "diagram-edge-marker diagram-edge-marker--fk-many",
      kind: "explicit-many",
    };
  }

  if (edge.data.constraintType === "explicit") {
    return {
      stroke: "#3b82f6",
      width: 2.35,
      dasharray: undefined,
      labelClassName: "diagram-edge-label diagram-edge-label--fk-one",
      badge: "FK 1:1",
      markerClassName: "diagram-edge-marker diagram-edge-marker--fk-one",
      kind: "explicit-one",
    };
  }

  if (edge.data.arity === "many") {
    return {
      stroke: "#a855f7",
      width: 1.95,
      dasharray: "7 5",
      labelClassName: "diagram-edge-label diagram-edge-label--implicit-many",
      badge: "REL 1:N",
      markerClassName: "diagram-edge-marker diagram-edge-marker--implicit-many",
      kind: "implicit-many",
    };
  }

  return {
    stroke: "#94a3b8",
    width: 1.75,
    dasharray: "7 5",
    labelClassName: "diagram-edge-label diagram-edge-label--implicit-one",
    badge: "REL 1:1",
    markerClassName: "diagram-edge-marker diagram-edge-marker--implicit-one",
    kind: "implicit-one",
  };
}

function formatRelationSymbol(edge) {
  if (edge.data.arity === "many") {
    return edge.data.isOptional ? "0..1 → ∞" : "1 → ∞";
  }

  return edge.data.isOptional ? "0..1 → 1" : "1 → 1";
}

function formatConstraintText(edge) {
  if (edge.data.fromFields?.length > 0 && edge.data.toFields?.length > 0) {
    return `${edge.data.from}.${edge.data.fromFields.join(", ")} → ${edge.data.to}.${edge.data.toFields.join(", ")}`;
  }

  return `${edge.data.from} → ${edge.data.to}`;
}

function formatFieldMapping(edge) {
  if (edge.data.fromFields?.length > 0 && edge.data.toFields?.length > 0) {
    return `${edge.data.fromFields.join(", ")} → ${edge.data.toFields.join(", ")}`;
  }

  return null;
}

function formatRelationLabel(edge) {
  return edge.data.constraintType === "explicit"
    ? formatConstraintText(edge)
    : `${edge.data.from} → ${edge.data.to}`;
}

export function mapGraphToReactFlow(graph) {
  const nodes = graph.nodes.map((node) => {
    const indexMetadata = extractIndexMetadata(node);

    return {
      id: node.id,
      type: "entity",
      position: { x: 0, y: 0 },
      draggable: true,
      data: {
        label: node.label,
        subtitle: node.type,
        className: getNodeClassName(node),
        meta:
          node.type === "model"
            ? `${node.data.fields.length} columns`
            : `${node.data.values.length} values`,
        mappedName: node.type === "model" ? extractMappedName(node) : null,
        footer:
          node.type === "model"
            ? {
                indexes: indexMetadata.indexes,
                uniques: indexMetadata.uniques,
              }
            : null,
        sections:
          node.type === "model" ? createModelSections(node.data.fields) : [],
        enumValues: node.type === "enum" ? (node.data.values ?? []) : [],
      },
      style: {
        width: node.type === "enum" ? 280 : 360,
        background: "transparent",
        border: "none",
        boxShadow: "none",
        padding: 0,
      },
    };
  });

  const edges = graph.edges.map((edge) => {
    const theme = getRelationTheme(edge);

    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: formatRelationLabel(edge),
      type: "relation",
      animated: false,
      sourceHandle: null,
      targetHandle: null,
      style: {
        stroke: theme.stroke,
        strokeWidth: theme.width,
        strokeDasharray: theme.dasharray,
      },
      data: {
        ...edge.data,
        symbol: formatRelationSymbol(edge),
        constraintText: formatConstraintText(edge),
        fieldMapping: formatFieldMapping(edge),
        relationTheme: theme,
        relationKind: theme.kind,
      },
    };
  });

  return {
    nodes,
    edges,
  };
}
