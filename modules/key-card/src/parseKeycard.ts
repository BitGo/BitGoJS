import type { KeycardEntry, PDFTextNode } from './types';

// pdfjs-dist is loaded lazily inside extractKeycardEntriesFromPDF to avoid
// loading browser-only globals at module evaluation time, which would crash
// in Node.js test environments.
//
// pdfjs-dist/webpack.mjs is Mozilla's official webpack entry point. It sets
// GlobalWorkerOptions.workerPort via webpack's native new Worker(new URL(...))
// pattern, so no manual worker configuration is needed in webpack builds.

// --- Regexes ---
const sectionHeaderRegex = /^([A-D])\s*[:.)-]\s*(.+?)\s*$/i;
const dataLineRegex = /^data\s*:\s*(.*)$/i;
const faqHeaderRegex = /^BitGo\s+KeyCard\s+FAQ$/i;

// --- Line reconstruction from PDF text nodes ---

function buildLinesFromPDFNodes(nodes: PDFTextNode[]): string[] {
  // Sort by page asc, y desc (top-to-bottom), x asc (left-to-right)
  const sorted = [...nodes].sort((a, b) => {
    if (a.page !== b.page) return a.page - b.page;
    if (Math.abs(a.y - b.y) > 2) return b.y - a.y;
    return a.x - b.x;
  });

  const lines: string[] = [];
  let currentLine: PDFTextNode[] = [];
  let currentY = -Infinity;
  let currentPage = -1;

  for (const node of sorted) {
    if (node.page !== currentPage || Math.abs(node.y - currentY) > 2) {
      if (currentLine.length > 0) {
        lines.push(buildLineText(currentLine));
      }
      currentLine = [node];
      currentY = node.y;
      currentPage = node.page;
    } else {
      currentLine.push(node);
    }
  }
  if (currentLine.length > 0) {
    lines.push(buildLineText(currentLine));
  }
  return lines;
}

function buildLineText(nodes: PDFTextNode[]): string {
  const sorted = [...nodes].sort((a, b) => a.x - b.x);
  let result = '';
  let lastX = -Infinity;
  let lastWidth = 0;
  for (const node of sorted) {
    if (lastX !== -Infinity && node.x - (lastX + lastWidth) > 2) {
      result += ' ';
    }
    result += node.text;
    lastX = node.x;
    lastWidth = node.width;
  }
  return result;
}

// --- Section parsing ---

function parseKeycardFromLines(lines: string[]): KeycardEntry[] {
  const entries: KeycardEntry[] = [];
  let currentLabel: string | null = null;
  let currentValue = '';
  let capturingData = false;
  let braceDepth = 0;
  let isJsonSection = false;

  const flushEntry = () => {
    if (currentLabel !== null) {
      entries.push({ label: currentLabel, value: currentValue.trim() });
      currentLabel = null;
      currentValue = '';
      capturingData = false;
      braceDepth = 0;
      isJsonSection = false;
    }
  };

  for (const line of lines) {
    if (faqHeaderRegex.test(line)) {
      flushEntry();
      break;
    }

    const headerMatch = sectionHeaderRegex.exec(line);
    if (headerMatch) {
      flushEntry();
      currentLabel = line.trim();
      continue;
    }

    if (currentLabel === null) continue;

    if (!capturingData) {
      const dataMatch = dataLineRegex.exec(line);
      if (dataMatch) {
        capturingData = true;
        const firstChunk = dataMatch[1] ?? '';
        if (firstChunk.includes('{')) {
          isJsonSection = true;
          braceDepth += (firstChunk.match(/\{/g) ?? []).length;
          braceDepth -= (firstChunk.match(/\}/g) ?? []).length;
        }
        currentValue = firstChunk;
        if (isJsonSection && braceDepth <= 0) flushEntry();
      }
    } else if (isJsonSection) {
      braceDepth += (line.match(/\{/g) ?? []).length;
      braceDepth -= (line.match(/\}/g) ?? []).length;
      currentValue += line;
      if (braceDepth <= 0) flushEntry();
    } else {
      currentValue += line;
    }
  }
  flushEntry();
  return entries;
}

// --- Public API ---

/**
 * Extracts structured keycard entries from a BitGo KeyCard PDF file.
 *
 * Parses all PDF text nodes across all pages, reconstructs visual lines,
 * then identifies labelled sections (A:, B:, C:, D:) and their associated
 * data values. Stops parsing at the FAQ section header.
 *
 * @param file - A browser `File` object representing the KeyCard PDF.
 * @returns An object containing:
 *   - `lines`: The reconstructed text lines from all PDF pages (useful for debugging).
 *   - `entries`: The parsed `KeycardEntry` array (label + value pairs).
 */
export async function extractKeycardEntriesFromPDF(file: File): Promise<{
  lines: string[];
  entries: KeycardEntry[];
}> {
  const pdfjsLib = await import('pdfjs-dist/webpack.mjs');
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const nodes: PDFTextNode[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    for (const item of textContent.items) {
      if ('str' in item && item.str.trim()) {
        const transform = item.transform as number[];
        nodes.push({
          text: item.str,
          x: transform[4],
          y: transform[5],
          page: pageNum,
          width: item.width,
        });
      }
    }
  }

  const lines = buildLinesFromPDFNodes(nodes);
  const entries = parseKeycardFromLines(lines);
  return { lines, entries };
}
