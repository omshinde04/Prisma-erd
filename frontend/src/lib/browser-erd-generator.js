import { z } from "zod";

const SCHEMA_SOURCE_TYPES = {
  INLINE: "inline",
  FILE: "file",
};

const schemaSourceSchema = z.object({
  type: z.enum([SCHEMA_SOURCE_TYPES.INLINE, SCHEMA_SOURCE_TYPES.FILE]),
  content: z.string().min(1, "Schema content cannot be empty."),
  origin: z.string().min(1),
  filePath: z.string().nullable(),
  encoding: z.string().min(1),
});

const fieldSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  kind: z.enum(["scalar", "relation", "unknown"]),
  isList: z.boolean(),
  isOptional: z.boolean(),
  attributes: z.array(z.string()),
  isPrimaryKey: z.boolean(),
  isForeignKey: z.boolean(),
  isUnique: z.boolean(),
  hasDefaultValue: z.boolean(),
  relationFromFields: z.array(z.string()),
  relationToFields: z.array(z.string()),
});

const parsePrismaSchemaResultSchema = z.object({
  source: schemaSourceSchema,
  models: z.array(
    z.object({
      name: z.string().min(1),
      fields: z.array(fieldSchema),
      blockAttributes: z.array(z.string()),
    }),
  ),
  enums: z.array(
    z.object({
      name: z.string().min(1),
      values: z.array(z.object({ name: z.string().min(1) })),
    }),
  ),
  compositeTypes: z.array(z.object({ name: z.string().min(1) })),
  relations: z.array(
    z.object({
      from: z.string().min(1),
      to: z.string().min(1),
      field: z.string().min(1),
      arity: z.enum(["one", "many"]),
      attributes: z.array(z.string()),
      isOptional: z.boolean(),
      fromFields: z.array(z.string()),
      toFields: z.array(z.string()),
      constraintType: z.enum(["implicit", "explicit"]),
    }),
  ),
  indexes: z.array(
    z.object({ model: z.string().min(1), fields: z.array(z.string()) }),
  ),
  constraints: z.array(
    z.object({
      model: z.string().min(1),
      type: z.string().min(1),
      fields: z.array(z.string()),
    }),
  ),
  metadata: z.object({
    contentLength: z.number().int().nonnegative(),
    modelCount: z.number().int().nonnegative(),
    enumCount: z.number().int().nonnegative(),
    relationCount: z.number().int().nonnegative(),
  }),
});

const erdGraphSchema = z.object({
  nodes: z.array(
    z.object({
      id: z.string().min(1),
      type: z.enum(["model", "enum", "composite"]),
      label: z.string().min(1),
      data: z.record(z.string(), z.unknown()),
    }),
  ),
  edges: z.array(
    z.object({
      id: z.string().min(1),
      source: z.string().min(1),
      target: z.string().min(1),
      label: z.string().min(1),
      type: z.enum(["relation"]),
      data: z.record(z.string(), z.unknown()),
    }),
  ),
  metadata: z.object({
    generatedAt: z.string().datetime(),
    nodeCount: z.number().int().nonnegative(),
    edgeCount: z.number().int().nonnegative(),
  }),
});

const SCALAR_TYPES = new Set([
  "String",
  "Boolean",
  "Int",
  "BigInt",
  "Float",
  "Decimal",
  "DateTime",
  "Json",
  "Bytes",
  "Unsupported",
]);

const BLOCK_PATTERN = /(model|enum)\s+(\w+)\s*\{([\s\S]*?)\}/g;
const RELATION_FIELDS_PATTERN = /fields:\s*\[([^\]]*)\]/;
const RELATION_REFERENCES_PATTERN = /references:\s*\[([^\]]*)\]/;

function normalizeFieldType(typeToken) {
  return typeToken.replace(/[?\[\]]/g, "");
}

function getFieldKind(typeToken, modelNameSet, enumNameSet) {
  const normalizedType = normalizeFieldType(typeToken);

  if (modelNameSet.has(normalizedType)) {
    return "relation";
  }

  if (SCALAR_TYPES.has(normalizedType) || enumNameSet.has(normalizedType)) {
    return "scalar";
  }

  return "unknown";
}

function extractRelationName(attributes) {
  const joinedAttributes = attributes.join(" ");
  const match = joinedAttributes.match(/@relation\(\s*"([^"]+)"/);
  return match ? match[1] : null;
}

