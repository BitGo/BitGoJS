import { TransactionExplanation as BaseTransactionExplanation, TransactionType } from '@bitgo/sdk-core';

export enum SuiTransactionType {
  Pay = 'Pay',
  PaySui = 'PaySui',
  PayAllSui = 'PayAllSui',
  AddDelegation = 'AddDelegation',
  WithdrawDelegation = 'WithdrawDelegation',
  SwitchDelegation = 'SwitchDelegation',
}

export interface TransactionExplanation extends BaseTransactionExplanation {
  type: TransactionType;
}

export type SuiObjectRef = {
  /** Hex code as string representing the object id */
  objectId: string;
  /** Object version */
  version: number;
  /** Base64 string representing the object digest */
  digest: string;
};

export type ObjectId = string;
export type SuiAddress = string;

export type SuiJsonValue = boolean | number | string | SuiObjectRef | SharedObjectRef | CallArg | Array<unknown>;

/**
 * Kind of a TypeTag which is represented by a Move type identifier.
 */
export type StructTag = {
  address: string;
  module: string;
  name: string;
  typeParams: TypeTag[];
};

/**
 * Sui TypeTag object. A decoupled `0x...::module::Type<???>` parameter.
 */
export type TypeTag =
  | { bool: null }
  | { u8: null }
  | { u64: null }
  | { u128: null }
  | { address: null }
  | { signer: null }
  | { vector: TypeTag }
  | { struct: StructTag }
  | { u16: null }
  | { u32: null }
  | { u256: null };

/**
 * A reference to a shared object.
 */
export type SharedObjectRef = {
  /** Hex code as string representing the object id */
  objectId: string;

  /** The version the object was shared at */
  initialSharedVersion: number;

  /** Whether reference is mutable */
  mutable: boolean;
};

export type ImmOrOwnedArg = { ImmOrOwned: SuiObjectRef };
export type SharedArg = { Shared: SharedObjectRef };
export type ObjectArg = ImmOrOwnedArg | SharedArg;
export type ObjVecArg = { ObjVec: ArrayLike<ObjectArg> };
/**
 * An object argument.
 */
export type CallArg = { Pure: ArrayLike<number> } | { Object: ObjectArg } | ObjVecArg;

export type TxDetails = PayTxDetails | PaySuiTxDetails | PayAllSuiTxDetails | MoveCallTxDetails;

export interface PayTxDetails {
  Pay: {
    coins: SuiObjectRef[];
    recipients: string[];
    amounts: number[];
  };
}

export interface PaySuiTxDetails {
  PaySui: {
    coins: SuiObjectRef[];
    recipients: string[];
    amounts: number[];
  };
}

export interface PayAllSuiTxDetails {
  PayAllSui: {
    coins: SuiObjectRef[];
    recipient: string;
  };
}

// ========== Move Call Tx ===========

/**
 * Transaction type used for calling Move modules' functions.
 * Should be crafted carefully, because the order of type parameters and
 * arguments matters.
 */
export interface MoveCallTxDetails {
  Call: {
    package: SuiAddress;
    module: string;
    function: string;
    typeArguments: TypeTag[];
    arguments: SuiJsonValue[];
  };
}

/**
 * The transaction data returned from the toJson() function of a transaction
 */
export interface TxData {
  id?: string;
  kind: { Single: TxDetails };
  sender: string;
  gasPayment: SuiObjectRef;
  gasBudget: number;
  gasPrice: number;
}

export interface PayTx {
  coins: SuiObjectRef[];
  recipients: string[];
  amounts: number[];
}

export interface MoveCallTx {
  package: SuiAddress;
  module: string;
  function: string;
  typeArguments: TypeTag[];
  arguments: SuiJsonValue[];
}

export interface SuiTransaction<T = PayTx | MoveCallTx> {
  type: SuiTransactionType;
  sender: string;
  tx: T;
  gasBudget: number;
  gasPrice: number;
  gasPayment: SuiObjectRef;
}
// Staking DTOs
export interface RequestAddDelegation {
  coins: SuiObjectRef[];
  amount: number;
  validatorAddress: SuiAddress;
}

export interface RequestWithdrawDelegation {
  delegationObjectId: SuiObjectRef;
  stakedSuiObjectId: SuiObjectRef;
  amount: number;
}

export interface RequestSwitchDelegation {
  delegationObjectId: SuiObjectRef;
  stakedSuiObjectId: SuiObjectRef;
  newValidatorAddress: SuiAddress;
  amount: number;
}

/**
 * Method names for the transaction method. Names change based on the type of transaction e.g 'request_add_delegation_mul_coin' for the staking transaction
 */
export enum MethodNames {
  /**
   * Add delegated stake to a validator's staking pool.
   *
   * @see https://github.com/MystenLabs/sui/blob/main/crates/sui-framework/docs/sui_system.md#function-request_add_delegation
   */
  RequestAddDelegation = 'request_add_delegation',
  /**
   * Add delegated stake to a validator's staking pool using multiple coins.
   *
   * @see https://github.com/MystenLabs/sui/blob/main/crates/sui-framework/docs/sui_system.md#0x2_sui_system_request_add_delegation_mul_coin
   */
  RequestAddDelegationMulCoin = 'request_add_delegation_mul_coin',
  /**
   * Switch delegation from the current validator to a new one..
   *
   * @see https://github.com/MystenLabs/sui/blob/main/crates/sui-framework/docs/sui_system.md#0x2_sui_system_request_switch_delegation
   */
  RequestSwitchDelegation = 'request_switch_delegation',
  /**
   * Withdraw some portion of a delegation from a validator's staking pool..
   *
   * @see https://github.com/MystenLabs/sui/blob/main/crates/sui-framework/docs/sui_system.md#function-request_withdraw_delegation
   */
  RequestWithdrawDelegation = 'request_withdraw_delegation',
}

/**
 * Sui modules
 */
export enum ModulesNames {
  /**
   * Module 0x2::sui_system
   *
   * @see https://github.com/MystenLabs/sui/blob/main/crates/sui-framework/docs/sui_system.md
   */
  SuiSystem = 'sui_system',
}
