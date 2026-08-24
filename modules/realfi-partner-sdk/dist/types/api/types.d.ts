export type TOrderStatus = "Open" | "Validating" | "Canceled" | "Executed" | "Invalidated" | "InvalidMinReceived";
export type TOrderAction = "Mint" | "Redeem" | "Deposit" | "Withdraw" | "Stake" | "Unstake" | "DirectMint" | "DirectBurn";
export interface IApiOrderUtxo {
    txHash: string;
    outputIndex: number;
}
export interface IOrderInfo {
    owner: string;
    action: TOrderAction;
    status: TOrderStatus;
    amount: bigint;
    slot: bigint;
    forfeit: bigint;
    version: string;
    utxo: IApiOrderUtxo;
    /** Output produced once the order is Executed or Canceled. */
    resultUtxo?: IApiOrderUtxo;
    /** Timelock unlock slot (Unstake only). */
    unlockSlot?: bigint;
    /** Cooldown maturity slot (Unstake only). */
    matureSlot?: bigint;
    /** Populated for Deposit orders. */
    principal?: bigint;
    /** Populated for Deposit orders. */
    yield?: bigint;
    /** Transaction that claimed an Unstake order's cooldown output. */
    claimTxHash?: string;
}
export interface IStakeTimes {
    currentCooldownSlot: bigint;
    nextCooldownSlot: bigint;
}
export interface IOrderFees {
    mintBps: number;
    redeemBps: number;
}
export interface IYieldBreakdown {
    totalSUSDr: bigint;
    totalUSDrValue: bigint;
    principal: bigint;
    yield: bigint;
    yieldPercent: number;
}
export interface IPointsBalance {
    pointsBalance: number | null;
    potentialPoints: number | null;
    multiplier: number | null;
}
export interface IReferrerCode {
    code: string;
    createdAt: string;
}
/**
 * Non-negative safe-integer USD UX/business minimums; not protocol
 * `min_received` or fees.
 */
export interface IPartnerLimits {
    readonly mintMinUsd: number;
    readonly redeemMinUsd: number;
}
/**
 * Environment runtime configuration shared with the deployed RealFi dapp.
 *
 * `swapCounterpartAssets` is the product-curated live swap list.
 * `swapOrderHistoryAssets` is its superset for historical and in-flight orders,
 * including disabled pairs. The deploy artifact falls back to the live list
 * when the dapp source leaves the history list unset.
 * Every asset identifier uses Sundae's canonical dotted form
 * (`policyId.assetName`, or `ada.lovelace`), not Cardano Core's concatenated
 * `Core.AssetId` representation. The values can be passed directly to
 * `RealfiSDK.sundae` discovery and builder APIs.
 */
export interface IPartnerConfig {
    /** Authoritative USDr ID in Sundae's dotted `policyId.assetName` form. */
    readonly stablecoinAssetId: string;
    readonly swapCounterpartAssets: readonly string[];
    readonly swapOrderHistoryAssets: readonly string[];
    readonly limits: IPartnerLimits;
}
//# sourceMappingURL=types.d.ts.map