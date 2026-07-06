# Prisma ERD

A production-ready open-source MCP server for parsing Prisma schema files and generating structured graph data for visual ER diagrams.

## Overview

Prisma ERD is being built as a local-first developer tool that integrates with MCP-compatible clients such as Zed Editor. Its purpose is to read a Prisma schema, extract the database structure, convert that structure into a graph representation, and later power a visual ER diagram experience using React Flow and ELK.js.

## Project Goals

The server will progressively support:

- reading `schema.prisma`
- parsing models
- parsing enums
- parsing composite types
- parsing indexes
- parsing constraints
- parsing relations
- building an internal graph
- returning structured JSON
- integrating with Zed through MCP
- powering a future React Flow-based diagram UI

## Current Status

Phase 1 is in progress.

Completed so far:

- repository initialization
- ES Modules setup
- runnable Node.js bootstrap
- startup configuration validation
- schema-based configuration parsing with Zod
- structured JSON logging
- graceful shutdown support for persistent mode

Not implemented yet:

- MCP server wiring
- Prisma schema parsing
- graph construction
- frontend diagram rendering

## Tech Stack

- Node.js (latest LTS target)
- JavaScript with ES Modules
- Official MCP SDK
- Zod
- React
- React Flow
- TailwindCSS
- ELK.js

## Project Structure

```text
src/
  config/
  core/
  mcp/
  parser/
  graph/
  services/
  tools/
  utils/
frontend/
docs/
tests/
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

### Start the bootstrap runtime

```bash
npm start
```

Expected behavior:

- application startup is validated
- configuration is parsed through a Zod schema
- structured JSON logs are printed
- the process exits successfully in default `oneshot` mode

### Run in persistent mode

```bash
APP_STARTUP_MODE=server npm start
```

Expected behavior:

- the application starts and stays alive
- structured logs confirm the runtime is ready
- the process shuts down gracefully on `SIGINT` or `SIGTERM`

### Development mode

```bash
npm run dev
```

### Validate configuration failures

```bash
NODE_ENV=staging npm start
```

Expected behavior:

- startup fails fast
- the console prints a readable configuration error
- invalid fields are listed explicitly

## Environment Variables

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `NODE_ENV` | No | `development` | Runtime environment. Allowed values: `development`, `test`, `production`. |
| `APP_STARTUP_MODE` | No | `oneshot` | Startup behavior. Allowed values: `oneshot`, `server`. |

## Example Output

### Successful startup

```json
{"timestamp":"2026-07-06T00:00:00.000Z","level":"info","message":"Starting application bootstrap","service":"prisma-visual-diagram-generator","metadata":{"environment":"development","startupMode":"oneshot"}}
{"timestamp":"2026-07-06T00:00:00.100Z","level":"info","message":"Bootstrap completed successfully","service":"prisma-visual-diagram-generator","metadata":{"status":"ready","mode":"oneshot"}}
```

### Invalid configuration

```text
[fatal] Application failed to start
Invalid application configuration
- nodeEnv: Invalid option: expected one of "development"|"test"|"production"
```

## Architecture Direction

This repository is being developed with the following principles:

- Clean Architecture
- SOLID design
- DRY
- KISS
- small reusable modules
- production-grade error handling
- async/await-first implementation style

## Roadmap

### Phase 1 — Project Initialization
- runtime bootstrap
- config foundation
- MCP server skeleton
- first MCP tool contract
- documentation improvements
- test foundation

### Phase 2 — Prisma Schema Intelligence
- Prisma schema reader
- parser modules for models, enums, composite types, indexes, and constraints
- internal graph builder
- structured JSON output contracts

### Phase 3 — Visual Diagram Layer
- React frontend foundation
- React Flow graph rendering
- automatic layout with ELK.js
- richer interactions and diagram UX

## Validation

Current validation performed locally:

```bash
npm install
npm start
NODE_ENV=staging npm start
```

This confirms the bootstrap entrypoint runs successfully and invalid runtime configuration fails fast with readable output.

## Contributing

This project is under active development. Once the MCP server skeleton and parser contracts are stable, contribution guidelines and issue templates can be added.

## License

MIT
