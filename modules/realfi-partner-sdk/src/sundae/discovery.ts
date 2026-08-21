import {
  QueryProviderSundaeSwap,
  SundaeUtils,
  type IPoolData,
  type TSupportedNetworks,
} from "@sundaeswap/core";

import { RealfiApi } from "../api/realfi-api.js";
import { API_REGISTRY } from "../api/registry.js";
import { isSwappableSundaeSwapVersion } from "./support.js";
import { withV4CurveData } from "./v4-curve.js";

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
  findPoolsByAsset(
    assetId: string,
    params?: ISundaePoolDiscoveryParams,
  ): Promise<IPoolData[]>;
}

/** Internal seam for RealFi's authoritative runtime pair configuration. */
export interface ISundaeCuratedPoolAssets {
  baseAssetId: string;
  counterpartAssetIds: readonly string[];
}

export type TSundaeCuratedPoolAssetsLoader = (
  network: TSupportedNetworks,
) => Promise<ISundaeCuratedPoolAssets>;

const SUNDAE_POOL_QUERY_RESULT_LIMIT = 50;
const SUNDAE_POOL_DISCOVERY_SCOPES: readonly TSundaePoolDiscoveryScope[] = [
  "curated",
  "buildable",
  "all",
];

function isPoolAsset(assetId: string, candidate: string): boolean {
  return SundaeUtils.isAssetIdsEqual(assetId, candidate);
}

function poolContainsAsset(pool: IPoolData, assetId: string): boolean {
  return (
    isPoolAsset(pool.assetA.assetId, assetId) ||
    isPoolAsset(pool.assetB.assetId, assetId)
  );
}

function deterministicUniquePools(pools: readonly IPoolData[]): IPoolData[] {
  const unique = new Map<string, IPoolData>();
  for (const pool of pools) {
    const key = `${pool.version}\u0000${pool.ident}`;
    if (!unique.has(key)) {
      unique.set(key, pool);
    }
  }

  return [...unique.values()].sort((left, right) => {
    if (left.ident !== right.ident) {
      return left.ident < right.ident ? -1 : 1;
    }
    if (left.version === right.version) {
      return 0;
    }
    return left.version < right.version ? -1 : 1;
  });
}

function isCuratedPool(
  pool: IPoolData,
  { baseAssetId, counterpartAssetIds }: ISundaeCuratedPoolAssets,
): boolean {
  const aIsBase = isPoolAsset(pool.assetA.assetId, baseAssetId);
  const bIsBase = isPoolAsset(pool.assetB.assetId, baseAssetId);
  const counterpartId = aIsBase
    ? pool.assetB.assetId
    : bIsBase
      ? pool.assetA.assetId
      : undefined;

  return (
    counterpartId !== undefined &&
    counterpartAssetIds.some((assetId) => isPoolAsset(counterpartId, assetId))
  );
}

/**
 * Internal constructor. The loader remains behind the package export boundary
 * so RealFi, not partners, owns curated pair selection.
 */
export function createPoolDiscovery(
  network: TSupportedNetworks,
  options: ISundaePoolDiscoveryOptions = {},
  loadCuratedPoolAssets?: TSundaeCuratedPoolAssetsLoader,
): ISundaePoolDiscoverySDK {
  const queryProvider = new QueryProviderSundaeSwap(network);
  if (options.endpoint !== undefined) {
    queryProvider.baseUrl = options.endpoint;
  }

  return {
    async findPoolsByAsset(
      assetId,
      { scope = "curated" }: ISundaePoolDiscoveryParams = {},
    ) {
      if (assetId.trim().length === 0) {
        throw new Error("Sundae pool discovery requires a non-empty asset id");
      }
      if (!SUNDAE_POOL_DISCOVERY_SCOPES.includes(scope)) {
        throw new Error(`Unsupported Sundae pool discovery scope: ${scope}`);
      }
      if (scope === "curated" && !loadCuratedPoolAssets) {
        throw new Error(
          "Curated Sundae pool discovery requires authoritative RealFi asset configuration",
        );
      }

      const curatedAssets =
        scope === "curated" ? await loadCuratedPoolAssets!(network) : undefined;
      const rawPools = await queryProvider.findPoolDataByAssetId(assetId);
      // Sundae's byAsset query has no pagination arguments. Treat the gateway's
      // 50-result boundary as incomplete rather than silently hiding pools.
      if (rawPools.length >= SUNDAE_POOL_QUERY_RESULT_LIMIT) {
        throw new Error(
          `Sundae pool discovery returned ${rawPools.length} pools for ${assetId}; results may be truncated`,
        );
      }

      // Before any scope filter, so `all` carries the curve data too. Retires
      // itself once Sundae's own query selects these fields — see v4-curve.ts.
      const all = await withV4CurveData(
        deterministicUniquePools(rawPools),
        assetId,
        queryProvider.baseUrl,
      );
      if (scope === "all") {
        return all;
      }

      // `swap`, not `buildAgainstPool` — see TSundaePoolDiscoveryScope. The
      // narrower capability would hide V4 from `curated` too, since that is
      // derived from this.
      const buildable = all.filter(
        (pool) =>
          isSwappableSundaeSwapVersion(pool.version) &&
          poolContainsAsset(pool, assetId),
      );
      if (scope === "buildable") {
        return buildable;
      }

      return buildable.filter((pool) => isCuratedPool(pool, curatedAssets!));
    },
  };
}

/** RealFi-owned runtime curation used by the public network factory. */
export function createRuntimeCuratedPoolAssetsLoader(
  partnerConfigUrl?: string,
): TSundaeCuratedPoolAssetsLoader {
  return async (network) => {
    const api = RealfiApi.create({
      ...API_REGISTRY[network],
      ...(partnerConfigUrl === undefined ? {} : { partnerConfigUrl }),
    });
    const config = await api.getPartnerConfig();
    return {
      baseAssetId: config.stablecoinAssetId,
      counterpartAssetIds: config.swapCounterpartAssets,
    };
  };
}
