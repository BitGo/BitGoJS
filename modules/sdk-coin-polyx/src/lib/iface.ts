import { Args } from '@substrate/txwrapper-core';
import { Interface } from '@bitgo-beta/abstract-substrate';
import { DecodedUnsignedTx } from '@substrate/txwrapper-core/lib/types';

export type AnyJson = string | number | boolean | null | { [key: string]: AnyJson } | Array<AnyJson>;

/**
 * Extended TxData interface for Polyx transactions
 * Adds assetId field to the base TxData interface from abstract-substrate
 */
export interface TxData extends Interface.TxData {
  assetId?: string;
  fromDID?: string;
  toDID?: string;
}

/**
 * Settlement type for Polyx transactions
 */
export enum SettlementType {
  SettleOnAffirmation = 'SettleOnAffirmation',
}

/**
 * Portfolio kind for Polyx transactions
 */
export enum PortfolioKind {
  Default = 'Default',
}

/**
 * Method names for Polyx transactions.
 * Extends the base MethodNames from Interface with additional Polyx-specific methods.
 */
export const MethodNames = {
  // Include all values from the base object
  ...Interface.MethodNames,

  /**
   * Registers a Decentralized Identifier (DID) along with Customer Due Diligence (CDD) information.
   *
   * @see https://developers.polymesh.network/sdk-docs/enums/Generated/Types/IdentityTx/#cddregisterdidwithcdd
   */
  RegisterDidWithCDD: 'cddRegisterDidWithCdd' as const,

  /**
   * Pre-approves an asset.
   */
  PreApproveAsset: 'preApproveAsset' as const,

  AddAndAffirmWithMediators: 'addAndAffirmWithMediators' as const,
} as const;

// Create a type that represents the keys of this object
export type MethodNamesType = keyof typeof MethodNames;

// Create a type that represents the values of this object
export type MethodNamesValues = (typeof MethodNames)[MethodNamesType];

export interface RegisterDidWithCDDArgs extends Args {
  targetAccount: string;
  secondaryKeys: [];
  expiry: null;
}

export interface PreApproveAssetArgs extends Args {
  assetId: string;
}

export interface AddAndAffirmWithMediatorsArgs extends Args {
  venueId: null;
  settlementType: SettlementType.SettleOnAffirmation;
  tradeDate: null;
  valueDate: null;
  legs: Array<{
    fungible: {
      sender: { did: string; kind: PortfolioKind.Default };
      receiver: { did: string; kind: PortfolioKind.Default };
      assetId: string;
      amount: string;
    };
  }>;
  portfolios: Array<{ did: string; kind: PortfolioKind.Default }>;
  instructionMemo: string;
  mediators: [];
}

export interface TxMethod extends Omit<Interface.TxMethod, 'args' | 'name'> {
  args:
    | Interface.TransferArgs
    | Interface.TransferAllArgs
    | Interface.AddStakeArgs
    | Interface.RemoveStakeArgs
    | Interface.BondArgs
    | Interface.BondExtraArgs
    | Interface.NominateArgs
    | Interface.ChillArgs
    | Interface.UnbondArgs
    | Interface.WithdrawUnbondedArgs
    | Interface.BatchArgs
    | RegisterDidWithCDDArgs
    | PreApproveAssetArgs
    | AddAndAffirmWithMediatorsArgs;
  name: MethodNamesValues;
}

export interface DecodedTx extends Omit<DecodedUnsignedTx, 'method'> {
  method: TxMethod;
}

export interface BondArgs extends Args {
  value: string;
  controller: string;
  payee: string | { Account: string };
}

export interface BondExtraArgs extends Args {
  maxAdditional: string;
}

export interface NominateArgs extends Args {
  targets: string[];
}

export interface BatchCallObject {
  method?: string;
  callIndex?: string;
  args: Record<string, unknown>;
}

export interface BatchArgs {
  calls: BatchCallObject[];
}

export interface UnbondArgs extends Args {
  value: string;
}

export interface WithdrawUnbondedArgs extends Args {
  numSlashingSpans: number;
}
