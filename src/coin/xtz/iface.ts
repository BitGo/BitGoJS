/**
 * A Tezos private key with the spsk prefix or raw
 */
export type PrivateKey = {
  prv: string;
};

/**
 * A Tezos public key with the sppk prefix or raw
 */
export type PublicKey = {
  pub: string;
};

/**
 * A seed to create Tezos key pairs. Must be between 16 and 64 Bytes long
 */
export type Seed = {
  seed: Buffer;
};

export type KeyPairOptions = Seed | PrivateKey | PublicKey;

export function isSeed(source: KeyPairOptions): source is Seed {
  return (source as Seed).seed !== undefined;
}

export function isPrivateKey(source: KeyPairOptions): source is PrivateKey {
  return (source as PrivateKey).prv !== undefined;
}

export function isPublicKey(source: KeyPairOptions): source is PublicKey {
  return (source as PublicKey).pub !== undefined;
}

export interface HashType {
  prefix: Buffer;
  byteLength: number;
}

export interface Operation {
  kind: string;
  balance: string;
  source: string;
  fee: string;
  gas_limit: string;
  storage_limit: string;
  script: any;
}

export interface ParsedTransaction {
  branch: string;
  contents: Operation[];
}
