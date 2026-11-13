import { generateLightningQrData, generateQrData, generateSafeQrData } from './generateQrData';
import { generateFaq, generateLightningFaq } from './faq';
import { drawKeycard } from './drawKeycard';
import { generateParamsForKeyCreation } from './generateParamsForKeyCreation';
import {
  GenerateKeycardParams,
  GenerateLightningQrDataParams,
  GenerateQrDataBaseParams,
  GenerateSafeQrDataParams,
} from './types';

export * from './drawKeycard';
export * from './extractKeycardFromPDF';
export * from './faq';
export * from './generateQrData';
export * from './parseKeycard';
export * from './upgradeWalletEncryption';
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

/** Draws the safe keycard PDF; shared by the saving and blob-returning entry points. */
async function drawSafeKeycard(params: GenerateQrDataBaseParams & GenerateSafeQrDataParams) {
  const questions = generateFaq(params.coin.fullName);
  const qrData = await generateSafeQrData(params);
  return drawKeycard({
    ...params,
    questions,
    qrData,
    pageBreakBeforeIndices: [1, 2],
    useQrPartHeaders: true,
  });
}

/**
 * Generates a safe keycard using the existing 4-box layout: boxes A/B/C each carry a JSON
 * object of the safe's root slots (see {@link generateSafeQrData}), rendered through the same
 * {@link drawKeycard} path as a wallet. Generated as part of safe creation, once the safe's
 * root triplets exist.
 */
export async function generateSafeKeycard(params: GenerateQrDataBaseParams & GenerateSafeQrDataParams): Promise<void> {
  const keycard = await drawSafeKeycard(params);
  const label = params.walletLabel || params.coin.fullName;
  keycard.save(`BitGo Keycard for ${label}.pdf`);
}

/**
 * Same as {@link generateSafeKeycard} but returns the PDF as a {@link Blob} instead of saving
 * it to disk, for callers (e.g. mobile) that stream the bytes themselves.
 */
export async function generateSafeKeycardBlob(
  params: GenerateQrDataBaseParams & GenerateSafeQrDataParams
): Promise<Blob> {
  return (await drawSafeKeycard(params)).output('blob');
}
