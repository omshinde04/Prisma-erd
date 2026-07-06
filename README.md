# Prisma ERD

Paste a Prisma schema or load a `schema.prisma` file and generate a proper visual ER diagram.

## Overview

Prisma ERD is a production-ready open-source project focused on one simple workflow:

- paste Prisma schema text
- or load a Prisma schema file
- parse the database structure
- convert it into graph data
- render a proper ERD visualizer
- export and share the resulting diagram artifacts

The architecture is being built so the core parsing and graph-generation pipeline stays clean, reusable, and independent from delivery layers such as MCP or the browser UI.

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
- render a visual ERD
- export the graph or image in suitable formats
- support future shareable diagram workflows

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
- frontend visualizer foundation with React, Vite, React Flow, and ELK.js
- paste-based schema input UI
- browser file upload workflow for Prisma schema files
- automatic layout of generated ERD graphs
- graph JSON export
- PNG diagram export
- reopenable snapshot save/open workflow

Not implemented yet:

- composite type parsing
- index extraction
- constraint extraction
- richer field classification
- hosted link-sharing workflow
- MCP integration

## Tech Stack

### Core
- Node.js (latest LTS target)
- JavaScript with ES Modules
- Zod

### Frontend
- React
- Vite
- React Flow
- ELK.js
- html-to-image

### Planned later
- Official MCP SDK
- hosted share-link infrastructure

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
- export-ready and sharing-ready UI state boundaries

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
  src/
    components/
    lib/
    styles/
docs/
tests/
```

## Core Pipeline Implemented So Far

The current codebase now supports this backend flow:

```text
paste schema or load file
  -> normalize schema source
  -> parse models, enums, and basic relations
  -> generate ERD nodes and edges
  -> return diagram-ready graph output
```

The frontend visualizer now supports this browser flow:

```text
paste schema or upload file
  -> parse schema in browser-safe adapter
  -> generate ERD graph
  -> run ELK layout
  -> render diagram with React Flow
  -> export graph, image, or snapshot
```

## Frontend Visualizer

The frontend visualizer currently provides:

- schema textarea for pasted Prisma schema
- file upload for local Prisma schema files
- status panel with counts
- interactive diagram canvas
- zoom, pan, minimap, and fit-view behavior
- automatic layout using ELK.js
- graph JSON export
- PNG export of the current diagram view
- snapshot save and reopen workflow

### Snapshot sharing workflow

A snapshot file contains:

- schema text
- parse result
- graph output
- export metadata

This lets one developer generate a diagram, save it, send the snapshot file to another developer, and reopen the same result later.

### Current UI limitation

The browser visualizer currently uses a browser-safe ERD generation adapter that mirrors the core parsing and graph logic.
This keeps the frontend usable now, but in a later milestone we should unify shared parsing/graph modules more elegantly across environments.

## Current Graph Output

The graph generation foundation currently supports:

- model nodes
- enum nodes
- relation edges
- visualization-friendly node data
- visualization-friendly edge data
- graph metadata with node and edge counts

## Export and Sharing Support

### Export Graph JSON
Downloads the generated graph as structured JSON.

### Export PNG
Downloads the currently rendered diagram view as a PNG image.

### Save Snapshot
Downloads a reusable `.prisma-erd.json` snapshot containing the schema, parse result, and graph.

### Open Snapshot
Loads a previously saved snapshot and restores the diagram into the app.

### Current export limitation

The PNG export captures the current rendered diagram container view. In a later milestone we can improve export quality for larger diagrams and add SVG export.

## Requirements

- Node.js 20 or newer
- npm 10 or newer recommended

## Installation

### Root project

```bash
git clone https://github.com/omshinde04/Prisma-erd.git
cd Prisma-erd
npm install
```

### Frontend

```bash
npm install --prefix frontend
```

## Running the Project

### Backend/bootstrap validation

```bash
npm start
```

### Run backend tests

```bash
npm test
```

### Start the frontend visualizer

```bash
npm run dev --prefix frontend
```

Then open the local Vite URL shown in the terminal, typically:

```text
http://localhost:5173
```

## Using the Visualizer

### Paste schema
1. Open the frontend app.
2. Paste your Prisma schema into the textarea.
3. Click `Generate ERD`.
4. Inspect the generated diagram.

### Upload file
1. Click `Upload file`.
2. Select a local `.prisma` file.
3. The file content is loaded into the textarea.
4. The diagram is generated automatically.

### Export graph
1. Generate a diagram.
2. Click `Export Graph JSON`.
3. Share the downloaded JSON if needed for structured output use cases.

### Export image
1. Generate a diagram.
2. Click `Export PNG`.
3. Share the downloaded image in chat, docs, or tickets.

### Save and reopen snapshot
1. Generate a diagram.
2. Click `Save Snapshot`.
3. Send the `.prisma-erd.json` file to another developer.
4. They open the app and click `Open Snapshot`.
5. The schema and diagram are restored.

## Running Tests

### Root tests

```bash
npm test
```

The current root tests validate:

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

### Frontend build validation

```bash
npm run build --prefix frontend
```

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
- visualizer UI foundation
- export and snapshot sharing foundation
- tests and documentation

### Phase 2 — Richer Export and Sharing
- SVG export
- improved high-resolution image export
- larger-diagram export strategy
- link-sharing architecture planning

### Phase 3 — Richer Prisma Schema Intelligence
- composite type parsing
- index extraction
- constraint extraction
- richer field metadata
- improved Prisma syntax coverage

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
npm install --prefix frontend
npm run build --prefix frontend
NODE_ENV=staging npm start
```

## License

MIT
