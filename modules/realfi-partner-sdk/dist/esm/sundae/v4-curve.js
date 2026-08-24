import { EContractVersion, EPoolCurve } from "@sundaeswap/core";

/**
 * Fills in the two v4 fields Sundae's own pool query does not select.
 *
 * `QueryProviderSundaeSwap.findPoolDataByAssetId` builds its query inside
 * `@sundaeswap/core`, and that query asks for neither `modules` nor `prices`.
 * So every v4 pool it returns arrives with `curve` and `prices` undefined, and
 * anything downstream has to assume the curve rather than check it.
 *
 * This is a stopgap for that gap, deliberately shaped to retire itself: it only
 * queries for pools that are *missing* the fields. The day Sundae selects them
 * upstream, the candidate list is empty, the extra request never fires, and
 * deleting this module is pure cleanup rather than a behaviour change.
 */

const POOL_CURVE_QUERY = `query poolCurves($asset: ID!) {
  pools { byAsset(asset: $asset) { id modules { identifier } prices } }
}`;
const CURVES = [EPoolCurve.ConstantProduct, EPoolCurve.ConstantSum, EPoolCurve.ConcentratedLiquidity];

/**
 * The invariant module identifiers are exactly the `EPoolCurve` values, so match
 * on those rather than on the `kind` discriminator — one less shape to depend on.
 */
function curveOf(row) {
  return CURVES.find(curve => (row.modules ?? []).some(module => module.identifier === curve));
}

/**
 * `IPoolData.prices` is a two-tuple aligned to `[assetA, assetB]`, but a v4 pool
 * can hold up to 16 assets and the API returns a weight for each. Two cases are
 * safe to map:
 *
 * - every weight is equal, so whichever two `assetA`/`assetB` project to are
 *   equal as well — this is what RealFi's stablecoin pools look like, including
 *   the three-asset ones;
 * - exactly two weights, which align with the pair directly.
 *
 * Anything else is left undefined rather than guessed at. A consumer that needs
 * the weights then refuses the pool, which is the right answer for a pool we
 * cannot describe.
 */
function pricesOf(row) {
  const raw = row.prices ?? [];
  if (raw.length === 0) return undefined;
  const weights = raw.map(price => BigInt(price));
  if (new Set(weights).size === 1) {
    return [weights[0], weights[0]];
  }
  return weights.length === 2 ? [weights[0], weights[1]] : undefined;
}
function needsCurveData(pool) {
  return pool.version === EContractVersion.V4 && (pool.curve === undefined || pool.prices === undefined);
}

/**
 * Returns `pools` with `curve`/`prices` filled in for the v4 pools that lacked
 * them. A pool the query cannot describe is returned untouched; a failed request
 * leaves every pool untouched, so discovery degrades to today's behaviour rather
 * than failing outright.
 */
export async function withV4CurveData(pools, assetId, endpoint) {
  if (!pools.some(needsCurveData)) {
    return [...pools];
  }
  let rows;
  try {
    const response = await fetch(endpoint, {
      body: JSON.stringify({
        query: POOL_CURVE_QUERY,
        variables: {
          asset: assetId
        }
      }),
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST"
    });
    const payload = await response.json();
    rows = payload.data?.pools?.byAsset ?? [];
  } catch {
    return [...pools];
  }
  const byIdent = new Map(rows.map(row => [row.id, row]));
  return pools.map(pool => {
    if (!needsCurveData(pool)) return pool;
    const row = byIdent.get(pool.ident);
    if (!row) return pool;
    const curve = pool.curve ?? curveOf(row);
    const prices = pool.prices ?? pricesOf(row);
    return {
      ...pool,
      ...(curve === undefined ? {} : {
        curve
      }),
      ...(prices === undefined ? {} : {
        prices
      })
    };
  });
}
//# sourceMappingURL=v4-curve.js.map