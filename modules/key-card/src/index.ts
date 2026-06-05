import { generateLightningQrDataAsync, generateQrDataAsync } from './generateQrData';
import { generateFaq, generateLightningFaq } from './faq';
import { drawKeycard } from './drawKeycard';
import { generateParamsForKeyCreation } from './generateParamsForKeyCreation';
import { GenerateKeycardParams, GenerateLightningQrDataParams, GenerateQrDataBaseParams } from './types';

export * from './drawKeycard';
export * from './extractKeycardFromPDF';
export * from './faq';
export * from './generateQrData';
export * from './parseKeycard';
export * from './utils';
export * from './types';

export async function generateKeycard(params: GenerateKeycardParams): Promise<void> {
  if ('userAuthKeychain' in params) {
    const questions = generateLightningFaq(params.coin.fullName);
    const qrData = await generateLightningQrDataAsync(params);
    const keycard = await drawKeycard({ ...params, questions, qrData });
    const label = params.walletLabel || params.coin.fullName;
    keycard.save(`BitGo Keycard for ${label}.pdf`);
  } else if ('coin' in params) {
    const questions = generateFaq(params.coin.fullName);
    const qrData = await generateQrDataAsync(params);
    const keycard = await drawKeycard({ ...params, questions, qrData });
    const label = params.walletLabel || params.coin.fullName;
    keycard.save(`BitGo Keycard for ${label}.pdf`);
  } else if ('curve' in params) {
    const data = generateParamsForKeyCreation(params);
    const keycard = await drawKeycard(data);
    const label = params.walletLabel || params.curve;
    keycard.save(`BitGo Keycard for ${label}.pdf`);
  } else {
    throw new Error('Either curve or coin must be provided');
  }
}

export async function generateLightningKeycard(
  params: GenerateQrDataBaseParams & GenerateLightningQrDataParams
): Promise<void> {
  const questions = generateLightningFaq(params.coin.fullName);
  const qrData = await generateLightningQrDataAsync(params);
  const keycard = await drawKeycard({ ...params, questions, qrData });
  const label = params.walletLabel || params.coin.fullName;
  keycard.save(`BitGo Keycard for ${label}.pdf`);
}
