/**
 * Find a reserve asset config by policy+name from settings.
 */
export function findReserveAsset(settings, asset) {
  const found = settings.reserve_assets.find(ra => ra.asset[0] === asset[0] && ra.asset[1] === asset[1]);
  if (!found) {
    throw new Error(`Reserve asset not found in settings: ${asset[0]}${asset[1]}`);
  }
  if (found.numerator === 0n) {
    throw new Error("Reserve asset numerator must be non-zero");
  }
  if (found.denominator === 0n) {
    throw new Error("Reserve asset denominator must be non-zero");
  }
  return found;
}

/**
 * Convert USDr amount to reserve amount (floor division, protocol-protective for burns).
 * Matches on-chain: usdr_to_reserve(amount, ra) = amount * denominator / numerator
 */
export function usdrToReserve(usdrAmount, ra) {
  return usdrAmount * ra.denominator / ra.numerator;
}

/**
 * Convert USDr amount to reserve amount (ceiling division, protocol-protective for mints).
 * Matches on-chain: usdr_to_reserve_ceil(amount, ra) = (amount * denominator + numerator - 1) / numerator
 */
export function usdrToReserveCeil(usdrAmount, ra) {
  return (usdrAmount * ra.denominator + ra.numerator - 1n) / ra.numerator;
}

/**
 * Compute per-reserve-asset deltas from order infos.
 * Groups orders by reserve asset and converts USDr amounts to reserve amounts.
 * @param negate If true, negate the delta (used for withdraw where amounts are positive but treasury outflow is negative)
 */
export function computeReserveDeltas(orderInfos, settings, negate = false) {
  const deltas = new Map();
  const amountsByAsset = new Map();
  for (const orderInfo of orderInfos) {
    const assetKey = orderInfo.reserveAsset[0] + orderInfo.reserveAsset[1];
    amountsByAsset.set(assetKey, (amountsByAsset.get(assetKey) ?? 0n) + orderInfo.amount);
  }
  for (const [assetKey, totalUsdr] of amountsByAsset.entries()) {
    const orderWithAsset = orderInfos.find(o => o.reserveAsset[0] + o.reserveAsset[1] === assetKey);
    const ra = findReserveAsset(settings, orderWithAsset.reserveAsset);
    const reserveAmount = usdrToReserve(negate ? -totalUsdr : totalUsdr, ra);
    deltas.set(assetKey, reserveAmount);
  }
  return deltas;
}
//# sourceMappingURL=reserve-assets.js.map