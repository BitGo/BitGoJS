import * as t from 'io-ts';
import { isLeft } from 'fp-ts/Either';
import { PathReporter } from 'io-ts/lib/PathReporter';
import { JsonFromString } from 'io-ts-types';
import { SafeKeycardRoots } from './types';

export type PDFTextNode = {
  text: string;
  x: number;
  y: number;
  page: number;
  width: number;
};

export type KeycardEntry = {
  label: string;
  value: string;
};

// A safe keycard box is a JSON object mapping each rootKeyType to a string (per-root
// ciphertext for A/B, public key for C).
const SafeKeycardRootsCodec: t.Type<SafeKeycardRoots> = t.type({
  secp256k1Multisig: t.string,
  ecdsaMpc: t.string,
  eddsaMpc: t.string,
  ed25519Multisig: t.string,
});

// Decodes a box's JSON string straight into the validated roots record.
const SafeKeycardBoxFromString = JsonFromString.pipe(SafeKeycardRootsCodec);

/**
 * Parses a safe keycard box value — the JSON packed by `generateSafeQrData`, e.g.
 * `{"secp256k1Multisig":"…","ecdsaMpc":"…",…}` — into its four roots. Throws if the value is
 * not valid JSON or any root is missing/non-string. Recovery tooling calls this on the A/B/C
 * box value returned by {@link parseKeycardFromLines}, then decrypts each root value with the
 * safe password.
 */
export function parseSafeKeycardBox(data: string): SafeKeycardRoots {
  const decoded = SafeKeycardBoxFromString.decode(data);
  if (isLeft(decoded)) {
    throw new Error(`parseSafeKeycardBox: ${PathReporter.report(decoded).join('; ')}`);
  }
  return decoded.right;
}

const sectionHeaderRegex = /^([A-D])\s*[:.)-]\s*(.+?)\s*$/i;
const dataLineRegex = /^data\s*:\s*(.*)$/i;
const faqHeaderRegex = /^BitGo\s+KeyCard\s+FAQ$/i;

// PDF coordinate tolerance in points. Nodes within this distance on the Y-axis
// are treated as belonging to the same line; nodes further apart are separate lines.
const PDF_LINE_Y_TOLERANCE = 2;
// Horizontal gap in points above which a space is inserted between adjacent nodes.
const PDF_NODE_GAP_THRESHOLD = 2;

function sanitizeText(input: string): string {
  return input.replace(/\s+/g, ' ').trim();
}

function normalizeSectionValue(rawValue: string): string {
  // Two-pass removal of "Part N" page-continuation labels:
  // 1. Line filter: removes labels that appear as standalone lines.
  // 2. Regex replace: removes labels embedded mid-line when
  //    buildLinesFromPDFNodes merges them with adjacent content at the same
  //    y-coordinate (e.g. "...X88bPart 2 lFPMd...").
  // join('') intentionally uses no separator — section values are continuous
  // strings (base64 / xpub) that wrap across PDF lines without spaces.
  return rawValue
    .split('\n')
    .filter((line) => !/^Part\s+\d+$/i.test(line.trim()))
    .join('')
    .replace(/\s*Part\s+\d+\s*/gi, '')
    .trim();
}

function countChar(input: string, char: string): number {
  return input.split(char).length - 1;
}

function isEncryptedWalletPasswordSectionTitle(title: string): boolean {
  const normalized = title.toLowerCase();
  // Box D is titled "Encrypted Wallet Password" (wallet) or "Encrypted Safe Password" (safe).
  return normalized.includes('encrypted wallet password') || normalized.includes('encrypted safe password');
}

/**
 * Reconstructs logical text lines from an unordered set of PDF text nodes.
 *
 * PDF text extraction returns individual positioned fragments. This function
 * sorts them by page then Y-coordinate (top-to-bottom), groups fragments
 * within PDF_LINE_Y_TOLERANCE points of each other onto the same line, and
 * inserts a space between fragments that are separated by more than
 * PDF_NODE_GAP_THRESHOLD points horizontally.
 */
