import { BaseTransactionBuilder } from './baseTransactionBuilder';
import { BaseTransactionBuilderFactory } from './baseTransactionBuilderFactory';

export interface BaseKey {
  key: any;
}

/**
 * A private key in extended or raw format
 */
export type PrivateKey = {
  prv: string;
};

/**
 * A public key in extended, compressed, or uncompressed format
 */
export type PublicKey = {
  pub: string;
};

/**
 * A seed to create key pairs. Must be between 16 and 64 Bytes long
 */
export type Seed = {
  seed: Buffer;
};

export type KeyPairOptions = Seed | PrivateKey | PublicKey;

export type BaseBuilder = BaseTransactionBuilder | BaseTransactionBuilderFactory;

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

/**
 * Key pair in the protocol default format.
 */
export type DefaultKeys = {
  prv?: string;
  pub: string;
};

/**
 * Key pair in Uint8Array format.
 */
export type ByteKeys = {
  prv?: Uint8Array;
  pub: Uint8Array;
};

/**
 * Key pair in extended format. Used for coins supporting secp256k1 elliptic curve.
 */
export type ExtendedKeys = {
  xprv?: string;
  xpub: string;
};

export interface BaseAddress {
  address: string;
}

export interface Entry extends BaseAddress {
  coin?: string;
  value: string;
}

export interface BaseFee {
  fee: string;
}