function extractBracketList(source, pattern) {
  const match = source.match(pattern);

  if (!match) {
    return [];
  }

  return match[1]
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function extractRelationFromFields(attributes) {
  const joinedAttributes = attributes.join(" ");
  return extractBracketList(joinedAttributes, RELATION_FIELDS_PATTERN);
}

function extractRelationToFields(attributes) {
  const joinedAttributes = attributes.join(" ");
  return extractBracketList(joinedAttributes, RELATION_REFERENCES_PATTERN);
}

function hasAttribute(attributes, attributeName) {
  return attributes.some((attribute) => attribute.startsWith(attributeName));
}

function extractBlocks(schemaContent) {
  const blocks = [];

  for (const match of schemaContent.matchAll(BLOCK_PATTERN)) {
    const [, type, name, body] = match;
    blocks.push({ type, name, body: body.trim() });
  }

  return blocks;
}

function parseFieldLine(line, modelNameSet, enumNameSet) {
  const trimmedLine = line.trim();

  if (!trimmedLine || trimmedLine.startsWith("//")) {
    return null;
  }

  if (trimmedLine.startsWith("@@")) {
    return {
      type: "block-attribute",
      value: trimmedLine,
    };
  }

  const tokens = trimmedLine.split(/\s+/);

  if (tokens.length < 2) {
    return null;
  }

  const [name, typeToken, ...attributeTokens] = tokens;

  if (name.startsWith("@")) {
    return null;
  }

  const relationFromFields = extractRelationFromFields(attributeTokens);
  const relationToFields = extractRelationToFields(attributeTokens);

  return {
    type: "field",
    value: {
      name,
      type: normalizeFieldType(typeToken),
      kind: getFieldKind(typeToken, modelNameSet, enumNameSet),
      isList: typeToken.includes("[]"),
      isOptional: typeToken.includes("?"),
      attributes: attributeTokens,
      isPrimaryKey: hasAttribute(attributeTokens, "@id"),
      isForeignKey: relationFromFields.length > 0,
      isUnique: hasAttribute(attributeTokens, "@unique"),
      hasDefaultValue: hasAttribute(attributeTokens, "@default"),
      relationFromFields,
      relationToFields,
    },
  };
}

function parseModelBlock(block, modelNameSet, enumNameSet) {
  const lines = block.body.split("\n");
  const fields = [];
  const blockAttributes = [];

  for (const line of lines) {
    const parsedLine = parseFieldLine(line, modelNameSet, enumNameSet);

    if (!parsedLine) {
      continue;
    }

    if (parsedLine.type === "block-attribute") {
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

function parseEnumBlock(block) {
  const values = block.body
    .split("\n")
    .map((line) => line.trim())
    .filter(
      (line) =>
        line.length > 0 && !line.startsWith("//") && !line.startsWith("@"),
    )
    .map((line) => {
      const [name] = line.split(/\s+/);
      return { name };
    });

  return {
    name: block.name,
    values,
  };
}

function findModelByName(models, name) {
  return models.find((model) => model.name === name) ?? null;
}

function findReciprocalField(models, ownerModelName, field, excludeFieldName) {
  const targetModel = findModelByName(models, field.type);

  if (!targetModel) {
    return null;
  }

  const relationName = extractRelationName(field.attributes);
  const candidates = targetModel.fields.filter(
    (candidate) =>
      candidate.kind === "relation" &&
      candidate.type === ownerModelName &&
      candidate.name !== excludeFieldName,
  );

  if (candidates.length === 0) {
    return null;
  }

  if (relationName) {
    const namedMatch = candidates.find(
      (candidate) => extractRelationName(candidate.attributes) === relationName,
    );

    if (namedMatch) {
      return namedMatch;
    }
  }

  return candidates.length === 1 ? candidates[0] : null;
}

function getRelationArity(models, parentModelName, childModelName, childField) {
  const reciprocalField = findReciprocalField(
    models,
    childModelName,
    { type: parentModelName, attributes: childField.attributes },
    childField.name,
  );

  if (!reciprocalField) {
    return "many";
  }

  return reciprocalField.isList ? "many" : "one";
}

function extractRelations(models) {
  const modelNameSet = new Set(models.map((model) => model.name));
  const relations = [];
  const consumedImplicitKeys = new Set();

  for (const model of models) {
    for (const field of model.fields) {
      if (field.kind !== "relation" || !modelNameSet.has(field.type)) {
        continue;
      }

      const isExplicitForeignKey = field.relationFromFields.length > 0;

      if (isExplicitForeignKey) {
        relations.push({
          from: field.type,
          to: model.name,
          field: field.name,
          arity: getRelationArity(models, field.type, model.name, field),
          attributes: field.attributes,
          isOptional: field.isOptional,
          fromFields: field.relationToFields,
          toFields: field.relationFromFields,
          constraintType: "explicit",
        });
        continue;
      }

      const reciprocalField = findReciprocalField(
        models,
        model.name,
        field,
        field.name,
      );
      const reciprocalIsExplicit =
        reciprocalField && reciprocalField.relationFromFields.length > 0;

      if (reciprocalIsExplicit) {
        continue;
      }

      const relationName = extractRelationName(field.attributes);
      const dedupeKey = relationName
        ? `name:${relationName}`
        : `pair:${[model.name, field.type].sort().join("::")}`;

      if (consumedImplicitKeys.has(dedupeKey)) {
        continue;
      }

      consumedImplicitKeys.add(dedupeKey);

      relations.push({
        from: model.name,
        to: field.type,
        field: field.name,
        arity: field.isList ? "many" : "one",
        attributes: field.attributes,
        isOptional: field.isOptional,
        fromFields: [],
        toFields: [],
        constraintType: "implicit",
      });
    }
  }

  return relations;
}

function parseSchema(schemaText) {
  const content = schemaText.trim();

  if (content.length === 0) {
    throw new Error("Schema input cannot be empty.");
  }

  const source = schemaSourceSchema.parse({
    type: SCHEMA_SOURCE_TYPES.INLINE,
    content,
    origin: "browser-inline-schema",
    filePath: null,
    encoding: "utf8",
  });

  const blocks = extractBlocks(content);
  const modelBlocks = blocks.filter((block) => block.type === "model");
  const enumBlocks = blocks.filter((block) => block.type === "enum");
  const modelNameSet = new Set(modelBlocks.map((block) => block.name));
  const enumNameSet = new Set(enumBlocks.map((block) => block.name));

  const models = modelBlocks.map((block) =>
    parseModelBlock(block, modelNameSet, enumNameSet),
  );
  const enums = enumBlocks.map(parseEnumBlock);
  const relations = extractRelations(models);

  return parsePrismaSchemaResultSchema.parse({
    source,
    models,
    enums,
    compositeTypes: [],
    relations,
    indexes: [],
    constraints: [],
    metadata: {
      contentLength: content.length,
      modelCount: models.length,
      enumCount: enums.length,
      relationCount: relations.length,
    },
  });
}

function buildGraphNodes(parseResult) {
  const modelNodes = parseResult.models.map((model) => ({
    id: `model:${model.name}`,
    type: "model",
    label: model.name,
    data: {
      name: model.name,
      fields: model.fields.map((field) => ({
        name: field.name,
        type: field.type,
        kind: field.kind,
        isList: field.isList,
        isOptional: field.isOptional,
        attributes: field.attributes,
        isPrimaryKey: field.isPrimaryKey,
        isForeignKey: field.isForeignKey,
        isUnique: field.isUnique,
        hasDefaultValue: field.hasDefaultValue,
        relationFromFields: field.relationFromFields,
        relationToFields: field.relationToFields,
      })),
      blockAttributes: model.blockAttributes,
    },
  }));

  const enumNodes = parseResult.enums.map((entry) => ({
    id: `enum:${entry.name}`,
    type: "enum",
    label: entry.name,
    data: {
      name: entry.name,
      values: entry.values.map((value) => value.name),
    },
  }));

  return [...modelNodes, ...enumNodes];
}

function buildGraphEdges(parseResult) {
  return parseResult.relations.map((relation) => ({
    id: `relation:${relation.from}:${relation.field}:${relation.to}`,
    source: `model:${relation.from}`,
    target: `model:${relation.to}`,
    label: relation.field,
    type: "relation",
    data: {
      from: relation.from,
      to: relation.to,
      field: relation.field,
      arity: relation.arity,
      attributes: relation.attributes,
      isOptional: relation.isOptional,
      fromFields: relation.fromFields,
      toFields: relation.toFields,
      constraintType: relation.constraintType,
    },
  }));
}

function buildGraph(parseResult) {
  const nodes = buildGraphNodes(parseResult);
  const edges = buildGraphEdges(parseResult);

  return erdGraphSchema.parse({
    nodes,
    edges,
    metadata: {
      generatedAt: new Date().toISOString(),
      nodeCount: nodes.length,
      edgeCount: edges.length,
    },
  });
}

export async function generateBrowserErd(schemaText) {
  const parseResult = parseSchema(schemaText);
  const graph = buildGraph(parseResult);

  return {
    parseResult,
    graph,
  };
}
