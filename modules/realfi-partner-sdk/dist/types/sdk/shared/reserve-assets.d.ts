import type { IReserveAsset } from "./types.js";
type TSettingsWithReserveAssets = {
    reserve_assets: IReserveAsset[];
};
type TOrderInfoWithReserveAsset = {
    reserveAsset?: [string, string];
    amount: bigint;
};
/**
 * Find a reserve asset config by policy+name from settings.
 */
export declare function findReserveAsset(settings: TSettingsWithReserveAssets, asset: [string, string]): IReserveAsset;
/**
 * Convert USDr amount to reserve amount (floor division, protocol-protective for burns).
 * Matches on-chain: usdr_to_reserve(amount, ra) = amount * denominator / numerator
 */
export declare function usdrToReserve(usdrAmount: bigint, ra: IReserveAsset): bigint;
/**
 * Convert USDr amount to reserve amount (ceiling division, protocol-protective for mints).
 * Matches on-chain: usdr_to_reserve_ceil(amount, ra) = (amount * denominator + numerator - 1) / numerator
 */
export declare function usdrToReserveCeil(usdrAmount: bigint, ra: IReserveAsset): bigint;
/**
 * Compute per-reserve-asset deltas from order infos.
 * Groups orders by reserve asset and converts USDr amounts to reserve amounts.
 * @param negate If true, negate the delta (used for withdraw where amounts are positive but treasury outflow is negative)
 */
export declare function computeReserveDeltas(orderInfos: TOrderInfoWithReserveAsset[], settings: TSettingsWithReserveAssets, negate?: boolean): Map<string, bigint>;
export {};
//# sourceMappingURL=reserve-assets.d.ts.map