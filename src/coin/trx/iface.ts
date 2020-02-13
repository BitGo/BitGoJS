import { ContractType, PermissionType } from './enum';

/**
 * A Tron private key in extended or raw format
 */
export type PrivateKey = {
  prv: string;
};

/**
 * A Tron public key in extended, compressed, or uncompressed format
 */
export type PublicKey = {
  pub: string;
};

/**
 * A seed to create Tron key pairs. Must be between 16 and 64 Bytes long
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

export interface Account {
  publicKey: string;
  privateKey: string;
  address: {
    base58: string;
    hex: string;
  };
}

export interface Parameter {
  value: string;
  typeUrl: string;
}

export interface Contract {
  parameter: Parameter;
  type: string;
}

/**
 * This interface represents a form of:
 * @external https://github.com/BitGo/bitgo-account-lib/blob/5f282588701778a4421c75fa61f42713f56e95b9/resources/trx/protobuf/tron.proto#L239
 */
export interface TransactionReceipt {
  /**
   * This does not exist in protobuf because it's attached by the node rpc calls.
   */
  txID?: string;
  raw_data: RawData;
  raw_data_hex: string;
  signature?: Array<string>;
}

export interface RawData {
  expiration: number;
  timestamp: number;
  contractType?: ContractType;
  contract: TransferContract[] | AccountPermissionUpdateContract[];
}

export interface Value {
  value: ValueFields;
}

export interface ValueFields {
  amount: number;
  // base58 encoded addresses
  owner_address: string;
  to_address: string;
}

export interface TransferContract {
  parameter: Value;
}

export interface AccountPermissionUpdateContract {
  ownerAddress: string;
  owner: Permission;
  witness?: Permission;
  actives: Array<Permission>;
}

export interface Permission {
  type: PermissionType;
  threshold: number;
}

export interface PermissionKey {
  address: string;
  weight: number;
}
