import {
  Core,
  type Blaze,
  type Provider,
  type TxBuilder as BlazeTxBuilder,
  type Wallet,
} from "@blaze-cardano/sdk";
import { AssetAmount, type IAssetAmountMetadata } from "@sundaeswap/asset";
import {
  BlazeHelper,
  EContractVersion,
  EDatumType,
  EPoolCurve,
  ESwapType,
  SundaeSDK,
  SundaeUtils,
  type IComposedTx,
  type IPoolData,
  type ISwapConfigArgs,
  type TDestinationAddress,
  type TOrderAddressesArgs,
  type TSupportedNetworks,
  type TSwapType,
} from "@sundaeswap/core";

// Keep the partner construction surface self-contained. Consumers can build
// swap inputs through `SundaeSwap` without importing our implementation
// dependencies directly.
export { AssetAmount, EContractVersion, EDatumType, EPoolCurve, ESwapType };
export type {
  IAssetAmountMetadata,
  IPoolData,
  ISwapConfigArgs,
  TDestinationAddress,
  TSwapType,
};

import type { IBuildStakeContinuationParams } from "../sdk/v1/family.js";
import {
  addressToRealFiDestination,
  plutusDataFromCbor,
  realfiOwnerFromSundaeV3OwnerAddress,
  sundaeV3DestinationAddressFromStepResult,
} from "../tx-builder/destination.js";
import type { RealFiDestinationDatum } from "../tx-builder/destination.js";
import type { StakeContinuationBuilder } from "../tx-builder/registry.js";
import {
  createPoolDiscovery,
  createRuntimeCuratedPoolAssetsLoader,
  type ISundaePoolDiscoveryOptions,
  type ISundaePoolDiscoverySDK,
} from "./discovery.js";
import {
  assertSupportedSundaeSwapPool,
  assertSwappableSundaeSwapPool,
} from "./support.js";

export type {
  ISundaePoolDiscoveryOptions,
  ISundaePoolDiscoveryParams,
  ISundaePoolDiscoverySDK,
  TSundaePoolDiscoveryScope,
} from "./discovery.js";
export {
  assertSupportedSundaeSwapPool,
  assertSwappableSundaeSwapPool,
  isSupportedSundaeSwapVersion,
  isSwappableSundaeSwapVersion,
  SUPPORTED_SUNDAE_SWAP_VERSIONS,
  SWAPPABLE_SUNDAE_SWAP_VERSIONS,
  type TSundaeSwapVersion,
  type TSwappableSundaeSwapVersion,
} from "./support.js";

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

export type TSundaeOwnedSwapConfigArgs = Omit<
  ISwapConfigArgs,
  "ownerAddress" | "orderAddresses"
> & {
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
  buildSwapToStakeOrderTx(
    params: ISundaeSwapToStakeParams,
  ): Promise<TSundaeSwapOrder>;
}

/** Creates a network-scoped, Blaze-free Sundae pool discovery adapter. */
export function forNetwork(
  network: TSupportedNetworks,
  options: ISundaePoolDiscoveryOptions = {},
): ISundaePoolDiscoverySDK {
  return createPoolDiscovery(
    network,
    options,
    createRuntimeCuratedPoolAssetsLoader(options.partnerConfigUrl),
  );
}

function canonicalizePoolAsset(
  pool: IPoolData,
  asset: AssetAmount<IAssetAmountMetadata>,
): AssetAmount<IAssetAmountMetadata> {
  const metadata = [pool.assetA, pool.assetB].find((poolAsset) =>
    SundaeUtils.isAssetIdsEqual(poolAsset.assetId, asset.metadata.assetId),
  );

  if (!metadata) {
    throw new Error(
      `Asset is not part of the Sundae swap pool: ${asset.metadata.assetId}`,
    );
  }

  return new AssetAmount(asset.amount, metadata);
}

function oppositePoolAsset(
  pool: IPoolData,
  suppliedAsset: AssetAmount<IAssetAmountMetadata>,
): IAssetAmountMetadata {
  return suppliedAsset.metadata.assetId === pool.assetA.assetId
    ? pool.assetB
    : pool.assetA;
}

