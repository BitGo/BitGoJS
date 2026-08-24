import type { Core } from "@blaze-cardano/sdk";

/**
 * Protocol version identifier
 */
export type TProtocolVersion =
  | "V0"
  | "V0_1"
  | "V0_2"
  | "V0_3"
  | "V0_4"
  | "V1_0"
  | "V1_0_Rc1"
  | "V1_1_Rc1";

/**
 * Bootstrap parameters for initializing the SDK
 */
export interface IProxyBootstrap {
  txHash: Core.TransactionId;
  outputIndex: bigint;
}

/**
 * Base parameters common to all SDK versions
 */
export interface IBaseSDKParams {
  version: TProtocolVersion;
  proxyBootstrap: IProxyBootstrap;
  assetNameHex: string;
  /** Enable trace output in Plutus scripts for debugging. Default: false */
  enableTrace?: boolean;
  /**
   * Address to deploy reference scripts to (and resolve them from). When set,
   * deployment locks reference UTxOs at this address and resolution queries it
   * first (a small, fast UTxO set). When omitted, Blaze's burn address is used.
   */
  scriptDeploymentAddress?: Core.Address;
}

/**
 * Reference inputs that can be cached for performance
 */
export interface ICachedReferenceInputs {
  protocolRefInput?: Core.TransactionUnspentOutput;
  proxyRefInput?: Core.TransactionUnspentOutput;
  treasuryRefInput?: Core.TransactionUnspentOutput;
  orderRefInput?: Core.TransactionUnspentOutput;
  stakingVaultRefInput?: Core.TransactionUnspentOutput;
  // V1.0 additional protocol scripts
  protocolMintRefInput?: Core.TransactionUnspentOutput;
  protocolStakeRefInput?: Core.TransactionUnspentOutput;
  protocolManagementRefInput?: Core.TransactionUnspentOutput;
}

/**
 * Result type for raw proxy-datum fetches.
 */
export interface IRawProxyDatumResult {
  proxyUtxo: Core.TransactionUnspentOutput;
  proxyDatum: Core.PlutusData;
}

/**
 * Result type for parsed proxy-datum fetches.
 */
export interface IProxyDatumResult<T> extends IRawProxyDatumResult {
  parsedProxyDatum: T;
}

/**
 * Result type for getTreasuryDatum operations
 */
export interface ITreasuryDatumResult<T> {
  treasuryUtxo: Core.TransactionUnspentOutput;
  treasuryDatum: Core.PlutusData;
  parsedTreasuryDatum: T;
}

/**
 * Result type for getVaultDatum operations
 */
export interface IVaultDatumResult<T> {
  vaultUtxo: Core.TransactionUnspentOutput;
  vaultDatum: Core.PlutusData;
  parsedVaultDatum: T;
}

/**
 * Output reference type used in scripts
 */
export interface IOutputReference {
  transaction_id: Core.TransactionId;
  output_index: bigint;
}

/**
 * Version-agnostic MultisigScript. Structurally identical across all
 * protocol versions (same Plutus CBOR encoding).
 */
export type TMultisigScript =
  | { Signature: { key_hash: string } }
  | { AllOf: { scripts: TMultisigScript[] } }
  | { AnyOf: { scripts: TMultisigScript[] } }
  | { AtLeast: { required: bigint; scripts: TMultisigScript[] } }
  | { Before: { time: bigint } }
  | { After: { time: bigint } }
  | { Script: { script_hash: string } };

/**
 * Version-agnostic reserve asset.
 */
export interface IReserveAsset {
  asset: [string, string];
  numerator: bigint;
  denominator: bigint;
}

/**
 * Version-agnostic proxy settings — common fields only.
 * Hides version-specific fields (direct_mint/burn_permission, registry shape).
 */
export interface IProxySettings {
  mint_permission: TMultisigScript;
  burn_permission: TMultisigScript;
  withdraw_permission: TMultisigScript;
  deposit_permission: TMultisigScript;
  stake_permission: TMultisigScript;
  unstake_permission: TMultisigScript;
  reserve_assets: IReserveAsset[];
}

/**
 * Permission key — for safely indexing into IProxySettings.
 */
export type TPermissionKey =
  | "mint_permission"
  | "burn_permission"
  | "withdraw_permission"
  | "deposit_permission"
  | "stake_permission"
  | "unstake_permission";
