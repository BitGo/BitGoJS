"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parsePartnerConfig = parsePartnerConfig;
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function isRecord(value) {
  return _typeof(value) === "object" && value !== null && !Array.isArray(value);
}

// Cardano native asset names are 0-32 bytes, so the canonical dotted form may
// legitimately end after the separator. Policy IDs and byte strings are
// lowercase hex; ADA is Sundae's single canonical non-native sentinel.
var PARTNER_ASSET_ID = /^(?:ada\.lovelace|[0-9a-f]{56}\.(?:[0-9a-f]{2}){0,32})$/;
function readAssetList(source, key) {
  var value = source[key];
  if (!Array.isArray(value) || !value.every(function (asset) {
    return typeof asset === "string" && PARTNER_ASSET_ID.test(asset);
  })) {
    throw new Error("invalid partner configuration: ".concat(key, " must be an asset ID array"));
  }
  return _toConsumableArray(value);
}
function readLimit(source, key) {
  var value = source[key];
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error("invalid partner configuration: limits.".concat(key, " must be a non-negative safe integer"));
  }
  return value;
}
function readStablecoinAssetId(source) {
  var assetId = source.stablecoinAssetId;
  if (typeof assetId !== "string" || !/^[0-9a-f]{56}\.(?:[0-9a-f]{2}){1,32}$/.test(assetId)) {
    throw new Error("invalid partner configuration: stablecoinAssetId must be a canonical Sundae asset ID");
  }
  return assetId;
}

/** Validate untrusted JSON and return fresh partner-owned values. */
function parsePartnerConfig(value) {
  if (!isRecord(value)) {
    throw new Error("invalid partner configuration: expected an object");
  }
  var swapCounterpartAssets = readAssetList(value, "swapCounterpartAssets");
  var swapOrderHistoryAssets = readAssetList(value, "swapOrderHistoryAssets");
  var history = new Set(swapOrderHistoryAssets);
  var omittedLiveAsset = swapCounterpartAssets.find(function (asset) {
    return !history.has(asset);
  });
  if (omittedLiveAsset !== undefined) {
    throw new Error("invalid partner configuration: history list omits live swap asset ".concat(omittedLiveAsset));
  }
  if (!isRecord(value.limits)) {
    throw new Error("invalid partner configuration: limits must be an object");
  }
  return {
    stablecoinAssetId: readStablecoinAssetId(value),
    swapCounterpartAssets: swapCounterpartAssets,
    swapOrderHistoryAssets: swapOrderHistoryAssets,
    limits: {
      mintMinUsd: readLimit(value.limits, "mintMinUsd"),
      redeemMinUsd: readLimit(value.limits, "redeemMinUsd")
    }
  };
}
//# sourceMappingURL=partner-config.js.map