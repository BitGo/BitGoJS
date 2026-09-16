/**
 * EIP-7702: Set Code for EOAs.
 *
 * Encoding/decoding helpers for the "set code" transaction type (0x04) and its
 * per-authorization digest. These produce byte-for-byte compatible output with
 * the reference implementations (@ethereumjs/tx `EOACodeEIP7702Transaction`,
 * geth).
 *
 * Wire format (EIP-2718):
 *
 * ```
 * rlp([chain_id, nonce, max_priority_fee_per_gas, max_fee_per_gas, gas_limit,
 *      destination, value, data, access_list, authorization_list,
 *      signature_y_parity, signature_r, signature_s])
 *
 * authorization_list = [[chain_id, address, nonce, y_parity, r, s], ...]
 * ```
 *
 * Each authorization is signed by the delegating EOA over
 * `keccak256(0x05 || rlp([chain_id, address, nonce]))`.
 *
 * BitGo wallets are MPC EOAs, so the per-authorization digest (a 32-byte
 * value) can be signed with the existing MPC ECDSA message-signing path and the
 * resulting `(r, s, yParity)` embedded via {@link buildSetCodeTransaction}.
 */

import { RLP } from '@ethereumjs/rlp';
import BN from 'bn.js';
import assert from 'assert';
import { addHexPrefix, bufferToHex, keccak256, setLengthLeft, toBuffer } from 'ethereumjs-util';

/** EIP-7702 set code transaction type (`0x04`). */
export const SET_CODE_TX_TYPE = 0x04;
/** Magic byte prepended to the RLP-encoded authorization for its signing digest. */
export const SET_CODE_MAGIC = 0x05;
/** Delegation indicator written into an EOA's code: `0xef0100 || address`. */
export const DELEGATION_PREFIX = Buffer.from('ef0100', 'hex');
/** Length of a delegation indicator (3-byte prefix + 20-byte address). */
export const DELEGATION_INDICATOR_LENGTH = 23;

/** Access-list entry, matching EIP-2930 semantics. */
export interface SetCodeAccessListEntry {
  address: string;
  storageKeys: string[];
}

/** An unsigned authorization: the fields covered by the delegation signature. */
export interface SetCodeAuthorizationUnsigned {
  chainId: number | bigint | string;
  /** 20-byte address that will hold the delegation (0x-prefixed hex). */
  address: string;
  nonce: number | bigint | string;
}

/** A fully signed authorization, ready to be embedded in a set code tx. */
export interface SetCodeAuthorization extends SetCodeAuthorizationUnsigned {
  yParity: 0 | 1;
  /** secp256k1 signature `r` (0x-prefixed hex). */
  r: string;
  /** secp256k1 signature `s` (0x-prefixed hex). */
  s: string;
}

/** Outer set code transaction parameters (EIP-4844/EIP-1559 semantics). */
export interface SetCodeTransactionParams {
  chainId: number | bigint | string;
  nonce: number | bigint | string;
  maxPriorityFeePerGas: number | bigint | string;
  maxFeePerGas: number | bigint | string;
  gasLimit: number | bigint | string;
  /** Destination of the transaction; EIP-7702 requires a non-null destination. */
  destination: string;
  value: number | bigint | string;
  /** Hex-encoded calldata (0x-prefixed or not). */
  data: string;
  accessList?: SetCodeAccessListEntry[];
  authorizationList: SetCodeAuthorization[];
}

/** A signed set code transaction. */
export interface SignedSetCodeTransaction extends SetCodeTransactionParams {
  yParity: 0 | 1;
  r: string;
  s: string;
}

/** Encode a scalar (number | bigint | string | BN) as minimal-length bytes. */
function toMinimalBuffer(value: number | bigint | string | BN): Buffer {
  const bn = BN.isBN(value) ? value : new BN(String(value), 10);
  // bn.js toArrayLike emits a single 0x00 for zero; RLP expects the empty byte
  // string (0x80) for a zero-valued scalar.
  if (bn.isZero()) {
    return Buffer.alloc(0);
  }
  return bn.toArrayLike(Buffer);
}

/** Normalize an address/data hex string to a Buffer, preserving length for addresses. */
function toBytes(value: string, fixedLength?: number): Buffer {
  const buf = toBuffer(addHexPrefix(value));
  return fixedLength === undefined ? buf : setLengthLeft(buf, fixedLength);
}

function encodeAccessList(accessList: SetCodeAccessListEntry[]): Array<[Buffer, Buffer[]]> {
  return accessList.map((entry) => [
    toBytes(entry.address, 20),
    entry.storageKeys.map((key) => toBytes(key, 32)),
  ]);
}

/**
 * Compute the signing digest for a set code authorization:
 * `keccak256(0x05 || rlp([chain_id, address, nonce]))`.
 *
 * The digest is a 32-byte value that can be signed by the wallet's MPC ECDSA
 * key (via the existing message-signing path) to produce `(r, s, yParity)`.
 */
export function computeSetCodeAuthorizationDigest(auth: SetCodeAuthorizationUnsigned): Buffer {
  const encoded = RLP.encode([
    toMinimalBuffer(auth.chainId),
    toBytes(auth.address, 20),
    toMinimalBuffer(auth.nonce),
  ]);
  return keccak256(Buffer.concat([Buffer.from([SET_CODE_MAGIC]), Buffer.from(encoded)]));
}

/**
 * Build and serialize a signed EIP-7702 set code transaction.
 *
 * `params` must include the envelope signature (`yParity`, `r`, `s`) and fully
 * signed `authorizationList` entries. Returns the EIP-2718 serialized bytes
 * (type byte `0x04` followed by the RLP payload).
 */
