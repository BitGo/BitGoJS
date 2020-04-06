import BN = require('bn.js');
import { BaseFee } from '../baseCoin/iface';

/**
 * An Ethereum private key in extended or raw format
 */
export type PrivateKey = {
  prv: string;
};

/**
 * An Ethereum public key in extended, compressed, or uncompressed format
 */
export type PublicKey = {
  pub: string;
};

/**
 * A seed to create Ethereum key pairs. Must be between 16 and 64 Bytes long
 */
export type Seed = {
  seed: Buffer;
};

export type KeyPairOptions = Seed | PrivateKey | PublicKey;

/**
 * @param source
 */
export function isSeed(source: KeyPairOptions): source is Seed {
  return (source as Seed).seed !== undefined;
}

/**
 * @param source
 */
export function isPrivateKey(source: KeyPairOptions): source is PrivateKey {
  return (source as PrivateKey).prv !== undefined;
}

/**
 * @param source
 */
export function isPublicKey(source: KeyPairOptions): source is PublicKey {
  return (source as PublicKey).pub !== undefined;
}

export interface Fee extends BaseFee {
  gasLimit: string;
}

export interface Account {
  publicKey: string;
  privateKey: string;
  address: {
    hex: string;
  };
}

export interface ParsedTransaction {
  branch: string;
  contents: Operation[];
}

export interface Operation {
  to: string;
  dataToSign?: string;
  gas_limit: string;
  gas_price: string;
  counter?: string;
}

/**
 * Any object that can be transformed into a `Buffer`
 */
export interface TransformableToBuffer {
  toBuffer(): Buffer;
}

/**
 * A hex string prefixed with `0x`.
 */
export type PrefixedHexString = string;

/**
 * A Buffer, hex string prefixed with `0x`, Number, or an object with a toBuffer method such as BN.
 */
export type BufferLike = Buffer | TransformableToBuffer | PrefixedHexString | number;

/**
 * A transaction's data.
 */
export interface SigData {
  /**
   * EC recovery ID.
   */
  v?: number;

  /**
   * EC signature parameter.
   */
  r?: number;

  /**
   * EC signature parameter.
   */
  s?: number;
}
/**
 * A transaction's data.
 */
export interface TxData {
  /**
   * The transaction's gas limit.
   */
  gasLimit?: BufferLike;

  /**
   * The transaction's gas price.
   */
  gasPrice?: BufferLike;

  /**
   * The transaction's the address is sent to.
   */
  to?: BufferLike;

  /**
   * The transaction's nonce.
   */
  nonce?: BufferLike;

  /**
   * The chainId's nonce.
   */
  chainId?: BufferLike;

  /**
   * This will contain the data of the message or the init of a contract
   */
  data?: BufferLike;

  /**
   * EC recovery ID.
   */
  v?: BufferLike;

  /**
   * EC signature parameter.
   */
  r?: BufferLike;

  /**
   * EC signature parameter.
   */
  s?: BufferLike;

  /**
   * The amount of Ether sent.
   */
  value?: BufferLike;
}

/**
 * The data of a fake (self-signing) transaction.
 */
export interface FakeTxData extends TxData {
  /**
   * The sender of the Tx.
   */
  from?: BufferLike;
}

export type Input = Buffer | string | number | Uint8Array | BN | null;

export interface Decoded {
  data: Buffer | Buffer[];
  remainder: Buffer;
}

export interface FieldData {
  allowZero: boolean;
  allowLess: boolean;
  length: number;
  name: string;
}
