import {
  Entry,
  SignTransactionOptions,
  TransactionExplanation,
  TransactionFee,
  TransactionPrebuild as BaseTransactionPrebuild,
  TransactionRecipient as Recipient,
} from '@bitgo/sdk-core';
import { ContractType, PermissionType } from './enum';

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
 *
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
  ref_block_bytes: string;
  ref_block_hash: string;
  fee_limit?: number;
  contractType?: ContractType;
  contract: TransferContract[] | AccountPermissionUpdateContract[] | TriggerSmartContract[];
}

export interface Value {
  type_url?: string;
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

export interface TriggerSmartContract {
  parameter: ContractCallValue;
  type?: string;
}

export interface ContractCallValue {
  type_url?: string;
  value: ContractCallValueFields;
}

export interface ContractCallValueFields {
  data: string;
  contract_address: string;
  owner_address: string;
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

export interface Block {
  number: number;
  hash: string;
}

export interface Fee {
  feeLimit: string;
}

export interface ContractEntry extends Entry {
  data?: string;
  contractAddress?: string;
}

export interface TronSignTransactionOptions extends SignTransactionOptions {
  txPrebuild: TransactionPrebuild;
  prv: string;
}

export interface TxInfo {
  recipients: Recipient[];
  from: string;
  txid: string;
}

export interface TronTransactionExplanation extends TransactionExplanation {
  expiration: number;
  timestamp: number;
}

export interface TransactionPrebuild extends BaseTransactionPrebuild {
  txHex: string;
  txInfo: TxInfo;
  feeInfo: TransactionFee;
}

export interface ExplainTransactionOptions {
  txHex?: string; // txHex is poorly named here; it is just a wrapped JSON object
  halfSigned?: {
    txHex: string; // txHex is poorly named here; it is just a wrapped JSON object
  };
  feeInfo: TransactionFee;
}

export interface RecoveryOptions {
  userKey: string; // Box A
  backupKey: string; // Box B
  bitgoKey: string; // Box C - this is bitgo's xpub and will be used to derive their root address
  recoveryDestination: string; // base58 address
  krsProvider?: string;
  walletPassphrase?: string;
}

export interface RecoveryTransaction {
  tx: TransactionPrebuild;
  recoveryAmount: number;
}

export enum NodeTypes {
  Full,
  Solidity,
}

/**
 * This structure is not a complete model of the AccountResponse from a node.
 */
export interface AccountResponse {
  address: string;
  balance: number;
  owner_permission: {
    keys: [PermissionKey];
  };
  active_permission: [{ keys: [PermissionKey] }];
}
