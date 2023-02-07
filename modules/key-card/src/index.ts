import { generateQrData, GenerateQrDataParams } from './generateQrData';
import { generateFaq } from './faq';
import { drawKeycard } from './drawKeycard';

export * from './drawKeycard';
export * from './faq';
export * from './generateQrData';
export * from './utils';

export interface GenerateKeycardParams extends GenerateQrDataParams {
  activationCode?: string;
  createQrCanvas: (data: string) => Promise<HTMLCanvasElement>;
  keyCardImage?: HTMLImageElement;
  walletLabel: string;
}

export async function generateKeycard(params: GenerateKeycardParams): Promise<void> {
  const questions = generateFaq(params.coin.fullName);
  const qrData = generateQrData(params);
  const keycard = await drawKeycard({ ...params, questions, qrData });
  // Save the PDF on the user's browser
  keycard.save(`BitGo Keycard for ${params.walletLabel}.pdf`);
}
