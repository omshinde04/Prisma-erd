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
- parser pipeline foundation contracts
- ERD graph foundation contracts
- focused tests for schema input behavior

Not implemented yet:

- real Prisma schema parser
- relation extraction
- graph generation from parsed schema
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

## Foundation Built in Phase 1

The current codebase now includes the core contracts required to support the future workflow:

```text
paste schema or load file
  -> normalize schema source
  -> create parser request/result contracts
  -> create ERD graph contracts
  -> prepare for visualization
```

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

## Supported Input Modes

### 1. Inline Prisma schema
The project can normalize raw schema input such as:

```prisma
model User {
  id Int @id
  email String @unique
}
```

### 2. Prisma schema file path
The project can normalize a file source such as:

```text
./prisma/schema.prisma
```

## Example Runtime Output

```json
{"timestamp":"2026-07-06T00:00:00.000Z","level":"info","message":"Starting application bootstrap","service":"prisma-visual-diagram-generator","metadata":{"environment":"development","startupMode":"oneshot"}}
{"timestamp":"2026-07-06T00:00:00.050Z","level":"info","message":"ERD pipeline foundation is ready","service":"prisma-visual-diagram-generator","metadata":{"supportedInputModes":["schema","filePath"],"graphNodeCount":0,"graphEdgeCount":0}}
{"timestamp":"2026-07-06T00:00:00.100Z","level":"info","message":"Bootstrap completed successfully","service":"prisma-visual-diagram-generator","metadata":{"status":"ready","mode":"oneshot"}}
```

## Roadmap

### Phase 1 — Core Foundation
- runtime bootstrap
- validated configuration
- schema input contracts
- schema source loading service
- parser contracts
- graph contracts
- tests and documentation

### Phase 2 — Prisma Schema Parsing
- parse Prisma schema content
- extract models, fields, enums, and relations
- normalize parser output

### Phase 3 — ERD Graph Generation
- convert parsed schema into nodes and edges
- enrich metadata for visualization
- prepare diagram-ready payloads

### Phase 4 — Visualizer UI
- add React frontend foundation
- render ERD using React Flow
- automatic layout with ELK.js
- support paste and file upload flows

### Phase 5 — Integration Layer
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
