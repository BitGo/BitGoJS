import { PlutusData } from "@blaze-cardano/core";
import type { Provider } from "@blaze-cardano/query";
import { type Blaze, Core, TxBuilder, type Wallet } from "@blaze-cardano/sdk";
import { TreasuryDatum as V0_1TreasuryDatum } from "../../generated-types/v0_1/index.js";
import type { Asset, Destination, ExtraProtocolRedeemerV1, MultisigScript, OrderActionV1, OrderDatumV1, ProtocolRedeemerV1, SignedPayload_ProtocolRedeemerV1, TreasuryRequestV1, Tuple_VerificationKey_COSESign1 } from "../../generated-types/v1_0/index.js";
import { buildMultisigTimelockNativeScript, buildTimelockAddress, buildTimelockNativeScript, type ICachedReferenceInputs, type IProxyDatumResult, type IRealfiSDKWithTreasury, type ITreasuryDatumResult, type IVaultDatumResult, RealfiSDKBase, type TProtocolVersion } from "../shared/index.js";
import { type IOrderUtxoFacts, type TOrderSanityResult } from "./order-sanity.js";
import type { IProxyDatum, IV1FamilySchemas, IV1FamilyScripts, IV1SigningSchemas, IVaultDatumLike, IYieldSplitAlpha, TV1Registry, TV1SettingsConfig } from "./types.js";
/**
 * Sentinel `reserve_asset` used in V1_0 TreasuryRequestV1 redeemers for
 * DirectMint and DirectBurn actions, which have no real reserve asset in
 * their order datum. The on-chain validators `direct_mint_logic` and
 * `direct_burn_logic` do not inspect this field; this sentinel makes the
 * intent explicit both in code and when inspecting on-chain redeemers.
 *
 * - `policy_id`: 28 zero bytes (standard policy-ID length, chosen as a
 *   sentinel and extremely unlikely to occur as a real script hash)
 * - `asset_name`: "unused" (ASCII)
 *
 * Keep in sync with backend `contract.DirectActionPaddingAsset`.
 */
export declare const DIRECT_ACTION_PADDING_ASSET: Asset;
/**
 * Parsed order information extracted from a UTXO.
 */
export interface IOrderInfo {
    utxo: Core.TransactionUnspentOutput;
    datum: OrderDatumV1;
    actionType: TOrderActionType;
    amount: bigint;
    /** Yield amount for deposit actions */
    yield?: bigint;
    /** Forfeit amount for unstake actions */
    forfeit?: bigint;
    /** Reserve asset for treasury actions, undefined for stake/unstake */
    reserveAsset?: [string, string];
    /**
     * Absolute fee retained by the protocol, in this action's output unit
     * (USDr for Mint, reserve for Burn). Always 0 for Stake/Unstake — the
     * protocol does not retain a fee on those actions. Locked at indexing
     * time by the Go backend; the SDK never recomputes. Zero (the default)
     * means "no fee", e.g. when the dispatcher passes no fees map or the
     * map has no entry for this order.
     */
    fee: bigint;
    /**
     * User-enforced output floor copied from the v1.0 datum (in output unit).
     * Used as a defensive sanity check by buildXxxExecute to throw early if
     * the fee somehow pushes the user output below what was signed.
     */
    minReceived?: bigint;
}
/** Minimal completed-swap shape accepted by the stake continuation builder. */
export interface IStakeContinuationSwap {
    minReceived: {
        amount: bigint;
        metadata: {
            assetId: string;
        };
    };
}
/** Parameters for building a RealFi stake order as another order's destination. */
export interface IBuildStakeContinuationParams {
    swap: IStakeContinuationSwap;
    destination: Destination;
    slippageToleranceBps?: bigint;
    owner?: MultisigScript;
    data?: PlutusData;
}
/** Address and inline datum a preceding protocol should pay its result to. */
export interface IStakeContinuation {
    address: Core.Address;
    datum: PlutusData;
}
export type TOrderActionType = "mint" | "burn" | "deposit" | "withdraw" | "stake" | "unstake" | "direct_mint" | "direct_burn";
/** Result of {@link RealfiSDKV1Family.classifyOrderAction}. */
export interface IClassifiedOrderAction {
    actionType: TOrderActionType;
    amount: bigint;
    yield?: bigint;
    forfeit?: bigint;
    minReceived?: bigint;
    reserveAsset?: [string, string];
    isTreasuryAction: boolean;
}
/** Result of {@link RealfiSDKV1Family.classifyOrderUtxo}. */
export interface IClassifiedOrderUtxo {
    /** The order datum decoded with this version's `OrderDatumV1` schema. */
    datum: OrderDatumV1;
    /** The action classified from {@link datum}. */
    action: IClassifiedOrderAction;
}
/** The `origin` field shared by every request kind — the consumed order UTxO. */
export interface IRequestOrigin {
    transaction_id: string;
    output_index: bigint;
}
export interface ITreasuryUnstakeOrderTxResult {
    /** Transaction builder for the treasury unstake order. */
    tx: TxBuilder;
    /**
     * Native script used as the unstake output destination:
     * AllOf { After(unlockSlot), owner }.
     */
    nativeScript: Core.NativeScript;
}
/**
 * Context handed to {@link RealfiSDKV1Family.applyExecutionValidityBounds}
 * at the end of `buildExecuteOrdersTx`. The vault fields are set only when
 * the executed action consumed the staking vault (stake/unstake/deposit).
 */
