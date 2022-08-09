import { ITransactionExplanation } from '../../bitgo';
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

/**
 * The number of participants for which to generate shares and a threshold of those that would be required when signing
 */
export type DkgOptions = {
  threshold: number;
  participants: number;
};

/**
 * Representation of a Signature to be added to a Transaction.
 */
export type Signature = {
  publicKey: PublicKey;
  signature: Buffer;
};

export type BlsKeyPairOptions = DkgOptions | BlsKeys;

export type KeyPairOptions = Seed | PrivateKey | PublicKey | BlsKeyPairOptions;

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
 * @param source
 */
export function isDkg(source: KeyPairOptions): source is DkgOptions {
  const dkg = source as DkgOptions;
  return dkg.threshold !== undefined && dkg.participants !== undefined;
}

export function isBlsKey(source: KeyPairOptions): source is BlsKeys {
  const bls = source as BlsKeys;
  return bls.publicShare !== undefined && bls.secretShares !== undefined;
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

/**
 * BLS signature keys.
 */
export type BlsKeys = {
  prv?: string;
  secretShares: string[];
  publicShare: string;
  seed: string;
  chaincode: string;
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

export interface TransactionRecipient {
  address: string;
  amount: string | number;
  memo?: string;
  tokenName?: string;
}

export interface TransactionFee {
  fee: string;
  feeRate?: number;
  size?: number;
  type?: string;
}

export interface TransactionOutputs {
  outputs: TransactionRecipient[];
  outputAmount: string;
}

export interface TransactionChanges {
  changeOutputs: TransactionRecipient[];
  changeAmount: string;
}

export type TransactionExplanation = ITransactionExplanation<TransactionFee>;
/**
 * Fee options.
 */
export type FeeOptions = {
  amount: number | string;
  unit?: 'baseUnit' | 'cpu' | 'ram';
  formula?: 'fixed' | 'feeRate' | 'perKB' | 'custom';
  type?: 'base' | 'max' | 'tip';
};

/**
 * The validity window signals when a transaction can be included in the network.
 *  ValidityWindow information is stored as part of the transaction data in the indexer and wallet platform, unless it is absolutely necessary.
 * firstValid: the absolute block/time after which the transaction is valid
 * lastValid: the absolute block/time before which the transaction is valid
 * minDuration: minimum duration a transaction for this coin is valid
 * maxDuration: maximum duration a transaction for this coin is valid
 * minDuration and maxDuration are defined per blockchain, whereas firstValid and lastValid are defined per transaction
 * unit: validity window will be measure in blockheigh or timestamp
 * TODO: validityWindow constraint methods will be taken on: https://bitgoinc.atlassian.net/browse/STLX-10800
 */
export interface ValidityWindow {
  firstValid?: number;
  lastValid?: number;
  minDuration?: number;
  maxDuration?: number;
  unit?: 'blockheight' | 'timestamp';
}

/**
 * Sequence Ids are used to differentiate payments coming from the same account and to prevent accidental double spends and replay attacks.
 */
export interface SequenceId {
  name: 'Nonce' | 'Sequence Id' | 'Counter';
  keyword: 'nonce' | 'sequenceId' | 'counter';
  value: string | number;
}
