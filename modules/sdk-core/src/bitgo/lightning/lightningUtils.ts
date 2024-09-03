import * as statics from '@bitgo/statics';
import * as utxolib from '@bitgo/utxo-lib';
import { importMacaroon, bytesToBase64 } from 'macaroon';
import * as bs58check from 'bs58check';

// https://github.com/lightningnetwork/lnd/blob/master/docs/remote-signing.md#the-signer-node
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

export const lightningNetworkName = ['bitcoin', 'testnet'] as const;
export type LightningNetworkName = (typeof lightningNetworkName)[number];

/**
 * Get the utxolib network for a lightning network.
 */
export function getLightningNetwork(networkName: LightningNetworkName): utxolib.Network {
  return utxolib.networks[networkName];
}

/**
 * Get the lightning coin name for a utxolib network.
 */
export function getLightningCoinName(network: utxolib.Network): string {
  return network === utxolib.networks.bitcoin ? 'lnbtc' : 'tlnbtc';
}

/**
 * Checks if the network name is a valid lightning network name.
 */
export function isValidLightningNetworkName(networkName: unknown): networkName is LightningNetworkName {
  return lightningNetworkName.includes(networkName as LightningNetworkName);
}

/**
 * Checks if the network is a valid lightning network.
 */
export function isValidLightningNetwork(network: unknown): network is utxolib.Network {
  return utxolib.isValidNetwork(network) && isValidLightningNetworkName(utxolib.getNetworkName(network));
}

/**
 * Returns the utxolib network name for a lightning coin.
 */
export function getUtxolibNetworkName(coinName: string): string | undefined {
  const coin = statics.coins.get(coinName);
  return coin instanceof statics.LightningCoin ? coin.network.utxolibName : undefined;
}

/**
 * Returns the utxolib network for a lightning coin.
 */
export function getUtxolibNetwork(coinName: string): utxolib.Network {
  const networkName = getUtxolibNetworkName(coinName);
  if (!isValidLightningNetworkName(networkName)) {
    throw new Error('invalid lightning network');
  }
  return getLightningNetwork(networkName);
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

/**
 * Adds an IP caveat to a macaroon and returns the modified macaroon as a Base64 string.
 */
export function addIPCaveatToMacaroon(macaroonBase64: string, ip: string): string {
  const macaroon = importMacaroon(macaroonBase64);
  macaroon.addFirstPartyCaveat(`ipaddr ${ip}`);
  return bytesToBase64(macaroon.exportBinary());
}

/**
 * Converts an extended public key (xpub) to the appropriate prefix (ypub, vpub, etc.) based on its purpose and network.
 */
function convertXpubPrefix(xpub: string, purpose: 49 | 84 | 86 | 1017, isMainnet: boolean): string {
  if (purpose === 1017 || purpose === 86) {
    return xpub;
  }
  const data = bs58check.decode(xpub);

  let versionBytes: Buffer;

  switch (purpose) {
    case 49:
      versionBytes = isMainnet ? Buffer.from([0x04, 0x9d, 0x7c, 0xb2]) : Buffer.from([0x04, 0x4a, 0x52, 0x62]); // ypub/upub for p2wpkh-p2sh
      break;
    case 84:
      versionBytes = isMainnet ? Buffer.from([0x04, 0xb2, 0x47, 0x46]) : Buffer.from([0x04, 0x5f, 0x1c, 0xf6]); // zpub/vpub for p2wpkh
      break;
    default:
      throw new Error('Unsupported purpose');
  }

  versionBytes.copy(data, 0, 0, 4);
  return bs58check.encode(data);
}

/**
 * Derives watch-only accounts from the master HD node for the given purposes and network.
 */
// https://github.com/lightningnetwork/lnd/blob/master/docs/remote-signing.md#required-accounts
function deriveWatchOnlyAccounts(masterHDNode: utxolib.BIP32Interface, isMainnet: boolean): WatchOnlyAccount[] {
  if (masterHDNode.isNeutered()) {
    throw new Error('masterHDNode must not be neutered');
  }

  const accounts: WatchOnlyAccount[] = [];

  const purposes = [49, 84, 86, 1017] as const;

  purposes.forEach((purpose) => {
    const maxAccount = purpose === 1017 ? 255 : 0;
    const coinType = purpose !== 1017 || isMainnet ? 0 : 1;

    for (let account = 0; account <= maxAccount; account++) {
      const path = `m/${purpose}'/${coinType}'/${account}'`;
      const derivedNode = masterHDNode.derivePath(path);

      // Ensure the node is neutered (i.e., converted to public key only)
      const neuteredNode = derivedNode.neutered();
      const xpub = convertXpubPrefix(neuteredNode.toBase58(), purpose, isMainnet);

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

/**
 * Creates a watch-only wallet init data from the provided signer root key and network.
 */
export function createWatchOnly(signerRootKey: string, network: utxolib.Network): WatchOnly {
  const masterHDNode = utxolib.bip32.fromBase58(signerRootKey, network);
  const getCurrentUnixTimestamp = () => {
    return Math.floor(Date.now() / 1000);
  };
  const master_key_birthday_timestamp = getCurrentUnixTimestamp().toString();
  const master_key_fingerprint = masterHDNode.fingerprint.toString('hex');
  const accounts = deriveWatchOnlyAccounts(masterHDNode, utxolib.isMainnet(network));
  return { master_key_birthday_timestamp, master_key_fingerprint, accounts };
}
