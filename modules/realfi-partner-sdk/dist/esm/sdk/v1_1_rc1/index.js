function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
import { blake2b_256, HexBlob, PlutusData } from "@blaze-cardano/core";
import * as Data from "@blaze-cardano/data";
import { parse } from "@blaze-cardano/data";
import { Core, makeValue, Value } from "@blaze-cardano/sdk";
import { BaseTypes, V0_1Types, V0_4Types, V1_0Types, V1_1Rc1Types } from "../../generated-types/index.js";
import { buildNonceFromUtxo, credentialFromScript, deployScript, findReserveAsset, getDatumFromNFT, slotAlignedTimeMs, slotFloor, usdrToReserveCeil, YIELD_ORACLE_BOOTSTRAP_PLACEHOLDER } from "../shared/index.js";
import { calculateYieldShares, MIN_LOVELACE, RealfiSDKV1Family } from "../v1/family.js";

/** V1_1-specific knobs threaded from the public params to the constructor. */
// eslint-disable-next-line @typescript-eslint/naming-convention

import { MAX_DIFFUSION_RATE_SPAN_MS, nextDepositDiffusion, pendingRemaining, settledBacking } from "./diffusion.js";

// eslint-disable-next-line @typescript-eslint/naming-convention

const DEFAULT_EXECUTION_VALIDITY_WINDOW_MS = 1_800_000n; // 30 minutes

/**
 * How far in the past to open a vault-touching execution's validity interval
 * when using the default wall clock.
 *
 * The validator requires the vault's `diffusion_start` to equal the validity
 * lower bound. Backing off both values absorbs submitter clock skew without
 * shortening duration-based order windows or the forward execution window.
 * Injected clocks are used verbatim for deterministic emulator tests.
 */
const DEFAULT_CLOCK_BACKOFF_MS = 120_000n; // 2 minutes

// ─────────────────────────────────────────────────────────────────────────────
// SDK Class
// ─────────────────────────────────────────────────────────────────────────────

/**
 * V1_1_Rc1 SDK implementation.
 *
 * The release candidate keeps V1_0's order/redeemer taxonomy (fees,
 * `min_received`, `ExchangeRequestV1`/`TreasuryRequestV1`/`StakeRequestV1`) and
 * adds **time-diffused yield**: the staking vault datum grows to four fields
 * (`circulating_susdr`, `pending_yield`, `diffusion_start`, `diffusion_end`)
 * and deposited staked yield releases into the exchange rate linearly over a
 * window rather than instantly.
 *
 * Because the redeemer shape is V1_0 plus an additive `diffusion_end`, this
 * class reuses {@link RealfiSDKV1Family}'s V1_0-semantics tx-builders wholesale
 * and overrides only the diffusion seams:
 * - the four-field vault datum ({@link buildInitialVaultDatum} /
 *   {@link buildUpdatedVaultDatum}) and nested settings adapters;
 * - {@link settledVaultBacking}: quote stake/unstake rates against settled
 *   backing (balance minus not-yet-diffused pending yield);
 * - {@link buildTreasuryRequest}: echo the order datum's `diffusion_end` into
 *   the signed payload;
 * - {@link updateDepositVaultOutput}: roll the staked share into the diffusion
 *   window on deposit;
 * - {@link buildDepositOrderTx}: expose the `diffusion_end` order parameter;
 * - {@link applyExecutionValidityBounds}: attach the validity range the
 *   diffusion rate time is read from.
 */