function canonicalizeSwapType(
  pool: IPoolData,
  suppliedAsset: AssetAmount<IAssetAmountMetadata>,
  swapType: TSwapType,
): TSwapType {
  if (swapType.type === ESwapType.MARKET) {
    return swapType;
  }

  const minReceivable = canonicalizePoolAsset(pool, swapType.minReceivable);
  const expectedAsset = oppositePoolAsset(pool, suppliedAsset);
  if (minReceivable.metadata.assetId !== expectedAsset.assetId) {
    throw new Error(
      `Sundae LIMIT minimum must use the pool asset opposite the supplied asset: ${expectedAsset.assetId}`,
    );
  }

  return { ...swapType, minReceivable };
}

function assertValidSlippage(slippage: number): void {
  if (!Number.isFinite(slippage) || slippage < 0 || slippage > 1) {
    throw new Error(
      "Sundae swap slippage must be a finite number between 0 and 1 inclusive",
    );
  }
}

function decimalFraction(value: number): {
  numerator: bigint;
  denominator: bigint;
} {
  const [coefficient = "0", exponentText] = value
    .toString()
    .toLowerCase()
    .split("e");
  const exponent = Number(exponentText ?? 0);
  const [whole, fraction = ""] = coefficient.split(".");
  const digits = BigInt(`${whole}${fraction}`);
  const scale = fraction.length - exponent;

  return scale > 0
    ? { numerator: digits, denominator: 10n ** BigInt(scale) }
    : { numerator: digits * 10n ** BigInt(-scale), denominator: 1n };
}

function ceilDiv(numerator: bigint, denominator: bigint): bigint {
  return numerator === 0n ? 0n : (numerator + denominator - 1n) / denominator;
}

/**
 * Applies the caller's decimal slippage to an integer quote without coercing
 * the quote to a JavaScript number. Sundae's helper performs that coercion,
 * which can weaken large minimums after `Number.MAX_SAFE_INTEGER`.
 */
function minReceivableFromSlippage(
  output: bigint,
  receivedAsset: IAssetAmountMetadata,
  slippage: number,
): AssetAmount<IAssetAmountMetadata> {
  const { numerator, denominator } = decimalFraction(slippage);
  const remaining = denominator - numerator;
  const amount = ceilDiv(output * remaining, denominator);

  return new AssetAmount(amount, receivedAsset);
}

/**
 * Why this fee cannot quote a constant-sum swap, or undefined if it can.
 *
 * At a fee of 1 the forward quote settles to nothing and the inverse divides by
 * zero; above 1 the forward quote goes negative. The bound matches
 * `ConstantSumPool.getSwapInput`'s own `[0, 1)` — the forward direction
 * tolerates exactly 1, but a pool taking the whole trade is not one we should be
 * quoting either way.
 */
function feeRefusal(currentFee: number): string | undefined {
  if (!Number.isFinite(currentFee) || currentFee < 0 || currentFee >= 1) {
    return `Sundae constant-sum swap requires a fee in [0, 1); got ${currentFee}`;
  }
  return undefined;
}

/**
 * The positive-amount rule matches what V3 and Stableswaps already enforce
 * through Sundae's "Input and reserves must be positive"; V4 was the only
 * version that quietly returned zero instead.
 */
function assertQuotableConstantSum(amount: bigint, currentFee: number): void {
  if (amount <= 0n) {
    throw new Error("Sundae constant-sum swap requires a positive amount");
  }
  const refusal = feeRefusal(currentFee);
  if (refusal) {
    throw new Error(refusal);
  }
}

/**
 * Settles a V4 (constant-sum) swap the way Sundae's own engine does:
 *
 *     output = offered − floor(offered × fee)
 *
 * That is `ConstantSumPool.getSwapOutput` from `@sundaeswap/math` specialised to
 * equal per-asset prices, not an approximation of it. We cannot call
 * `SundaeUtils.getSwapOutput` for V4 because it dispatches on `pool.curve`, and
 * the Sundae API populates neither `curve` nor `prices` — it would fall through
 * to `Unsupported v4 pool curve: undefined`.
 *
 * The rate comes from `currentFee`'s exact decimal expansion rather than a float
 * product: past `Number.MAX_SAFE_INTEGER` a float drops the low digits and
 * shifts the result, the same hazard {@link minReceivableFromSlippage} avoids.
 *
 * `priceWeight` is the pool's per-asset constant-sum price, which both assets of
 * a supported pool share. It cannot be divided out: the fee is floored at the
 * *scaled* value and the quotient is floored again, so the two roundings only
 * collapse into one at a weight of `1`. At a weight of `2`, offering `1999` at a
 * fee of `0.001` settles to `1997`, where dividing out would say `1998` — and
 * since this figure also becomes `minReceived`, the higher answer would leave a
 * floor the fill can never clear.
 *
 * Deliberately does NOT cap the output at the pool's reserve. `ConstantSumPool`
 * caps, because it prices one specific pool; a V4 order names no pool, so
 * capping here would silently lower `minReceived` — the owner's only guarantee —
 * whenever a large order is quoted against a shallow pool.
 */
