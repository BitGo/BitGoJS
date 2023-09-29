import { generateQrData, GenerateQrDataParams } from './generateQrData';
import { generateFaq } from './faq';
import { drawKeycard } from './drawKeycard';
import jsPDF from 'jspdf';
import { generateParamsForKeyCreation } from './generateParamsForKeyCreation';

export * from './drawKeycard';
export * from './faq';
export * from './generateQrData';
export * from './utils';

export interface GenerateKeycardParams extends GenerateQrDataParams {
  activationCode?: string;
  keyCardImage?: HTMLImageElement;
  walletLabel: string;
}

export async function generateKeycard(params: GenerateKeycardParams): Promise<void> {
  let keycard: jsPDF;
  if (!params.curve && params.coin) {
    const questions = generateFaq(params.coin.fullName);
    const qrData = generateQrData(params);
    keycard = await drawKeycard({ ...params, questions, qrData });
  } else if (params.curve && !params.coin) {
    const data = generateParamsForKeyCreation(params);
    keycard = await drawKeycard(data);
  } else {
    throw new Error('Either curve or coin must be provided');
  }
  // Save the PDF on the user's browser
  keycard.save(`BitGo Keycard for ${params.walletLabel}.pdf`);
}