export class RealfiSDKV1_1Rc1 extends RealfiSDKV1Family {
  static create(blaze, params) {
    const enableTrace = params.enableTrace ?? false;

    // 1. Create oneshot script
    const oneShotScript = new BaseTypes.BaseOneshotOneshotMint({
      transaction_id: params.proxyBootstrap.txHash,
      output_index: params.proxyBootstrap.outputIndex
    }, enableTrace).Script;
    const oneShotPolicyId = oneShotScript.hash();

    // 2. Create sub-validator scripts first (they only need proxy policy)
    const protocolMintScript = new V1_1Rc1Types.V1_1Rc1ProtocolMintProtocolMintWithdraw(oneShotPolicyId, enableTrace).Script;
    const protocolStakeScript = new V1_1Rc1Types.V1_1Rc1ProtocolStakeProtocolStakeWithdraw(oneShotPolicyId, enableTrace).Script;
    const protocolManagementScript = new V1_1Rc1Types.V1_1Rc1ProtocolManagementProtocolManagementWithdraw(oneShotPolicyId, enableTrace).Script;

    // 3. Derive the two oracle validators. They are DISTINCT scripts with
    // distinct roles and hashes (the shared "yield_oracle" naming is a contract
    // quirk):
    //   - `yield_oracle` is a mint+spend validator: its single hash is both the
    //     oracle-NFT policy id AND the address holding the long-lived oracle
    //     UTxO. This is the orchestrator's `yield_oracle_validator` compile-time
    //     param — ExecuteOrders' `no_script_input` guard protects that UTxO from
    //     being drained by a normal execution.
    //   - `distribution_oracle` is the withdraw-only publish-logic validator.
    //     Its hash is what `registry.yield_oracle` must hold (PublishYieldOracle
    //     requires THIS validator's withdrawal).
    // Seeded by its OWN dedicated bootstrap UTxO (NOT proxyBootstrap, which the
    // proxy NFT mint consumes) so the oracle one-shot stays satisfiable when the
    // publish flow later bootstraps the oracle NFT. Only the hashes are needed
    // here (the publish path / NFT mint is a follow-up).
    // A deferred oracle omits the seed → default to the placeholder (a
    // permanently un-consumable reference). A deployment that runs the oracle
    // supplies a real seed. Either way the orchestrator hash is deterministic.
    const yieldOracleBootstrap = params.yieldOracleBootstrap ?? YIELD_ORACLE_BOOTSTRAP_PLACEHOLDER;
    const yieldOracleScript = new V1_1Rc1Types.V1_1Rc1YieldOracleYieldOracleMint({
      transaction_id: yieldOracleBootstrap.txHash,
      output_index: yieldOracleBootstrap.outputIndex
    }, oneShotPolicyId, enableTrace).Script;
    const yieldOracleValidatorHash = yieldOracleScript.hash();
    // The oracle NFT is minted under the yield_oracle validator's own policy, so
    // the NFT policy id equals that validator's hash.
    const oracleNftPolicyId = yieldOracleValidatorHash;
    const distributionOracleScript = new V1_1Rc1Types.V1_1Rc1DistributionOracleDistributionOracleWithdraw(oneShotPolicyId, oracleNftPolicyId, enableTrace).Script;
    const distributionOracleScriptHash = distributionOracleScript.hash();

    // The v1_0→v1_1 migration validator. Withdraw-only and registry-gated (not
    // an orchestrator compile param): whitelisted at runtime via
    // `registry.migration`. Only the proxy policy id parametrizes it.
    const migrationScript = new V1_1Rc1Types.V1_1Rc1ProtocolMigrationV1_0ToV1_1ProtocolMigrationV1_0ToV1_1Withdraw(oneShotPolicyId, enableTrace).Script;

    // 4. Create orchestrator with sub-validator hashes + the yield_oracle
    // validator hash (the validator that HOLDS the oracle UTxO — NOT
    // distribution_oracle).
    const protocolOrchestratorScript = new V1_1Rc1Types.V1_1Rc1ProtocolOrchestratorProtocolOrchestratorWithdraw(oneShotPolicyId, protocolMintScript.hash(), protocolStakeScript.hash(), protocolManagementScript.hash(), yieldOracleValidatorHash, enableTrace).Script;
    const mintProxyScript = new BaseTypes.BaseMintProxyMintProxyMint(oneShotPolicyId, enableTrace).Script;

    // Use V0.1 or V1.1 treasury script based on option
    const treasuryScript = params.useV0_1Treasury ? new V0_1Types.V0_1TreasuryTreasurySpend({
      transaction_id: params.treasuryBootstrap.txHash,
      output_index: params.treasuryBootstrap.outputIndex
    }, oneShotPolicyId, enableTrace).Script : new V1_1Rc1Types.V1_1Rc1TreasuryTreasurySpend({
      transaction_id: params.treasuryBootstrap.txHash,
      output_index: params.treasuryBootstrap.outputIndex
    }, oneShotPolicyId, enableTrace).Script;

    // 4. Create order script with orchestrator hash
    const orderScript = new V1_1Rc1Types.V1_1Rc1OrderOrderSpend(oneShotPolicyId, protocolOrchestratorScript.hash(), enableTrace).Script;

    // Use V0.4 or V1.1 staking vault script based on option
    const stakingVaultScript = params.useV0_4StakingVault ? new V0_4Types.V0_4StakingVaultStakingVaultSpend({
      transaction_id: params.stakingVaultBootstrap.txHash,
      output_index: params.stakingVaultBootstrap.outputIndex
    }, oneShotPolicyId, enableTrace).Script : new V1_1Rc1Types.V1_1Rc1StakingVaultStakingVaultSpend({
      transaction_id: params.stakingVaultBootstrap.txHash,
      output_index: params.stakingVaultBootstrap.outputIndex
    }, oneShotPolicyId, enableTrace).Script;
    return new RealfiSDKV1_1Rc1(blaze, {
      version: "V1_1_Rc1",
      proxyBootstrap: params.proxyBootstrap,
      assetNameHex: params.assetNameHex,
      sUSDrAssetNameHex: params.sUSDrAssetNameHex,
      enableTrace,
      defaultSlippageToleranceBps: params.defaultSlippageToleranceBps,
      scriptDeploymentAddress: params.scriptDeploymentAddress,
      deployedValidators: params.deployedValidators
    }, V1_1Rc1Types, {
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
    },
    // The v1_1 signed-payload / signed-redeemer schemas are the V1_0-shaped
    // payload plus TreasuryRequestV1.diffusion_end (additive), so they map
    // onto the family's stable signing-schema keys. blaze mangles the
    // orchestrator generics with a `_v1_1_` infix (see the codegen note in
    // project_v1_1_rc1_vs_audited_v1_1_divergence); remap them here.
    {
      SignedPayload_ProtocolRedeemerV1: V1_1Rc1Types.SignedPayload_v1_1_ProtocolRedeemerV1,
      SignedRedeemer_ExtraProtocolRedeemerV1: V1_1Rc1Types.SignedRedeemer_v1_1_ExtraProtocolRedeemerV1
    }, {
      now: params.now,
      defaultDiffusionDurationMs: params.defaultDiffusionDurationMs,
      executionValidityWindowMs: params.executionValidityWindowMs,
      diffusionShortfallThresholdMs: params.diffusionShortfallThresholdMs,
      throwOnDiffusionWindowShortfall: params.throwOnDiffusionWindowShortfall,
      distributionOracleScriptHash,
      migrationScript
    });
  }
  constructor(blaze, params, schemas, scripts, cachedReferenceInputs, signingSchemas, options) {
    super(blaze, params, schemas, scripts, cachedReferenceInputs, signingSchemas);
    _defineProperty(this, "version", "V1_1_Rc1");
    _defineProperty(this, "nowFn", void 0);
    _defineProperty(this, "defaultDiffusionDurationMs", void 0);
    _defineProperty(this, "executionValidityWindowMs", void 0);
    _defineProperty(this, "executionClockBackoffMs", void 0);
    _defineProperty(this, "diffusionShortfallThresholdMs", void 0);
    _defineProperty(this, "throwOnDiffusionWindowShortfall", void 0);
    /**
     * The `distribution_oracle` (publish-logic) validator hash. Exposed so
     * settings datums can point `registry.yield_oracle` at it — that is the
     * withdrawal the orchestrator's PublishYieldOracle path requires. NOTE: this
     * is NOT the orchestrator's 5th compile-time parameter; that parameter is the
     * `yield_oracle` validator hash (the mint+spend validator that holds the
     * oracle UTxO), which is a different validator with a different hash.
     */
    _defineProperty(this, "distributionOracleScriptHash", void 0);
    /**
     * The `protocol_migration_v1_0_to_v1_1` withdraw validator and its hash.
     * The validator is registry-gated (whitelisted via `registry.migration`), NOT
     * an orchestrator compile-time parameter, so it lives version-locally on this
     * class. Deploy it (`deployMigration`) + register its stake
     * (`registerMigrationStake`), then run `buildMigrateStateTx` to migrate a
     * v1_0 one-field vault datum to the four-field v1_1 shape in place.
     */
    _defineProperty(this, "migrationScript", void 0);
    _defineProperty(this, "migrationScriptHash", void 0);
    /**
     * Slot-aligned execution bounds for the in-flight `buildExecuteOrdersTx`.
     * `executionNowMs` is the backed-off lower bound used by the diffusion datum
     * and rate quote; `executionValidUntilMs` is based on the unshifted wall time.
     * Both are undefined outside an execution build.
     */
    _defineProperty(this, "executionNowMs", void 0);
    _defineProperty(this, "executionValidUntilMs", void 0);
    this.nowFn = options.now ?? (() => BigInt(Date.now()));
    this.executionClockBackoffMs = options.now === undefined ? DEFAULT_CLOCK_BACKOFF_MS : 0n;
    this.defaultDiffusionDurationMs = options.defaultDiffusionDurationMs;
    this.diffusionShortfallThresholdMs = options.diffusionShortfallThresholdMs ?? 0n;
    // A negative threshold would silently suppress detection of a window that
    // HAS lapsed (remaining is negative by then), defeating the whole guard —
    // and, with throwOnDiffusionWindowShortfall set, defeating it silently.
    if (this.diffusionShortfallThresholdMs < 0n) {
      throw new RangeError(`diffusionShortfallThresholdMs must be non-negative, got ${this.diffusionShortfallThresholdMs} ms.`);
    }
    this.throwOnDiffusionWindowShortfall = options.throwOnDiffusionWindowShortfall ?? false;
    this.executionValidityWindowMs = options.executionValidityWindowMs ?? DEFAULT_EXECUTION_VALIDITY_WINDOW_MS;
    const validitySpanMs = this.executionClockBackoffMs + this.executionValidityWindowMs;
    if (this.executionValidityWindowMs < 0n || validitySpanMs > MAX_DIFFUSION_RATE_SPAN_MS) {
      throw new RangeError(`Execution validity span must be at most 1 hour (${MAX_DIFFUSION_RATE_SPAN_MS} ms), got ${validitySpanMs} ms.`);
    }
    this.distributionOracleScriptHash = options.distributionOracleScriptHash;
    this.migrationScript = options.migrationScript;
    this.migrationScriptHash = options.migrationScript.hash();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Version Seams
  // ─────────────────────────────────────────────────────────────────────────────

  settingsConfig(settings) {
    // V1_1 settings are nested: the reserve/pot config lives under `config`.
    return settings.config;
  }
  settingsRegistry(settings) {
    return settings.registry;
  }
  buildInitialVaultDatum() {
    return {
      circulating_susdr: 0n,
      pending_yield: 0n,
      diffusion_start: 0n,
      diffusion_end: 0n
    };
  }
  buildUpdatedVaultDatum(previous, sUSDrDelta) {
    // Stake / unstake move only circulating_susdr; the diffusion window passes
    // through untouched (stake.ak / unstake.ak enforce this). Deposit builds
    // its datum via updateDepositVaultOutput, not this seam.
    return {
      circulating_susdr: previous.circulating_susdr + sUSDrDelta,
      pending_yield: previous.pending_yield,
      diffusion_start: previous.diffusion_start,
      diffusion_end: previous.diffusion_end
    };
  }
  settledVaultBacking(parsedVaultDatum, vaultUSDr) {
    return settledBacking(vaultUSDr, parsedVaultDatum, this.rateTimeMs());
  }
  buildTreasuryRequest(datum, parsed, origin) {
    // The signed request must echo the order datum's diffusion_end
    // (utilities.ak enforces request.diffusion_end == order.diffusion_end).
    const action = datum.action;
    const diffusionEnd = "ODeposit" in action ? action.ODeposit.diffusion_end : 0n;
    return {
      destination: datum.destination,
      amount: parsed.amount,
      yield: parsed.yield ?? 0n,
      diffusion_end: diffusionEnd,
      origin,
      reserve_asset: parsed.reserveAsset
    };
  }
  get splitsYield() {
    return true;
  }

  /**
   * The yield split a deposit batch's creator should pick:
   * vault_usdr / treasury_circulating, i.e. the share of the circulating supply
   * that is staked. Pinning it to that ratio makes the SIGNED split reproduce
   * exactly the integer staked share the executor writes to the vault —
   * deposit.ak recomputes staked_yield_share = total_yield * numerator /
   * denominator with the same truncation-toward-zero, and the same two values
   * feed the execute path's calculateYieldShares.
   *
   * Only the creator of a batch calls this. A co-signer must NOT: it reads live
   * state, and two signers reading it at different chain states would produce
   * different payload bytes, which cannot be co-signed (the orchestrator checks
   * every signature against one payload hash). Co-signers read the batch's alpha
   * back from the backend and pass it to getSignedPayloadFromOrderInputs.
   */
  async computeDepositAlpha() {
    const stablecoinAssetId = Core.AssetId(this.stablecoinPolicyId + this.assetNameHex);
    const {
      vaultUtxo
    } = await this.getVaultDatum();
    const vaultUSDr = vaultUtxo.output().amount().multiasset()?.get(stablecoinAssetId) ?? 0n;
    const {
      parsedTreasuryDatum
    } = await this.getTreasuryDatum();
    const treasuryCirculating = parsedTreasuryDatum.circulating_supply;
    return treasuryCirculating > 0n ? {
      numerator: vaultUSDr,
      denominator: treasuryCirculating
    } : {
      numerator: 0n,
      denominator: 1n
    };
  }
  async buildDepositAction(requests, alpha) {
    // No fallback to live state: that is what made two signings of one batch
    // disagree. The batch's alpha has to be handed in — its creator computes it
    // once (computeDepositAlpha), everyone else reads it back from the backend.
    if (!alpha) {
      throw new Error("v1_1_rc1: a deposit batch needs its yield-split alpha — pass the batch's stored alpha (created with computeDepositAlpha)");
    }
    if (alpha.denominator <= 0n) {
      throw new Error(`v1_1_rc1: yield-split alpha denominator must be positive, got ${alpha.denominator}`);
    }
    if (alpha.numerator < 0n || alpha.numerator > alpha.denominator) {
      throw new Error(`v1_1_rc1: yield-split alpha must be within [0, 1], got ${alpha.numerator}/${alpha.denominator}`);
    }
    // The family action type is v1_0-shaped (Deposit has no `alpha`); the rc1
    // signing schema serializes `alpha` via its $defs (see IV1SigningSchemas).
    return {
      Deposit: {
        requests,
        alpha
      }
    };
  }

  /**
   * rc1's Deposit carries a COSE-signed `alpha`; `deposit.ak` splits total_yield
   * against that signed ratio (quotient_integer), NOT live vault/treasury state.
   * Echo the signed alpha here so the executor's vault/pot outputs (and the
   * pot-output indexing) match what the validator checks — re-reading state
   * would diverge if the vault or treasury moved between signing and execution.
   */
  resolveDepositYieldShares(totalYield, vaultUSDr, treasuryCirculating, action) {
    const deposit = action.Deposit;
    if (!deposit) {
      // Defensive: a non-Deposit action routed here → live-state split.
      return super.resolveDepositYieldShares(totalYield, vaultUSDr, treasuryCirculating, action);
    }
    const {
      numerator,
      denominator
    } = deposit.alpha;
    // BigInt division truncates toward zero, matching Aiken quotient_integer.
    const stakedYieldShare = denominator > 0n ? totalYield * numerator / denominator : 0n;
    return {
      stakedYieldShare,
      unstakedYieldShare: totalYield - stakedYieldShare
    };
  }
  serializeOrchestratorWithdrawalRedeemer(redeemer) {
    // v1_1_rc1's orchestrator dispatch wraps order execution in
    // ExecuteOrders(...) (the sibling PublishYieldOracle path is a follow-up
    // PR). Nest the family's signed redeemer inside the wrapper. The redeemer is
    // v1_0-typed at the family layer (Deposit carries `alpha` only at runtime,
    // injected by buildDepositAction); cast to the wrapper's static.
    return Data.serialize(V1_1Rc1Types.ProtocolOrchestratorRedeemerV1, {
      ExecuteOrders: [redeemer]
    });
  }
  updateDepositVaultOutput(tx, vaultUtxo, parsedVaultDatum, ctx) {
    // Vault window end = max diffusion_end across the batch's deposit orders
    // (max_end in deposit.ak). Read from each order datum's ODeposit action.
    let windowEndMs = 0n;
    for (const orderInfo of ctx.orderInfos) {
      const action = orderInfo.datum.action;
      if ("ODeposit" in action && action.ODeposit.diffusion_end > windowEndMs) {
        windowEndMs = action.ODeposit.diffusion_end;
      }
    }

    // One timestamp for both the shortfall check and the datum, so the warning
    // can never describe a different execution time than the one written.
    const nowMs = this.rateTimeMs();
    this.checkDiffusionWindow(parsedVaultDatum, ctx, windowEndMs, nowMs);
    const window = nextDepositDiffusion(parsedVaultDatum, ctx.stakedYieldShare, ctx.totalYield, windowEndMs, nowMs);
    this.updateVaultOutputWithDatum(tx, vaultUtxo, {
      circulating_susdr: parsedVaultDatum.circulating_susdr,
      ...window
    }, ctx.stakedYieldShare);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Deposit order builder (adds the diffusion_end datum field)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Build a deposit order. Identical to the family default except the ODeposit
   * datum carries `diffusion_end` — the absolute POSIX-ms timestamp the staked
   * yield diffuses until, set at ORDER CREATION and echoed by the executed
   * request. Resolution: explicit `diffusionEnd` > `diffusionDurationMs` added to
   * the order-creation time > the SDK's `defaultDiffusionDurationMs` added to the
   * order-creation time > `0n` (instant).
   *
   * NB: because the window is absolute and fixed here, any delay before the
   * execute lands (batching, cold/multisig signature collection) shortens the
   * effective window; a window that fully elapses before execution collapses the
   * deposit to instant on-chain.
   */
  async buildDepositOrderTx(params) {
    if (params.principal < 0n) {
      throw new Error("Deposit principal must be non-negative");
    }
    if (params.principal === 0n && params.yield === 0n) {
      throw new Error("Deposit must have non-zero principal or yield");
    }
    const settings = this.settingsConfig(await this.getVersionSettings());
    const ra = findReserveAsset(settings, params.reserveAsset);
    const reserveAssetId = Core.AssetId(params.reserveAsset[0] + params.reserveAsset[1]);
    let valueToLock;
    if (params.yield >= 0n) {
      // Positive yield: lock reserve backing for BOTH principal AND yield.
      const totalUSDrBacking = params.principal + params.yield;
      valueToLock = totalUSDrBacking > 0n ? makeValue(MIN_LOVELACE, [reserveAssetId, usdrToReserveCeil(totalUSDrBacking, ra)]) : makeValue(MIN_LOVELACE);
    } else {
      // Negative yield: lock principal (reserve) + unstaked yield share (USDr).
      const principalReserve = params.principal > 0n ? usdrToReserveCeil(params.principal, ra) : 0n;
      valueToLock = principalReserve > 0n ? makeValue(MIN_LOVELACE, [reserveAssetId, principalReserve]) : makeValue(MIN_LOVELACE);
      const stablecoinAssetId = Core.AssetId(this.stablecoinPolicyId + this.assetNameHex);
      const {
        parsedTreasuryDatum
      } = await this.getTreasuryDatum();
      const vaultUtxo = (await this.getVaultDatum()).vaultUtxo;
      const vaultUSDr = vaultUtxo.output().amount().multiasset()?.get(stablecoinAssetId) ?? 0n;
      const {
        unstakedYieldShare
      } = calculateYieldShares(params.yield, vaultUSDr, parsedTreasuryDatum.circulating_supply);
      if (unstakedYieldShare < 0n) {
        valueToLock = Value.merge(valueToLock, makeValue(0n, [stablecoinAssetId, -unstakedYieldShare]));
      }
    }

    // Typed as the v1_1 action (carries diffusion_end); assignable to the
    // family's v1_0 action param since the extra field is additive.
    const action = {
      ODeposit: {
        principal: params.principal,
        yield: params.yield,
        diffusion_end: this.resolveDiffusionEnd(params),
        reserve_asset: params.reserveAsset
      }
    };
    return this._buildOrderTx({
      action,
      valueToLock,
      owner: params.owner,
      destination: params.destination,
      data: params.data
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Execution validity / diffusion rate time
  // ─────────────────────────────────────────────────────────────────────────────

  async buildExecuteOrdersTx(params) {
    // Pin both execution bounds once and align them to integer slots. The
    // backed-off lower bound drives diffusion_start and rate math; the upper
    // bound stays relative to unshifted wall time so skew protection does not
    // shorten the configured forward window.
    const provider = this.blaze.provider;
    const wallNowMs = slotAlignedTimeMs(provider, this.nowFn());
    this.executionNowMs = slotAlignedTimeMs(provider, wallNowMs - this.executionClockBackoffMs);
    this.executionValidUntilMs = slotAlignedTimeMs(provider, wallNowMs + this.executionValidityWindowMs);
    try {
      return await super.buildExecuteOrdersTx(params);
    } finally {
      this.executionNowMs = undefined;
      this.executionValidUntilMs = undefined;
    }
  }
  async applyExecutionValidityBounds(tx, context) {
    const nowMs = this.executionNowMs;
    const validUntilMs = this.executionValidUntilMs;
    if (nowMs === undefined || validUntilMs === undefined) {
      return;
    }
    const {
      actionType,
      parsedVaultDatum
    } = context;

    // Deposit always reads the diffusion rate time once a window is requested
    // or already active; setting bounds unconditionally on deposit is safe
    // (the validator only caps the span when it reads it). Stake/unstake need
    // bounds only when a diffusion window is active.
    const needsBounds = actionType === "deposit" || (actionType === "stake" || actionType === "unstake") && (parsedVaultDatum?.pending_yield ?? 0n) > 0n;
    if (!needsBounds) {
      return;
    }

    // Both bounds are already slot-aligned times, but go through `slotFloor`
    // anyway: it is the only conversion allowed to reach the tx builder, and it
    // guarantees an integer slot (the CBOR writer would silently truncate a
    // fractional one, putting a different value on-chain than the datum's).
    tx.setValidFrom(slotFloor(this.blaze.provider, nowMs));
    tx.setValidUntil(slotFloor(this.blaze.provider, validUntilMs));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * The diffusion rate timestamp (POSIX ms): the pinned execution time during
   * an execution build, else the current wall-clock time (used by order-build
   * min-received estimation, where an exact rate time is not yet knowable).
   */
  rateTimeMs() {
    return this.executionNowMs ?? this.nowFn();
  }
  resolveDiffusionEnd(params) {
    if (params.diffusionEnd !== undefined) {
      return params.diffusionEnd;
    }
    const duration = params.diffusionDurationMs ?? this.defaultDiffusionDurationMs;
    return duration !== undefined ? this.nowFn() + duration : 0n;
  }

  /**
   * Surface a diffusion-window shortfall on a deposit execution.
   *
   * `diffusion_end` is absolute and fixed at ORDER CREATION, so waiting to
   * execute (batching, cold/multisig signing) eats the window. Once it is gone,
   * `validate_deposit_diffusion` (utilities.ak:1117) zeroes the window and the
   * deposit settles instantly — a VALID on-chain outcome, so the tx succeeds and
   * nothing else in the stack complains. This is the only place that sees it:
   * the operator would otherwise have to read the resulting vault datum.
   *
   * Advisory by default; {@link IRealfiSDKParamsV1_1Rc1.throwOnDiffusionWindowShortfall}
   * turns it into a refusal.
   */
  checkDiffusionWindow(vaultIn, ctx, windowEndMs, nowMs) {
    // A loss freezes the window rather than collapsing it (utilities.ak:1143).
    if (ctx.totalYield < 0n) {
      return;
    }
    // What the vault still owes the exchange rate — NOT `pending_yield`, which
    // keeps its original value in the datum until a tx rewrites it and so stays
    // positive long after the window has run its course. Only an unfinished
    // window has anything left to lose.
    const pendingLeftUsdr = pendingRemaining(vaultIn, nowMs);
    // No window requested and nothing left owed: the validator zeroes the datum
    // as its benign no-op case (utilities.ak:1128) — either a plain instant
    // deposit, or bookkeeping cleanup after a window ran to completion.
    if (windowEndMs <= 0n && pendingLeftUsdr <= 0n) {
      return;
    }
    // Nothing to diffuse: no staked share arriving and nothing still owed.
    if (ctx.stakedYieldShare <= 0n && pendingLeftUsdr <= 0n) {
      return;
    }
    const remainingMs = windowEndMs - nowMs;
    let message;
    if (windowEndMs > 0n) {
      if (remainingMs > this.diffusionShortfallThresholdMs) {
        return;
      }
      // Distinct outcomes: a lapsed window collapses to instant, while a
      // near-lapsed one still opens and diffuses over what is left.
      if (remainingMs <= 0n) {
        message = `deposit diffusion window lapsed ${-remainingMs}ms before execution ` + `(diffusion_end=${windowEndMs}, execution time=${nowMs}); the staked ` + `yield settles INSTANTLY instead of diffusing. Re-create the order ` + `with a longer window to diffuse it.`;
      } else {
        message = `deposit diffusion window has only ${remainingMs}ms left at ` + `execution (diffusion_end=${windowEndMs}); the staked yield diffuses ` + `over that remainder.`;
      }
    } else {
      // No window requested while one is unfinished: the validator clears the
      // active window instead of carrying it (utilities.ak:1128-1136).
      message = `deposit requests no diffusion window while ${pendingLeftUsdr} USDr has ` + `not yet diffused (of ${vaultIn.pending_yield} pending, at execution ` + `time ${nowMs}); the active window is CLEARED and that remainder ` + `settles instantly.`;
    }
    const text = `[realfi-sdk] ${message}`;
    if (this.throwOnDiffusionWindowShortfall) {
      throw new Error(text);
    }
    console.warn(text);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // In-place v1_0 → v1_1_rc1 upgrade: vault-datum migration (MigrateState)
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Deploy the migration validator as a reference script. Required before its
   * withdrawal can be attached in {@link buildMigrateStateTx}.
   */
  async deployMigration() {
    return deployScript(this.blaze, this.migrationScript, this.scriptDeploymentAddress);
  }

  /**
   * Register the migration validator's stake credential. Its withdrawal cannot
   * be exercised until the stake credential is registered.
   */
  registerMigrationStake() {
    return this.blaze.newTransaction().addRegisterStake(credentialFromScript(this.migrationScript));
  }

  /**
   * Read the staking-vault UTxO holding a legacy v1_0 (one-field) datum. The
   * inherited {@link getVaultDatum} parses the four-field v1_1 schema and THROWS
   * on a pre-migration vault, so the migration path reads the input with the
   * v1_0 single-field schema (`circulating_susdr` only).
   */
  async readLegacyVaultDatum() {
    const {
      utxo,
      parsedDatum
    } = await getDatumFromNFT(this.blaze, this.stakingVaultNFTAssetId, V1_0Types.VaultDatumV1);
    const legacy = parsedDatum;
    return {
      vaultUtxo: utxo,
      circulatingSusdr: legacy.circulating_susdr
    };
  }

  /**
   * Build the COSE payload for a `MigrateState` action. Unlike the order path
   * (whose nonce derives from the sorted order inputs), migration spends the
   * vault UTxO, so the nonce is anchored to the vault input. Returns the CBOR
   * payload (for {@link buildMigrateStateTx}) and its blake2b-256 hash (for
   * CIP-30 signing by the `permissions.migrate` signer(s)).
   */
  async getMigrateStatePayload() {
    const {
      vaultUtxo
    } = await this.readLegacyVaultDatum();
    const nonce = buildNonceFromUtxo(vaultUtxo.input());
    // The family signing-schema key is v1_0-typed at compile time (its action
    // union predates MigrateState), but the runtime schema is the v1_1 one whose
    // ProtocolRedeemerV1 includes the MigrateState literal (ctor 8). Cast the
    // payload to the family payload type the serializer expects.
    const payload = {
      action: "MigrateState",
      nonce
    };
    const serialized = Data.serialize(this.signing.SignedPayload_ProtocolRedeemerV1, payload);
    const signedPayload = serialized.toCbor().toString();
    const payloadHash = blake2b_256(HexBlob(signedPayload));
    return {
      signedPayload,
      payloadHash
    };
  }

  /**
   * Build the in-place vault-datum migration transaction (`MigrateState`). Spends
   * the staking-vault UTxO (still holding the v1_0 one-field datum) and re-locks
   * it at the SAME address and value with the four-field v1_1 datum
   * (`circulating_susdr` preserved, diffusion window zeroed). Operator-only — not
   * on the partner surface, like {@link buildExecuteOrdersTx}.
   *
   * Requires (per `protocol_migration_v1_0_to_v1_1.ak` + the orchestrator's
   * MigrateState branch): the migration validator deployed + stake-registered,
   * `registry.migration = Some(migrationScriptHash)` in the live settings, and
   * `signatures` = the `permissions.migrate` COSE signatures over the payload
   * hash from {@link getMigrateStatePayload}.
   */
  async buildMigrateStateTx(params) {
    const signedPayload = parse(this.signing.SignedPayload_ProtocolRedeemerV1, PlutusData.fromCbor(HexBlob(params.signedPayload)));
    const {
      vaultUtxo,
      circulatingSusdr
    } = await this.readLegacyVaultDatum();

    // Reference inputs: orchestrator + staking-vault + migration scripts, plus
    // the proxy datum (read as a reference input, never spent).
    const refInputs = await this.getScriptReferenceInputs({
      protocol: this.protocolScriptHash,
      stakingVault: this.stakingVaultScriptHash,
      migration: this.migrationScriptHash
    });
    const {
      proxyUtxo
    } = await this.getParsedProxyDatum();

    // Fee inputs: wallet UTxOs minus the vault (a script input), the proxy, and
    // every reference input (regular and reference inputs must be disjoint).
    const walletUtxos = await this.blaze.wallet.getUnspentOutputs();
    const utxoKey = inp => `${inp.transactionId().toString()}#${inp.index().toString()}`;
    const excluded = new Set([utxoKey(vaultUtxo.input()), utxoKey(proxyUtxo.input())]);
    for (const ref of Object.values(refInputs)) {
      if (ref) {
        excluded.add(utxoKey(ref.input()));
      }
    }
    const feeUtxos = walletUtxos.filter(u => !excluded.has(utxoKey(u.input())));

    // Vault input index in the ledger-sorted input set (txHash, then index).
    const sortedInputRefs = [vaultUtxo.input(), ...feeUtxos.map(u => u.input())].sort((a, b) => {
      const txA = a.transactionId().toString();
      const txB = b.transactionId().toString();
      if (txA < txB) return -1;
      if (txA > txB) return 1;
      return Number(a.index()) - Number(b.index());
    });
    const vaultInputIdx = BigInt(sortedInputRefs.findIndex(r => r.transactionId().toString() === vaultUtxo.input().transactionId().toString() && r.index() === vaultUtxo.input().index()));

    // Migrated datum: preserve circulating_susdr, zero the diffusion window (no
    // pending yield at migration time). The vault output is the first output the
    // builder adds, so its index is 0 (change outputs are appended after).
    const migratedDatum = {
      circulating_susdr: circulatingSusdr,
      pending_yield: 0n,
      diffusion_start: 0n,
      diffusion_end: 0n
    };

    // No order requests travel in a migration; the request/treasury indices are
    // dummies (the migration branch reads only the vault indices).
    const extra = {
      request_to_outputs: [],
      input_to_requests: [],
      treasury_input_idx: 0n,
      treasury_output_idx: 0n,
      vault_input_idx: vaultInputIdx,
      vault_output_idx: 0n
    };
    const orchestratorRedeemer = this.serializeOrchestratorWithdrawalRedeemer({
      extra,
      payload: signedPayload,
      signatures: params.signatures
    });
    const tx = this.newOrderTransaction();

    // Spend the vault with DeferToProtocol (Void); the vault script resolves
    // from the staking-vault reference input.
    tx.addInput(vaultUtxo, Data.Void());
    for (const feeUtxo of feeUtxos) {
      tx.addInput(feeUtxo);
    }
    tx.addReferenceInput(refInputs.protocol);
    tx.addReferenceInput(refInputs.stakingVault);
    tx.addReferenceInput(refInputs.migration);
    tx.addReferenceInput(proxyUtxo);

    // Re-lock exactly one vault output at the SAME address (payment + stake) and
    // the SAME value, no reference script, carrying the four-field datum.
    tx.lockAssets(vaultUtxo.output().address(), vaultUtxo.output().amount(), Data.serialize(this.schemas.VaultDatumV1, migratedDatum));

    // Orchestrator withdrawal carries the ExecuteOrders(MigrateState) redeemer
    // plus the permissions.migrate COSE signatures.
    tx.addWithdrawal(Core.RewardAccount.fromCredential({
      type: Core.CredentialType.ScriptHash,
      hash: this.protocolScriptHash
    }, this.network), 0n, orchestratorRedeemer);
    // Migration validator withdrawal (Void); enforces the migration tx shape.
    tx.addWithdrawal(Core.RewardAccount.fromCredential({
      type: Core.CredentialType.ScriptHash,
      hash: this.migrationScriptHash
    }, this.network), 0n, Data.Void());
    return tx;
  }
}

/** Re-exported for parity with the sibling version modules. */
export { MAX_DIFFUSION_RATE_SPAN_MS };
//# sourceMappingURL=index.js.map