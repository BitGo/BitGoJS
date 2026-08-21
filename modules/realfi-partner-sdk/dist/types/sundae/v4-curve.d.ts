import { type IPoolData } from "@sundaeswap/core";
/**
 * Returns `pools` with `curve`/`prices` filled in for the v4 pools that lacked
 * them. A pool the query cannot describe is returned untouched; a failed request
 * leaves every pool untouched, so discovery degrades to today's behaviour rather
 * than failing outright.
 */
export declare function withV4CurveData(pools: readonly IPoolData[], assetId: string, endpoint: string): Promise<IPoolData[]>;
//# sourceMappingURL=v4-curve.d.ts.map