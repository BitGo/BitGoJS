import type { Provider } from "@blaze-cardano/query";
import { type Blaze, Core, type Wallet } from "@blaze-cardano/sdk";

import {
  BaseTypes,
  V0_1Types,
  V0_4Types,
  V1_0Types,
} from "../../generated-types/index.js";
import type {
  RegistryV1,
  SettingsV1,
  VaultDatumV1,
} from "../../generated-types/v1_0/index.js";
import type { TV1SettingsConfig } from "../v1/types.js";
import { RealfiSDKV1Family } from "../v1/family.js";

export {
  DIRECT_ACTION_PADDING_ASSET,
  type ITreasuryUnstakeOrderTxResult,
} from "../v1/family.js";

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface IRealfiSDKParamsV1_0 {
  version: "V1_0";
  proxyBootstrap: {
    txHash: Core.TransactionId;
    outputIndex: bigint;
  };
  /** USDr asset name hex */
  assetNameHex: string;
  /** sUSDr asset name hex */
  sUSDrAssetNameHex: string;
  /** The treasury bootstrap UTxO reference */
  treasuryBootstrap: {
    txHash: Core.TransactionId;
    outputIndex: bigint;
  };
  /** The staking vault bootstrap UTxO reference */
  stakingVaultBootstrap: {
    txHash: Core.TransactionId;
    outputIndex: bigint;
  };
  /** Enable trace output in Plutus scripts for debugging. Default: false */
  enableTrace?: boolean;
  /**
   * Fallback slippage tolerance (in basis points) used by buildStakeOrderTx /
   * buildUnstakeOrderTx when the caller doesn't pass a per-call value and
   * doesn't pass an explicit `minReceived`. 50n = 0.5%. Default: 50n.
   */
  defaultSlippageToleranceBps?: bigint;
  /**
   * Use V0.1 treasury script instead of V1.0.
   * This is needed for protocol-only upgrades where the treasury NFT
   * remains at the V0.1 treasury address. Default: false
   */
  useV0_1Treasury?: boolean;
  /**
   * Use V0.4 staking vault script instead of V1.0.
   * This is needed for protocol-only upgrades where the vault NFT
   * remains at the V0.4 vault address. Default: false
   */
  useV0_4StakingVault?: boolean;
  /**
   * Hashes of the validators this deployment actually runs. See
   * IV1FamilyConstructorParams.deployedValidators — without them, identity is
   * derived from bundled artifacts and an order can be locked at an address
   * nothing watches.
   */
  deployedValidators?: Readonly<Record<string, string>>;
  /**
   * Address to deploy reference scripts to (and resolve them from). When
   * omitted, Blaze's burn address is used for both deploy and resolve.
   */
  scriptDeploymentAddress?: Core.Address;
  referenceInputs?: {
    protocolRefInput?: Core.TransactionUnspentOutput;
    proxyRefInput?: Core.TransactionUnspentOutput;
    treasuryRefInput?: Core.TransactionUnspentOutput;
    orderRefInput?: Core.TransactionUnspentOutput;
    stakingVaultRefInput?: Core.TransactionUnspentOutput;
  };
  clientSource?: import("../shared/client-id.js").TClientSource;
}

// ─────────────────────────────────────────────────────────────────────────────
// SDK Class
// ─────────────────────────────────────────────────────────────────────────────

/**
 * V1_0 SDK implementation.
 *
 * Extends V0_4 with:
 * - DirectMint/DirectBurn: Mint/burn USDr without reserve asset flow (for fiat wire scenarios)
 * - Invalidated redeemer: Allow order owners to recover funds when protocol is upgraded
 * - Forfeit parameter: Support yield forfeiture during unstake operations
 * - New Settings fields: direct_mint_permission, direct_burn_permission
 *
 * All transaction-building logic lives in {@link RealfiSDKV1Family}; this
 * class instantiates the V1_0 scripts and implements the version seams
 * (flat settings, 1-field vault datum).
 */
export class RealfiSDKV1_0<
  P extends Provider,
  W extends Wallet,
