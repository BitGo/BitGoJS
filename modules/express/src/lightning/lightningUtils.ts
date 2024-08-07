import { promises as fs } from 'fs';
import { decodeOrElse } from '@bitgo/sdk-core';
import { LightningSignerConnections, LightningSignerConnectionsCodec, LightningSignerDetails } from './codecs';
import { _forceSecureUrl } from '../config';

export async function getLightningSignerConnections(path: string): Promise<LightningSignerConnections> {
  const urlFile = await fs.readFile(path, { encoding: 'utf8' });
  const urls: unknown = JSON.parse(urlFile);
  const decoded = decodeOrElse(
    LightningSignerConnectionsCodec.name,
    LightningSignerConnectionsCodec,
    urls,
    (errors) => {
      throw new Error(`Invalid lightning signer URL file: ${errors}`);
    }
  );
  const secureUrls: LightningSignerConnections = {};
  for (const [walletId, { url, tlsCert }] of Object.entries(decoded)) {
    secureUrls[walletId] = { url: _forceSecureUrl(url), tlsCert };
  }
  return secureUrls;
}

export function getLightningWalletSignerDetails(
  walletId: string,
  config: { lightningSignerConnections?: LightningSignerConnections }
): LightningSignerDetails {
  if (!config.lightningSignerConnections) {
    throw new Error('Missing required configuration: lightningSignerConnections');
  }

  const lightningSignerDetails = config.lightningSignerConnections[walletId];
  if (!lightningSignerDetails) {
    throw new Error(`Missing required configuration for walletId: ${walletId}`);
  }
  return lightningSignerDetails;
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