export interface IExecutionValidityContext<TVaultDatum> {
    actionType: TOrderActionType;
    vaultUtxo?: Core.TransactionUnspentOutput;
    parsedVaultDatum?: TVaultDatum;
}
/**
 * Version-agnostic constructor parameters for the V1 family. Each version's
 * `static create` assembles this from its own public params interface.
 */
export interface IV1FamilyConstructorParams {
    version: TProtocolVersion;
    proxyBootstrap: {
        txHash: Core.TransactionId;
        outputIndex: bigint;
    };
    /** USDr asset name hex */
    assetNameHex: string;
    /** sUSDr asset name hex */
    sUSDrAssetNameHex: string;
    enableTrace?: boolean;
    defaultSlippageToleranceBps?: bigint;
    scriptDeploymentAddress?: Core.Address;
    clientSource?: import("../shared/client-id.js").TClientSource;
    /**
     * Hashes of the validators this deployment actually runs, keyed as in
     * `backend/config/env/<env>.protocol.yaml`.
     *
     * Every identity below is otherwise derived from the Plutus artifacts this
     * package bundles, which is correct only while those bytes match the ones on
     * chain. Where they do not, the derived order address is an address nothing
     * watches — and because an order is `lockAssets` with no on-chain validation,
     * funds go there silently. Supplying the deployment's own hashes overrides
     * the derivation; the scripts themselves still come from on-chain reference
     * inputs, so identity is all that is needed.
     *
     * Partial maps are normal — validators the deployment does not name keep
     * their derived identity.
     */
    deployedValidators?: Readonly<Record<string, string>>;
}
export declare const MIN_LOVELACE = 2000000n;
export declare function calculateYieldShares(totalYield: bigint, vaultUSDr: bigint, treasuryCirculating: bigint): {
    stakedYieldShare: bigint;
    unstakedYieldShare: bigint;
};
/**
 * Shared implementation for the V1 protocol family (v1_0, v1_0_rc1, v1_1+).
 *
 * The family is generic over the two datum shapes that differ across
 * versions — `TSettings` (the proxy settings static) and `TVaultDatum` (the
 * staking-vault datum static) — and receives all generated artifacts from the
 * subclass: schema VALUES via {@link IV1FamilySchemas} (plus, optionally,
 * {@link IV1SigningSchemas}) and instantiated scripts via
 * {@link IV1FamilyScripts}. Method bodies never touch a version's generated
 * module directly, so this chunk adds no runtime import edge to any
 * `generated-types/v1_x` module and per-version code-splitting is preserved.
 *
 * Method defaults implement v1_0 semantics (fees, min_received, the v1_0
 * protocol-redeemer schema). Versions that diverge override the affected
 * members:
 * - vault datum construction is NEVER done inline — it goes through the
 *   abstract `buildInitialVaultDatum` / `buildUpdatedVaultDatum` seam so
 *   versions with additional vault fields cannot be silently truncated;
 * - settings access goes through the abstract `settingsConfig` /
 *   `settingsRegistry` adapters;
 * - `applyExecutionValidityBounds` lets a version constrain the validity
 *   interval of execution transactions (no-op by default).
 */
