import { Core, type Blaze, type Provider, type TxBuilder as BlazeTxBuilder, type Wallet } from "@blaze-cardano/sdk";
import { AssetAmount, type IAssetAmountMetadata } from "@sundaeswap/asset";
import { EContractVersion, EDatumType, EPoolCurve, ESwapType, type IComposedTx, type IPoolData, type ISwapConfigArgs, type TDestinationAddress, type TOrderAddressesArgs, type TSupportedNetworks, type TSwapType } from "@sundaeswap/core";
export { AssetAmount, EContractVersion, EDatumType, EPoolCurve, ESwapType };
export type { IAssetAmountMetadata, IPoolData, ISwapConfigArgs, TDestinationAddress, TSwapType, };
import type { IBuildStakeContinuationParams } from "../sdk/v1/family.js";
import type { StakeContinuationBuilder } from "../tx-builder/registry.js";
import { type ISundaePoolDiscoveryOptions, type ISundaePoolDiscoverySDK } from "./discovery.js";
export type { ISundaePoolDiscoveryOptions, ISundaePoolDiscoveryParams, ISundaePoolDiscoverySDK, TSundaePoolDiscoveryScope, } from "./discovery.js";
export { assertSupportedSundaeSwapPool, assertSwappableSundaeSwapPool, isSupportedSundaeSwapVersion, isSwappableSundaeSwapVersion, SUPPORTED_SUNDAE_SWAP_VERSIONS, SWAPPABLE_SUNDAE_SWAP_VERSIONS, type TSundaeSwapVersion, type TSwappableSundaeSwapVersion, } from "./support.js";
export interface ISundaeSwapQuoteParams {
    pool: IPoolData;
    suppliedAsset: AssetAmount<IAssetAmountMetadata>;
    /** Decimal fraction: `0.01` is 1%. No application default is applied. */
    slippage: number;
}
export interface ISundaeSwapQuote {
    estimatedReceived: AssetAmount<IAssetAmountMetadata>;
    minReceived: AssetAmount<IAssetAmountMetadata>;
    /** Decimal fraction: `0.01` is 1%. */
    priceImpact: number;
}
export interface ISundaeSwapInputQuoteParams {
    pool: IPoolData;
    /** The amount the owner wants to receive. */
    desiredOutput: AssetAmount<IAssetAmountMetadata>;
}
export interface ISundaeSwapInputQuote {
    /** The smallest supply that still yields `desiredOutput`. */
    requiredInput: AssetAmount<IAssetAmountMetadata>;
}
export type TSundaeSwapOrder = IComposedTx<BlazeTxBuilder, Core.Transaction>;
export type TSundaeOwnedSwapConfigArgs = Omit<ISwapConfigArgs, "ownerAddress" | "orderAddresses"> & {
    ownerAddress: string;
    /** Final recipient and optional cancellation address; not a Sundae order route. */
    orderAddresses: Omit<TOrderAddressesArgs, "PoolDestinationVersion">;
};
export interface ISundaeSwapToStakeParams {
    sdk: StakeContinuationBuilder;
    swap: TSundaeOwnedSwapConfigArgs;
    stake?: Omit<IBuildStakeContinuationParams, "swap" | "destination">;
}
/**
 * A V4 swap intent: an offer and a floor, naming no pool.
 *
 * `referralFee` is deliberately not surfaced — no RealFi path takes one.
 */
