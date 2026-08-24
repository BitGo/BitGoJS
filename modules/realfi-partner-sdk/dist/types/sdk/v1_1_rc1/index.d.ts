import { PlutusData } from "@blaze-cardano/core";
import type { Provider } from "@blaze-cardano/query";
import { type Blaze, Core, type TxBuilder, type Wallet } from "@blaze-cardano/sdk";
import type { Destination, MultisigScript, SettingsV1, TreasuryRequestV1, Tuple_VerificationKey_COSESign1, VaultDatumV1 } from "../../generated-types/v1_1_rc1/index.js";
import { type ICachedReferenceInputs } from "../shared/index.js";
import { RealfiSDKV1Family, type IClassifiedOrderAction, type IExecutionValidityContext, type IOrderInfo, type IRequestOrigin, type IV1FamilyConstructorParams } from "../v1/family.js";
import type { IV1FamilySchemas, IV1FamilyScripts, IV1SigningSchemas, IYieldSplitAlpha, TV1Registry, TV1SettingsConfig } from "../v1/types.js";
/** V1_1-specific knobs threaded from the public params to the constructor. */
interface IV1_1Rc1Options {
    now?: () => bigint;
    defaultDiffusionDurationMs?: bigint;
    executionValidityWindowMs?: bigint;
    diffusionShortfallThresholdMs?: bigint;
    throwOnDiffusionWindowShortfall?: boolean;
    distributionOracleScriptHash: Core.Hash28ByteBase16;
    /**
     * The `protocol_migration_v1_0_to_v1_1` withdraw validator script. Used to
     * deploy/register it and to attach its withdrawal + hash when running the
     * in-place vault-datum migration (`MigrateState`).
     */
    migrationScript: Core.Script;
}
import { MAX_DIFFUSION_RATE_SPAN_MS } from "./diffusion.js";
export interface IRealfiSDKParamsV1_1Rc1 {
    version: "V1_1_Rc1";
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
    /**
     * Dedicated bootstrap UTxO for the yield_oracle NFT one-shot, baked into the
     * orchestrator's logic hash (via the yield_oracle validator param).
     *
     * OPTIONAL: a deployment that DEFERS the oracle can omit it, in which case the
     * SDK uses {@link YIELD_ORACLE_BOOTSTRAP_PLACEHOLDER} — a permanently
     * un-consumable all-zeros reference. A deployment that intends to actually run
     * the oracle must supply a real, still-unspent UTxO here (distinct from the
     * proxy/treasury/stakingVault seeds, each of which its own NFT mint consumes),
     * so the oracle policy stays mintable when the publish flow bootstraps the
     * oracle NFT.
     */
    yieldOracleBootstrap?: {
        readonly txHash: Core.TransactionId;
        readonly outputIndex: bigint;
    };
    /** Enable trace output in Plutus scripts for debugging. Default: false */
    enableTrace?: boolean;
    /**
     * Fallback slippage tolerance (bps) for stake/unstake `minReceived`. 50n =
     * 0.5%. Default: 50n. Same semantics as V1_0.
     */
    defaultSlippageToleranceBps?: bigint;
    /**
     * Use V0.1 treasury script instead of V1.1. Needed for protocol-only
     * upgrades where the treasury NFT stays at the V0.1 address. Default: false
     */
    useV0_1Treasury?: boolean;
    /**
     * Use V0.4 staking vault script instead of V1.1. Needed for protocol-only
     * upgrades where the vault NFT stays at the V0.4 address. Default: false
     */
    useV0_4StakingVault?: boolean;
    /**
     * Hashes of the validators this deployment actually runs. See
     * IV1FamilyConstructorParams.deployedValidators.
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
    /**
     * Default diffusion window length (ms) applied to `buildDepositOrderTx` when
     * the caller passes neither `diffusionEnd` nor `diffusionDurationMs`. Measured
     * from ORDER-CREATION time (not execution). When unset, deposits default to
     * instant (no diffusion window). Choose to match the yield-deposit cadence
     * (~24h for daily deposits, ~5d per epoch).
     */
    defaultDiffusionDurationMs?: bigint;
    /**
     * Forward validity window (ms) attached to vault-touching executions while a
     * diffusion window is active. The window plus any default-clock backoff must
     * not exceed 1h (`MAX_DIFFUSION_RATE_SPAN_MS`). Default: 30 minutes.
     */
    executionValidityWindowMs?: bigint;
    /**
     * Remaining diffusion window (ms) at or below which a deposit execution
     * reports a shortfall (see {@link throwOnDiffusionWindowShortfall} for how).
     * Default: 0n — only a window that has FULLY lapsed by execution time, which
     * is the point the validator collapses it to an instant deposit. Raise it
     * (e.g. 300_000n) to also flag a window that will survive execution but has
     * nearly nothing left to diffuse over.
     */
    diffusionShortfallThresholdMs?: bigint;
    /**
     * Refuse (throw) rather than `console.warn` when a deposit execution hits a
     * diffusion-window shortfall. Default: false — a lapsed window is still a
     * valid, executable deposit on-chain (it just settles instantly), so the
     * default never blocks an execution. Set true in automation that must not
     * silently under-deliver a diffused deposit.
     */
    throwOnDiffusionWindowShortfall?: boolean;
    /**
     * Injectable clock (POSIX ms) for the diffusion rate time and deposit
     * `diffusion_end` defaulting. Defaults to wall-clock `Date.now()`. Tests
     * pass a deterministic function tied to the emulator clock.
     */
    now?: () => bigint;
}
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
export declare class RealfiSDKV1_1Rc1<P extends Provider, W extends Wallet> extends RealfiSDKV1Family<P, W, SettingsV1, VaultDatumV1> {
    readonly version: "V1_1_Rc1";
    private readonly nowFn;
    private readonly defaultDiffusionDurationMs?;
    private readonly executionValidityWindowMs;
    private readonly executionClockBackoffMs;
    private readonly diffusionShortfallThresholdMs;
    private readonly throwOnDiffusionWindowShortfall;
    /**
     * The `distribution_oracle` (publish-logic) validator hash. Exposed so
     * settings datums can point `registry.yield_oracle` at it — that is the
     * withdrawal the orchestrator's PublishYieldOracle path requires. NOTE: this
     * is NOT the orchestrator's 5th compile-time parameter; that parameter is the
     * `yield_oracle` validator hash (the mint+spend validator that holds the
     * oracle UTxO), which is a different validator with a different hash.
     */
    readonly distributionOracleScriptHash: Core.Hash28ByteBase16;
    /**
     * The `protocol_migration_v1_0_to_v1_1` withdraw validator and its hash.
     * The validator is registry-gated (whitelisted via `registry.migration`), NOT
     * an orchestrator compile-time parameter, so it lives version-locally on this
     * class. Deploy it (`deployMigration`) + register its stake
     * (`registerMigrationStake`), then run `buildMigrateStateTx` to migrate a
     * v1_0 one-field vault datum to the four-field v1_1 shape in place.
     */
    readonly migrationScript: Core.Script;
    readonly migrationScriptHash: Core.Hash28ByteBase16;
    /**
     * Slot-aligned execution bounds for the in-flight `buildExecuteOrdersTx`.
     * `executionNowMs` is the backed-off lower bound used by the diffusion datum
     * and rate quote; `executionValidUntilMs` is based on the unshifted wall time.
     * Both are undefined outside an execution build.
     */
    private executionNowMs?;
    private executionValidUntilMs?;
    static create<P extends Provider, W extends Wallet>(blaze: Blaze<P, W>, params: IRealfiSDKParamsV1_1Rc1): RealfiSDKV1_1Rc1<P, W>;
    protected constructor(blaze: Blaze<P, W>, params: IV1FamilyConstructorParams, schemas: IV1FamilySchemas<SettingsV1, VaultDatumV1>, scripts: IV1FamilyScripts, cachedReferenceInputs: ICachedReferenceInputs | undefined, signingSchemas: IV1SigningSchemas, options: IV1_1Rc1Options);
    protected settingsConfig(settings: SettingsV1): TV1SettingsConfig;
    protected settingsRegistry(settings: SettingsV1): TV1Registry;
    protected buildInitialVaultDatum(): VaultDatumV1;
    protected buildUpdatedVaultDatum(previous: VaultDatumV1, sUSDrDelta: bigint): VaultDatumV1;
    protected settledVaultBacking(parsedVaultDatum: VaultDatumV1, vaultUSDr: bigint): bigint;
    protected buildTreasuryRequest(datum: Parameters<RealfiSDKV1Family<P, W, SettingsV1, VaultDatumV1>["buildTreasuryRequest"]>[0], parsed: IClassifiedOrderAction, origin: IRequestOrigin): TreasuryRequestV1;
    protected get splitsYield(): boolean;
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
    computeDepositAlpha(): Promise<IYieldSplitAlpha>;
    protected buildDepositAction(requests: TreasuryRequestV1[], alpha?: IYieldSplitAlpha): Promise<Awaited<ReturnType<RealfiSDKV1Family<P, W, SettingsV1, VaultDatumV1>["buildDepositAction"]>>>;
    /**
     * rc1's Deposit carries a COSE-signed `alpha`; `deposit.ak` splits total_yield
     * against that signed ratio (quotient_integer), NOT live vault/treasury state.
     * Echo the signed alpha here so the executor's vault/pot outputs (and the
     * pot-output indexing) match what the validator checks — re-reading state
     * would diverge if the vault or treasury moved between signing and execution.
     */
    protected resolveDepositYieldShares(totalYield: bigint, vaultUSDr: bigint, treasuryCirculating: bigint, action: Parameters<RealfiSDKV1Family<P, W, SettingsV1, VaultDatumV1>["resolveDepositYieldShares"]>[3]): {
        stakedYieldShare: bigint;
        unstakedYieldShare: bigint;
    };
    protected serializeOrchestratorWithdrawalRedeemer(redeemer: Parameters<RealfiSDKV1Family<P, W, SettingsV1, VaultDatumV1>["serializeOrchestratorWithdrawalRedeemer"]>[0]): PlutusData;
    protected updateDepositVaultOutput(tx: TxBuilder, vaultUtxo: Core.TransactionUnspentOutput, parsedVaultDatum: VaultDatumV1, ctx: {
        stakedYieldShare: bigint;
        totalYield: bigint;
        orderInfos: IOrderInfo[];
    }): void;
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
    buildDepositOrderTx(params: {
        principal: bigint;
        yield: bigint;
        reserveAsset: [string, string];
        destination: Destination;
        owner?: MultisigScript;
        data?: PlutusData;
        /** Absolute POSIX-ms timestamp the staked yield diffuses until. */
        diffusionEnd?: bigint;
        /** Diffusion window length (ms) from order-creation time. */
        diffusionDurationMs?: bigint;
    }): Promise<TxBuilder>;
    buildExecuteOrdersTx(params: Parameters<RealfiSDKV1Family<P, W, SettingsV1, VaultDatumV1>["buildExecuteOrdersTx"]>[0]): Promise<TxBuilder>;
    protected applyExecutionValidityBounds(tx: TxBuilder, context: IExecutionValidityContext<VaultDatumV1>): Promise<void>;
    /**
     * The diffusion rate timestamp (POSIX ms): the pinned execution time during
     * an execution build, else the current wall-clock time (used by order-build
     * min-received estimation, where an exact rate time is not yet knowable).
     */
    private rateTimeMs;
    private resolveDiffusionEnd;
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
    private checkDiffusionWindow;
    /**
     * Deploy the migration validator as a reference script. Required before its
     * withdrawal can be attached in {@link buildMigrateStateTx}.
     */
    deployMigration(): Promise<TxBuilder>;
    /**
     * Register the migration validator's stake credential. Its withdrawal cannot
     * be exercised until the stake credential is registered.
     */
    registerMigrationStake(): TxBuilder;
    /**
     * Read the staking-vault UTxO holding a legacy v1_0 (one-field) datum. The
     * inherited {@link getVaultDatum} parses the four-field v1_1 schema and THROWS
     * on a pre-migration vault, so the migration path reads the input with the
     * v1_0 single-field schema (`circulating_susdr` only).
     */
    private readLegacyVaultDatum;
    /**
     * Build the COSE payload for a `MigrateState` action. Unlike the order path
     * (whose nonce derives from the sorted order inputs), migration spends the
     * vault UTxO, so the nonce is anchored to the vault input. Returns the CBOR
     * payload (for {@link buildMigrateStateTx}) and its blake2b-256 hash (for
     * CIP-30 signing by the `permissions.migrate` signer(s)).
     */
    getMigrateStatePayload(): Promise<{
        signedPayload: string;
        payloadHash: string;
    }>;
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
    buildMigrateStateTx(params: {
        signedPayload: string;
        signatures: Tuple_VerificationKey_COSESign1[];
    }): Promise<TxBuilder>;
}
/** Re-exported for parity with the sibling version modules. */
export { MAX_DIFFUSION_RATE_SPAN_MS };
//# sourceMappingURL=index.d.ts.map