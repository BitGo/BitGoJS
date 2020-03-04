import { BaseFee } from '../baseCoin/iface';
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

export interface HashType {
  prefix: Buffer;
  byteLength: number;
}

export interface Operation {
  kind: string;
  counter: string;
  source: string;
  fee: string;
  gas_limit: string;
  storage_limit: string;
}

export interface RevealOp extends Operation {
  public_key: string;
}

export interface OriginationOp extends Operation {
  balance: string;
  script: any;
}

export interface TransactionOp extends Operation {
  parameters?: any;
  destination: string;
  amount: string;
}

export interface ParsedTransaction {
  branch: string;
  contents: Operation[];
}

/**
 * Different Tezos specific fees
 */
export interface Fee extends BaseFee {
  gasLimit?: string;
  storageLimit?: string;
}

/**
 * Send transaction information
 */
export interface TransferData {
  amount: string;
  coin?: string;
  from: string;
  to: string;
  fee: Fee;
  dataToSign?: string;
  counter?: string;
}

/**
 * Taquito return type for sign operations
 */
export interface SignResponse {
  bytes: string;
  sig: any;
  prefixSig: any;
  sbytes: string;
}
