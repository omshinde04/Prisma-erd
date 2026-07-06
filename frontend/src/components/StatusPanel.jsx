function getStatusLabel(status) {
  switch (status) {
    case "loading":
      return "Generating diagram";
    case "success":
      return "Diagram generated";
    case "error":
      return "Generation failed";
    default:
      return "Ready";
  }
}

export function StatusPanel({ status, error, summary }) {
  return (
    <section className="panel panel--status">
      <div className="panel__header">
        <h2 className="panel__title">Generation status</h2>
        <span className={`status-badge status-badge--${status}`}>
          {getStatusLabel(status)}
        </span>
      </div>

      <p className="panel__description">
        Track schema parsing and ERD generation metrics while you work with
        large Prisma schemas.
      </p>

      {error ? <p className="status-error">{error}</p> : null}

      <dl className="status-grid">
        <div className="status-card">
          <dt className="status-card__label">Models</dt>
          <dd className="status-card__value">{summary.modelCount}</dd>
        </div>
        <div className="status-card">
          <dt className="status-card__label">Enums</dt>
          <dd className="status-card__value">{summary.enumCount}</dd>
        </div>
        <div className="status-card">
          <dt className="status-card__label">Relations</dt>
          <dd className="status-card__value">{summary.relationCount}</dd>
        </div>
        <div className="status-card">
          <dt className="status-card__label">Nodes</dt>
          <dd className="status-card__value">{summary.nodeCount}</dd>
        </div>
        <div className="status-card">
          <dt className="status-card__label">Edges</dt>
          <dd className="status-card__value">{summary.edgeCount}</dd>
        </div>
      </dl>
    </section>
  );
}
