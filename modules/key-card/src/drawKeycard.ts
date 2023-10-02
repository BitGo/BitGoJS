import { jsPDF } from 'jspdf';
import * as QRCode from 'qrcode';
import { splitKeys } from './utils';
import { IDrawKeyCard } from './types';

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

function drawOnePageOfQrCodes(
  qrImages: HTMLCanvasElement[],
  doc: jsPDF,
  y: number,
  qrSize: number,
  startIndex
): number {
  doc.setFont('helvetica');
  let qrIndex: number = startIndex;
  for (; qrIndex < qrImages.length; qrIndex++) {
    const image = qrImages[qrIndex];
    const textBuffer = 15;
    if (y + qrSize + textBuffer >= doc.internal.pageSize.getHeight()) {
      return qrIndex;
    }

    doc.addImage(image, left(0), y, qrSize, qrSize);

    if (qrImages.length === 1) {
      return qrIndex + 1;
    }

    y = moveDown(y, qrSize + textBuffer);
    doc.setFontSize(font.body).setTextColor(color.black);
    doc.text('Part ' + (qrIndex + 1).toString(), left(0), y);
    y = moveDown(y, 20);
  }
  return qrIndex + 1;
}

export async function drawKeycard({
  activationCode,
  questions,
  keyCardImage,
  qrData,
  walletLabel,
  curve,
}: IDrawKeyCard): Promise<jsPDF> {
  // document details
  const width = 8.5 * 72;
  let y = 0;

  // Create the PDF instance
  const doc = new jsPDF('portrait', 'pt', 'letter'); // jshint ignore:line
  doc.setFont('helvetica');

  // PDF Header Area - includes the logo and company name
  // This is data for the BitGo logo in the top left of the PDF
  y = moveDown(y, 30);

  if (keyCardImage) {
    doc.addImage(keyCardImage, left(0), y, 303, 40);
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
  const title = curve ? KeyCurveName[curve] + ' key:' : 'wallet named:';
  doc.text('Created on ' + date + ' for ' + title, left(0), y);
  // copy
  y = moveDown(y, 25);
  doc.setFontSize(font.subheader).setTextColor(color.black);
  doc.text(walletLabel, left(0), y);
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

  const qrKeys = ['user', 'passcode', 'backup', 'bitgo'].filter((key) => !!qrData[key]);
  for (let index = 0; index < qrKeys.length; index++) {
    const name = qrKeys[index];
    if (index === 2) {
      // Add 2nd Page
      doc.addPage();

      // 2nd page title
      y = 30;
    }

    const qr = qrData[name];
    let topY = y;
    const textLeft = left(qrSize + 15);
    let textHeight = 0;

    const qrImages: HTMLCanvasElement[] = [];
    const keys = splitKeys(qr.data, QRBinaryMaxLength);
    for (const key of keys) {
      qrImages.push(await QRCode.toCanvas(key, { errorCorrectionLevel: 'L' }));
    }

    let nextQrIndex = drawOnePageOfQrCodes(qrImages, doc, y, qrSize, 0);

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
    if (qr?.data?.length > QRBinaryMaxLength) {
      y = moveDown(y, 30);
      textHeight += 30;
      doc.text('Note: you will need to put all Parts together for the full key', textLeft, y);
    }
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
        nextQrIndex = drawOnePageOfQrCodes(qrImages, doc, y, qrSize, nextQrIndex);
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
    // Move down the size of the QR code minus accumulated height on the right side, plus margin
    // if we have a key that spans multiple pages, then exclude QR code size
    const rowHeight = Math.max(qr.data.length > QRBinaryMaxLength ? qrSize + 20 : qrSize, textHeight);
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
