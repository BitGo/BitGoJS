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

const sectionHeaderRegex = /^([A-D])\s*[:.)-]\s*(.+?)\s*$/i;
const dataLineRegex = /^data\s*:\s*(.*)$/i;
const faqHeaderRegex = /^BitGo\s+KeyCard\s+FAQ$/i;

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
  return title.toLowerCase().includes('encrypted wallet password');
}

export function buildLinesFromPDFNodes(nodes: PDFTextNode[]): string[] {
  const sortedNodes = [...nodes].sort((a, b) => {
    if (a.page !== b.page) {
      return a.page - b.page;
    }
    const yDiff = Math.abs(a.y - b.y);
    if (yDiff > 2) {
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

      if (previousRightEdge !== null && node.x - previousRightEdge > 2) {
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
    const lineChanged = Number.isNaN(currentY) || Math.abs(node.y - currentY) > 2;
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
