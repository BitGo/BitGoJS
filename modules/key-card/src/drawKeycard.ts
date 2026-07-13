import type { jsPDF } from 'jspdf';
import * as QRCode from 'qrcode';
import { IDrawKeyCard } from './types';
import { splitKeys } from './utils';
type jsPDFModule = typeof import('jspdf');

const isNode = typeof window === 'undefined' || typeof window.document === 'undefined';

async function loadJSPDF(): Promise<jsPDFModule> {
  let jsPDF: jsPDFModule;

  if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
    // We are in the browser
    jsPDF = await import('jspdf');
  } else {
    // We are in Node.js
    jsPDF = require('jspdf');
  }
  return jsPDF;
}

enum KeyCurveName {
  ed25519 = 'EDDSA',
  secp256k1 = 'ECDSA',
  bls = 'BLS',
}

// Max for Binary/Byte Data https://github.com/soldair/node-qrcode#qr-code-capacity
// the largest theoretically possible value is actually 2953 but the QR codes get so dense that scanning them with a
// phone (off of a printed page) doesn't work anymore
// this limitation was chosen by trial and error
export const QRBinaryMaxLength = 1500;

// Default page-break layout: start a new page before the 3rd box (index 2), matching the
// historical wallet keycard. Callers (e.g. the safe keycard) may override with their own indices.
const DEFAULT_PAGE_BREAK_INDICES = [2];

const font = {
  header: 24,
  subheader: 15,
  body: 12,
};

const color = {
  black: '#000000',
  darkgray: '#4c4c4c',
  gray: '#9b9b9b',
  red: '#e21e1e',
};

const margin = 30;

// Helpers for data formatting / positioning on the paper
function left(x: number): number {
  return margin + x;
}
function moveDown(y: number, ydelta: number): number {
  return y + ydelta;
}

/**
 * Prefixes one fragment of a split key with a part header so a QR scanner can reassemble the
 * fragments without relying on scan order.
 *
 * When a key box's payload exceeds {@link QRBinaryMaxLength}, {@link splitKeys} divides it into
 * multiple QR codes. Each fragment's QR payload is encoded as a 1-based part header followed by
 * the fragment:
 *
 *     "<index>/<total>|<fragment>"      e.g.  "1/3|<chunk>", "2/3|<chunk>", "3/3|<chunk>"
 *
 * A single-fragment payload is returned unchanged (no header).
 *
 * Reassembly contract for a consumer (e.g. a future recovery/scan tool):
 *   1. Scan every QR code for a box.
 *   2. Split each payload on the FIRST "|": the left side is "<index>/<total>", the right side
 *      is the fragment.
 *   3. Verify parts 1..total are all present (total is identical in every header).
 *   4. Concatenate the fragments in ascending index order to recover the full box payload.
 *   5. Parse/decrypt as usual (for a safe box: JSON.parse, then decrypt each root value).
 *
 * Notes:
 *   - The "|" delimiter is safe: base64 ciphertext, JSON, and base58 xpubs never contain it.
 *   - This header exists ONLY inside the QR image. The human-readable "Data:" text printed on
 *     the card is the full, unheadered payload; the PDF-text parser reads that, so this header
 *     does not affect PDF-based recovery.
 */
function encodeQrCodePart(fragment: string, index: number, total: number): string {
  return total > 1 ? `${index + 1}/${total}|${fragment}` : fragment;
}

// Draws QR codes down the left column, returning the index of the next QR still to draw (for
// continuation on a later page) and the y-offset just below the drawn QR column (so callers
// can place content, e.g. a note, under the QR codes).
function drawOnePageOfQrCodes(
  qrImages: (HTMLCanvasElement | string)[],
  doc: jsPDF,
  y: number,
  qrSize: number,
  startIndex: number
): { nextIndex: number; endY: number } {
  doc.setFont('helvetica');
  let qrIndex: number = startIndex;
  for (; qrIndex < qrImages.length; qrIndex++) {
    const image = qrImages[qrIndex];
    const textBuffer = 15;
    if (y + qrSize + textBuffer >= doc.internal.pageSize.getHeight()) {
      return { nextIndex: qrIndex, endY: y };
    }

    if (typeof image === 'string') {
      doc.addImage(image, 'PNG', left(0), y, qrSize, qrSize);
    } else {
      doc.addImage(image, left(0), y, qrSize, qrSize);
    }

    if (qrImages.length === 1) {
      return { nextIndex: qrIndex + 1, endY: y + qrSize };
    }

    y = moveDown(y, qrSize + textBuffer);
    doc.setFontSize(font.body).setTextColor(color.black);
    doc.text('Part ' + (qrIndex + 1).toString(), left(0), y);
    y = moveDown(y, 20);
  }
  return { nextIndex: qrIndex, endY: y };
}