export interface ISundaeSwapIntentParams {
    /** Bech32 owner: the cancel authority and the default payout destination. */
    ownerAddress: string;
    /** What the owner pays into the swap. */
    offered: AssetAmount<IAssetAmountMetadata>;
    /**
     * The floor the fill must clear, and the owner's only guarantee: the surplus
     * above it is unbound on-chain, so the scooper keeps whatever the fill clears
     * it by. Take it from {@link quoteSwap}; never slacken it to help an order
     * fill.
     */
    minReceived: AssetAmount<IAssetAmountMetadata>;
    /** Final recipient. Defaults to a fixed destination at `ownerAddress`. */
    destination?: TDestinationAddress | "Self";
    /** Lifetime service-fee allocation, in lovelace. */
    budget?: bigint;
    /**
     * Per-scoop fee cap, in lovelace — also the scooper's routing fan-out budget
     * (`maxPerExecution / costPerPool` pools). Too small and the order cannot be
     * routed at all; a fill spanning more of the pair's pools needs more of it.
     */
    maxPerExecution?: bigint;
    /**
     * The OrderConfig settings entry this order fulfills. Resolved from the
     * protocol query when omitted — but that query returns nothing on a
     * deployment whose API does not serve settings yet, so it stays passable.
     */
    configToken?: string;
}
export interface ISundaeSwapSDK {
    quoteSwap(params: ISundaeSwapQuoteParams): ISundaeSwapQuote;
    quoteSwapInput(params: ISundaeSwapInputQuoteParams): ISundaeSwapInputQuote;
    buildSwapOrderTx(params: ISwapConfigArgs): Promise<TSundaeSwapOrder>;
    /** V4 only: a pool-less intent. See {@link buildSwapIntentTx}. */
    buildSwapIntentTx(params: ISundaeSwapIntentParams): Promise<TSundaeSwapOrder>;
    buildSwapToStakeOrderTx(params: ISundaeSwapToStakeParams): Promise<TSundaeSwapOrder>;
}
/** Creates a network-scoped, Blaze-free Sundae pool discovery adapter. */
export declare function forNetwork(network: TSupportedNetworks, options?: ISundaePoolDiscoveryOptions): ISundaePoolDiscoverySDK;
/**
 * Picks the V4 pool whose fee should quote a swap, ignoring any non-V4 pool in
 * `pools` and any V4 pool {@link quoteSwap} would refuse. Undefined when none
 * qualifies, which means the caller should fall back to another version.
 *
 * A V4 order names no pool, so this routes nothing — it only decides whose fee
 * sets `min_received`. Cheapest is both the best rate and the safer pick: the
 * floor is the owner's only guarantee, and a pool overstating its fee would drag
 * it down into territory a scooper can fill cheaply and pocket the difference.
 * A hostile pool can therefore only win by genuinely being the cheapest.
 *
 * Selection lives here rather than in the caller so that the eligibility rules
 * have one home. `SundaeUtils.getBestPoolBySwapOutcome` is the equivalent for
 * the other versions and cannot be used: it calls `getSwapOutput`, which throws
 * on a V4 pool.
 */
export declare function selectV4QuotePool(pools: IPoolData[]): IPoolData | undefined;
/**
 * Quotes a market swap for any swappable pool version. Callers do not branch on
 * `pool.version`; this does.
 *
 * V3 / Stableswaps use Sundae's own pool math with the caller's slippage applied
 * at bigint precision. V4 is constant-sum — see {@link quoteConstantSumSwap} for
 * why its quote is exact, why `priceImpact` is `0`, and why `slippage` is
 * ignored there.
 */
export declare function quoteSwap({ pool, suppliedAsset, slippage, }: ISundaeSwapQuoteParams): ISundaeSwapQuote;
/**
 * Quotes the supply needed to receive `desiredOutput`, for any swappable pool
 * version. The inverse of {@link quoteSwap}, and the direction a swap form needs
 * when the user edits the receive field rather than the pay field.
 */
export declare function quoteSwapInput({ pool, desiredOutput, }: ISundaeSwapInputQuoteParams): ISundaeSwapInputQuote;
/**
 * Builds a standalone Sundae swap order against a specific pool.
 *
 * V4 is quotable but not buildable here: its order carries no pool reference at
 * all, so it cannot share this pool-taking argument shape. Use
 * {@link buildSwapIntentTx}.
 */
export declare function buildSwapOrderTx(blaze: Blaze<Provider, Wallet>, params: ISwapConfigArgs): Promise<TSundaeSwapOrder>;
/**
 * Places a Sundae V4 swap.
 *
 * A V4 order is an intent: an offer and a floor, naming no pool. The scooper
 * decides how to fill it — one pool, a split across the pair's pools, or a
 * multi-hop chain — and `minReceived` is what bounds the result.
 *
 * Goes through `swapIntent` rather than `swap`: `TxBuilderV4.swap` throws by
 * design, because a swap order carries the route constraint, which is outside
 * the launch's audited surface.
 */
export declare function buildSwapIntentTx(blaze: Blaze<Provider, Wallet>, params: ISundaeSwapIntentParams): Promise<TSundaeSwapOrder>;
/**
 * Builds a Sundae V3 or Stableswaps order whose proceeds continue into a
 * version-aware RealFi stake order. The caller's original Sundae destination
 * becomes the RealFi destination, so both sUSDr and any USDr above Sundae's
 * guaranteed minimum continue to the intended recipient.
 */
export declare function buildSwapToStakeOrderTx(blaze: Blaze<Provider, Wallet>, { sdk, swap, stake }: ISundaeSwapToStakeParams): Promise<TSundaeSwapOrder>;
/** Creates a Blaze-scoped partner swap adapter. */
export declare function create(blaze: Blaze<Provider, Wallet>): ISundaeSwapSDK;
//# sourceMappingURL=index.d.ts.map