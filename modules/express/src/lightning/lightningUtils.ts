import { promises as fs } from 'fs';
import { importMacaroon } from 'macaroon';
import { decodeOrElse } from '@bitgo/sdk-core';
import { BIP32Interface } from '@bitgo/utxo-lib';
import { LightningSignerConnections, LightningSignerConnectionsCodec, LightningSignerDetails } from './codecs';
import { _forceSecureUrl } from '../config';

export interface WatchOnlyAccount {
  purpose: number;
  coin_type: number;
  account: number;
  xpub: string;
}

export interface WatchOnly {
  master_key_birthday_timestamp: string;
  master_key_fingerprint: string;
  accounts: WatchOnlyAccount[];
}

export const signerMacaroonPermissions = [
  {
    entity: 'message',
    action: 'write',
  },
  {
    entity: 'signer',
    action: 'generate',
  },
  {
    entity: 'address',
    action: 'read',
  },
  {
    entity: 'onchain',
    action: 'write',
  },
];

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

export function addIPCaveatToMacaroon(macaroonBase64: string, ip: string): string {
  const macaroon = importMacaroon(macaroonBase64);
  macaroon.addFirstPartyCaveat(`ipaddr ${ip}`);
  return macaroon.exportBinary().toString('hex');
}

// https://github.com/lightningnetwork/lnd/blob/master/docs/remote-signing.md#required-accounts
export function deriveWatchOnlyAccounts(masterHDNode: BIP32Interface, isMainnet: boolean): WatchOnlyAccount[] {
  if (masterHDNode.isNeutered()) {
    throw new Error('masterHDNode must not be neutered');
  }

  const accounts: WatchOnlyAccount[] = [];

  const purposes = [49, 84, 86, 1017] as const;
  const coinType = isMainnet ? 0 : 1;

  purposes.forEach((purpose) => {
    const maxAccount = purpose === 1017 ? 255 : 0;

    for (let account = 0; account <= maxAccount; account++) {
      const path = `m/${purpose}'/${coinType}'/${account}'`;
      const derivedNode = masterHDNode.derivePath(path);

      // Ensure the node is neutered (i.e., converted to public key only)
      const neuteredNode = derivedNode.neutered();
      const xpub = neuteredNode.toBase58();

      accounts.push({
        purpose,
        coin_type: coinType,
        account,
        xpub,
      });
    }
  });

  return accounts;
}

export function createWatchOnly(masterHDNode: BIP32Interface, isMainnet: boolean): WatchOnly {
  const getCurrentUnixTimestamp = () => {
    return Math.floor(Date.now() / 1000);
  };
  const master_key_birthday_timestamp = getCurrentUnixTimestamp().toString();
  const master_key_fingerprint = masterHDNode.fingerprint.toString('hex');
  const accounts = deriveWatchOnlyAccounts(masterHDNode, isMainnet);
  return { master_key_birthday_timestamp, master_key_fingerprint, accounts };
}