function computeKeyCardImageDimensions(keyCardImage: HTMLImageElement) {
  // Max dimensions stablished by fixed available PDF space
  const KEY_CARD_IMAGE_MAX_DIMENSIONS = {
    width: 303,
    height: 40,
  };

  const { width: imgWidth, height: imgHeight } = keyCardImage;
  const { width: maxWidth, height: maxHeight } = KEY_CARD_IMAGE_MAX_DIMENSIONS;

  // Try scaling ratio based on width
  const wRatio = imgWidth / maxWidth;
  let finalRatio = wRatio;

  // If resized height exceeds the available height space, base ratio also on height
  if (imgHeight / finalRatio > maxHeight) {
    finalRatio = imgHeight / maxHeight;
  }
  return [imgWidth / finalRatio, imgHeight / finalRatio];
}

export async function drawKeycard({
  activationCode,
  questions,
  keyCardImage,
  qrData,
  walletLabel,
  curve,
  pageBreakBeforeIndices = DEFAULT_PAGE_BREAK_INDICES,
  useQrPartHeaders = false,
}: IDrawKeyCard): Promise<jsPDF> {
  const jsPDFModule = await loadJSPDF();

  // document details
  const width = 8.5 * 72;
  let y = 0;

  // Create the PDF instance
  const doc = new jsPDFModule.jsPDF('portrait', 'pt', 'letter'); // jshint ignore:line
  doc.setFont('helvetica');

  // PDF Header Area - includes the logo and company name
  // This is data for the BitGo logo in the top left of the PDF
  y = moveDown(y, 30);

  if (keyCardImage) {
    const [imgWidth, imgHeight] = computeKeyCardImageDimensions(keyCardImage);
    if (isNode) {
      // In Node.js, jsPDF cannot extract pixels from an HTMLImageElement (no DOM/canvas).
      // The script passes a duck-typed object whose .src is a base64 data URL — use it directly.
      doc.addImage((keyCardImage as unknown as { src: string }).src, 'PNG', left(0), y, imgWidth, imgHeight);
    } else {
      doc.addImage(keyCardImage, left(0), y, imgWidth, imgHeight);
    }
  }

  // Activation Code
  if (activationCode) {
    y = moveDown(y, 8);
    doc.setFontSize(font.body).setTextColor(color.gray);
    doc.text('Activation Code', left(460), y);
  }
  doc.setFontSize(font.header).setTextColor(color.black);
  y = moveDown(y, 25);
  doc.text('KeyCard', left(curve && !activationCode ? 460 : 325), y - 1);
  if (activationCode) {
    doc.setFontSize(font.header).setTextColor(color.gray);
    doc.text(activationCode, left(460), y);
  }

  // Subheader
  // titles
  const date = new Date().toDateString();
  y = moveDown(y, margin);
  doc.setFontSize(font.body).setTextColor(color.gray);

  if (curve || walletLabel) {
    const title = curve ? KeyCurveName[curve] + ' key:' : 'wallet named:';
    doc.text('Created on ' + date + ' for ' + title, left(0), y);
    // copy
    y = moveDown(y, 25);
    if (walletLabel) {
      doc.setFontSize(font.subheader).setTextColor(color.black);
      doc.text(walletLabel, left(0), y);
    }
  } else {
    doc.text('Created on ' + date, left(0), y);
    y = moveDown(y, 25);
  }
  if (!curve) {
    // Red Bar
    y = moveDown(y, 20);
    doc.setFillColor(255, 230, 230);
    doc.rect(left(0), y, width - 2 * margin, 32, 'F');

    // warning message
    y = moveDown(y, 20);
    doc.setFontSize(font.body).setTextColor(color.red);
    doc.text('Print this document, or keep it securely offline. See below for FAQ.', left(75), y);
  }
  // Generate the first page's data for the backup PDF
  y = moveDown(y, 35);
  const qrSize = 130;
  const qrKeys = ['user', 'userMasterPublicKey', 'backup', 'backupMasterPublicKey', 'bitgo', 'passcode'].filter(
    (key) => !!qrData[key]
  );
  for (let index = 0; index < qrKeys.length; index++) {
    const name = qrKeys[index];

    if (pageBreakBeforeIndices.includes(index)) {
      // Start a new page for this box
      doc.addPage();

      // 2nd page title
      y = 30;
    }

    const qr = qrData[name];
    let topY = y;
    const textLeft = left(qrSize + 15);
    let textHeight = 0;

    const qrImages: (HTMLCanvasElement | string)[] = [];
    const keys = splitKeys(qr.data, QRBinaryMaxLength);
    for (let i = 0; i < keys.length; i++) {
      const payload = useQrPartHeaders ? encodeQrCodePart(keys[i], i, keys.length) : keys[i];
      if (isNode) {
        qrImages.push(await QRCode.toDataURL(payload, { errorCorrectionLevel: 'L' }));
      } else {
        qrImages.push(await QRCode.toCanvas(payload, { errorCorrectionLevel: 'L' }));
      }
    }

    const isMultiPart = qr?.data?.length > QRBinaryMaxLength;
    const { nextIndex, endY: qrColumnEndY } = drawOnePageOfQrCodes(qrImages, doc, y, qrSize, 0);
    let nextQrIndex = nextIndex;

    // For a split key, place the "put all Parts together" note directly under the QR codes,
    // wrapped to the QR column width so it stays in the left column and never overlaps the
    // Data payload rendered on the right.
    let qrColumnBottom = qrColumnEndY;
    if (isMultiPart) {
      doc.setFontSize(font.body - 2).setTextColor(color.darkgray);
      const noteLines = doc.splitTextToSize('Note: you will need to put all Parts together for the full key', qrSize);
      const noteY = moveDown(qrColumnEndY, 15);
      doc.text(noteLines, left(0), noteY);
      qrColumnBottom = noteY + noteLines.length * doc.getLineHeight();
    }

    doc.setFontSize(font.subheader).setTextColor(color.black);
    y = moveDown(y, 10);
    textHeight += 10;
    doc.text(qr.title, textLeft, y);
    textHeight += doc.getLineHeight();
    y = moveDown(y, 15);
    textHeight += 15;
    doc.setFontSize(font.body).setTextColor(color.darkgray);
    doc.text(qr.description, textLeft, y);
    textHeight += doc.getLineHeight();
    doc.setFontSize(font.body - 2);
    y = moveDown(y, 30);
    textHeight += 30;
    doc.text('Data:', textLeft, y);
    textHeight += doc.getLineHeight();
    y = moveDown(y, 15);
    textHeight += 15;
    const width = 72 * 8.5 - textLeft - 30;
    doc.setFont('courier').setFontSize(9).setTextColor(color.black);
    const lines = doc.splitTextToSize(qr.data, width);
    const buffer = 10;
    for (let line = 0; line < lines.length; line++) {
      // add new page if data does not fit on one page
      if (y + buffer >= doc.internal.pageSize.getHeight()) {
        doc.addPage();
        textHeight = 0;
        y = 30;
        topY = y;
        // Redraw remaining QRs on the new page and update the column bottom to THIS page, so
        // the rowHeight math below stays same-page (avoids a stale page-1 coordinate).
        const continued = drawOnePageOfQrCodes(qrImages, doc, y, qrSize, nextQrIndex);
        nextQrIndex = continued.nextIndex;
        qrColumnBottom = continued.endY;
        doc.setFont('courier').setFontSize(9).setTextColor(color.black);
      }
      doc.text(lines[line], textLeft, y);
      if (line !== lines.length - 1) {
        y = moveDown(y, buffer);
        textHeight += buffer;
      }
    }

    // Add public key if exists
    if (qr.publicMasterKey) {
      const text = 'Key Id: ' + qr.publicMasterKey;

      // Gray bar
      y = moveDown(y, 20);
      textHeight += 20;
      doc.setFillColor(247, 249, 249); // Gray background
      doc.setDrawColor(0, 0, 0); // Border

      // Leave a bit of space for the side of the rectangle.
      const splitKeyId = doc.splitTextToSize(text, width - 10);

      // The height of the box must be at least 15 px (for single line case), or
      // a multiple of 13 for each line.  This allows for proper padding.
      doc.rect(textLeft, y, width, Math.max(12 * splitKeyId.length, 15), 'FD');
      textHeight += splitKeyId.length * doc.getLineHeight();
      doc.text(splitKeyId, textLeft + 5, y + 10);
    }

    doc.setFont('helvetica');
    // Move down past the taller of the two columns: the right-side text (textHeight) or the
    // left-side QR column (plus the note printed under it for split keys), then add a margin.
    const qrColumnHeight = isMultiPart ? qrColumnBottom - topY : qrSize;
    const rowHeight = Math.max(qrColumnHeight, textHeight);
    const marginBottom = 15;
    y = moveDown(y, rowHeight - (y - topY) + marginBottom);
  }

  // Add next Page
  doc.addPage();

  // next pages title
  y = 0;
  y = moveDown(y, 55);
  doc.setFontSize(font.header).setTextColor(color.black);
  doc.text('BitGo KeyCard FAQ', left(0), y);

  // Generate the second page's data for the backup PDF
  y = moveDown(y, 30);
  questions.forEach(function (q) {
    doc.setFontSize(font.subheader).setTextColor(color.black);
    doc.text(q.question, left(0), y);
    y = moveDown(y, 20);
    doc.setFontSize(font.body).setTextColor(color.darkgray);
    q.answer.forEach(function (line) {
      doc.text(line, left(0), y);
      y = moveDown(y, font.body + 3);
    });
    y = moveDown(y, 22);
  });

  return doc;
}
