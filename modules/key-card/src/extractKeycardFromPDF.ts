import { buildLinesFromPDFNodes, KeycardEntry, parseKeycardFromLines, PDFTextNode } from './parseKeycard';

/**
 * Extracts keycard entries from a PDF file (browser only).
 *
 * Before calling this function, configure the pdfjs worker:
 *   import { GlobalWorkerOptions } from 'pdfjs-dist';
 *   GlobalWorkerOptions.workerSrc = '<url to pdf.worker.min.js>';
 *
 * pdfjs-dist is loaded via dynamic import so this module can be safely
 * imported in Node.js environments without triggering browser-only globals.
 */
export async function extractKeycardEntriesFromPDF(file: File): Promise<{
  lines: string[];
  entries: KeycardEntry[];
}> {
  const pdfjsLib = await import('pdfjs-dist');
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDocument = await loadingTask.promise;
  const nodes: PDFTextNode[] = [];

  for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber++) {
    const page = await pdfDocument.getPage(pageNumber);
    const textContent = await page.getTextContent();

    for (const item of textContent.items) {
      if (!('str' in item) || !Array.isArray(item.transform)) {
        continue;
      }

      const text = item.str.replace(/\s+/g, ' ').trim();
      if (!text) {
        continue;
      }

      const x = Number(item.transform[4] ?? 0);
      const y = Number(item.transform[5] ?? 0);
      const width = 'width' in item ? Number(item.width ?? 0) : 0;

      nodes.push({ text, x, y, page: pageNumber, width });
    }
  }

  const lines = buildLinesFromPDFNodes(nodes);
  return {
    lines,
    entries: parseKeycardFromLines(lines),
  };
}
