import * as statics from '@bitgo/statics';
import * as utxolib from '@bitgo/utxo-lib';
import { importMacaroon, bytesToBase64 } from 'macaroon';
import * as bs58check from 'bs58check';
import * as sdkcore from '@bitgo/sdk-core';
import { WatchOnly, WatchOnlyAccount } from '../codecs';

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

export const lightningNetworkName = ['bitcoin', 'testnet'] as const;
export type LightningNetworkName = (typeof lightningNetworkName)[number];

/**
 * Checks if the coin name is a lightning coin name.
 */
export function isLightningCoinName(coinName: unknown): coinName is 'lnbtc' | 'tlnbtc' {
  return coinName === 'lnbtc' || coinName === 'tlnbtc';
}

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
 * Returns the statics network data for a lightning coin.
 */
export function getStaticsLightningNetwork(coinName: string): statics.LightningNetwork {
  if (!isLightningCoinName(coinName)) {
    throw new Error(`${coinName} is not a lightning coin`);
  }
  const coin = statics.coins.get(coinName);
  if (!(coin instanceof statics.LightningCoin)) {
    throw new Error('coin is not a lightning coin');
  }
  return coin.network;
}

/**
 * Returns the utxolib network for a lightning coin.
 */
export function getUtxolibNetwork(coinName: string): utxolib.Network {
  const networkName = getStaticsLightningNetwork(coinName).utxolibName;
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

const PURPOSE_WRAPPED_P2WKH = 49;
const PURPOSE_P2WKH = 84;
const PURPOSE_P2TR = 86;
const PURPOSE_ALL_OTHERS = 1017;

type ExtendedKeyPurpose =
  | typeof PURPOSE_WRAPPED_P2WKH
  | typeof PURPOSE_P2WKH
  | typeof PURPOSE_P2TR
  | typeof PURPOSE_ALL_OTHERS;

/**
 * Converts an extended public key (xpub) to the appropriate prefix (ypub, vpub, etc.) based on its purpose and network.
 */
function convertXpubPrefix(xpub: string, purpose: ExtendedKeyPurpose, isMainnet: boolean): string {
  if (purpose === PURPOSE_P2TR || purpose === PURPOSE_ALL_OTHERS) {
    return xpub;
  }
  const data = bs58check.decode(xpub);

  let versionBytes: Buffer;

  switch (purpose) {
    case PURPOSE_WRAPPED_P2WKH:
      versionBytes = isMainnet ? Buffer.from([0x04, 0x9d, 0x7c, 0xb2]) : Buffer.from([0x04, 0x4a, 0x52, 0x62]); // ypub/upub for p2sh-p2wpkh
      break;
    case PURPOSE_P2WKH:
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
function deriveWatchOnlyAccounts(masterHDNode: utxolib.BIP32Interface, isMainnet: boolean): WatchOnlyAccount[] {
  // https://github.com/lightningnetwork/lnd/blob/master/docs/remote-signing.md#required-accounts
  if (masterHDNode.isNeutered()) {
    throw new Error('masterHDNode must not be neutered');
  }

  const purposes = [PURPOSE_WRAPPED_P2WKH, PURPOSE_P2WKH, PURPOSE_P2TR, PURPOSE_ALL_OTHERS] as const;

  return purposes.flatMap((purpose) => {
    const maxAccount = purpose === PURPOSE_ALL_OTHERS ? 255 : 0;
    const coinType = purpose !== PURPOSE_ALL_OTHERS || isMainnet ? 0 : 1;

    return Array.from({ length: maxAccount + 1 }, (_, account) => {
      const path = `m/${purpose}'/${coinType}'/${account}'`;
      const derivedNode = masterHDNode.derivePath(path);

      // Ensure the node is neutered (i.e., converted to public key only)
      const neuteredNode = derivedNode.neutered();
      const xpub = convertXpubPrefix(neuteredNode.toBase58(), purpose, isMainnet);

      return {
        purpose,
        coin_type: coinType,
        account,
        xpub,
      };
    });
  });
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

/**
 * Derives the shared Elliptic Curve Diffie-Hellman (ECDH) secret between the user's auth extended private key
 * and the Lightning service's public key for secure communication.
 */
export function deriveLightningServiceSharedSecret(coinName: 'lnbtc' | 'tlnbtc', userAuthXprv: string): Buffer {
  const publicKey = Buffer.from(getStaticsLightningNetwork(coinName).lightningServicePubKey, 'hex');
  const userAuthHdNode = utxolib.bip32.fromBase58(userAuthXprv);
  return sdkcore.getSharedSecret(userAuthHdNode, publicKey);
}

/**
 * Derives the shared secret for the middleware using the user's auth extended private key and the middleware's public key.
 * This is used for secure communication between the middleware and the user.
 */
export function deriveMiddlewareSharedSecret(coinName: 'lnbtc' | 'tlnbtc', userXprv: string): Buffer {
  const publicKey = Buffer.from(getStaticsLightningNetwork(coinName).middlewarePubKey, 'hex');
  const userAuthHdNode = utxolib.bip32.fromBase58(userXprv);
  return sdkcore.getSharedSecret(userAuthHdNode, publicKey);
}

/**
 * Derives the shared secret for TAT service using the user's private key and the TAT public key.
 * This is used for secure communication with the TAT service and the user.
 */
export function deriveTatSharedSecret(coinName: 'lnbtc' | 'tlnbtc', userXprv: string): Buffer {
  const publicKey = Buffer.from(getStaticsLightningNetwork(coinName).tatPubKey, 'hex');
  const userAuthHdNode = utxolib.bip32.fromBase58(userXprv);
  return sdkcore.getSharedSecret(userAuthHdNode, publicKey);
}

/**
 * Given a seed, compute a BIP32 derivation index.
 * 0 <= index < 4294967295 (largest 4 byte number)
 * @param seed
 */
export function computeBip32DerivationIndexFromSeed(seed: string): number {
  return Buffer.from(utxolib.crypto.sha256(Buffer.from(seed, 'utf8'))).readUint32BE(0);
}
