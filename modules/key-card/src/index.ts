import { generateLightningQrData, generateQrData, generateVaultQrData } from './generateQrData';
import { generateFaq, generateLightningFaq } from './faq';
import { drawKeycard } from './drawKeycard';
import { generateParamsForKeyCreation } from './generateParamsForKeyCreation';
import {
  GenerateKeycardParams,
  GenerateLightningQrDataParams,
  GenerateQrDataBaseParams,
  GenerateVaultQrDataParams,
} from './types';

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
    const qrData = await generateLightningQrData(params);
    const keycard = await drawKeycard({ ...params, questions, qrData });
    const label = params.walletLabel || params.coin.fullName;
    keycard.save(`BitGo Keycard for ${label}.pdf`);
  } else if ('coin' in params) {
    const questions = generateFaq(params.coin.fullName);
    const qrData = await generateQrData(params);
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
  const qrData = await generateLightningQrData(params);
  const keycard = await drawKeycard({ ...params, questions, qrData });
  const label = params.walletLabel || params.coin.fullName;
  keycard.save(`BitGo Keycard for ${label}.pdf`);
}

/**
 * Generates a vault keycard using the existing 4-box layout: boxes A/B/C each carry a JSON
 * object of the four roots (see {@link generateVaultQrData}), rendered through the same
 * {@link drawKeycard} path as a wallet. Generated as part of vault creation, once all four
 * root triplets exist.
 */
export async function generateVaultKeycard(
  params: GenerateQrDataBaseParams & GenerateVaultQrDataParams
): Promise<void> {
  const questions = generateFaq(params.coin.fullName);
  const qrData = await generateVaultQrData(params);
  const keycard = await drawKeycard({ ...params, questions, qrData, pageBreakBeforeIndices: [1, 2] });
  const label = params.walletLabel || params.coin.fullName;
  keycard.save(`BitGo Keycard for ${label}.pdf`);
}