function constantSumSwapOutput(
  offered: bigint,
  currentFee: number,
  priceWeight: bigint,
): bigint {
  assertQuotableConstantSum(offered, currentFee);

  const { numerator, denominator } = decimalFraction(currentFee);
  const offeredValue = offered * priceWeight;
  const feeValue = (offeredValue * numerator) / denominator;

  return (offeredValue - feeValue) / priceWeight;
}

/**
 * Quotes a V4 swap. `slippage` is validated by {@link quoteSwap} and then
 * ignored: a constant-sum pool has no price movement to buffer against, and —
 * decisively — the surplus above `min_received` is unbound on-chain, so slack in
 * the floor is not a safety margin, it is directly skimmable by the scooper.
 * `estimatedReceived` and `minReceived` are therefore the same figure.
 *
 * Assumes the pool weights its two assets equally. That precondition is
 * unverifiable from the API, which never serves `prices`; the matching-decimals
 * half of it is checked here, and the pools RealFi trades satisfy both.
 */
/**
 * Why this pool cannot be priced as an equal-weight constant-sum pool, or
 * undefined if it can. {@link constantSumPriceWeight} throws it and
 * {@link selectV4QuotePool} filters on it, so the two cannot drift apart.
 */
function constantSumRefusal(pool: IPoolData): string | undefined {
  // A V4 pool's swap math follows its invariant module, not its contract
  // version, so "V4" alone does not mean constant-sum. Nor does an absent
  // `curve`: that means whoever fetched the pool did not ask for it, which is
  // not evidence of anything. Pool discovery asks; Sundae's own query provider
  // does not.
  if (pool.curve !== EPoolCurve.ConstantSum) {
    return (
      `Sundae V4 pool ${pool.ident} is not known to be ${EPoolCurve.ConstantSum} ` +
      `(curve: ${pool.curve ?? "unknown"}). Resolve pools through pool ` +
      `discovery, which supplies the curve.`
    );
  }
  // Same story for `prices`: absent means unasked, not 1:1. Unequal weights need
  // the two-price form of the constant-sum formula and a reserve orientation
  // this quote does not model; equal weights of any magnitude are handled, and
  // carried into the arithmetic rather than divided out.
  if (pool.prices === undefined) {
    return (
      `Sundae V4 pool ${pool.ident} declares no price weights. Resolve pools ` +
      `through pool discovery, which supplies them.`
    );
  }
  const [priceIn, priceOut] = pool.prices;
  if (priceIn !== priceOut) {
    return (
      `Sundae V4 pool ${pool.ident} weights its assets ` +
      `${priceIn}:${priceOut}; only equal weights are priced here`
    );
  }
  if (priceIn <= 0n) {
    return `Sundae V4 pool ${pool.ident} declares a non-positive price weight`;
  }
  // Decimals stand in for the price weights we usually cannot see: a 1:1
  // constant-sum pair settles raw amounts one-for-one only at equal scale.
  if (pool.assetA.decimals !== pool.assetB.decimals) {
    return (
      `Sundae V4 pool ${pool.ident} pairs assets of differing decimals ` +
      `(${pool.assetA.decimals} and ${pool.assetB.decimals}); the 1:1 ` +
      `constant-sum assumption does not hold`
    );
  }
  return undefined;
}

function constantSumPriceWeight(pool: IPoolData): bigint {
  const refusal = constantSumRefusal(pool);
  if (refusal) {
    throw new Error(refusal);
  }
  return pool.prices![0];
}

