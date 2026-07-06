export function SchemaInputPanel({
  schemaText,
  onSchemaTextChange,
  onGenerate,
  onClear,
  onFileLoaded,
  isGenerating,
}) {
  async function handleSubmit(event) {
    event.preventDefault();
    await onGenerate(schemaText);
  }

  async function handleFileChange(event) {
    const [file] = event.target.files ?? [];

    if (!file) {
      return;
    }

    const content = await file.text();
    await onFileLoaded(content);
    event.target.value = "";
  }

  return (
    <form className="panel" onSubmit={handleSubmit}>
      <div className="panel__header">
        <h2 className="panel__title">Schema input</h2>
        <p className="panel__description">
          Paste schema text or upload a Prisma schema file.
        </p>
      </div>

      <label className="field">
        <span className="field__label">Prisma schema</span>
        <textarea
          className="schema-textarea"
          value={schemaText}
          onChange={(event) => onSchemaTextChange(event.target.value)}
          placeholder="Paste your schema.prisma contents here"
          spellCheck="false"
        />
      </label>

      <div className="panel__actions">
        <label className="button button--secondary file-button">
          <input
            type="file"
            accept=".prisma,text/plain"
            onChange={handleFileChange}
            hidden
          />
          Upload file
        </label>

        <button
          type="submit"
          className="button button--primary"
          disabled={isGenerating}
        >
          {isGenerating ? "Generating…" : "Generate ERD"}
        </button>

        <button
          type="button"
          className="button button--ghost"
          onClick={onClear}
          disabled={isGenerating}
        >
          Clear
        </button>
      </div>
    </form>
  );
}