export declare abstract class RealfiSDKV1Family<P extends Provider, W extends Wallet, TSettings, TVaultDatum extends IVaultDatumLike> extends RealfiSDKBase<P, W> implements IRealfiSDKWithTreasury {
    readonly stablecoinPolicyId: Core.PolicyId;
    readonly oneShotPolicyId: Core.PolicyId;
    readonly protocolScriptHash: Core.Hash28ByteBase16;
    readonly protocolMintScriptHash: Core.Hash28ByteBase16;
    readonly protocolStakeScriptHash: Core.Hash28ByteBase16;
    readonly protocolManagementScriptHash: Core.Hash28ByteBase16;
    readonly treasuryScriptHash: Core.Hash28ByteBase16;
    readonly treasuryNFTAssetId: Core.AssetId;
    readonly orderScriptHash: Core.Hash28ByteBase16;
    readonly orderScriptAddress: Core.Address;
    readonly treasuryAddress: Core.Address;
    readonly stakingVaultScriptHash: Core.Hash28ByteBase16;
    readonly stakingVaultAddress: Core.Address;
    readonly stakingVaultNFTAssetId: Core.AssetId;
    readonly sUSDrAssetNameHex: string;
    protected readonly oneShotScript: Core.Script;
    protected readonly protocolScript: Core.Script;
    protected readonly protocolOrchestratorScript: Core.Script;
    protected readonly protocolMintScript: Core.Script;
    protected readonly protocolStakeScript: Core.Script;
    protected readonly protocolManagementScript: Core.Script;
    protected readonly mintProxyScript: Core.Script;
    protected readonly treasuryScript: Core.Script;
    protected readonly orderScript: Core.Script;
    protected readonly stakingVaultScript: Core.Script;
    protected readonly defaultSlippageToleranceBps?: bigint;
    /** Schema values used by every shared serialize/parse site. */
    protected readonly schemas: IV1FamilySchemas<TSettings, TVaultDatum>;
    private readonly signingSchemas?;
    protected constructor(blaze: Blaze<P, W>, params: IV1FamilyConstructorParams, schemas: IV1FamilySchemas<TSettings, TVaultDatum>, scripts: IV1FamilyScripts, cachedReferenceInputs?: ICachedReferenceInputs, signingSchemas?: IV1SigningSchemas);
    /**
     * Replace derived script identity with the deployment's own hashes.
     *
     * Version-owned validators are selected only from this SDK's exact version
     * slot. Treasury and staking-vault validators can deliberately survive a
     * protocol-only upgrade, so their unversioned entries are used as the
     * authoritative active-state fallback.
     *
     * Unrecognised keys are ignored: a blueprint legitimately carries validators
     * outside this family (oneshot, mint_proxy) and future ones this build has
     * never heard of.
     */
    private applyDeployedValidators;
    /**
     * Schemas for the v1_0-semantics signing/execute defaults. Throws for
     * versions that neither supplied {@link IV1SigningSchemas} nor overrode
     * the two consumers (`getSignedPayloadFromOrderInputs`,
     * `buildExecuteOrdersTx`).
     */
    protected get signing(): IV1SigningSchemas;
    /**
     * Project the version's settings onto the fields the shared tx-builders
     * read. v1_0/v1_0_rc1: the settings object itself; v1_1+: `settings.config`.
     */
    protected abstract settingsConfig(settings: TSettings): TV1SettingsConfig;
    /**
     * Extract the validator registry (the fields the family reads) from the
     * version's settings.
     */
    protected abstract settingsRegistry(settings: TSettings): TV1Registry;
    /**
     * Build the vault datum used when bootstrapping the staking vault.
     * This is the ONLY place (together with `buildUpdatedVaultDatum`) that
     * knows the version's full vault-datum shape.
     */
    protected abstract buildInitialVaultDatum(): TVaultDatum;
    /**
     * Build the vault datum that replaces `previous` after an execution that
     * changes circulating sUSDr by `sUSDrDelta`. Versions with additional
     * vault fields decide here how each field carries over.
     */
    protected abstract buildUpdatedVaultDatum(previous: TVaultDatum, sUSDrDelta: bigint): TVaultDatum;
    /**
     * Version hook: the USDr backing the stake/unstake exchange rate is
     * computed against. Defaults to the vault's full USDr balance (v1_0 /
     * v1_0_rc1 semantics). Versions with time-diffused yield (v1_1_rc1+)
     * override this to exclude the not-yet-diffused pending yield
     * (`settled_backing` in utilities.ak).
     */
    protected settledVaultBacking(_parsedVaultDatum: TVaultDatum, vaultUSDr: bigint): bigint;
    /**
     * Version hook: constrain the transaction validity interval on order
     * executions. Called once at the end of `buildExecuteOrdersTx`, right
     * before the builder is returned.
     *
     * No-op by default: v1_0 / v1_0_rc1 executions carry no validity
     * constraints. Versions with time-diffused yield (v1_1_rc1+) override this
     * to attach validFrom/validTo bounds on vault-touching executions.
     */
    protected applyExecutionValidityBounds(_tx: TxBuilder, _context: IExecutionValidityContext<TVaultDatum>): Promise<void>;
    /**
     * Version hook: build the `Deposit` protocol action that goes into the
     * COSE-signed payload. v1_0 / v1_0_rc1 have no yield split — the validator
     * recomputes it from live state — so they take no `alpha` and reject one.
     * Versions that carry a signed `alpha` (v1_1_rc1+) override this and require
     * it: it is the batch's parameter, never something a signer derives.
     */
    protected buildDepositAction(requests: TreasuryRequestV1[], alpha?: IYieldSplitAlpha): Promise<ProtocolRedeemerV1>;
    /**
     * Version hook: split a deposit's total yield between the staked vault and
     * the unstaked pot at EXECUTION time.
     *
     * v1_0 / v1_0_rc1 (default): the on-chain validator recomputes the split from
     * live vault/treasury state, so recomputing it here from the same state
     * matches. v1_1_rc1+ carry a COSE-signed `alpha` in the Deposit action and
     * the validator splits against THAT — so those versions override this to echo
     * the signed alpha, never a second live read (which would diverge if state
     * moved between signing and execution). `action` is the signed action being
     * executed; the default ignores it.
     */
    protected resolveDepositYieldShares(totalYield: bigint, vaultUSDr: bigint, treasuryCirculating: bigint, _action: ProtocolRedeemerV1): {
        stakedYieldShare: bigint;
        unstakedYieldShare: bigint;
    };
    /**
     * Version hook: serialize the redeemer attached to the orchestrator
     * withdrawal. Defaults to the bare `SignedRedeemer<ExtraProtocolRedeemerV1>`
     * (v1_0 / v1_0_rc1). Versions whose orchestrator wraps execution in a
     * top-level dispatch enum (v1_1_rc1+: `ExecuteOrders(...)`/`PublishYieldOracle`)
     * override this to nest the signed redeemer inside that wrapper.
     */
    protected serializeOrchestratorWithdrawalRedeemer(redeemer: {
        extra: ExtraProtocolRedeemerV1;
        payload: SignedPayload_ProtocolRedeemerV1;
        signatures: Tuple_VerificationKey_COSESign1[];
    }): PlutusData;
    /**
     * Mint the treasury NFT.
     */
    mintTreasuryNFT(treasuryBootstrapUtxo: Core.TransactionUnspentOutput, initialDatum?: V0_1TreasuryDatum): Promise<{
        tx: TxBuilder;
        nftAssetId: Core.AssetId;
    }>;
    deployTreasury(): Promise<TxBuilder>;
    deployOrderContract(): Promise<TxBuilder>;
    getTreasuryDatum(): Promise<ITreasuryDatumResult<V0_1TreasuryDatum>>;
    /**
     * Mint the staking vault NFT and create initial vault UTxO.
     */
    mintStakingVaultNFT(stakingVaultBootstrapUtxo: Core.TransactionUnspentOutput, initialDatum?: TVaultDatum): Promise<{
        tx: TxBuilder;
        nftAssetId: Core.AssetId;
    }>;
    deployStakingVault(): Promise<TxBuilder>;
    /**
     * Deploy the protocol mint script as a reference script (V1.0 only).
     */
    deployProtocolMint(): Promise<TxBuilder>;
    /**
     * Deploy the protocol stake script as a reference script (V1.0 only).
     */
    deployProtocolStake(): Promise<TxBuilder>;
    /**
     * Deploy the protocol management script as a reference script (V1.0 only).
     */
    deployProtocolManagement(): Promise<TxBuilder>;
    /**
     * Register the protocol mint stake credential (V1.0 sub-validator).
     */
    registerProtocolMintStake(): TxBuilder;
    /**
     * Register the protocol stake stake credential (V1.0 sub-validator).
     */
    registerProtocolStakeStake(): TxBuilder;
    /**
     * Register the protocol management stake credential (V1.0 sub-validator).
     */
    registerProtocolManagementStake(): TxBuilder;
    /**
     * Register the staking vault stake credential (for stake/unstake operations).
     */
    registerStakingVaultStake(): TxBuilder;
    /**
     * Register all five protocol stake credentials (orchestrator + mint / stake /
     * management sub-validators + staking vault) in a SINGLE transaction.
     * Certificates are tiny, so there is no size constraint. Replaces five
     * `register*Stake` calls (and, for a cold wallet, five sign/submit cycles).
     */
    registerAllStakes(): TxBuilder;
    /**
     * Pack the eight protocol reference-script deployments into as few
     * transactions as fit under `budgetBytes` of script payload each, returning
     * one TxBuilder per batch in deploy order.
     *
     * Batches by measured script size (`script.toCbor()` bytes) rather than a
     * fixed count, because the validators are wildly uneven (~0.5–11 KB) and two
     * of the ~10 KB sub-validators cannot share a transaction. The default budget
     * (13 000) leaves headroom under the 16 384-byte tx limit for tx overhead and
     * future script growth; callers can lower it if a validator grows.
     *
     * Fresh-deploy only: it does NOT skip already-deployed scripts. To resume a
     * partial deploy, use the granular `deploy*` methods (which throw
     * `ScriptAlreadyDeployedError` for idempotent reruns).
     */
    deployScriptsBatched(budgetBytes?: number): TxBuilder[];
    /** The sUSDr asset ID (stablecoin policy + staked-USDr asset name). */
    getSusdrAssetId(): Core.AssetId;
    getVaultDatum(): Promise<IVaultDatumResult<TVaultDatum>>;
    mintOneShot(receiverAddress: Core.Address, datum: IProxyDatum<TSettings>): Promise<{
        tx: TxBuilder;
        policyId: Core.PolicyId;
    }>;
    updateOneShotDatum(receiverAddress: Core.Address, newDatum: IProxyDatum<TSettings>): Promise<TxBuilder>;
    getParsedProxyDatum(): Promise<IProxyDatumResult<IProxyDatum<TSettings>>>;
    /**
     * Check if the protocol has been upgraded past this SDK version.
     *
     * Returns true if either:
     * - The order script hash no longer matches registry.order (order validator upgraded)
     * - The protocol logic no longer matches this SDK's protocol script hash (protocol upgraded)
     *
     * When this returns true, orders created with this SDK version can use the
     * `Invalidated` redeemer to recover funds via `buildInvalidatedOrdersTx`.
     */
    isProtocolUpgraded(): Promise<boolean>;
    /**
     * Read the version-agnostic settings config (`reserve_assets`,
     * `unstaked_yield_pot`) off the live proxy datum. Public accessor over the
     * `settingsConfig` / `getVersionSettings` seam so consumers read the shared
     * fields without casting a version-specific settings shape: v1_0 / v1_0_rc1
     * project the flat settings, v1_1+ project `settings.config`.
     */
    getSettingsConfig(): Promise<TV1SettingsConfig>;
    /**
     * Whether the batch covering these orders needs a yield-split alpha, i.e. it is
     * a deposit on a version that splits yield. Callers that both create and sign a
     * batch use it to decide whether to pick one (computeDepositAlpha); a co-signer
     * has no use for it — it reads the batch's stored alpha either way.
     */
    batchNeedsAlpha(orderInputs: Core.TransactionInput[]): Promise<boolean>;
    /**
     * Whether this version's Deposit action carries a signed yield split. False for
     * v1_0 / v1_0_rc1, whose validator recomputes the split from live state;
     * v1_1_rc1+ override it.
     */
    protected get splitsYield(): boolean;
    /**
     * Decode and classify a single open order UTxO with this version's schema.
     *
     * Parses the UTxO's inline datum via `this.schemas.OrderDatumV1` — exactly
     * the way {@link parseOrderInfos} does — then classifies the action. Unlike
     * {@link parseOrders}, this imposes NO same-action-type constraint, so it is
     * the per-UTxO primitive for scanning a MIXED batch of open orders at the
     * order script address and handling each by its action type.
     *
     * @throws if the UTxO carries no inline datum, or the datum fails to decode
     *   under this version's order schema (e.g. a V1.1 order read by a V1.0 SDK).
     */
    classifyOrderUtxo(utxo: Core.TransactionUnspentOutput): IClassifiedOrderUtxo;
    /**
     * Decode a batch of order UTxOs into {@link IOrderInfo} objects, validating
     * they are ALL the same action type (throws on a mixed batch). Public
     * wrapper over {@link parseOrderInfos}; use it to prepare inputs for the
     * same-type execute builders. To scan a mixed batch, classify each UTxO
     * individually with {@link classifyOrderUtxo} instead.
     *
     * The optional `fees` map (keyed by `${txHash}#${outputIndex}`) stamps each
     * order with its locked fee in the action's output unit; missing entries
     * default to 0 (no fee retained).
     */
    parseOrders(orderUtxos: Core.TransactionUnspentOutput[], fees?: Map<string, bigint>): IOrderInfo[];
    /**
     * Internal helper to build an order transaction.
     */
    protected _buildOrderTx(params: {
        action: OrderActionV1;
        valueToLock: Core.Value;
        destination: Destination;
        owner?: MultisigScript;
        data?: PlutusData;
        extraLabels?: Map<bigint, Core.Metadatum>;
    }): Promise<TxBuilder>;
    /** Resolve the order owner exactly once for transaction and continuation builders. */
    protected resolveOrderOwner(owner?: MultisigScript): Promise<MultisigScript>;
    /** Serialize an order datum through the live version instance's schema seam. */
    protected serializeOrderDatum(action: OrderActionV1, destination: Destination, owner: MultisigScript, data?: PlutusData): PlutusData;
    /**
     * Build a mint order: lock reserve tokens, request USDr minting.
     */
    buildMintOrderTx(params: {
        amount: bigint;
        reserveAsset: [string, string];
        destination: Destination;
        minReceived?: bigint;
        /**
         * ADA to lock in the RealFi order UTxO and forward to the destination
         * output when the order is executed. Defaults to MIN_LOVELACE.
         */
        orderLovelace?: bigint;
        owner?: MultisigScript;
        data?: PlutusData;
    }): Promise<TxBuilder>;
    /**
     * Build a redeem (burn) order: lock USDr, request reserve token redemption.
     */
    buildRedeemOrderTx(params: {
        amount: bigint;
        reserveAsset: [string, string];
        destination: Destination;
        minReceived?: bigint;
        owner?: MultisigScript;
        data?: PlutusData;
    }): Promise<TxBuilder>;
    /**
     * Build a deposit order: lock reserve tokens, request treasury deposit.
     */
    buildDepositOrderTx(params: {
        principal: bigint;
        yield: bigint;
        reserveAsset: [string, string];
        destination: Destination;
        owner?: MultisigScript;
        data?: PlutusData;
    }): Promise<TxBuilder>;
    /**
     * Build a withdraw order: lock min ADA, request reserve token withdrawal.
     */
    buildWithdrawOrderTx(params: {
        amount: bigint;
        reserveAsset: [string, string];
        destination: Destination;
        owner?: MultisigScript;
        data?: PlutusData;
    }): Promise<TxBuilder>;
    /**
     * Build a stake order: lock USDr, request sUSDr minting.
     */
    buildStakeOrderTx(params: {
        amount: bigint;
        destination: Destination;
        minReceived?: bigint;
        slippageToleranceBps?: bigint;
        owner?: MultisigScript;
        data?: PlutusData;
    }): Promise<TxBuilder>;
    /**
     * Build a stake-order continuation from a completed swap's guaranteed USDr
     * output. The swap quote remains observable to the caller, while the SDK
     * owns the RealFi amount, exchange-rate quote, schema, and request address.
     */
    buildStakeContinuation(params: IBuildStakeContinuationParams): Promise<IStakeContinuation>;
    protected _buildUnstakeOrderTx(params: {
        amount: bigint;
        destination: Destination;
        forfeit?: bigint;
        minReceived?: bigint;
        slippageToleranceBps?: bigint;
        owner?: MultisigScript;
        data?: PlutusData;
        extraLabels?: Map<bigint, Core.Metadatum>;
    }): Promise<TxBuilder>;
    /**
     * Build an unstake order: lock sUSDr, request USDr release.
     *
     * The destination is automatically set to a native script address that
     * enforces a timelock: AllOf { Signature(user), After(unlockSlot) }.
     * This means the released USDr can only be spent by the user after the
     * unlock time has passed.
     *
     * @param params.amount - Amount of sUSDr to unstake
     * @param params.destination - The user's actual destination (used to extract payment key hash)
     * @param params.unlockSlot - Slot number after which the user can spend the released USDr
     * @param params.forfeit - Optional amount of USDr to forfeit to yield pot (default: 0)
     * @param params.slippageToleranceBps - Optional min-received tolerance override in basis points
     */
    buildUnstakeOrderTx(params: {
        amount: bigint;
        destination: Destination;
        unlockSlot: bigint;
        forfeit?: bigint;
        minReceived?: bigint;
        slippageToleranceBps?: bigint;
        owner?: MultisigScript;
        data?: PlutusData;
    }): Promise<TxBuilder>;
    /**
     * Build a treasury-managed unstake order that wraps the destination in a
     * native timelock script controlled by the order owner.
     *
     * The destination is set to: AllOf { After(unlockSlot), owner }. This keeps
     * treasury multisig ownership on the released USDr while enforcing the same
     * unlock slot used by the retail unstake helper. The owner must be convertible
     * to a Cardano native script.
     */
    buildTreasuryUnstakeOrderTx(params: {
        amount: bigint;
        destination: Destination;
        unlockSlot: bigint;
        forfeit?: bigint;
        minReceived?: bigint;
        slippageToleranceBps?: bigint;
        owner: MultisigScript;
        data?: PlutusData;
    }): Promise<ITreasuryUnstakeOrderTxResult>;
    /**
     * Compute the default `min_received` (output sUSDR floor) for a stake order
     * by reading the current staking-vault exchange rate and applying a
     * slippage tolerance buffer.
     *
     * Tolerance resolution: per-call > SDK-level (defaultSlippageToleranceBps)
     * > built-in 50bps (0.5%).
     *
     * Yield accrual moves `vault_usdr` up over time, so shares-per-USDR shrinks
     * between order placement and execution. The buffer protects the user from
     * receiving fewer shares than they expected at sign time.
     *
     * Bootstrap edge case: when the vault is empty (no USDR locked or no sUSDR
     * circulating), the rate is treated as 1:1 and the buffer is skipped.
     */
    protected computeStakeMinReceived(amount: bigint, perCallToleranceBps?: bigint): Promise<bigint>;
    protected resolveStakeSlippageToleranceBps(perCallToleranceBps?: bigint): bigint;
    /**
     * Compute the default `min_received` (output USDR floor) for an unstake
     * order by reading the current staking-vault exchange rate.
     *
     * `forfeit` is subtracted from the gross expected USDR, then a slippage
     * tolerance protects the order from quote/provider drift. Tolerance
     * resolution is per-call > SDK-level > built-in 50bps (0.5%).
     *
     * Bootstrap edge case: when the vault is empty, the rate is treated as 1:1.
     */
    protected computeUnstakeMinReceived(amount: bigint, forfeit: bigint, perCallToleranceBps?: bigint): Promise<bigint>;
    /**
     * Build a direct mint order: mint USDr without reserve asset backing.
     * Used for fiat wire scenarios where reserve arrives off-chain.
     */
    buildDirectMintOrderTx(params: {
        amount: bigint;
        destination: Destination;
        owner?: MultisigScript;
        data?: PlutusData;
    }): Promise<TxBuilder>;
    /**
     * Build a direct burn order: burn USDr without reserve asset redemption.
     * Used for fiat wire scenarios where reserve is sent off-chain.
     */
    buildDirectBurnOrderTx(params: {
        amount: bigint;
        destination: Destination;
        owner?: MultisigScript;
        data?: PlutusData;
    }): Promise<TxBuilder>;
    static buildTimelockNativeScript: typeof buildTimelockNativeScript;
    static buildTimelockAddress: typeof buildTimelockAddress;
    static buildMultisigTimelockNativeScript: typeof buildMultisigTimelockNativeScript;
    /**
     * Build the V1_0 SignedPayload_ProtocolRedeemer from order inputs.
     * Returns both the CBOR hex string (for buildExecuteOrdersTx) and
     * the blake2b_256 hash (for CIP-30 signing).
     *
     * `alpha` is the batch's yield split, required by versions whose Deposit
     * action carries one (v1_1_rc1+) and rejected everywhere else. It is a
     * parameter of the batch, chosen once by whoever created it and read back from
     * the backend by every co-signer: on-chain, all signatures of a batch are
     * checked against ONE payload hash, so a signer that derived its own value
     * would produce bytes nobody else can co-sign.
     */
    getSignedPayloadFromOrderInputs(orderInputs: Core.TransactionInput[], alpha?: IYieldSplitAlpha): Promise<{
        signedPayload: string;
        payloadHash: string;
    }>;
    /**
     * Build a transaction to execute orders.
     *
     * Handles all 8 action types: mint, burn, deposit, withdraw, stake, unstake,
     * direct_mint, direct_burn.
     */
    buildExecuteOrdersTx(params: {
        orderInputs: Core.TransactionInput[];
        signedPayload: string;
        signatures: Tuple_VerificationKey_COSESign1[];
        /**
         * Per-order fees retained by the protocol, keyed by `${txHash}#${index}`,
         * in the action's output unit (USDr for Mint, reserve for Burn, sUSDr for
         * Stake, USDr for Unstake). Computed and locked by the Go backend at the
         * order's index time. Missing entries default to 0 (no fee retained).
         * The SDK never recomputes a fee — it just subtracts this absolute value
         * from each user's destination output.
         */
        fees?: Map<string, bigint>;
    }): Promise<TxBuilder>;
    /**
     * Mint: reserve goes to treasury, USDr minted to destinations.
     *
     * The per-order fee (in USDr, locked at index time) is retained by the
     * treasury: the user receives `amount − fee` USDr while `amount` is still
     * minted, so the protocol pockets the difference via the treasury balance.
     */
    protected buildMintExecute(tx: TxBuilder, orderInfos: IOrderInfo[], stablecoinAssetId: Core.AssetId, treasuryUtxo: Core.TransactionUnspentOutput, parsedTreasuryDatum: V0_1TreasuryDatum, settings: TV1SettingsConfig): void;
    /**
     * Burn: USDr burned, reserve sent to destinations.
     *
     * The audited contract decreases circulating_supply by the FULL signed
     * `amount` (the user burns the whole `amount` of USDr) and the reserve
     * outflow per asset equals what the user actually receives. The locked
     * fee (in reserve units) stays in the treasury — by paying out
     * `usdr_to_reserve(amount, ra) − fee` instead of the full natural
     * amount, the protocol pockets the difference.
     */
    protected buildBurnExecute(tx: TxBuilder, orderInfos: IOrderInfo[], stablecoinAssetId: Core.AssetId, treasuryUtxo: Core.TransactionUnspentOutput, parsedTreasuryDatum: V0_1TreasuryDatum, settings: TV1SettingsConfig): void;
    /**
     * Withdraw: reserve sent to destinations, no mint/burn.
     */
    protected buildWithdrawExecute(tx: TxBuilder, orderInfos: IOrderInfo[], treasuryUtxo: Core.TransactionUnspentOutput, parsedTreasuryDatum: V0_1TreasuryDatum, settings: TV1SettingsConfig): void;
    /**
     * Deposit: reserve deposited, interest USDr minted and split between vault and yield pot.
     */
    protected buildDepositExecute(tx: TxBuilder, orderInfos: IOrderInfo[], stablecoinAssetId: Core.AssetId, treasuryUtxo: Core.TransactionUnspentOutput, parsedTreasuryDatum: V0_1TreasuryDatum, vaultUtxo: Core.TransactionUnspentOutput, parsedVaultDatum: TVaultDatum, settings: TV1SettingsConfig, action: ProtocolRedeemerV1): void;
    /**
     * Version hook: lock the post-deposit vault output. v1_0 / v1_0_rc1 keep the
     * one-field datum and simply add `stakedYieldShare` USDr to the vault.
     * Versions with time-diffused yield override this to roll the staked share
     * into the diffusion window (`validate_deposit_diffusion` in deposit.ak).
     */
    protected updateDepositVaultOutput(tx: TxBuilder, vaultUtxo: Core.TransactionUnspentOutput, parsedVaultDatum: TVaultDatum, ctx: {
        stakedYieldShare: bigint;
        totalYield: bigint;
        orderInfos: IOrderInfo[];
    }): void;
    /**
     * Stake: USDr locked in vault, sUSDr minted to destinations.
     *
     * Stake is not fee-filtered (no protocol fee retained on stake), so the
     * vault receives the full `amount` USDr and mints sUSDr at the natural
     * rate.
     */
    protected buildStakeExecute(tx: TxBuilder, orderInfos: IOrderInfo[], stablecoinAssetId: Core.AssetId, sUSDrAssetId: Core.AssetId, vaultUtxo: Core.TransactionUnspentOutput, parsedVaultDatum: TVaultDatum): void;
    /**
     * Unstake: sUSDr burned, USDr sent to user's destination address.
     * V1_0: Supports forfeit parameter - forfeited USDr goes to yield pot.
     */
    protected buildUnstakeExecute(tx: TxBuilder, orderInfos: IOrderInfo[], stablecoinAssetId: Core.AssetId, sUSDrAssetId: Core.AssetId, vaultUtxo: Core.TransactionUnspentOutput, parsedVaultDatum: TVaultDatum, settings: TV1SettingsConfig): void;
    /**
     * DirectMint: Mint USDr without reserve asset flow.
     * USDr is minted to destinations, treasury circulating_supply increases.
     * NO reserve asset changes.
     */
    protected buildDirectMintExecute(tx: TxBuilder, orderInfos: IOrderInfo[], stablecoinAssetId: Core.AssetId, treasuryUtxo: Core.TransactionUnspentOutput, parsedTreasuryDatum: V0_1TreasuryDatum): void;
    /**
     * DirectBurn: Burn USDr without reserve asset flow.
     * USDr is burned, treasury circulating_supply decreases.
     * NO reserve asset changes, NO destination outputs (fiat sent off-chain).
     */
    protected buildDirectBurnExecute(tx: TxBuilder, orderInfos: IOrderInfo[], stablecoinAssetId: Core.AssetId, treasuryUtxo: Core.TransactionUnspentOutput, parsedTreasuryDatum: V0_1TreasuryDatum): void;
    /**
     * Build a transaction to cancel orders.
     */
    buildCancelOrdersTx(params: {
        orderInputs: Core.TransactionInput[];
        destination?: Core.Address;
        availableSigners?: Set<string>;
        versionHint?: TProtocolVersion;
    }): Promise<TxBuilder>;
    /**
     * Build a transaction to recover funds from invalidated orders.
     * Only works when the protocol has been upgraded and the order validator
     * no longer matches the current protocol logic.
     *
     * IMPORTANT: Only works for orders with simple Signature owners.
     *
     * Output-at-same-index constraint: Each output must be at the same
     * transaction index as its corresponding input.
     */
    buildInvalidatedOrdersTx(params: {
        orderInputs: Core.TransactionInput[];
    }): Promise<TxBuilder>;
    /**
     * Parse order UTxOs into IOrderInfo objects and validate they are all the
     * same type. The optional `fees` map (keyed by `${txHash}#${outputIndex}`)
     * stamps each order with its locked fee in the action's output unit.
     * Missing entries default to 0 (no fee retained).
     */
    protected parseOrderInfos(orderUtxos: Core.TransactionUnspentOutput[], fees?: Map<string, bigint>): IOrderInfo[];
    /**
     * Full executability screen for one open order (WTB-1764): the datum
     * predicates plus the two value-dependent aborts (input funding, unsatisfiable
     * `min_received`). Every consumer that decides whether an order may join a
     * batch should call this rather than `screenOrderAction` alone — the datum-only
     * screen cannot see an underfunded UTxO, which is the cheapest batch-killer.
     *
     * Reads settings for the reserve multiplier on mint/burn. `getParsedProxyDatum`
     * memoises, so the per-order cost after the first call is local arithmetic —
     * safe for the approvals cron's whole-address sweep.
     */
    screenOrderForExecution(utxo: Core.TransactionUnspentOutput, action: IClassifiedOrderAction): Promise<TOrderSanityResult>;
    /**
     * Derive the value-dependent facts {@link screenOrderUtxoFacts} needs. Mirrors
     * the per-action consumed asset and ceiling the validators use; see that
     * function's doc comment for the `.ak` line references.
     */
    protected deriveOrderUtxoFacts(utxo: Core.TransactionUnspentOutput, action: IClassifiedOrderAction, settings: TV1SettingsConfig): Promise<IOrderUtxoFacts>;
    private deriveOrderUtxoFactsUnsafe;
    private getValidatedScreeningSettings;
    /**
     * Classify an order action from its datum.
     */
    protected classifyOrderAction(datum: OrderDatumV1): IClassifiedOrderAction;
    /**
     * Build the signed-payload treasury request for a deposit/withdraw order.
     *
     * v1_0 / v1_0_rc1 emit the four-field request. Versions whose on-chain
     * `TreasuryRequestV1` carries extra fields (v1_1_rc1's `diffusion_end`, which
     * the validator requires the signed request to echo from the order datum)
     * override this to add them; the return stays assignable to the v1_0 shape,
     * and the extra fields are encoded by the version's own payload schema value.
     */
    protected buildTreasuryRequest(datum: OrderDatumV1, parsed: IClassifiedOrderAction, origin: IRequestOrigin): TreasuryRequestV1;
    /**
     * Update treasury output with new reserve and circulating supply.
     */
    protected updateTreasuryOutput(tx: TxBuilder, treasuryUtxo: Core.TransactionUnspentOutput, parsedTreasuryDatum: V0_1TreasuryDatum, reserveDeltas: Map<string, bigint>, circulatingSupplyDelta: bigint): void;
    /**
     * Update treasury output without reserve changes (for DirectMint/DirectBurn).
     */
    protected updateTreasuryOutputNoReserve(tx: TxBuilder, treasuryUtxo: Core.TransactionUnspentOutput, parsedTreasuryDatum: V0_1TreasuryDatum, circulatingSupplyDelta: bigint): void;
    /**
     * Update vault output with new circulating_susdr and USDr balance.
     *
     * The datum construction is delegated to the version's
     * `buildUpdatedVaultDatum` seam; the value rebuild below is
     * datum-shape-agnostic and shared by all versions.
     */
    protected updateVaultOutput(tx: TxBuilder, vaultUtxo: Core.TransactionUnspentOutput, parsedVaultDatum: TVaultDatum, sUSDrDelta: bigint, uSDrDelta?: bigint): void;
    /**
     * Lock the vault output with an already-constructed datum, rebuilding its
     * USDr balance by `uSDrDelta`. The value rebuild is datum-shape-agnostic;
     * versions whose datum update needs more than `sUSDrDelta` (v1_1_rc1's
     * deposit diffusion window) build the datum themselves and call this.
     */
    protected updateVaultOutputWithDatum(tx: TxBuilder, vaultUtxo: Core.TransactionUnspentOutput, newVaultDatum: TVaultDatum, uSDrDelta?: bigint): void;
    protected getVersionSettings(): Promise<TSettings>;
}
//# sourceMappingURL=family.d.ts.map