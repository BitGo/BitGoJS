import { generateQrData, GenerateQrDataParams } from './generateQrData';
import { generateFaq } from './faq';
import { drawKeycard } from './drawKeycard';

export * from './drawKeycard';
export * from './faq';
export * from './generateQrData';
export * from './utils';

export interface GenerateKeycardParams extends GenerateQrDataParams {
  activationCode?: string;
  keyCardImage?: HTMLImageElement;
  walletLabel: string;
}

export function generateKeycard(params: GenerateKeycardParams): void {
  const questions = generateFaq(params.coin.fullName);
  const qrData = generateQrData(params);
  const keycard = drawKeycard({ ...params, questions, qrData });
  // Save the PDF on the user's browser
  keycard.save(`BitGo Keycard for ${params.walletLabel}.pdf`);
}
