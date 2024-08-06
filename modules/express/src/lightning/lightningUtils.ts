import { promises as fs } from 'fs';
import { decodeOrElse } from '@bitgo/sdk-core';
import { LightningSignerUrls, LightningSignerUrlsCodec } from './codecs';
import { _forceSecureUrl } from '../config';

export async function getLightningSignerUrls(path: string): Promise<LightningSignerUrls> {
  const urlFile = await fs.readFile(path, { encoding: 'utf8' });
  const urls: unknown = JSON.parse(urlFile);
  const decoded = decodeOrElse(LightningSignerUrlsCodec.name, LightningSignerUrlsCodec, urls, (errors) => {
    throw new Error(`Invalid lightning signer URL file: ${errors}`);
  });
  const secureUrls: LightningSignerUrls = {};
  for (const [walletId, url] of Object.entries(decoded)) {
    secureUrls[walletId] = _forceSecureUrl(url);
  }
  return secureUrls;
}

/**
 * Returns coin specific data for a lightning coin.
 */
export function unwrapLightningCoinSpecific<V>(obj: { lnbtc: V } | { tlnbtc: V }, coinSpecificPath: string): V {
  if (coinSpecificPath !== 'lnbtc' && coinSpecificPath !== 'tlnbtc') {
    throw new Error(`invalid coinSpecificPath ${coinSpecificPath} for lightning coin`);
  }
  if (coinSpecificPath === 'lnbtc' && 'lnbtc' in obj) {
    return obj.lnbtc;
  }
  if (coinSpecificPath === 'tlnbtc' && 'tlnbtc' in obj) {
    return obj.tlnbtc;
  }
  throw new Error('invalid lightning coin specific');
}
