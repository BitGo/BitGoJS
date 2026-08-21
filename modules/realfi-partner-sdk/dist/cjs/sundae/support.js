"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SWAPPABLE_SUNDAE_SWAP_VERSIONS = exports.SUPPORTED_SUNDAE_SWAP_VERSIONS = void 0;
exports.assertSupportedSundaeSwapPool = assertSupportedSundaeSwapPool;
exports.assertSwappableSundaeSwapPool = assertSwappableSundaeSwapPool;
exports.isSupportedSundaeSwapVersion = isSupportedSundaeSwapVersion;
exports.isSwappableSundaeSwapVersion = isSwappableSundaeSwapVersion;
var _core = require("@sundaeswap/core");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/**
 * What the SDK can do with a pool, by Sundae contract version.
 *
 * Deliberately a `Record` over every version: a new Sundae version will not
 * compile until someone answers both questions for it, rather than silently
 * defaulting to unsupported because nobody remembered a second list.
 */
var POOL_SUPPORT = _defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty({}, _core.EContractVersion.V1, {
  swap: false,
  buildAgainstPool: false
}), _core.EContractVersion.V3, {
  swap: true,
  buildAgainstPool: true
}), _core.EContractVersion.NftCheck, {
  swap: false,
  buildAgainstPool: false
}), _core.EContractVersion.Condition, {
  swap: false,
  buildAgainstPool: false
}), _core.EContractVersion.Stableswaps, {
  swap: true,
  buildAgainstPool: true
}), _core.EContractVersion.V4, {
  swap: true,
  buildAgainstPool: false
});
function versionsWhere(capability) {
  return Object.keys(POOL_SUPPORT).filter(function (version) {
    return POOL_SUPPORT[version][capability];
  });
}

/**
 * `pool.version` comes off the Sundae API, so a version absent from the table
 * reads as unsupported rather than throwing. Fail closed.
 */
function supports(version, capability) {
  var _POOL_SUPPORT$version;
  return ((_POOL_SUPPORT$version = POOL_SUPPORT[version]) === null || _POOL_SUPPORT$version === void 0 ? void 0 : _POOL_SUPPORT$version[capability]) === true;
}

/** Versions whose order names the pool. See {@link isSupportedSundaeSwapVersion}. */
var SUPPORTED_SUNDAE_SWAP_VERSIONS = exports.SUPPORTED_SUNDAE_SWAP_VERSIONS = versionsWhere("buildAgainstPool");
/**
 * Whether the pool-taking `buildSwapOrderTx` accepts this version. Narrower than
 * {@link isSwappableSundaeSwapVersion} — a V4 pool is swappable but its order
 * names no pool, so it is not buildable *against a pool*.
 */
function isSupportedSundaeSwapVersion(version) {
  return supports(version, "buildAgainstPool");
}
function assertSupportedSundaeSwapPool(pool) {
  if (!isSupportedSundaeSwapVersion(pool.version)) {
    throw new Error("Unsupported Sundae swap pool version: ".concat(pool.version));
  }
}

/** Versions the SDK can quote and place a swap for. */
var SWAPPABLE_SUNDAE_SWAP_VERSIONS = exports.SWAPPABLE_SUNDAE_SWAP_VERSIONS = versionsWhere("swap");
/** Whether the SDK can quote this version and place a swap for it. */
function isSwappableSundaeSwapVersion(version) {
  return supports(version, "swap");
}

/**
 * Throws the same message as {@link assertSupportedSundaeSwapPool} on purpose:
 * callers and tests treat "Unsupported Sundae swap pool version: X" as the one
 * version-rejection string.
 */
function assertSwappableSundaeSwapPool(pool) {
  if (!isSwappableSundaeSwapVersion(pool.version)) {
    throw new Error("Unsupported Sundae swap pool version: ".concat(pool.version));
  }
}
//# sourceMappingURL=support.js.map