> extends RealfiSDKV1Family<P, W, SettingsV1, VaultDatumV1> {
  readonly version = "V1_0" as const;

  /**
   * Create a V1_0 SDK instance.
   */
  static create<P extends Provider, W extends Wallet>(
    blaze: Blaze<P, W>,
    params: IRealfiSDKParamsV1_0,
  ): RealfiSDKV1_0<P, W> {
    const enableTrace = params.enableTrace ?? false;

    // 1. Create oneshot script
    const oneShotScript = new BaseTypes.BaseOneshotOneshotMint(
      {
        transaction_id: params.proxyBootstrap.txHash,
        output_index: params.proxyBootstrap.outputIndex,
      },
      enableTrace,
    ).Script;
    const oneShotPolicyId = oneShotScript.hash();

    // 2. Create sub-validator scripts first (they only need proxy policy)
    const protocolMintScript =
      new V1_0Types.V1_0ProtocolMintProtocolMintWithdraw(
        oneShotPolicyId,
        enableTrace,
      ).Script;

    const protocolStakeScript =
      new V1_0Types.V1_0ProtocolStakeProtocolStakeWithdraw(
        oneShotPolicyId,
        enableTrace,
      ).Script;

    const protocolManagementScript =
      new V1_0Types.V1_0ProtocolManagementProtocolManagementWithdraw(
        oneShotPolicyId,
        enableTrace,
      ).Script;

    // 3. Create orchestrator with sub-validator hashes
    const protocolOrchestratorScript =
      new V1_0Types.V1_0ProtocolOrchestratorProtocolOrchestratorWithdraw(
        oneShotPolicyId,
        protocolMintScript.hash(),
        protocolStakeScript.hash(),
        protocolManagementScript.hash(),
        enableTrace,
      ).Script;

    const mintProxyScript = new BaseTypes.BaseMintProxyMintProxyMint(
      oneShotPolicyId,
      enableTrace,
    ).Script;

    // Use V0.1 or V1.0 treasury script based on option
    // V0.1 is needed for protocol-only upgrades where treasury stays at V0.1 address
    const treasuryScript = params.useV0_1Treasury
      ? new V0_1Types.V0_1TreasuryTreasurySpend(
          {
            transaction_id: params.treasuryBootstrap.txHash,
            output_index: params.treasuryBootstrap.outputIndex,
          },
          oneShotPolicyId,
          enableTrace,
        ).Script
      : new V1_0Types.V1_0TreasuryTreasurySpend(
          {
            transaction_id: params.treasuryBootstrap.txHash,
            output_index: params.treasuryBootstrap.outputIndex,
          },
          oneShotPolicyId,
          enableTrace,
        ).Script;

    // 4. Create order script with orchestrator hash (order needs to know the protocol)
    const orderScript = new V1_0Types.V1_0OrderOrderSpend(
      oneShotPolicyId,
      protocolOrchestratorScript.hash(),
      enableTrace,
    ).Script;

    // Use V0.4 or V1.0 staking vault script based on option
    // V0.4 is needed for protocol-only upgrades where vault stays at V0.4 address
    const stakingVaultScript = params.useV0_4StakingVault
      ? new V0_4Types.V0_4StakingVaultStakingVaultSpend(
          {
            transaction_id: params.stakingVaultBootstrap.txHash,
            output_index: params.stakingVaultBootstrap.outputIndex,
          },
          oneShotPolicyId,
          enableTrace,
        ).Script
      : new V1_0Types.V1_0StakingVaultStakingVaultSpend(
          {
            transaction_id: params.stakingVaultBootstrap.txHash,
            output_index: params.stakingVaultBootstrap.outputIndex,
          },
          oneShotPolicyId,
          enableTrace,
        ).Script;

    return new RealfiSDKV1_0(
      blaze,
      {
        version: "V1_0",
        proxyBootstrap: params.proxyBootstrap,
        assetNameHex: params.assetNameHex,
        sUSDrAssetNameHex: params.sUSDrAssetNameHex,
        enableTrace,
        defaultSlippageToleranceBps: params.defaultSlippageToleranceBps,
        scriptDeploymentAddress: params.scriptDeploymentAddress,
        clientSource: params.clientSource,
        deployedValidators: params.deployedValidators,
      },
      V1_0Types,
      {
        oneShotScript,
        protocolOrchestratorScript,
        protocolMintScript,
        protocolStakeScript,
        protocolManagementScript,
        mintProxyScript,
        treasuryScript,
        orderScript,
        stakingVaultScript,
      },
      {
        protocolRefInput: params.referenceInputs?.protocolRefInput,
        proxyRefInput: params.referenceInputs?.proxyRefInput,
        treasuryRefInput: params.referenceInputs?.treasuryRefInput,
        orderRefInput: params.referenceInputs?.orderRefInput,
        stakingVaultRefInput: params.referenceInputs?.stakingVaultRefInput,
      },
      V1_0Types,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Version Seams
  // ─────────────────────────────────────────────────────────────────────────────

  protected settingsConfig(settings: SettingsV1): TV1SettingsConfig {
    // V1_0 settings are flat: the settings object IS the config.
    return settings;
  }

  protected settingsRegistry(settings: SettingsV1): RegistryV1 {
    return settings.registry;
  }

  protected buildInitialVaultDatum(): VaultDatumV1 {
    return { circulating_susdr: 0n };
  }

  protected buildUpdatedVaultDatum(
    previous: VaultDatumV1,
    sUSDrDelta: bigint,
  ): VaultDatumV1 {
    return { circulating_susdr: previous.circulating_susdr + sUSDrDelta };
  }
}
