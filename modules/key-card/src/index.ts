import jsPDF from 'jspdf';

import { generateQrData } from './generateQrData';
import { generateFaq } from './faq';
import { drawKeycard } from './drawKeycard';
import { generateParamsForKeyCreation } from './generateParamsForKeyCreation';
import { GenerateKeycardParams } from './types';

export * from './drawKeycard';
export * from './faq';
export * from './generateQrData';
export * from './utils';
export * from './types';

export async function generateKeycard(params: GenerateKeycardParams): Promise<void> {
  let keycard: jsPDF;
  if ('coin' in params) {
    const questions = generateFaq(params.coin.fullName);
    const qrData = generateQrData(params);
    keycard = await drawKeycard({ ...params, questions, qrData });
  } else if ('curve' in params) {
    const data = generateParamsForKeyCreation(params);
    keycard = await drawKeycard(data);
  } else {
    throw new Error('Either curve or coin must be provided');
  }
  // Save the PDF on the user's browser
  keycard.save(`BitGo Keycard for ${params.walletLabel}.pdf`);
}