export function buildLinesFromPDFNodes(nodes: PDFTextNode[]): string[] {
  const sortedNodes = [...nodes].sort((a, b) => {
    if (a.page !== b.page) {
      return a.page - b.page;
    }
    const yDiff = Math.abs(a.y - b.y);
    if (yDiff > PDF_LINE_Y_TOLERANCE) {
      return b.y - a.y;
    }
    return a.x - b.x;
  });

  const lines: string[] = [];
  let currentLineNodes: PDFTextNode[] = [];
  let currentPage = -1;
  let currentY = Number.NaN;

  function flushLine() {
    if (currentLineNodes.length === 0) {
      return;
    }

    const sortedLineNodes = [...currentLineNodes].sort((a, b) => a.x - b.x);
    let line = '';
    let previousRightEdge: number | null = null;
    for (const node of sortedLineNodes) {
      const piece = sanitizeText(node.text);
      if (!piece) {
        continue;
      }

      if (previousRightEdge !== null && node.x - previousRightEdge > PDF_NODE_GAP_THRESHOLD) {
        line += ' ';
      }
      line += piece;
      previousRightEdge = node.x + node.width;
    }

    const normalizedLine = line.trim();
    if (normalizedLine) {
      lines.push(normalizedLine);
    }
  }

  for (const node of sortedNodes) {
    const pageChanged = node.page !== currentPage;
    const lineChanged = Number.isNaN(currentY) || Math.abs(node.y - currentY) > PDF_LINE_Y_TOLERANCE;
    if (pageChanged || lineChanged) {
      flushLine();
      currentLineNodes = [node];
      currentPage = node.page;
      currentY = node.y;
      continue;
    }

    currentLineNodes.push(node);
  }

  flushLine();
  return lines;
}

export function parseKeycardFromLines(lines: string[]): KeycardEntry[] {
  const sections: Array<{
    section: string;
    title: string;
    values: string[];
    isCapturingData: boolean;
    openCurlyCount: number;
  }> = [];
  let currentSectionIndex = -1;

  for (const line of lines) {
    const labelMatch = line.match(sectionHeaderRegex);
    if (labelMatch) {
      const section = labelMatch[1]?.toUpperCase();
      const title = sanitizeText(labelMatch[2] ?? '');
      if (section && title) {
        sections.push({
          section,
          title,
          values: [],
          isCapturingData: false,
          openCurlyCount: 0,
        });
        currentSectionIndex = sections.length - 1;
        continue;
      }
    }

    if (currentSectionIndex < 0) {
      continue;
    }

    const currentSection = sections[currentSectionIndex];
    if (!currentSection) {
      continue;
    }

    const dataLineMatch = line.match(dataLineRegex);
    if (dataLineMatch) {
      currentSection.isCapturingData = true;
      const inlineValue = sanitizeText(dataLineMatch[1] ?? '');
      if (inlineValue) {
        currentSection.values.push(inlineValue);
        currentSection.openCurlyCount += countChar(inlineValue, '{') - countChar(inlineValue, '}');
      }
      continue;
    }

    if (currentSection.isCapturingData) {
      if (faqHeaderRegex.test(line)) {
        currentSection.isCapturingData = false;
        continue;
      }

      currentSection.values.push(line);

      // For encrypted wallet password, data is a single JSON object. Stop as
      // soon as the object closes so footer/FAQ content is not appended.
      if (isEncryptedWalletPasswordSectionTitle(currentSection.title)) {
        currentSection.openCurlyCount += countChar(line, '{') - countChar(line, '}');
        if (currentSection.values.length > 0 && currentSection.openCurlyCount <= 0) {
          currentSection.isCapturingData = false;
        }
      }
    }
  }

  return sections
    .filter(({ section, values }) => ['A', 'B', 'C', 'D'].includes(section) && values.length > 0)
    .map(({ section, title, values }) => ({
      label: `${section}: ${title}`,
      value: normalizeSectionValue(values.join('\n')),
    }));
}
