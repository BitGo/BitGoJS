import type { Provider } from "@blaze-cardano/query";
import type { Blaze, Core, TxBuilder, Wallet } from "@blaze-cardano/sdk";

import type {
  GovernanceConfig,
  MultisigScript,
  Permissions,
  ProtocolConfig,
  RegistryV1,
  SettingsV1,
  Tuple_VerificationKey_COSESign1,
} from "../../generated-types/v1_1_rc1/index.js";

/**
 * COSE (CIP-8) signatures authorizing a settings change — `(VerificationKey,
 * COSESign1)` tuples over the auth-payload hash from `getSettingsAuthPayloadHash`.
 * Collected out-of-band (e.g. from hardware wallets), then passed to the build
 * method — mirroring the orchestrator's `buildExecuteOrdersTx({ signatures })`.
 */
export type TSettingsSignatures = Tuple_VerificationKey_COSESign1[];

export interface IProtocolSettingsAdminParams {
  proxyPolicyId: Core.PolicyId;
  governanceConfig: GovernanceConfig;
  enableTrace?: boolean;
  referenceInputs?: {
    settingsRefInput?: Core.TransactionUnspentOutput;
  };
}

export interface IProtocolSettingsAdminSource<
  P extends Provider,
  W extends Wallet,
> {
  readonly blaze: Blaze<P, W>;
  readonly oneShotPolicyId: Core.PolicyId;
  readonly enableTrace: boolean;
}

export interface IProtocolSettingsState {
  proxyUtxo: Core.TransactionUnspentOutput;
  proxyDatum: Core.PlutusData;
  proxyAddress: Core.Address;
  logicHash: Core.ScriptHash;
  settingsData: Core.PlutusData;
  liveSettings?: SettingsV1;
  paymentCredentialHash: string;
  isFrozen: boolean;
  isGovernedByThisValidator: boolean;
}

export interface IBuildChangePermissionsTxParams {
  nextPermissions: Permissions;
  signatures: TSettingsSignatures;
}

export interface IBuildChangeConfigTxParams {
  nextConfig: ProtocolConfig;
  signatures: TSettingsSignatures;
}

export interface IBuildChangeLogicTxParams {
  nextLogicHash?: Core.ScriptHash;
  nextRegistry?: RegistryV1;
  signatures: TSettingsSignatures;
}

/**
 * A settings change resolved against the current on-chain state — the shared
 * intermediate used to both compute the auth-payload hash and build the tx, so
 * the signed message and the submitted tx always agree.
 */
export interface IResolvedSettingsChange {
  redeemer:
    | "ChangeLogic"
    | "ChangePermissions"
    | "ChangeConfig"
    | "Shutdown"
    | "Restore"
    | "Migrate";
  nextLogicHash: Core.ScriptHash;
  nextSettingsData: Core.PlutusData;
  receiverAddress: Core.Address;
  coValidateWith?: {
    rewardAccount: Core.RewardAccount;
    applyWitness(tx: TxBuilder): Promise<void>;
  };
}

export interface IBuildMigrateTxParams<P extends Provider, W extends Wallet> {
  destination: IProtocolSettingsAdminInstance<P, W>;
  /** COSE signatures satisfying this (source) validator's `migrate` permission. */
  signatures: TSettingsSignatures;
  /** COSE signatures satisfying the destination validator's `migrate` permission. */
  destinationSignatures: TSettingsSignatures;
}

/**
 * The change to authorize, passed to both `getSettingsAuthPayloadHash` (to get
 * the hash to sign) and the matching build method — mirroring how the
 * orchestrator passes the same order inputs to `getSignedPayloadFromOrderInputs`
 * and `buildExecuteOrdersTx`.
 */
export type TSettingsChange<P extends Provider, W extends Wallet> =
  | { type: "ChangePermissions"; nextPermissions: Permissions }
  | { type: "ChangeConfig"; nextConfig: ProtocolConfig }
  | {
      type: "ChangeLogic";
      nextLogicHash?: Core.ScriptHash;
      nextRegistry?: RegistryV1;
    }
  | { type: "Shutdown" }
  | { type: "Restore" }
  | { type: "Migrate"; destination: IProtocolSettingsAdminInstance<P, W> };

export interface IProtocolSettingsAdminInstance<
  P extends Provider,
  W extends Wallet,
> {
  readonly blaze: Blaze<P, W>;
  readonly proxyPolicyId: Core.PolicyId;
  readonly governanceConfig: GovernanceConfig;
  readonly settingsScriptHash: Core.ScriptHash;
  readonly settingsValidatorAddress: Core.Address;
  readonly settingsRewardAccount: Core.RewardAccount;
  readonly enableTrace: boolean;

  getSettingsState(): Promise<IProtocolSettingsState>;
  applySettingsWitness(tx: TxBuilder): Promise<void>;
}

export type TGovernancePermissionKey =
  | "logic_change"
  | "permission_change"
  | "config_change"
  | "shutdown"
  | "restore"
  | "migrate";

export interface IParsedProxyDatum {
  logicHash: Core.ScriptHash;
  settingsData: Core.PlutusData;
}

export type TPermissionedScript = MultisigScript;
