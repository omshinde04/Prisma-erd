function downloadTextFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = fileName;
  anchor.click();

  URL.revokeObjectURL(url);
}

export function exportGraphJson(graph, fileName = 'prisma-erd-graph.json') {
  const content = JSON.stringify(graph, null, 2);
  downloadTextFile(content, fileName, 'application/json');
}

export function exportSnapshotJson(snapshot, fileName = 'prisma-erd-snapshot.prisma-erd.json') {
  const content = JSON.stringify(snapshot, null, 2);
  downloadTextFile(content, fileName, 'application/json');
}
