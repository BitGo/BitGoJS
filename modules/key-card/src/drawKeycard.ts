import { jsPDF } from 'jspdf';
import { FAQ } from './faq';
import { QrData } from './generateQrData';
import { splitKeys } from './utils';

// Max for Binary/Byte Data https://en.wikipedia.org/wiki/QR_code#Standards
// keys for TSS wallets aren't alphanumeric, so qrcode.react falls back to binary/byte encoding
export const QRBinaryMaxLength = 2953;

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

export async function drawKeycard({ activationCode, createQrCanvas, questions, keyCardImage, qrData, walletLabel }: {
  activationCode?: string;
  createQrCanvas: (data: string) => Promise<HTMLCanvasElement>;
  keyCardImage?: HTMLImageElement;
  qrData: QrData;
  questions: FAQ[];
  walletLabel: string;
}): Promise<jsPDF> {
  // document details
  const width = 8.5 * 72;
  let y = 0;

  // Helpers for data formatting / positioning on the paper
  const left = (x: number) => margin + x;
  const moveDown = (ydelta: number) => (y += ydelta);

  // Create the PDF instance

  const doc = new jsPDF('portrait', 'pt', 'letter'); // jshint ignore:line
  doc.setFont('helvetica');

  // PDF Header Area - includes the logo and company name
  // This is data for the BitGo logo in the top left of the PDF
  moveDown(30);

  if (keyCardImage) {
    doc.addImage(keyCardImage, left(0), y, 303, 40);
  }

  // Activation Code
  if (activationCode) {
    moveDown(8);
    doc.setFontSize(font.body).setTextColor(color.gray);
    doc.text('Activation Code', left(460), y);
  }
  doc.setFontSize(font.header).setTextColor(color.black);
  moveDown(25);
  doc.text('KeyCard', left(325), y - 1);
  if (activationCode) {
    doc.setFontSize(font.header).setTextColor(color.gray);
    doc.text(activationCode, left(460), y);
  }

  // Subheader
  // titles
  const date = new Date().toDateString();
  moveDown(margin);
  doc.setFontSize(font.body).setTextColor(color.gray);
  doc.text('Created on ' + date + ' for wallet named:', left(0), y);
  // copy
  moveDown(25);
  doc.setFontSize(font.subheader).setTextColor(color.black);
  doc.text(walletLabel, left(0), y);
  // Red Bar
  moveDown(20);
  doc.setFillColor(255, 230, 230);
  doc.rect(left(0), y, width - 2 * margin, 32, 'F');

  // warning message
  moveDown(20);
  doc.setFontSize(font.body).setTextColor(color.red);
  doc.text('Print this document, or keep it securely offline. See below for FAQ.', left(75), y);

  // Generate the first page's data for the backup PDF
  moveDown(35);
  const qrSize = 130;

  const qrKeys = ['user', 'passcode', 'backup', 'bitgo'];
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

    if (qr.data.length <= QRBinaryMaxLength) {
      const image = await createQrCanvas(qr.data);
      doc.addImage(image, left(0), y, qrSize, qrSize);
    } else {
      // key is too long for one QR code
      const keys = splitKeys(qr.data, QRBinaryMaxLength);
      for (const key of keys) {
        const image = await createQrCanvas(key);
        doc.addImage(image, left(0), y, qrSize, qrSize);
        const textBuffer = 15;
        moveDown(qrSize + textBuffer);
        doc.setFontSize(font.body).setTextColor(color.black);
        doc.text('Part ' + (index + 1).toString(), left(0), y);
        moveDown(20);
      }
      y = topY;
    }

    doc.setFontSize(font.subheader).setTextColor(color.black);
    moveDown(10);
    textHeight += 10;
    doc.text(qr.title, textLeft, y);
    textHeight += doc.getLineHeight();
    moveDown(15);
    textHeight += 15;
    doc.setFontSize(font.body).setTextColor(color.darkgray);
    doc.text(qr.description, textLeft, y);
    textHeight += doc.getLineHeight();
    doc.setFontSize(font.body - 2);
    if (qr?.data?.length > QRBinaryMaxLength) {
      moveDown(30);
      textHeight += 30;
      doc.text('Note: you will need to put Part 1 and Part 2 together for the full key', textLeft, y);
    }
    moveDown(30);
    textHeight += 30;
    doc.text('Data:', textLeft, y);
    textHeight += doc.getLineHeight();
    moveDown(15);
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
      }
      doc.text(lines[line], textLeft, y);
      if (line !== lines.length - 1) {
        moveDown(buffer);
        textHeight += buffer;
      }
    }

    // Add public key if exists
    if (qr.publicMasterKey) {
      const text = 'Key Id: ' + qr.publicMasterKey;

      // Gray bar
      moveDown(20);
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
    let rowHeight = Math.max(qrSize, textHeight);
    if (qr?.data?.length > QRBinaryMaxLength) {
      rowHeight = textHeight;
    }
    const marginBottom = 15;
    moveDown(rowHeight - (y - topY) + marginBottom);
  }

  // Add next Page
  doc.addPage();

  // next pages title
  y = 0;
  moveDown(55);
  doc.setFontSize(font.header).setTextColor(color.black);
  doc.text('BitGo KeyCard FAQ', left(0), y);

  // Generate the second page's data for the backup PDF
  moveDown(30);
  questions.forEach(function (q) {
    doc.setFontSize(font.subheader).setTextColor(color.black);
    doc.text(q.question, left(0), y);
    moveDown(20);
    doc.setFontSize(font.body).setTextColor(color.darkgray);
    q.answer.forEach(function (line) {
      doc.text(line, left(0), y);
      moveDown(font.body + 3);
    });
    moveDown(22);
  });

  return doc;
}
