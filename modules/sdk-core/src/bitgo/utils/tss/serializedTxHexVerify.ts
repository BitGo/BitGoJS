import { CoinFeature } from '@bitgo/statics';

import { IBaseCoin } from '../../baseCoin';
import type { SignableTransaction } from './baseTypes';
import { isCoinWithPreHashedSignable } from './preHashedSignable';
import { isCoinWithSignableConsistency } from './signableConsistency';

/** The two server-supplied hexes of one unsigned transaction. */
export interface TssSignableEnvelope {
  signableHex?: string;
  serializedTxHex?: string;
}

/** A legacy EVM transaction is exactly 9 RLP fields: nonce, gasPrice, gasLimit, to, value, data, v, r, s. */
const LEGACY_TX_FIELD_COUNT = 9;

function toBuffer(hex: string): Buffer | undefined {
  const stripped = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (stripped.length === 0 || stripped.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(stripped)) {
    return undefined;
  }
  return Buffer.from(stripped, 'hex');
}

/**
 * Returns the payload of a single RLP list that consumes the whole buffer, or undefined when the
 * bytes are not exactly one well-formed RLP list.
 */
function rlpListPayload(bytes: Buffer): Buffer | undefined {
  if (bytes.length < 2) {
    return undefined;
  }
  const prefix = bytes[0];
  if (prefix < 0xc0) {
    return undefined; // not a list
  }
  if (prefix <= 0xf7) {
    const length = prefix - 0xc0;
    return 1 + length === bytes.length ? bytes.subarray(1) : undefined;
  }
  const lengthOfLength = prefix - 0xf7;
  if (1 + lengthOfLength >= bytes.length) {
    return undefined;
  }
  let length = 0;
  for (let i = 0; i < lengthOfLength; i++) {
    length = length * 256 + bytes[1 + i];
  }
  return 1 + lengthOfLength + length === bytes.length ? bytes.subarray(1 + lengthOfLength) : undefined;
}

/** Counts the top-level items of an RLP list payload, or undefined when it is malformed. */
function countRlpListItems(payload: Buffer): number | undefined {
  let offset = 0;
  let items = 0;
  while (offset < payload.length) {
    const prefix = payload[offset];
    // A single byte below 0x80 is its own data with no header; every other item has a header.
    let headerLength = 0;
    let dataLength = 1;
    if (prefix >= 0x80) {
      if (prefix <= 0xb7) {
        headerLength = 1;
        dataLength = prefix - 0x80;
      } else if (prefix <= 0xbf) {
        const lengthOfLength = prefix - 0xb7;
        if (offset + 1 + lengthOfLength > payload.length) {
          return undefined;
        }
        headerLength = 1 + lengthOfLength;
        dataLength = 0;
        for (let i = 0; i < lengthOfLength; i++) {
          dataLength = dataLength * 256 + payload[offset + 1 + i];
        }
      } else if (prefix <= 0xf7) {
        headerLength = 1;
        dataLength = prefix - 0xc0;
      } else {
        const lengthOfLength = prefix - 0xf7;
        if (offset + 1 + lengthOfLength > payload.length) {
          return undefined;
        }
        headerLength = 1 + lengthOfLength;
        dataLength = 0;
        for (let i = 0; i < lengthOfLength; i++) {
          dataLength = dataLength * 256 + payload[offset + 1 + i];
        }
      }
    }
    offset += headerLength + dataLength;
    if (offset > payload.length) {
      return undefined;
    }
    items += 1;
  }
  return items;
}

/**
 * True when `signableHex` is a legacy (type-0) EVM envelope: exactly one 9-field RLP list.
 *
 * A legacy transaction is signed over the EIP-155 preimage
 * `RLP([nonce, gasPrice, gasLimit, to, value, data, chainId, 0, 0])`, which ethereumjs refuses to
 * parse as a transaction ("Incompatible EIP155-based V"). An unsigned legacy broadcast tx has the
 * same 9-field shape, so both are verified through serializedTxHex. Typed envelopes
 * (0x01/0x02/0x03/0x04) and non-RLP signables (hashes, native/UTXO formats) do not match.
 */
export function isLegacyEvmSignableHex(signableHex: string): boolean {
  const bytes = toBuffer(signableHex);
  if (!bytes) {
    return false;
  }
  const payload = rlpListPayload(bytes);
  return payload !== undefined && countRlpListItems(payload) === LEGACY_TX_FIELD_COUNT;
}

/**
 * Returns true when TSS verifyTransaction should decode serializedTxHex instead of signableHex.
 *
 * CoinFeature.TSS_VERIFY_USE_SERIALIZED_TX_HEX wins (ICP hash digests, BSC/XDC legacy EIP-155 RLP
 * where signableHex is never a parseable transaction, chains that never activated EIP-1559).
 * Otherwise the decision follows the actual envelope: a type-0 transaction on an EIP-1559-capable
 * chain carries the EIP-155 preimage in signableHex and must be verified through serializedTxHex,
 * while a type-2 signableHex is already the unsigned transaction and is verified directly.
 *
 * Only coins that can bind the two hexes (assertSignableConsistency) are considered for the
 * envelope route, and pre-hashed signables (Avalanche atomic) keep their own route. Everything
 * else keeps the upstream behaviour.
 *
 * The legacy decision is made from signableHex alone: a legacy preimage must never fall back to
 * the signable route just because serializedTxHex is absent. Callers on the serialized route must
 * reject a missing serializedTxHex instead of verifying bytes they do not have.
 */
export function shouldVerifyWithSerializedTxHex(coin: IBaseCoin, unsignedTx?: TssSignableEnvelope): boolean {
  if (coin.getConfig().features?.includes(CoinFeature.TSS_VERIFY_USE_SERIALIZED_TX_HEX)) {
    return true;
  }
  const { signableHex, serializedTxHex } = unsignedTx ?? {};
  if (!signableHex) {
    return false;
  }
  // Pre-hashed signables are checked before the envelope so a preimage-shaped hex never pulls an
  // Avalanche atomic payload into the EVM route.
  if (
    isCoinWithPreHashedSignable(coin) &&
    serializedTxHex &&
    coin.isSignablePreHashed(unsignedTx as SignableTransaction)
  ) {
    return false;
  }
  if (!isCoinWithSignableConsistency(coin)) {
    return false;
  }
  return isLegacyEvmSignableHex(signableHex);
}
