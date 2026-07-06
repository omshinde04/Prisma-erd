import { toPng } from 'html-to-image';

export async function exportDiagramAsPng(element, fileName = 'prisma-erd-diagram.png') {
  if (!element) {
    throw new Error('Diagram container is not available for export.');
  }

  const dataUrl = await toPng(element, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: '#020617',
  });

  const anchor = document.createElement('a');
  anchor.href = dataUrl;
  anchor.download = fileName;
  anchor.click();
}