/**
 * Stricter than the quote, deliberately: a swap form trades both ways against
 * the one pool it selected, so both reserves must be usable, where a single
 * quote only checks the side it pays out.
 */
function isSelectableV4Pool(pool: IPoolData): boolean {
  return (
    constantSumRefusal(pool) === undefined &&
    feeRefusal(pool.currentFee) === undefined &&
    pool.liquidity.aReserve > 0n &&
    pool.liquidity.bReserve > 0n
  );
}

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
export function selectV4QuotePool(pools: IPoolData[]): IPoolData | undefined {
  return pools
    .filter(
      (pool) =>
        pool.version === EContractVersion.V4 && isSelectableV4Pool(pool),
    )
    .reduce<
      IPoolData | undefined
    >((best, pool) => (best === undefined || pool.currentFee < best.currentFee ? pool : best), undefined);
}

function quoteConstantSumSwap(
  pool: IPoolData,
  suppliedAsset: AssetAmount<IAssetAmountMetadata>,
  receivedAsset: IAssetAmountMetadata,
  outputReserve: bigint,
): ISundaeSwapQuote {
  const priceIn = constantSumPriceWeight(pool);
  if (outputReserve <= 0n) {
    throw new Error(
      `Sundae V4 pool ${pool.ident} holds no ${receivedAsset.assetId} to swap into`,
    );
  }

  const output = constantSumSwapOutput(
    suppliedAsset.amount,
    pool.currentFee,
    priceIn,
  );

  return {
    estimatedReceived: new AssetAmount(output, receivedAsset),
    minReceived: new AssetAmount(output, receivedAsset),
    priceImpact: 0,
  };
}

/**
 * Quotes a market swap for any swappable pool version. Callers do not branch on
 * `pool.version`; this does.
 *
 * V3 / Stableswaps use Sundae's own pool math with the caller's slippage applied
 * at bigint precision. V4 is constant-sum — see {@link quoteConstantSumSwap} for
 * why its quote is exact, why `priceImpact` is `0`, and why `slippage` is
 * ignored there.
 */
export function quoteSwap({
  pool,
  suppliedAsset,
  slippage,
}: ISundaeSwapQuoteParams): ISundaeSwapQuote {
  assertSwappableSundaeSwapPool(pool);
  assertValidSlippage(slippage);

  const canonicalSuppliedAsset = canonicalizePoolAsset(pool, suppliedAsset);
  const receivesAssetA = SundaeUtils.isAssetIdsEqual(
    pool.assetB.assetId,
    canonicalSuppliedAsset.metadata.assetId,
  );
  const receivedAsset = receivesAssetA ? pool.assetA : pool.assetB;

  if (pool.version === EContractVersion.V4) {
    return quoteConstantSumSwap(
      pool,
      canonicalSuppliedAsset,
      receivedAsset,
      receivesAssetA ? pool.liquidity.aReserve : pool.liquidity.bReserve,
    );
  }

  const outcome = SundaeUtils.getSwapOutput(pool, canonicalSuppliedAsset);

  return {
    estimatedReceived: new AssetAmount(outcome.output, receivedAsset),
    minReceived: minReceivableFromSlippage(
      outcome.output,
      receivedAsset,
      slippage,
    ),
    priceImpact: outcome.priceImpact.toNumber(),
  };
}

/**
 * The smallest constant-sum supply that still yields `output`.
 *
 * Mirrors `ConstantSumPool.getSwapInput`. Not a plain gross-up: the forward
 * settlement is `ceil(input·price·(feeDen−feeNum)/feeDen)`, and that clears
 * `output·price` exactly when the numerator reaches `feeDen·(target−1)+1`, so
 * the `−1n` is what keeps the answer minimal rather than a unit high.
 */
function constantSumSwapInput(
  output: bigint,
  currentFee: number,
  priceWeight: bigint,
): bigint {
  // Reasserted here even though `quoteSwapInput` checks the amount: this is
  // where a fee of 1 would divide by zero, and the raw error would name the
  // division rather than the fee that caused it.
  assertQuotableConstantSum(output, currentFee);

  const { numerator: feeNum, denominator: feeDen } =
    decimalFraction(currentFee);
  const targetValue = output * priceWeight;
  const numerator = feeDen * (targetValue - 1n) + 1n;
  const denominator = (feeDen - feeNum) * priceWeight;

  return (numerator + denominator - 1n) / denominator;
}

