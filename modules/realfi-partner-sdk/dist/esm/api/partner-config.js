function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Cardano native asset names are 0-32 bytes, so the canonical dotted form may
// legitimately end after the separator. Policy IDs and byte strings are
// lowercase hex; ADA is Sundae's single canonical non-native sentinel.
const PARTNER_ASSET_ID = /^(?:ada\.lovelace|[0-9a-f]{56}\.(?:[0-9a-f]{2}){0,32})$/;
function readAssetList(source, key) {
  const value = source[key];
  if (!Array.isArray(value) || !value.every(asset => typeof asset === "string" && PARTNER_ASSET_ID.test(asset))) {
    throw new Error(`invalid partner configuration: ${key} must be an asset ID array`);
  }
  return [...value];
}
function readLimit(source, key) {
  const value = source[key];
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`invalid partner configuration: limits.${key} must be a non-negative safe integer`);
  }
  return value;
}
function readStablecoinAssetId(source) {
  const assetId = source.stablecoinAssetId;
  if (typeof assetId !== "string" || !/^[0-9a-f]{56}\.(?:[0-9a-f]{2}){1,32}$/.test(assetId)) {
    throw new Error("invalid partner configuration: stablecoinAssetId must be a canonical Sundae asset ID");
  }
  return assetId;
}

/** Validate untrusted JSON and return fresh partner-owned values. */
export function parsePartnerConfig(value) {
  if (!isRecord(value)) {
    throw new Error("invalid partner configuration: expected an object");
  }
  const swapCounterpartAssets = readAssetList(value, "swapCounterpartAssets");
  const swapOrderHistoryAssets = readAssetList(value, "swapOrderHistoryAssets");
  const history = new Set(swapOrderHistoryAssets);
  const omittedLiveAsset = swapCounterpartAssets.find(asset => !history.has(asset));
  if (omittedLiveAsset !== undefined) {
    throw new Error(`invalid partner configuration: history list omits live swap asset ${omittedLiveAsset}`);
  }
  if (!isRecord(value.limits)) {
    throw new Error("invalid partner configuration: limits must be an object");
  }
  return {
    stablecoinAssetId: readStablecoinAssetId(value),
    swapCounterpartAssets,
    swapOrderHistoryAssets,
    limits: {
      mintMinUsd: readLimit(value.limits, "mintMinUsd"),
      redeemMinUsd: readLimit(value.limits, "redeemMinUsd")
    }
  };
}
//# sourceMappingURL=partner-config.js.map