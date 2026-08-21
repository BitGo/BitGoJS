function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
import { BaseTypes, V0_1Types, V0_4Types, V1_0Types } from "../../generated-types/index.js";
import { RealfiSDKV1Family } from "../v1/family.js";
export { DIRECT_ACTION_PADDING_ASSET } from "../v1/family.js";

// eslint-disable-next-line @typescript-eslint/naming-convention

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
export class RealfiSDKV1_0 extends RealfiSDKV1Family {
  constructor(...args) {
    super(...args);
    _defineProperty(this, "version", "V1_0");
  }
  /**
   * Create a V1_0 SDK instance.
   */
  static create(blaze, params) {
    const enableTrace = params.enableTrace ?? false;

    // 1. Create oneshot script
    const oneShotScript = new BaseTypes.BaseOneshotOneshotMint({
      transaction_id: params.proxyBootstrap.txHash,
      output_index: params.proxyBootstrap.outputIndex
    }, enableTrace).Script;
    const oneShotPolicyId = oneShotScript.hash();

    // 2. Create sub-validator scripts first (they only need proxy policy)
    const protocolMintScript = new V1_0Types.V1_0ProtocolMintProtocolMintWithdraw(oneShotPolicyId, enableTrace).Script;
    const protocolStakeScript = new V1_0Types.V1_0ProtocolStakeProtocolStakeWithdraw(oneShotPolicyId, enableTrace).Script;
    const protocolManagementScript = new V1_0Types.V1_0ProtocolManagementProtocolManagementWithdraw(oneShotPolicyId, enableTrace).Script;

    // 3. Create orchestrator with sub-validator hashes
    const protocolOrchestratorScript = new V1_0Types.V1_0ProtocolOrchestratorProtocolOrchestratorWithdraw(oneShotPolicyId, protocolMintScript.hash(), protocolStakeScript.hash(), protocolManagementScript.hash(), enableTrace).Script;
    const mintProxyScript = new BaseTypes.BaseMintProxyMintProxyMint(oneShotPolicyId, enableTrace).Script;

    // Use V0.1 or V1.0 treasury script based on option
    // V0.1 is needed for protocol-only upgrades where treasury stays at V0.1 address
    const treasuryScript = params.useV0_1Treasury ? new V0_1Types.V0_1TreasuryTreasurySpend({
      transaction_id: params.treasuryBootstrap.txHash,
      output_index: params.treasuryBootstrap.outputIndex
    }, oneShotPolicyId, enableTrace).Script : new V1_0Types.V1_0TreasuryTreasurySpend({
      transaction_id: params.treasuryBootstrap.txHash,
      output_index: params.treasuryBootstrap.outputIndex
    }, oneShotPolicyId, enableTrace).Script;

    // 4. Create order script with orchestrator hash (order needs to know the protocol)
    const orderScript = new V1_0Types.V1_0OrderOrderSpend(oneShotPolicyId, protocolOrchestratorScript.hash(), enableTrace).Script;

    // Use V0.4 or V1.0 staking vault script based on option
    // V0.4 is needed for protocol-only upgrades where vault stays at V0.4 address
    const stakingVaultScript = params.useV0_4StakingVault ? new V0_4Types.V0_4StakingVaultStakingVaultSpend({
      transaction_id: params.stakingVaultBootstrap.txHash,
      output_index: params.stakingVaultBootstrap.outputIndex
    }, oneShotPolicyId, enableTrace).Script : new V1_0Types.V1_0StakingVaultStakingVaultSpend({
      transaction_id: params.stakingVaultBootstrap.txHash,
      output_index: params.stakingVaultBootstrap.outputIndex
    }, oneShotPolicyId, enableTrace).Script;
    return new RealfiSDKV1_0(blaze, {
      version: "V1_0",
      proxyBootstrap: params.proxyBootstrap,
      assetNameHex: params.assetNameHex,
      sUSDrAssetNameHex: params.sUSDrAssetNameHex,
      enableTrace,
      defaultSlippageToleranceBps: params.defaultSlippageToleranceBps,
      scriptDeploymentAddress: params.scriptDeploymentAddress,
      clientSource: params.clientSource,
      deployedValidators: params.deployedValidators
    }, V1_0Types, {
      oneShotScript,
      protocolOrchestratorScript,
      protocolMintScript,
      protocolStakeScript,
      protocolManagementScript,
      mintProxyScript,
      treasuryScript,
      orderScript,
      stakingVaultScript
    }, {
      protocolRefInput: params.referenceInputs?.protocolRefInput,
      proxyRefInput: params.referenceInputs?.proxyRefInput,
      treasuryRefInput: params.referenceInputs?.treasuryRefInput,
      orderRefInput: params.referenceInputs?.orderRefInput,
      stakingVaultRefInput: params.referenceInputs?.stakingVaultRefInput
    }, V1_0Types);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Version Seams
  // ─────────────────────────────────────────────────────────────────────────────

  settingsConfig(settings) {
    // V1_0 settings are flat: the settings object IS the config.
    return settings;
  }
  settingsRegistry(settings) {
    return settings.registry;
  }
  buildInitialVaultDatum() {
    return {
      circulating_susdr: 0n
    };
  }
  buildUpdatedVaultDatum(previous, sUSDrDelta) {
    return {
      circulating_susdr: previous.circulating_susdr + sUSDrDelta
    };
  }
}
//# sourceMappingURL=index.js.map