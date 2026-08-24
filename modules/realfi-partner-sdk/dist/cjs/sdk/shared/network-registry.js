"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NETWORK_REGISTRY = void 0;
var _sdk = require("@blaze-cardano/sdk");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); } // Per-network on-chain bootstrap references for protocol detection.
// Source of truth: frontend/app/config/{mainnet,preprod,preview}.json
// (proxyBootstrap/treasuryBootstrap/stakingVaultBootstrap, stablecoinAssetName,
// sUSDrAssetName). Update an entry only when that network's protocol is
// redeployed with new bootstrap UTxOs.
//
// Frozen (entry + bootstrap objects): NETWORK_REGISTRY is shared by reference
// into detectSDKParams — a consumer mutating proxyBootstrap.txHash would
// otherwise poison every later detectParams(provider, "mainnet") call.
var freezeBootstrap = function freezeBootstrap(b) {
  return Object.freeze(b);
};
var freezeDetectInput = function freezeDetectInput(entry) {
  return Object.freeze(_objectSpread(_objectSpread({}, entry), {}, {
    proxyBootstrap: freezeBootstrap(entry.proxyBootstrap),
    treasuryBootstrap: freezeBootstrap(entry.treasuryBootstrap),
    stakingVaultBootstrap: freezeBootstrap(entry.stakingVaultBootstrap)
  }, entry.yieldOracleBootstrap ? {
    yieldOracleBootstrap: freezeBootstrap(entry.yieldOracleBootstrap)
  } : {}));
};
var NETWORK_REGISTRY = exports.NETWORK_REGISTRY = Object.freeze({
  mainnet: freezeDetectInput({
    proxyBootstrap: {
      txHash: _sdk.Core.TransactionId("d09c01e21d4ee92b9e58686ca0284288c9c889d8e1a9ab7ab799211a171863ac"),
      outputIndex: 0n
    },
    treasuryBootstrap: {
      txHash: _sdk.Core.TransactionId("d09c01e21d4ee92b9e58686ca0284288c9c889d8e1a9ab7ab799211a171863ac"),
      outputIndex: 1n
    },
    stakingVaultBootstrap: {
      txHash: _sdk.Core.TransactionId("d09c01e21d4ee92b9e58686ca0284288c9c889d8e1a9ab7ab799211a171863ac"),
      outputIndex: 2n
    },
    assetNameHex: "55534472",
    sUSDrAssetNameHex: "7355534472"
  }),
  preprod: freezeDetectInput({
    proxyBootstrap: {
      txHash: _sdk.Core.TransactionId("d9654f43caff2b471bc4db912d8ec6d1932cb48093c3fa2fc3f564519ac855f7"),
      outputIndex: 0n
    },
    treasuryBootstrap: {
      txHash: _sdk.Core.TransactionId("d9654f43caff2b471bc4db912d8ec6d1932cb48093c3fa2fc3f564519ac855f7"),
      outputIndex: 1n
    },
    stakingVaultBootstrap: {
      txHash: _sdk.Core.TransactionId("d9654f43caff2b471bc4db912d8ec6d1932cb48093c3fa2fc3f564519ac855f7"),
      outputIndex: 2n
    },
    assetNameHex: "55534472",
    sUSDrAssetNameHex: "7355534472"
  }),
  preview: freezeDetectInput({
    proxyBootstrap: {
      txHash: _sdk.Core.TransactionId("a32795a0be2dfef61583ab0d7b2c959bbbeab159530dc5a3ef0fa61d94595c99"),
      outputIndex: 1n
    },
    treasuryBootstrap: {
      txHash: _sdk.Core.TransactionId("cf7450305eeaca76ee15a2a863b7d2d272dce7493feae489ec18395cc22b4646"),
      outputIndex: 2n
    },
    stakingVaultBootstrap: {
      txHash: _sdk.Core.TransactionId("17ad2403529298bc8b6a3150069cb0edf55a17e3c334d8b9e0f98ca0e3922bbb"),
      outputIndex: 0n
    },
    assetNameHex: "55534472",
    sUSDrAssetNameHex: "7355534472"
  })
});
//# sourceMappingURL=network-registry.js.map