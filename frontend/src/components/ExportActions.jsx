export function ExportActions({
  disabled,
  onExportGraph,
  onExportImage,
  onSaveSnapshot,
  onOpenSnapshot,
}) {
  async function handleSnapshotOpen(event) {
    const [file] = event.target.files ?? [];

    if (!file) {
      return;
    }

    await onOpenSnapshot(file);
    event.target.value = "";
  }

  return (
    <section className="panel panel--exports">
      <div className="panel__header">
        <h2 className="panel__title">Export & share</h2>
        <p className="panel__description">
          Download the graph, export the current diagram view, or save a
          reopenable snapshot.
        </p>
      </div>

      <div className="export-grid">
        <button
          type="button"
          className="button button--secondary"
          onClick={onExportGraph}
          disabled={disabled}
        >
          Export Graph JSON
        </button>
        <button
          type="button"
          className="button button--secondary"
          onClick={onExportImage}
          disabled={disabled}
        >
          Export PNG
        </button>
        <button
          type="button"
          className="button button--secondary"
          onClick={onSaveSnapshot}
          disabled={disabled}
        >
          Save Snapshot
        </button>
        <label className="button button--secondary file-button export-open-button">
          <input
            type="file"
            accept=".json,.prisma-erd.json,application/json"
            onChange={handleSnapshotOpen}
            hidden
          />
          Open Snapshot
        </label>
      </div>
    </section>
  );
}