/**
 * Quotes the supply needed to receive `desiredOutput`, for any swappable pool
 * version. The inverse of {@link quoteSwap}, and the direction a swap form needs
 * when the user edits the receive field rather than the pay field.
 */
export function quoteSwapInput({
  pool,
  desiredOutput,
}: ISundaeSwapInputQuoteParams): ISundaeSwapInputQuote {
  assertSwappableSundaeSwapPool(pool);

  const canonicalDesiredOutput = canonicalizePoolAsset(pool, desiredOutput);
  const suppliedAsset = oppositePoolAsset(pool, canonicalDesiredOutput);

  if (pool.version === EContractVersion.V4) {
    if (canonicalDesiredOutput.amount <= 0n) {
      throw new Error("Sundae V4 swap requires a positive desired output");
    }

    return {
      requiredInput: new AssetAmount(
        constantSumSwapInput(
          canonicalDesiredOutput.amount,
          pool.currentFee,
          constantSumPriceWeight(pool),
        ),
        suppliedAsset,
      ),
    };
  }

  return {
    requiredInput: new AssetAmount(
      SundaeUtils.getSwapInput(pool, canonicalDesiredOutput).input,
      suppliedAsset,
    ),
  };
}

/**
 * Builds a standalone Sundae swap order against a specific pool.
 *
 * V4 is quotable but not buildable here: its order carries no pool reference at
 * all, so it cannot share this pool-taking argument shape. Use
 * {@link buildSwapIntentTx}.
 */
export async function buildSwapOrderTx(
  blaze: Blaze<Provider, Wallet>,
  params: ISwapConfigArgs,
): Promise<TSundaeSwapOrder> {
  if (params.pool.version === EContractVersion.V4) {
    throw new Error(
      "Sundae V4 swaps are placed as pool-less intents; use buildSwapIntentTx",
    );
  }
  assertSupportedSundaeSwapPool(params.pool);
  if (params.swapType.type === ESwapType.MARKET) {
    assertValidSlippage(params.swapType.slippage);
  }

  const suppliedAsset = canonicalizePoolAsset(
    params.pool,
    params.suppliedAsset,
  );
  const swapType = canonicalizeSwapType(
    params.pool,
    suppliedAsset,
    params.swapType,
  );
  const builderSwapType: TSwapType =
    swapType.type === ESwapType.MARKET
      ? {
          type: ESwapType.LIMIT,
          minReceivable: minReceivableFromSlippage(
            SundaeUtils.getSwapOutput(params.pool, suppliedAsset).output,
            oppositePoolAsset(params.pool, suppliedAsset),
            swapType.slippage,
          ),
        }
      : swapType;
  const canonicalParams: ISwapConfigArgs = {
    ...params,
    suppliedAsset,
    // Convert MARKET inputs to the equivalent LIMIT input ourselves so the
    // Sundae builder cannot repeat its bigint-unsafe slippage calculation.
    swapType: builderSwapType,
  };

  const builder = SundaeSDK.new({ blazeInstance: blaze }).builder(
    params.pool.version,
  );
  return builder.swap(canonicalParams);
}

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
export async function buildSwapIntentTx(
  blaze: Blaze<Provider, Wallet>,
  params: ISundaeSwapIntentParams,
): Promise<TSundaeSwapOrder> {
  if (!params.ownerAddress) {
    throw new Error(
      "Sundae V4 swap requires ownerAddress so the order remains cancellable",
    );
  }
  if (params.offered.amount <= 0n) {
    throw new Error("Sundae V4 swap requires a positive offered amount");
  }
  if (params.minReceived.amount <= 0n) {
    throw new Error("Sundae V4 swap requires a positive minReceived amount");
  }
  if (
    SundaeUtils.isAssetIdsEqual(
      params.offered.metadata.assetId,
      params.minReceived.metadata.assetId,
    )
  ) {
    throw new Error(
      "Sundae V4 swap requires the offered and received assets to differ",
    );
  }

  const builder = SundaeSDK.new({ blazeInstance: blaze }).builder(
    EContractVersion.V4,
  );

  // Each optional is forwarded only when supplied, so Sundae's own defaults
  // apply otherwise.
  return builder.swapIntent({
    ownerAddress: params.ownerAddress,
    offered: params.offered,
    minReceived: params.minReceived,
    ...(params.destination === undefined
      ? {}
      : { destination: params.destination }),
    ...(params.budget === undefined ? {} : { budget: params.budget }),
    ...(params.maxPerExecution === undefined
      ? {}
      : { maxPerExecution: params.maxPerExecution }),
    ...(params.configToken === undefined
      ? {}
      : { configToken: params.configToken }),
  });
}

