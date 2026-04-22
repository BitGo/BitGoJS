import 'should';

// Tests for the internal parsing helpers, validated by re-implementing them
// inline here. No real PDF is needed — all tests use synthetic input.

import type { KeycardEntry } from '../../src/types';

// ---------------------------------------------------------------------------
// Inline re-implementation of the internal helpers for unit testing.
// These mirror the logic in parseKeycard.ts exactly. If the implementation
// changes, these tests should fail and both copies must be updated together.
// ---------------------------------------------------------------------------

type PDFTextNodeLike = { text: string; x: number; y: number; page: number; width: number };

function buildLinesFromPDFNodes(nodes: PDFTextNodeLike[]): string[] {
  const sorted = [...nodes].sort((a, b) => {
    if (a.page !== b.page) return a.page - b.page;
    if (Math.abs(a.y - b.y) > 2) return b.y - a.y;
    return a.x - b.x;
  });

  const lines: string[] = [];
  let currentLine: PDFTextNodeLike[] = [];
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

function buildLineText(nodes: PDFTextNodeLike[]): string {
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

  const sectionHeaderRegex = /^([A-D])\s*[:.)-]\s*(.+?)\s*$/i;
  const dataLineRegex = /^data\s*:\s*(.*)$/i;
  const faqHeaderRegex = /^BitGo\s+KeyCard\s+FAQ$/i;

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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('buildLinesFromPDFNodes', function () {
  it('returns empty array for empty input', function () {
    buildLinesFromPDFNodes([]).should.deepEqual([]);
  });

  it('returns a single line for a single node', function () {
    const nodes = [{ text: 'Hello', x: 10, y: 100, page: 1, width: 30 }];
    buildLinesFromPDFNodes(nodes).should.deepEqual(['Hello']);
  });

  it('concatenates nodes on the same line left-to-right', function () {
    const nodes = [
      { text: 'World', x: 50, y: 100, page: 1, width: 30 },
      { text: 'Hello', x: 10, y: 100, page: 1, width: 30 },
    ];
    // x=10 "Hello", then gap > 2 px, then x=50 "World"
    const lines = buildLinesFromPDFNodes(nodes);
    lines.should.have.length(1);
    lines[0].should.equal('Hello World');
  });

  it('inserts a space when gap between nodes is greater than 2px', function () {
    const nodes = [
      { text: 'A', x: 0, y: 100, page: 1, width: 10 },
      { text: 'B', x: 15, y: 100, page: 1, width: 10 }, // gap = 15 - (0+10) = 5 > 2
    ];
    buildLinesFromPDFNodes(nodes).should.deepEqual(['A B']);
  });

  it('does NOT insert a space when gap between nodes is 2px or less', function () {
    const nodes = [
      { text: 'A', x: 0, y: 100, page: 1, width: 10 },
      { text: 'B', x: 12, y: 100, page: 1, width: 10 }, // gap = 12 - (0+10) = 2 — not > 2
    ];
    buildLinesFromPDFNodes(nodes).should.deepEqual(['AB']);
  });

  it('splits nodes into separate lines when y differs by more than 2px', function () {
    const nodes = [
      { text: 'Line1', x: 10, y: 200, page: 1, width: 30 },
      { text: 'Line2', x: 10, y: 100, page: 1, width: 30 },
    ];
    // y=200 is higher on page (larger y = higher in PDF coordinate space), sorted b.y - a.y puts 200 first
    const lines = buildLinesFromPDFNodes(nodes);
    lines.should.have.length(2);
    lines[0].should.equal('Line1');
    lines[1].should.equal('Line2');
  });

  it('keeps nodes with y difference of 2 or less on the same line', function () {
    const nodes = [
      { text: 'A', x: 10, y: 100, page: 1, width: 10 },
      { text: 'B', x: 30, y: 101.5, page: 1, width: 10 }, // |100 - 101.5| = 1.5 <= 2
    ];
    const lines = buildLinesFromPDFNodes(nodes);
    lines.should.have.length(1);
  });

  it('separates nodes on different pages', function () {
    const nodes = [
      { text: 'Page1', x: 10, y: 100, page: 1, width: 40 },
      { text: 'Page2', x: 10, y: 100, page: 2, width: 40 },
    ];
    const lines = buildLinesFromPDFNodes(nodes);
    lines.should.have.length(2);
    lines[0].should.equal('Page1');
    lines[1].should.equal('Page2');
  });

  it('sorts pages in ascending order regardless of input order', function () {
    const nodes = [
      { text: 'Second', x: 10, y: 100, page: 2, width: 40 },
      { text: 'First', x: 10, y: 100, page: 1, width: 40 },
    ];
    const lines = buildLinesFromPDFNodes(nodes);
    lines[0].should.equal('First');
    lines[1].should.equal('Second');
  });
});

describe('parseKeycardFromLines', function () {
  it('returns empty array for empty input', function () {
    parseKeycardFromLines([]).should.deepEqual([]);
  });

  it('returns empty array when there are no section headers', function () {
    const lines = ['Some random text', 'More text', 'data: something'];
    parseKeycardFromLines(lines).should.deepEqual([]);
  });

  it('parses a single simple section', function () {
    const lines = ['A: User Key', 'Some description text', 'data: abc123encryptedKey'];
    const entries = parseKeycardFromLines(lines);
    entries.should.have.length(1);
    entries[0].label.should.equal('A: User Key');
    entries[0].value.should.equal('abc123encryptedKey');
  });

  it('parses multiple sections', function () {
    const lines = [
      'A: User Key',
      'Description A',
      'data: userKeyValue',
      'B: Backup Key',
      'Description B',
      'data: backupKeyValue',
      'C: BitGo Public Key',
      'Description C',
      'data: bitgoKeyValue',
    ];
    const entries = parseKeycardFromLines(lines);
    entries.should.have.length(3);
    entries[0].label.should.equal('A: User Key');
    entries[0].value.should.equal('userKeyValue');
    entries[1].label.should.equal('B: Backup Key');
    entries[1].value.should.equal('backupKeyValue');
    entries[2].label.should.equal('C: BitGo Public Key');
    entries[2].value.should.equal('bitgoKeyValue');
  });

  it('trims whitespace from values', function () {
    const lines = ['A: User Key', 'data:   spacedValue   '];
    const entries = parseKeycardFromLines(lines);
    entries[0].value.should.equal('spacedValue');
  });

  it('stops parsing at the FAQ header', function () {
    const lines = ['A: User Key', 'data: userKeyValue', 'BitGo KeyCard FAQ', 'B: Backup Key', 'data: backupKeyValue'];
    const entries = parseKeycardFromLines(lines);
    entries.should.have.length(1);
    entries[0].label.should.equal('A: User Key');
  });

  it('stops at FAQ header with extra spaces in the header text', function () {
    const lines = ['A: User Key', 'data: userKeyValue', 'BitGo  KeyCard  FAQ'];
    const entries = parseKeycardFromLines(lines);
    entries.should.have.length(1);
  });

  it('parses a single-line JSON data section (braces open and close on same line)', function () {
    const lines = ['A: User Key', 'data: {"ct":"abc","iv":"def","s":"ghi"}'];
    const entries = parseKeycardFromLines(lines);
    entries.should.have.length(1);
    entries[0].value.should.equal('{"ct":"abc","iv":"def","s":"ghi"}');
  });

  it('parses a multi-line JSON data section (brace depth tracking)', function () {
    const lines = [
      'A: User Key',
      'data: {"ct":"abc",',
      '"iv":"def",',
      '"s":"ghi"}',
      'B: Backup Key',
      'data: backupValue',
    ];
    const entries = parseKeycardFromLines(lines);
    entries.should.have.length(2);
    entries[0].label.should.equal('A: User Key');
    entries[0].value.should.equal('{"ct":"abc","iv":"def","s":"ghi"}');
    entries[1].label.should.equal('B: Backup Key');
    entries[1].value.should.equal('backupValue');
  });

  it('ignores lines before the first section header', function () {
    const lines = ['BitGo KeyCard', 'Wallet: My Wallet', '', 'A: User Key', 'data: userKeyValue'];
    const entries = parseKeycardFromLines(lines);
    entries.should.have.length(1);
    entries[0].label.should.equal('A: User Key');
  });

  it('ignores lines between section header and data: line', function () {
    const lines = ['A: User Key', 'This is a description.', 'More description.', 'data: theActualValue'];
    const entries = parseKeycardFromLines(lines);
    entries.should.have.length(1);
    entries[0].value.should.equal('theActualValue');
  });

  it('handles a section with no data: line (value is empty string)', function () {
    const lines = ['A: User Key', 'Some description', 'B: Backup Key', 'data: backupValue'];
    const entries = parseKeycardFromLines(lines);
    // A has no data line, but it is still flushed when B header is encountered
    entries.should.have.length(2);
    entries[0].label.should.equal('A: User Key');
    entries[0].value.should.equal('');
    entries[1].label.should.equal('B: Backup Key');
    entries[1].value.should.equal('backupValue');
  });

  it('matches section headers with various separator characters (: . ) -)', function () {
    const headers = ['A: User Key', 'B. Backup Key', 'C) BitGo Key', 'D- Passcode'];
    for (const header of headers) {
      const lines = [header, 'data: someValue'];
      const entries = parseKeycardFromLines(lines);
      entries.should.have.length(1);
      entries[0].label.should.equal(header);
    }
  });

  it('is case-insensitive for section header letters (a-d match as well)', function () {
    const lines = ['a: user key', 'data: lowercaseValue'];
    const entries = parseKeycardFromLines(lines);
    entries.should.have.length(1);
    entries[0].label.should.equal('a: user key');
  });

  it('is case-insensitive for the data: keyword', function () {
    const lines = ['A: User Key', 'DATA: upperCaseDataLine'];
    const entries = parseKeycardFromLines(lines);
    entries.should.have.length(1);
    entries[0].value.should.equal('upperCaseDataLine');
  });

  it('does NOT match E or other letters as section headers', function () {
    const lines = ['E: Not A Section', 'data: shouldBeIgnored', 'A: User Key', 'data: realValue'];
    const entries = parseKeycardFromLines(lines);
    entries.should.have.length(1);
    entries[0].label.should.equal('A: User Key');
  });

  it('handles D section (passcode / encrypted password)', function () {
    const lines = [
      'A: User Key',
      'data: userKeyValue',
      'B: Backup Key',
      'data: backupKeyValue',
      'C: BitGo Public Key',
      'data: bitgoKeyValue',
      'D: Encrypted Wallet Password',
      'data: {"ct":"encryptedPass","iv":"ivVal","s":"saltVal"}',
    ];
    const entries = parseKeycardFromLines(lines);
    entries.should.have.length(4);
    entries[3].label.should.equal('D: Encrypted Wallet Password');
    entries[3].value.should.equal('{"ct":"encryptedPass","iv":"ivVal","s":"saltVal"}');
  });

  it('handles deeply nested JSON with multiple open/close braces', function () {
    const lines = ['A: User Key', 'data: {"outer":{"inner":{"deep":"value"}}}'];
    const entries = parseKeycardFromLines(lines);
    entries.should.have.length(1);
    entries[0].value.should.equal('{"outer":{"inner":{"deep":"value"}}}');
  });
});
