/*
Functions for dealing with inscriptions.

Wrapper around @bitgo/wasm-utxo inscription functions for utxo-ord consumers.

See https://docs.ordinals.com/inscriptions.html
*/

import {
  inscriptions as wasmInscriptions,
  address as wasmAddress,
  Transaction,
  ECPair,
  type TapLeafScript,
  type CoinName,
} from '@bitgo/wasm-utxo';

export type { TapLeafScript };

// default "postage" amount
// https://github.com/ordinals/ord/blob/0.24.2/src/lib.rs#L149
const DEFAULT_POSTAGE_SATS = BigInt(10_000);

/**
 * Prepared data for an inscription reveal transaction.
 * Compatible with sdk-core's PreparedInscriptionRevealData.
 */
export type PreparedInscriptionRevealData = {
  /** The commit address (derived from outputScript for the given network) */
  address: string;
  /** Estimated virtual size of the reveal transaction */
  revealTransactionVSize: number;
  /** Tap leaf script for spending the commit output */
  tapLeafScript: TapLeafScript;
};

/**
 * BIP32-like interface compatible with both utxo-lib and wasm-utxo BIP32 types.
 * The publicKey can be Buffer (utxo-lib) or Uint8Array (wasm-utxo).
 */
export interface BIP32Like {
  publicKey: Uint8Array;
}

/** Input type for inscription functions - either a BIP32-like key or raw public key bytes */
export type KeyInput = BIP32Like | Uint8Array;

function isBIP32Like(key: KeyInput): key is BIP32Like {
  return typeof key === 'object' && key !== null && 'publicKey' in key && !ArrayBuffer.isView(key);
}

/**
 * Extract compressed public key from key input.
 * Handles BIP32-like objects and raw pubkey bytes (32 or 33 bytes).
 */
function getCompressedPublicKey(key: KeyInput): Uint8Array {
  const pubkey = isBIP32Like(key) ? key.publicKey : key;

  if (pubkey.length === 33) {
    return pubkey;
  }
  if (pubkey.length === 32) {
    // x-only pubkey - prepend 0x02 parity byte to make compressed
    const compressedPubkey = new Uint8Array(33);
    compressedPubkey[0] = 0x02;
    compressedPubkey.set(pubkey, 1);
    return compressedPubkey;
  }
  throw new Error(`Invalid public key length: ${pubkey.length}. Expected 32 or 33 bytes.`);
}

/**
 * Create the P2TR output script for an inscription.
 *
 * @param key - BIP32 key or public key bytes (32-byte x-only or 33-byte compressed)
 * @param contentType - MIME type of the inscription (e.g., "text/plain", "image/png")
 * @param inscriptionData - The inscription data bytes
 * @returns The P2TR output script for the inscription commit address
 */
export function createOutputScriptForInscription(
  key: KeyInput,
  contentType: string,
  inscriptionData: Uint8Array
): Uint8Array {
  const compressedPubkey = getCompressedPublicKey(key);
  const ecpair = ECPair.fromPublicKey(compressedPubkey);
  const result = wasmInscriptions.createInscriptionRevealData(ecpair, contentType, inscriptionData);
  return result.outputScript;
}

/**
 * Create inscription reveal data including the commit address and tap leaf script.
 *
 * @param key - BIP32 key or public key bytes (32-byte x-only or 33-byte compressed)
 * @param contentType - MIME type of the inscription (e.g., "text/plain", "image/png")
 * @param inscriptionData - The inscription data bytes
 * @param coinName - Coin name (e.g., "btc", "tbtc")
 * @returns PreparedInscriptionRevealData with address, vsize estimate, and tap leaf script
 */
export function createInscriptionRevealData(
  key: KeyInput,
  contentType: string,
  inscriptionData: Uint8Array,
  coinName: CoinName
): PreparedInscriptionRevealData {
  const compressedPubkey = getCompressedPublicKey(key);
  const ecpair = ECPair.fromPublicKey(compressedPubkey);

  const wasmResult = wasmInscriptions.createInscriptionRevealData(ecpair, contentType, inscriptionData);

  // Convert outputScript to address for the given network
  const address = wasmAddress.fromOutputScriptWithCoin(wasmResult.outputScript, coinName);

  return {
    address,
    revealTransactionVSize: wasmResult.revealTransactionVSize,
    tapLeafScript: wasmResult.tapLeafScript,
  };
}

/**
 * Sign a reveal transaction.
 *
 * Creates and signs the reveal transaction that spends from the commit output
 * and sends the inscription to the recipient.
 *
 * @param privateKey - 32-byte private key
 * @param tapLeafScript - The tap leaf script from createInscriptionRevealData
 * @param commitAddress - The commit address
 * @param recipientAddress - Where to send the inscription
 * @param unsignedCommitTx - The unsigned commit transaction bytes
 * @param coinName - Coin name (e.g., "btc", "tbtc")
 * @returns The signed PSBT as bytes
 */
export function signRevealTransaction(
  privateKey: Uint8Array,
  tapLeafScript: TapLeafScript,
  commitAddress: string,
  recipientAddress: string,
  unsignedCommitTx: Uint8Array,
  coinName: CoinName
): Uint8Array {
  const ecpair = ECPair.fromPrivateKey(privateKey);
  const commitTx = Transaction.fromBytes(unsignedCommitTx);
  const commitOutputScript = wasmAddress.toOutputScriptWithCoin(commitAddress, coinName);
  const recipientOutputScript = wasmAddress.toOutputScriptWithCoin(recipientAddress, coinName);

  return wasmInscriptions.signRevealTransaction(
    ecpair,
    tapLeafScript,
    commitTx,
    commitOutputScript,
    recipientOutputScript,
    DEFAULT_POSTAGE_SATS
  );
}