/**
 * Builds a Sundae V3 or Stableswaps order whose proceeds continue into a
 * version-aware RealFi stake order. The caller's original Sundae destination
 * becomes the RealFi destination, so both sUSDr and any USDr above Sundae's
 * guaranteed minimum continue to the intended recipient.
 */
export async function buildSwapToStakeOrderTx(
  blaze: Blaze<Provider, Wallet>,
  { sdk, swap, stake }: ISundaeSwapToStakeParams,
): Promise<TSundaeSwapOrder> {
  assertSupportedSundaeSwapPool(swap.pool);
  if (!swap.ownerAddress) {
    throw new Error(
      "Sundae swap-to-stake requires ownerAddress so the swap remains cancellable",
    );
  }

  // The Sundae builder validates the continuation address that replaces this
  // destination. Validate the caller's original final destination first so a
  // cross-network address or a script address without a datum cannot be hidden
  // by composition and later receive the sUSDr/excess output incorrectly.
  BlazeHelper.validateAddressAndDatumAreValid({
    ...swap.orderAddresses.DestinationAddress,
    network: SundaeUtils.getNetworkFromProvider(blaze.provider.networkName),
  });

  const suppliedAsset = canonicalizePoolAsset(swap.pool, swap.suppliedAsset);
  const swapType = canonicalizeSwapType(
    swap.pool,
    suppliedAsset,
    swap.swapType,
  );
  const minReceived =
    swapType.type === ESwapType.LIMIT
      ? swapType.minReceivable
      : quoteSwap({
          pool: swap.pool,
          suppliedAsset,
          slippage: swapType.slippage,
        }).minReceived;

  const continuation = await sdk.buildStakeContinuation({
    ...stake,
    owner:
      stake?.owner ??
      realfiOwnerFromSundaeV3OwnerAddress(
        Core.Address.fromBech32(swap.ownerAddress).getNetworkId() ===
          Core.NetworkId.Mainnet
          ? "mainnet"
          : "preview",
        swap.ownerAddress,
      ),
    swap: { minReceived },
    destination: realfiDestinationFromSundaeDestination(
      swap.orderAddresses.DestinationAddress,
    ),
  });

  return buildSwapOrderTx(blaze, {
    ...swap,
    orderAddresses: {
      DestinationAddress:
        sundaeV3DestinationAddressFromStepResult(continuation),
      ...(swap.orderAddresses.AlternateAddress
        ? { AlternateAddress: swap.orderAddresses.AlternateAddress }
        : {}),
    },
  });
}

/** Creates a Blaze-scoped partner swap adapter. */
export function create(blaze: Blaze<Provider, Wallet>): ISundaeSwapSDK {
  return {
    quoteSwap,
    quoteSwapInput,
    buildSwapOrderTx: (params) => buildSwapOrderTx(blaze, params),
    buildSwapIntentTx: (params) => buildSwapIntentTx(blaze, params),
    buildSwapToStakeOrderTx: (params) => buildSwapToStakeOrderTx(blaze, params),
  };
}

function realfiDestinationFromSundaeDestination({
  address,
  datum,
}: TDestinationAddress) {
  const realfiDatum: RealFiDestinationDatum = (() => {
    switch (datum.type) {
      case EDatumType.NONE:
        return "NoDatum";
      case EDatumType.HASH:
        return { DatumHash: [datum.value] };
      case EDatumType.INLINE:
        return { InlineDatum: [plutusDataFromCbor(datum.value)] };
      default: {
        const unreachable: never = datum;
        return unreachable;
      }
    }
  })();

  return addressToRealFiDestination(
    Core.Address.fromBech32(address),
    realfiDatum,
  );
}
