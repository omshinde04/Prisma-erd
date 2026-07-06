# Prisma ERD

Paste a Prisma schema or load a `schema.prisma` file and generate a proper visual ER diagram.

## Overview

Prisma ERD is a production-ready open-source project focused on one simple workflow:

- paste Prisma schema text
- or load a Prisma schema file
- parse the database structure
- convert it into graph data
- render a proper ERD visualizer

The architecture is being built so the core parsing and graph-generation pipeline stays clean, reusable, and independent from delivery layers such as MCP or a future frontend UI.

## Product Goal

The product should ultimately:

- accept raw Prisma schema text
- accept `schema.prisma` file input
- parse models
- parse enums
- parse composite types
- parse indexes
- parse constraints
- parse relations
- build an internal graph
- produce structured diagram-ready JSON
- power a proper visual ERD experience

## Current Status

Phase 1 is in progress.

Completed so far:

- repository initialization
- ES Modules setup
- runnable Node.js bootstrap
- startup configuration validation with Zod
- structured JSON logging
- graceful shutdown support
- schema input contracts for pasted schema and file path input
- schema source loading service
- parser pipeline contracts
- ERD graph contracts
- Prisma schema parser foundation
- model extraction
- enum extraction
- basic relation extraction between parsed models
- ERD graph generation foundation
- end-to-end core service from schema input to graph output
- focused tests for input, parsing, and graph generation behavior

Not implemented yet:

- composite type parsing
- index extraction
- constraint extraction
- richer field classification
- frontend visualizer
- MCP integration

## Tech Stack

- Node.js (latest LTS target)
- JavaScript with ES Modules
- Zod
- React
- React Flow
- TailwindCSS
- ELK.js
- Official MCP SDK for later integration

## Architecture Principles

This repository is being developed with:

- Clean Architecture
- SOLID design
- DRY
- KISS
- async/await-first implementation
- production-grade error handling
- small reusable modules
- transport-agnostic core services

## Current Project Structure

```text
src/
  config/
  core/
  graph/
  mcp/
  parser/
  services/
  tools/
  utils/
frontend/
docs/
tests/
```

## Core Pipeline Implemented So Far

The current codebase now supports this pipeline:

```text
paste schema or load file
  -> normalize schema source
  -> parse models, enums, and basic relations
  -> generate ERD nodes and edges
  -> return diagram-ready graph output
```

## Currently Supported Parsing

The parser foundation currently supports:

- `model` blocks
- `enum` blocks
- scalar field extraction
- relation-like field detection
- basic relation extraction between parsed models
- model block attributes collection
- parser metadata counts

### Important limitation

At this stage, any non-scalar field whose type matches a parsed model is treated as a relation candidate.
Enum fields are currently parsed as non-scalar fields in the model field contract, but relation extraction only produces edges when the target type is another parsed model.

This is acceptable for the current milestone and will be refined in future parser milestones.

## Current Graph Output

The graph generation foundation currently supports:

- model nodes
- enum nodes
- relation edges
- visualization-friendly node data
- visualization-friendly edge data
- graph metadata with node and edge counts

### Node output

Model nodes currently include:
- model name
- field list
- block attributes

Enum nodes currently include:
- enum name
- enum values

### Edge output

Relation edges currently include:
- source model
- target model
- relation field name
- relation arity
- raw relation field attributes

## Requirements

- Node.js 20 or newer
- npm 10 or newer recommended

## Installation

```bash
git clone https://github.com/omshinde04/Prisma-erd.git
cd Prisma-erd
npm install
```

## Running the Project

### Start the application bootstrap

```bash
npm start
```

Expected behavior:

- startup configuration is validated
- the ERD pipeline foundation is initialized
- structured JSON logs are printed
- the process exits successfully in default `oneshot` mode

### Run in persistent mode

```bash
APP_STARTUP_MODE=server npm start
```

Expected behavior:

- the application starts and stays alive
- logs confirm the runtime is ready
- the process shuts down gracefully on `SIGINT` or `SIGTERM`

## Running Tests

```bash
npm test
```

The current tests validate:

- inline Prisma schema input normalization
- file-based schema loading
- invalid input handling
- unreadable file handling
- initial parser result contract
- empty ERD graph contract
- model extraction
- enum extraction
- relation extraction between parsed models
- parser metadata counts
- graph node generation
- graph edge generation
- end-to-end ERD generation service behavior

## Example Supported Schema

```prisma
enum Role {
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
}
```

## Example Graph Behavior

From the schema above, the current ERD generation foundation can create:

- model node: `User`
- model node: `Post`
- enum node: `Role`
- relation edge: `User.posts -> Post`
- relation edge: `Post.user -> User`

## Example Graph Output Shape

```json
{
  "nodes": [
    {
      "id": "model:User",
      "type": "model",
      "label": "User",
      "data": {
        "name": "User",
        "fields": [
          {
            "name": "id",
            "type": "Int",
            "kind": "scalar",
            "isList": false,
            "isOptional": false,
            "attributes": ["@id"]
          }
        ],
        "blockAttributes": []
      }
    }
  ],
  "edges": [
    {
      "id": "relation:Post:user:User",
      "source": "model:Post",
      "target": "model:User",
      "label": "user",
      "type": "relation",
      "data": {
        "from": "Post",
        "to": "User",
        "field": "user",
        "arity": "one",
        "attributes": ["@relation(fields:", "[userId],", "references:", "[id])"]
      }
    }
  ]
}
```

## Roadmap

### Phase 1 — Core Foundation
- runtime bootstrap
- validated configuration
- schema input contracts
- schema source loading service
- parser contracts
- parser foundation for models, enums, and relations
- graph contracts
- graph generation foundation
- tests and documentation

### Phase 2 — Richer Prisma Schema Intelligence
- composite type parsing
- index extraction
- constraint extraction
- richer field metadata
- improved Prisma syntax coverage

### Phase 3 — Visualizer UI Foundation
- add React frontend foundation
- render ERD using React Flow
- automatic layout with ELK.js
- support paste and file upload flows

### Phase 4 — Integration Layer
- MCP server and Zed integration
- editor-driven schema workflows
- richer generation and visualization tooling

## Validation

Current validation performed locally should include:

```bash
npm install
npm start
npm test
NODE_ENV=staging npm start
```

## License

MIT
