import { useMemo, useRef, useState } from "react";

import { SchemaInputPanel } from "./components/SchemaInputPanel.jsx";
import { DiagramCanvas } from "./components/DiagramCanvas.jsx";
import { StatusPanel } from "./components/StatusPanel.jsx";
import { ExportActions } from "./components/ExportActions.jsx";
import { generateBrowserErd } from "./lib/browser-erd-generator.js";
import { exportGraphJson, exportSnapshotJson } from "./lib/export-json.js";
import { exportDiagramAsPng } from "./lib/export-image.js";
import { createSnapshot, loadSnapshotFromFile } from "./lib/snapshot.js";

const SAMPLE_SCHEMA = `enum Role {
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
}`;

export default function App() {
  const diagramExportRef = useRef(null);
  const [schemaText, setSchemaText] = useState(SAMPLE_SCHEMA);
  const [diagramState, setDiagramState] = useState({
    status: "idle",
    error: "",
    result: null,
  });

  const summary = useMemo(() => {
    if (!diagramState.result) {
      return {
        modelCount: 0,
        enumCount: 0,
        relationCount: 0,
        nodeCount: 0,
        edgeCount: 0,
      };
    }

    return {
      modelCount: diagramState.result.parseResult.metadata.modelCount,
      enumCount: diagramState.result.parseResult.metadata.enumCount,
      relationCount: diagramState.result.parseResult.metadata.relationCount,
      nodeCount: diagramState.result.graph.metadata.nodeCount,
      edgeCount: diagramState.result.graph.metadata.edgeCount,
    };
  }, [diagramState.result]);

  async function handleGenerate(nextSchemaText = schemaText) {
    setDiagramState((currentState) => ({
      ...currentState,
      status: "loading",
      error: "",
    }));

    try {
      const result = await generateBrowserErd(nextSchemaText);

      setDiagramState({
        status: "success",
        error: "",
        result,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error while generating ERD.";

      setDiagramState({
        status: "error",
        error: message,
        result: null,
      });
    }
  }

  function handleClear() {
    setSchemaText("");
    setDiagramState({
      status: "idle",
      error: "",
      result: null,
    });
  }

  async function handleFileLoaded(fileContent) {
    setSchemaText(fileContent);
    await handleGenerate(fileContent);
  }

  function handleExportGraph() {
    if (!diagramState.result) {
      return;
    }

    exportGraphJson(diagramState.result.graph);
  }

  async function handleExportImage() {
    if (!diagramState.result) {
      return;
    }

    try {
      await exportDiagramAsPng(diagramExportRef.current);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to export diagram image.";
      setDiagramState((currentState) => ({
        ...currentState,
        status: "error",
        error: message,
      }));
    }
  }

  function handleSaveSnapshot() {
    if (!diagramState.result) {
      return;
    }

    const snapshot = createSnapshot({
      schema: schemaText,
      parseResult: diagramState.result.parseResult,
      graph: diagramState.result.graph,
    });

    exportSnapshotJson(snapshot);
  }

  async function handleOpenSnapshot(file) {
    try {
      const snapshot = await loadSnapshotFromFile(file);

      setSchemaText(snapshot.schema);
      setDiagramState({
        status: "success",
        error: "",
        result: {
          parseResult: snapshot.parseResult,
          graph: snapshot.graph,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to open snapshot file.";
      setDiagramState({
        status: "error",
        error: message,
        result: null,
      });
    }
  }

  const actionsDisabled =
    diagramState.status === "loading" || !diagramState.result;

  return (
    <div className="app-shell">
      <div className="app-layout">
        <aside className="sidebar">
          <div className="sidebar-stack">
            <div>
              <p className="eyebrow">Prisma ERD Generator</p>
              <h1 className="sidebar-title">Professional ERD workspace</h1>
              <p className="sidebar-description">
                Paste a Prisma schema, upload a <code>schema.prisma</code> file,
                or reopen a saved snapshot to generate a modern database-style
                diagram.
              </p>
            </div>

            <SchemaInputPanel
              schemaText={schemaText}
              onSchemaTextChange={setSchemaText}
              onGenerate={handleGenerate}
              onClear={handleClear}
              onFileLoaded={handleFileLoaded}
              isGenerating={diagramState.status === "loading"}
            />

            <StatusPanel
              status={diagramState.status}
              error={diagramState.error}
              summary={summary}
            />

            <ExportActions
              disabled={actionsDisabled}
              onExportGraph={handleExportGraph}
              onExportImage={handleExportImage}
              onSaveSnapshot={handleSaveSnapshot}
              onOpenSnapshot={handleOpenSnapshot}
            />
          </div>
        </aside>

        <main className="workspace">
          <div className="workspace-shell">
            <header className="workspace-header">
              <div>
                <h2 className="workspace-title">ERD Diagram</h2>
                <p className="workspace-subtitle text-balance">
                  Modern database-style visualization with grouped fields,
                  stronger semantics, and a workspace optimized for large Prisma
                  schemas.
                </p>
              </div>

              <div className="workspace-metrics">
                <span className="metric-pill">
                  Models{" "}
                  <span className="metric-pill__value">
                    {summary.modelCount}
                  </span>
                </span>
                <span className="metric-pill">
                  Relations{" "}
                  <span className="metric-pill__value">
                    {summary.relationCount}
                  </span>
                </span>
                <span className="metric-pill">
                  Nodes{" "}
                  <span className="metric-pill__value">
                    {summary.nodeCount}
                  </span>
                </span>
              </div>
            </header>

            <DiagramCanvas
              result={diagramState.result}
              status={diagramState.status}
              exportRef={diagramExportRef}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
