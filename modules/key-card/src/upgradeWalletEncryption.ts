/**
 * PDF-generation helpers for the wallet encryption upgrade flow.
 *
 * Orchestration (unlocking the session, re-encrypting keychains, PUT-ing to the server) lives on
 * `Wallet.upgradeEncryption` in `@bitgo/sdk-core`. This module contains only the pieces that
 * depend on `jspdf`/`qrcode` — a factory that returns a `UpgradeEncryptionPdfGenerator` the
 * caller can pass into that method, plus a Node-side coin-logo loader.
 */

import * as https from 'https';
import { BaseCoin, coins } from '@bitgo/statics';
import { UpgradeEncryptionPdfGenerator } from '@bitgo/sdk-core';
import { generateQrData } from './generateQrData';
import { generateFaq } from './faq';
import { drawKeycard } from './drawKeycard';

/**
 * Fetch a coin logo image and return an HTMLImageElement-compatible object.
 * jsPDF reads `.src` in Node.js; computeKeyCardImageDimensions reads `.width`/`.height`.
 * Returns undefined on any failure — the keycard is generated without the logo in that case.
 */
export async function loadKeycardImage(
  url: string,
  httpGet: typeof https.get = https.get
): Promise<HTMLImageElement | undefined> {
  return new Promise((resolve) => {
    httpGet(url, (res) => {
      if (res.statusCode !== 200) {
        console.warn(`Warning: coin logo not loaded (HTTP ${res.statusCode}) — keycard will be generated without it`);
        resolve(undefined);
        return;
      }
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const contentType = res.headers['content-type'] ?? 'image/png';
        const dataUrl = `data:${contentType};base64,${Buffer.concat(chunks).toString('base64')}`;
        const img = { src: dataUrl, width: 303, height: 40 } as unknown as HTMLImageElement;
        resolve(img);
      });
      res.on('error', (err) => {
        console.warn(`Warning: coin logo not loaded (${err.message}) — keycard will be generated without it`);
        resolve(undefined);
      });
    }).on('error', (err) => {
      console.warn(`Warning: coin logo not loaded (${err.message}) — keycard will be generated without it`);
      resolve(undefined);
    });
  });
}

export interface KeycardPdfGeneratorOptions {
  /** Base URL for loading the coin logo (e.g. Environments[env].uri). Omit to skip the logo. */
  imageBaseUrl?: string;
}

/**
 * Build a {@link UpgradeEncryptionPdfGenerator} that regenerates the keycard PDF with the
 * canonical `generateQrData` + `drawKeycard` flow. Pass the returned function into
 * `Wallet.upgradeEncryption({ generatePdf })`.
 */
export function createKeycardPdfGenerator(options: KeycardPdfGeneratorOptions = {}): UpgradeEncryptionPdfGenerator {
  const { imageBaseUrl } = options;
  return async ({
    coinName,
    userKeychain,
    backupKeychain,
    bitgoKeychain,
    passphrase,
    passcodeEncryptionCode,
    walletLabel,
  }) => {
    const staticsCoin = coins.get(coinName) as BaseCoin;
    const keyCardImage = imageBaseUrl
      ? await loadKeycardImage(`${imageBaseUrl}/web/assets/keycards/${staticsCoin.family.toLowerCase()}.png`)
      : undefined;
    const qrData = await generateQrData({
      coin: staticsCoin,
      userKeychain,
      backupKeychain,
      bitgoKeychain,
      passphrase,
      passcodeEncryptionCode,
      encryptionVersion: 2,
    });
    const questions = generateFaq(staticsCoin.fullName);
    return drawKeycard({ qrData, questions, walletLabel, keyCardImage });
  };
}
