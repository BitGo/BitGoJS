import { Entry } from '@bitgo/sdk-core';
import { ContractType, PermissionType, TronResource } from './enum';

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
 * @external https://github.com/BitGo/bitgo-account-lib/blob/5f282588701778a4421c75fa61f42713f56e95b9/resources/protobuf/tron.proto#L239
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
  contract:
    | TransferContract[]
    | AccountPermissionUpdateContract[]
    | TriggerSmartContract[]
    | FreezeBalanceV2Contract[]
    | VoteWitnessContract[]
    | UnfreezeBalanceV2Contract[]
    | WithdrawExpireUnfreezeContract[]
    | WithdrawBalanceContract[]
    | ResourceManagementContract[];
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

export interface AccountInfo {
  address: string;
  balance: number;
  owner_permission: {
    keys: [PermissionKey];
  };
  active_permission: [{ keys: [PermissionKey] }];
  trc20: [Record<string, string>];
}

/**
 * Freeze balance contract value fields
 */
export interface FreezeBalanceValueFields {
  resource: string;
  frozen_balance: number;
  owner_address: string;
}

/**
 * Unfreeze transaction value fields
 */
export interface UnfreezeBalanceValueFields {
  resource: string;
  unfreeze_balance: number;
  owner_address: string;
}

/**
 * Freeze balance contract value interface
 */
export interface FreezeBalanceValue {
  type_url?: string;
  value: FreezeBalanceValueFields;
}

/**
 * Freeze balance v2 contract interface
 */
export interface FreezeBalanceV2Contract {
  parameter: FreezeBalanceValue;
  type?: string;
}

/**
 * Unfreeze balance contract value interface
 */
export interface UnfreezeBalanceValue {
  type_url?: string;
  value: UnfreezeBalanceValueFields;
}

/**
 * Unfreeze balance v2 contract interface
 */
export interface UnfreezeBalanceV2Contract {
  parameter: UnfreezeBalanceValue;
  type?: string;
}

/**
 * Freeze balance contract parameter interface
 */
export interface FreezeBalanceContractParameter {
  parameter: {
    value: {
      resource: TronResource;
      frozen_balance: number;
      owner_address: string;
    };
  };
}

/**
 * Withdraw transaction value fields
 */
export interface WithdrawExpireUnfreezeValueFields {
  owner_address: string;
}

/**
 * Withdraw balance contract value interface
 */
export interface WithdrawExpireUnfreezeValue {
  type_url?: string;
  value: WithdrawExpireUnfreezeValueFields;
}

/**
 * Withdraw expire unfreeze contract interface
 */
export interface WithdrawExpireUnfreezeContract {
  parameter: WithdrawExpireUnfreezeValue;
  type?: string;
}

export interface WithdrawBalanceContract {
  // same as withdraw expire unfreeze
  parameter: WithdrawExpireUnfreezeValue;
  type?: string;
}

export interface UnfreezeBalanceContractParameter {
  parameter: {
    value: {
      resource: TronResource;
      unfreeze_balance: number;
      owner_address: string;
    };
  };
}

/**
 * Freeze balance contract decoded interface
 */
export interface FreezeContractDecoded {
  ownerAddress?: string;
  resource?: number;
  frozenBalance?: string | number;
}

/**
 * Unfreeze balance contract decoded interface
 */
export interface UnfreezeContractDecoded {
  ownerAddress?: string;
  resource?: number;
  unfreezeBalance?: string | number;
}

/**
 * Withdraw expire unfreeze contract decoded interface
 */
export interface WithdrawContractDecoded {
  ownerAddress?: string;
}

/**
 * Vote data in a vote transaction
 */
export interface VoteWitnessData {
  vote_address: string;
  vote_count: number;
}

/**
 * Vote transaction value fields
 */
export interface VoteWitnessValueFields {
  owner_address: string;
  votes: VoteWitnessData[];
}

/**
 * Vote contract value interface
 */
export interface VoteWitnessValue {
  type_url?: string;
  value: VoteWitnessValueFields;
}

/**
 * Vote witness contract interface
 */
export interface VoteWitnessContract {
  parameter: VoteWitnessValue;
  type?: string;
}

/**
 * Vote witness contract decoded interface
 */
export interface VoteContractDecoded {
  ownerAddress?: string;
  votes?: Array<{
    voteAddress?: string;
    voteCount?: string | number;
  }>;
}

/**
 * Vote witness contract parameter interface
 */
export interface VoteWitnessContractParameter {
  parameter: {
    value: {
      owner_address: string;
      votes: Array<{
        vote_address: string;
        vote_count: number;
      }>;
    };
  };
}

/**
 * Withdraw expire unfreeze contract parameter interface
 */
export interface WithdrawExpireUnfreezeContractParameter {
  parameter: {
    value: {
      owner_address: string;
    };
  };
}

/**
 * Delegate/Undelegate resource value interface
 */
export interface ResourceManagementTxValueFields {
  balance: number;
  receiver_address: string;
  owner_address: string;
  resource: string;
}

/**
 * Delegate/Undelegate resource parameters interface
 */
export interface ResourceManagmentTxParams {
  value: ResourceManagementTxValueFields;
  type_url?: string;
}

/**
 * Delegate/Undelegate resource contract interface
 */
export interface ResourceManagementContract {
  parameter: ResourceManagmentTxParams;
  type?: string;
}

/**
 * Delegate/Undelegate resource contract parameter interface
 */
export interface ResourceManagementContractParameter {
  parameter: {
    value: {
      resource: TronResource;
      balance: string | number;
      owner_address: string;
      receiver_address: string;
    };
  };
}

/**
 * Delegate/Undelegate resource contract decoded interface
 */
export interface ResourceManagementContractDecoded {
  ownerAddress?: string;
  receiverAddress?: string;
  balance?: string | number;
  resource?: TronResource;
}
