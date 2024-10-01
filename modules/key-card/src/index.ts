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
  if ('coin' in params) {
    const questions = generateFaq(params.coin.fullName);
    const qrData = generateQrData(params);
    const keycard = await drawKeycard({ ...params, questions, qrData });
    keycard.save(`BitGo Keycard for ${params.walletLabel}.pdf`);
  } else if ('curve' in params) {
    const data = generateParamsForKeyCreation(params);
    const keycard = await drawKeycard(data);
    keycard.save(`BitGo Keycard for ${params.walletLabel}.pdf`);
  } else {
    throw new Error('Either curve or coin must be provided');
  }
}
