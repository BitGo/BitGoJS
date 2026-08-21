import { type IPoolData, type TSupportedNetworks } from "@sundaeswap/core";
/**
 * Which pools discovery returns, narrowing left to right:
 * `curated ⊆ buildable ⊆ all`.
 *
 * - `all` — every pool the Sundae API returns for the asset, any version.
 * - `buildable` — those the SDK can build an order *for*. Note "for", not
 *   "against": a V4 pool is included because the SDK places a pool-less intent
 *   for it, even though no order names the pool.
 * - `curated` — the buildable pools whose pair RealFi has approved.
 */
export type TSundaePoolDiscoveryScope = "curated" | "buildable" | "all";
export interface ISundaePoolDiscoveryParams {
    /** Defaults to the RealFi-approved `curated` scope. */
    scope?: TSundaePoolDiscoveryScope;
}
export interface ISundaePoolDiscoveryOptions {
    /** Overrides Sundae's endpoint while retaining the network for fee math. */
    endpoint?: string;
    /** Overrides RealFi's runtime partner configuration for custom deployments. */
    partnerConfigUrl?: string;
}
export interface ISundaePoolDiscoverySDK {
    findPoolsByAsset(assetId: string, params?: ISundaePoolDiscoveryParams): Promise<IPoolData[]>;
}
/** Internal seam for RealFi's authoritative runtime pair configuration. */
export interface ISundaeCuratedPoolAssets {
    baseAssetId: string;
    counterpartAssetIds: readonly string[];
}
export type TSundaeCuratedPoolAssetsLoader = (network: TSupportedNetworks) => Promise<ISundaeCuratedPoolAssets>;
/**
 * Internal constructor. The loader remains behind the package export boundary
 * so RealFi, not partners, owns curated pair selection.
 */
export declare function createPoolDiscovery(network: TSupportedNetworks, options?: ISundaePoolDiscoveryOptions, loadCuratedPoolAssets?: TSundaeCuratedPoolAssetsLoader): ISundaePoolDiscoverySDK;
/** RealFi-owned runtime curation used by the public network factory. */
export declare function createRuntimeCuratedPoolAssetsLoader(partnerConfigUrl?: string): TSundaeCuratedPoolAssetsLoader;
//# sourceMappingURL=discovery.d.ts.map