export function buildSetCodeTransaction(params: SignedSetCodeTransaction): Buffer {
  const authorizationList = params.authorizationList.map((auth) => [
    toMinimalBuffer(auth.chainId),
    toBytes(auth.address, 20),
    // Per the reference implementations, the authorization `nonce` is RLP
    // encoded as a nested list.
    [toMinimalBuffer(auth.nonce)],
    toMinimalBuffer(auth.yParity),
    toBytes(auth.r, 32),
    toBytes(auth.s, 32),
  ]);

  const payload = RLP.encode([
    toMinimalBuffer(params.chainId),
    toMinimalBuffer(params.nonce),
    toMinimalBuffer(params.maxPriorityFeePerGas),
    toMinimalBuffer(params.maxFeePerGas),
    toMinimalBuffer(params.gasLimit),
    toBytes(params.destination, 20),
    toMinimalBuffer(params.value),
    toBytes(params.data),
    encodeAccessList(params.accessList ?? []),
    authorizationList,
    toMinimalBuffer(params.yParity),
    toBytes(params.r, 32),
    toBytes(params.s, 32),
  ]);

  return Buffer.concat([Buffer.from([SET_CODE_TX_TYPE]), Buffer.from(payload)]);
}

/**
 * Compute the transaction-envelope signing hash for a set code transaction:
 * `keccak256(0x04 || rlp(<fields without signature>))`. This is the digest the
 * sending EOA signs over (in addition to each authorization digest).
 */
export function getSetCodeTransactionSigningHash(params: SetCodeTransactionParams): Buffer {
  const authorizationList = params.authorizationList.map((auth) => [
    toMinimalBuffer(auth.chainId),
    toBytes(auth.address, 20),
    [toMinimalBuffer(auth.nonce)],
    toMinimalBuffer(auth.yParity),
    toBytes(auth.r, 32),
    toBytes(auth.s, 32),
  ]);

  const payload = RLP.encode([
    toMinimalBuffer(params.chainId),
    toMinimalBuffer(params.nonce),
    toMinimalBuffer(params.maxPriorityFeePerGas),
    toMinimalBuffer(params.maxFeePerGas),
    toMinimalBuffer(params.gasLimit),
    toBytes(params.destination, 20),
    toMinimalBuffer(params.value),
    toBytes(params.data),
    encodeAccessList(params.accessList ?? []),
    authorizationList,
  ]);

  return keccak256(Buffer.concat([Buffer.from([SET_CODE_TX_TYPE]), Buffer.from(payload)]));
}

interface DecodedSetCodeTransaction extends Array<Buffer | Buffer[]> {
  0: Buffer; // chainId
  1: Buffer; // nonce
  2: Buffer; // maxPriorityFeePerGas
  3: Buffer; // maxFeePerGas
  4: Buffer; // gasLimit
  5: Buffer; // destination
  6: Buffer; // value
  7: Buffer; // data
  8: Buffer[]; // accessList
  9: Buffer[]; // authorizationList
  10: Buffer; // yParity
  11: Buffer; // r
  12: Buffer; // s
}

function assertDecodedList(value: unknown, index: number): Buffer[] {
  assert(Array.isArray(value), `Invalid set code tx: field ${index} is not a list`);
  return value as Buffer[];
}

/**
 * Parse a serialized EIP-7702 set code transaction into its component fields.
 * Accepts a 0x-prefixed or raw hex string.
 */
export function parseSetCodeTransaction(serialized: string): SignedSetCodeTransaction {
  const bytes = toBuffer(addHexPrefix(serialized));
  assert(bytes.length > 0, 'Empty set code transaction');
  assert(bytes[0] === SET_CODE_TX_TYPE, `Expected set code tx type 0x04, got 0x${bytes[0].toString(16)}`);

  const decoded = RLP.decode(bytes.subarray(1)) as unknown as DecodedSetCodeTransaction;
  assert(decoded.length === 13, `Expected 13 fields, got ${decoded.length}`);

  const rawAuthList = assertDecodedList(decoded[9], 9);
  const rawAccessList = assertDecodedList(decoded[8], 8);

  return {
    chainId: bufferToHex(decoded[0]),
    nonce: bufferToHex(decoded[1]),
    maxPriorityFeePerGas: bufferToHex(decoded[2]),
    maxFeePerGas: bufferToHex(decoded[3]),
    gasLimit: bufferToHex(decoded[4]),
    destination: bufferToHex(decoded[5]),
    value: bufferToHex(decoded[6]),
    data: bufferToHex(decoded[7]),
    accessList: rawAccessList.map((entry) => {
      const [addr, storageKeys] = entry as unknown as [Buffer, Buffer[]];
      return { address: bufferToHex(addr), storageKeys: storageKeys.map(bufferToHex) };
    }),
    authorizationList: rawAuthList.map((auth) => {
      const [c, a, n, yp, rr, ss] = auth as unknown as [Buffer, Buffer, Buffer[], Buffer, Buffer, Buffer];
      return {
        chainId: bufferToHex(c),
        address: bufferToHex(a),
        nonce: bufferToHex(Buffer.concat(n)),
        yParity: yp.length === 0 ? 0 : (yp[0] as 0 | 1),
        r: bufferToHex(rr),
        s: bufferToHex(ss),
      };
    }),
    yParity: decoded[10].length === 0 ? 0 : (decoded[10][0] as 0 | 1),
    r: bufferToHex(decoded[11]),
    s: bufferToHex(decoded[12]),
  };
}
