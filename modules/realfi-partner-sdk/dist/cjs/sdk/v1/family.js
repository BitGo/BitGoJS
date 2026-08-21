"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RealfiSDKV1Family = exports.MIN_LOVELACE = exports.DIRECT_ACTION_PADDING_ASSET = void 0;
exports.calculateYieldShares = calculateYieldShares;
var _core = require("@blaze-cardano/core");
var _data = _interopRequireWildcard(require("@blaze-cardano/data"));
var Data = _data;
var _sdk = require("@blaze-cardano/sdk");
var _index = require("../../generated-types/v0_1/index.js");
var _index2 = require("../shared/index.js");
var _orderSanity = require("./order-sanity.js");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t19 in e) "default" !== _t19 && {}.hasOwnProperty.call(e, _t19) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t19)) && (i.get || i.set) ? o(f, _t19, i) : f[_t19] = e[_t19]); return f; })(e, t); }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _possibleConstructorReturn(t, e) { if (e && ("object" == _typeof(e) || "function" == typeof e)) return e; if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined"); return _assertThisInitialized(t); }
function _assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _getPrototypeOf(t) { return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) { return t.__proto__ || Object.getPrototypeOf(t); }, _getPrototypeOf(t); }
function _inherits(t, e) { if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function"); t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } }), Object.defineProperty(t, "prototype", { writable: !1 }), e && _setPrototypeOf(t, e); }
function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sentinel `reserve_asset` used in V1_0 TreasuryRequestV1 redeemers for
 * DirectMint and DirectBurn actions, which have no real reserve asset in
 * their order datum. The on-chain validators `direct_mint_logic` and
 * `direct_burn_logic` do not inspect this field; this sentinel makes the
 * intent explicit both in code and when inspecting on-chain redeemers.
 *
 * - `policy_id`: 28 zero bytes (standard policy-ID length, chosen as a
 *   sentinel and extremely unlikely to occur as a real script hash)
 * - `asset_name`: "unused" (ASCII)
 *
 * Keep in sync with backend `contract.DirectActionPaddingAsset`.
 */
var DIRECT_ACTION_PADDING_ASSET = exports.DIRECT_ACTION_PADDING_ASSET = ["00".repeat(28), (0, _core.toHex)(new TextEncoder().encode("unused"))];

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parsed order information extracted from a UTXO.
 */

/** Minimal completed-swap shape accepted by the stake continuation builder. */

/** Parameters for building a RealFi stake order as another order's destination. */

/** Address and inline datum a preceding protocol should pay its result to. */

/** Result of {@link RealfiSDKV1Family.classifyOrderAction}. */

/** Result of {@link RealfiSDKV1Family.classifyOrderUtxo}. */

/** The `origin` field shared by every request kind — the consumed order UTxO. */

/**
 * Context handed to {@link RealfiSDKV1Family.applyExecutionValidityBounds}
 * at the end of `buildExecuteOrdersTx`. The vault fields are set only when
 * the executed action consumed the staking vault (stake/unstake/deposit).
 */

/**
 * Version-agnostic constructor parameters for the V1 family. Each version's
 * `static create` assembles this from its own public params interface.
 */

/** Blueprint validator key (within a version slot) -> SDK identity field. */
var DEPLOYED_VALIDATOR_FIELDS = [["protocol_orchestrator.protocol_orchestrator.withdraw", "protocolScriptHash"], ["protocol_mint.protocol_mint.withdraw", "protocolMintScriptHash"], ["protocol_stake.protocol_stake.withdraw", "protocolStakeScriptHash"], ["protocol_management.protocol_management.withdraw", "protocolManagementScriptHash"], ["order.order.spend", "orderScriptHash"], ["treasury.treasury.spend", "treasuryScriptHash"], ["staking_vault.staking_vault.spend", "stakingVaultScriptHash"]];
var DEPLOYED_VALIDATOR_PREFIXES = {
  V1_0: "v1_0/",
  V1_0_Rc1: "v1_0_rc1/",
  V1_1_Rc1: "v1_1_rc1/"
};
var COMPATIBLE_STATE_VALIDATOR_FIELDS = new Set(["treasuryScriptHash", "stakingVaultScriptHash"]);

/** Hash fields whose address must move with them. */
var DEPLOYED_ADDRESS_FIELDS = {
  orderScriptHash: "orderScriptAddress",
  treasuryScriptHash: "treasuryAddress",
  stakingVaultScriptHash: "stakingVaultAddress"
};
var MIN_LOVELACE = exports.MIN_LOVELACE = 2000000n;

/**
 * Calculate yield split between staked and unstaked portions.
 * Matches on-chain deposit.ak logic: staked_yield_share = total_yield * vault_usdr / treasury_circulating
 *
 * IMPORTANT: Uses truncation toward zero (BigInt default `/` operator) to match
 * Aiken's builtin.quotient_integer. Do NOT use floor division here, as it
 * rounds toward negative infinity which gives different results for negative yields.
 * Example: floor(-165/90) = -2, but trunc(-165/90) = -1.
 */
/**
 * Extract the requests list from a signed payload action, regardless of action type.
 * Both TreasuryRequestV1 and RequestV1 have `origin: { transaction_id, output_index }`.
 */
function getRequestsFromAction(action) {
  if ("Mint" in action) return action.Mint.requests;
  if ("Burn" in action) return action.Burn.requests;
  if ("Withdraw" in action) return action.Withdraw.requests;
  if ("Deposit" in action) return action.Deposit.requests;
  if ("Stake" in action) return action.Stake.requests;
  if ("Unstake" in action) return action.Unstake.requests;
  if ("DirectMint" in action) return action.DirectMint.requests;
  if ("DirectBurn" in action) return action.DirectBurn.requests;
  throw new Error("Unknown action type in signed payload");
}
function calculateYieldShares(totalYield, vaultUSDr, treasuryCirculating) {
  // Note: BigInt / truncates toward zero, matching Aiken's quotient_integer
  var stakedYieldShare = treasuryCirculating > 0n ? totalYield * vaultUSDr / treasuryCirculating : 0n;
  var unstakedYieldShare = totalYield - stakedYieldShare;
  return {
    stakedYieldShare: stakedYieldShare,
    unstakedYieldShare: unstakedYieldShare
  };
}

/**
 * Refuse to create an order whose `min_received` floor is not strictly
 * positive (WTB-1764).
 *
 * Every v1-family validator predicate that reads `min_received` requires it to
 * be > 0, and those predicates run inside a `zip_fold` that `expect`s each
 * request in turn — so one order with a zero floor crashes the ENTIRE execution
 * transaction, killing every valid order batched alongside it. Such an order can
 * never execute; creating it only plants a landmine at the order script address.
 *
 * This guards both an explicit caller-supplied floor and a computed one that
 * rounds or nets down to zero (a dust stake at a high exchange rate, or a
 * full-forfeit unstake).
 */
function assertPositiveMinReceived(label, minReceived) {
  if (minReceived <= 0n) {
    throw new Error("".concat(label, " minReceived must be positive (got ").concat(minReceived, "); an order with a ") + "non-positive min_received can never execute and crashes every batch it joins");
  }
}
function buildOrderDestinationValue(orderInfo, consumedAssets) {
  var deliveredAssets = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
  var value = orderInfo.utxo.output().amount();
  var _iterator = _createForOfIteratorHelper(consumedAssets),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var _step$value = _slicedToArray(_step.value, 2),
        assetId = _step$value[0],
        amount = _step$value[1];
      if (amount !== 0n) {
        value = _sdk.Value.merge(value, (0, _sdk.makeValue)(0n, [assetId, -amount]));
      }
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  var _iterator2 = _createForOfIteratorHelper(deliveredAssets),
    _step2;
  try {
    for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
      var _step2$value = _slicedToArray(_step2.value, 2),
        _assetId = _step2$value[0],
        _amount = _step2$value[1];
      if (_amount !== 0n) {
        value = _sdk.Value.merge(value, (0, _sdk.makeValue)(0n, [_assetId, _amount]));
      }
    }
  } catch (err) {
    _iterator2.e(err);
  } finally {
    _iterator2.f();
  }
  return value;
}

// ─────────────────────────────────────────────────────────────────────────────
// SDK Family Base Class
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Shared implementation for the V1 protocol family (v1_0, v1_0_rc1, v1_1+).
 *
 * The family is generic over the two datum shapes that differ across
 * versions — `TSettings` (the proxy settings static) and `TVaultDatum` (the
 * staking-vault datum static) — and receives all generated artifacts from the
 * subclass: schema VALUES via {@link IV1FamilySchemas} (plus, optionally,
 * {@link IV1SigningSchemas}) and instantiated scripts via
 * {@link IV1FamilyScripts}. Method bodies never touch a version's generated
 * module directly, so this chunk adds no runtime import edge to any
 * `generated-types/v1_x` module and per-version code-splitting is preserved.
 *
 * Method defaults implement v1_0 semantics (fees, min_received, the v1_0
 * protocol-redeemer schema). Versions that diverge override the affected
 * members:
 * - vault datum construction is NEVER done inline — it goes through the
 *   abstract `buildInitialVaultDatum` / `buildUpdatedVaultDatum` seam so
 *   versions with additional vault fields cannot be silently truncated;
 * - settings access goes through the abstract `settingsConfig` /
 *   `settingsRegistry` adapters;
 * - `applyExecutionValidityBounds` lets a version constrain the validity
 *   interval of execution transactions (no-op by default).
 */
var RealfiSDKV1Family = exports.RealfiSDKV1Family = /*#__PURE__*/function (_RealfiSDKBase) {
  function RealfiSDKV1Family(blaze, params, schemas, scripts, cachedReferenceInputs, signingSchemas) {
    var _this;
    _classCallCheck(this, RealfiSDKV1Family);
    _this = _callSuper(this, RealfiSDKV1Family, [blaze, {
      version: params.version,
      proxyBootstrap: params.proxyBootstrap,
      assetNameHex: params.assetNameHex,
      enableTrace: params.enableTrace,
      scriptDeploymentAddress: params.scriptDeploymentAddress,
      clientSource: params.clientSource
    }, cachedReferenceInputs]);
    // Script hashes and policy IDs
    _defineProperty(_this, "stablecoinPolicyId", void 0);
    _defineProperty(_this, "oneShotPolicyId", void 0);
    _defineProperty(_this, "protocolScriptHash", void 0);
    _defineProperty(_this, "protocolMintScriptHash", void 0);
    _defineProperty(_this, "protocolStakeScriptHash", void 0);
    _defineProperty(_this, "protocolManagementScriptHash", void 0);
    _defineProperty(_this, "treasuryScriptHash", void 0);
    _defineProperty(_this, "treasuryNFTAssetId", void 0);
    _defineProperty(_this, "orderScriptHash", void 0);
    _defineProperty(_this, "orderScriptAddress", void 0);
    _defineProperty(_this, "treasuryAddress", void 0);
    _defineProperty(_this, "stakingVaultScriptHash", void 0);
    _defineProperty(_this, "stakingVaultAddress", void 0);
    _defineProperty(_this, "stakingVaultNFTAssetId", void 0);
    _defineProperty(_this, "sUSDrAssetNameHex", void 0);
    // Scripts
    _defineProperty(_this, "oneShotScript", void 0);
    _defineProperty(_this, "protocolScript", void 0);
    // Alias for orchestrator (base class compatibility)
    _defineProperty(_this, "protocolOrchestratorScript", void 0);
    _defineProperty(_this, "protocolMintScript", void 0);
    _defineProperty(_this, "protocolStakeScript", void 0);
    _defineProperty(_this, "protocolManagementScript", void 0);
    _defineProperty(_this, "mintProxyScript", void 0);
    _defineProperty(_this, "treasuryScript", void 0);
    _defineProperty(_this, "orderScript", void 0);
    _defineProperty(_this, "stakingVaultScript", void 0);
    _defineProperty(_this, "defaultSlippageToleranceBps", void 0);
    /** Schema values used by every shared serialize/parse site. */
    _defineProperty(_this, "schemas", void 0);
    _defineProperty(_this, "signingSchemas", void 0);
    _this.schemas = schemas;
    _this.signingSchemas = signingSchemas;
    _this.sUSDrAssetNameHex = params.sUSDrAssetNameHex;
    _this.defaultSlippageToleranceBps = params.defaultSlippageToleranceBps;
    _this.oneShotScript = scripts.oneShotScript;
    _this.protocolOrchestratorScript = scripts.protocolOrchestratorScript;
    _this.protocolScript = scripts.protocolOrchestratorScript; // Alias for base class
    _this.protocolMintScript = scripts.protocolMintScript;
    _this.protocolStakeScript = scripts.protocolStakeScript;
    _this.protocolManagementScript = scripts.protocolManagementScript;
    _this.mintProxyScript = scripts.mintProxyScript;
    _this.treasuryScript = scripts.treasuryScript;
    _this.orderScript = scripts.orderScript;
    _this.stakingVaultScript = scripts.stakingVaultScript;
    _this.oneShotPolicyId = _sdk.Core.PolicyId(_this.oneShotScript.hash());
    _this.protocolScriptHash = _this.protocolOrchestratorScript.hash();
    _this.protocolMintScriptHash = _this.protocolMintScript.hash();
    _this.protocolStakeScriptHash = _this.protocolStakeScript.hash();
    _this.protocolManagementScriptHash = _this.protocolManagementScript.hash();
    _this.stablecoinPolicyId = _sdk.Core.PolicyId(_this.mintProxyScript.hash());
    _this.treasuryScriptHash = _this.treasuryScript.hash();
    _this.orderScriptHash = _this.orderScript.hash();
    _this.stakingVaultScriptHash = _this.stakingVaultScript.hash();
    _this.treasuryAddress = (0, _core.addressFromValidator)(_this.network, _this.treasuryScript);
    _this.orderScriptAddress = (0, _core.addressFromValidator)(_this.network, _this.orderScript);
    _this.stakingVaultAddress = (0, _core.addressFromValidator)(_this.network, _this.stakingVaultScript);

    // Every identity above is derived from this package's own artifacts, which
    // only describes a deployment running those exact bytes. Where the caller
    // knows what the chain actually runs, that wins — otherwise the derived
    // order address is one nothing watches, and an order (lockAssets, no
    // on-chain validation) would submit successfully into it.
    _this.applyDeployedValidators(params.deployedValidators, params.version);

    // Treasury NFT: policy = treasury script hash, name = "treasury"
    var treasuryAssetName = _sdk.Core.AssetName((0, _core.toHex)(Buffer.from("treasury")));
    _this.treasuryNFTAssetId = _sdk.Core.AssetId(_this.treasuryScriptHash + treasuryAssetName.toString());

    // Staking vault NFT: policy = staking vault script hash, name = "staking_vault"
    var vaultAssetName = _sdk.Core.AssetName((0, _core.toHex)(Buffer.from("staking_vault")));
    _this.stakingVaultNFTAssetId = _sdk.Core.AssetId(_this.stakingVaultScriptHash + vaultAssetName.toString());
    return _this;
  }

  /**
   * Replace derived script identity with the deployment's own hashes.
   *
   * Version-owned validators are selected only from this SDK's exact version
   * slot. Treasury and staking-vault validators can deliberately survive a
   * protocol-only upgrade, so their unversioned entries are used as the
   * authoritative active-state fallback.
   *
   * Unrecognised keys are ignored: a blueprint legitimately carries validators
   * outside this family (oneshot, mint_proxy) and future ones this build has
   * never heard of.
   */
  _inherits(RealfiSDKV1Family, _RealfiSDKBase);
  return _createClass(RealfiSDKV1Family, [{
    key: "applyDeployedValidators",
    value: function applyDeployedValidators(deployed, version) {
      if (!deployed) return;
      if (!(version in DEPLOYED_VALIDATOR_PREFIXES)) return;
      var prefix = DEPLOYED_VALIDATOR_PREFIXES[version];
      var mutable = this;
      for (var _i = 0, _DEPLOYED_VALIDATOR_F = DEPLOYED_VALIDATOR_FIELDS; _i < _DEPLOYED_VALIDATOR_F.length; _i++) {
        var _DEPLOYED_VALIDATOR_F2 = _slicedToArray(_DEPLOYED_VALIDATOR_F[_i], 2),
          suffix = _DEPLOYED_VALIDATOR_F2[0],
          field = _DEPLOYED_VALIDATOR_F2[1];
        var versionedHash = deployed["".concat(prefix).concat(suffix)];
        var activeStateHash = COMPATIBLE_STATE_VALIDATOR_FIELDS.has(field) ? deployed[suffix] : undefined;
        var deployedHash = activeStateHash !== null && activeStateHash !== void 0 ? activeStateHash : versionedHash;
        if (!deployedHash) continue;
        var hash = _sdk.Core.Hash28ByteBase16(deployedHash.toLowerCase());
        mutable[field] = hash;
        var addressField = DEPLOYED_ADDRESS_FIELDS[field];
        if (addressField) {
          mutable[addressField] = (0, _core.addressFromCredentials)(this.network, _sdk.Core.Credential.fromCore({
            type: _sdk.Core.CredentialType.ScriptHash,
            hash: hash
          }));
        }
      }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Version Seams
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Schemas for the v1_0-semantics signing/execute defaults. Throws for
     * versions that neither supplied {@link IV1SigningSchemas} nor overrode
     * the two consumers (`getSignedPayloadFromOrderInputs`,
     * `buildExecuteOrdersTx`).
     */
  }, {
    key: "signing",
    get: function get() {
      if (!this.signingSchemas) {
        throw new Error("".concat(this.version, ": no signing schemas supplied \u2014 pass signingSchemas to the family constructor or override getSignedPayloadFromOrderInputs and buildExecuteOrdersTx"));
      }
      return this.signingSchemas;
    }

    /**
     * Project the version's settings onto the fields the shared tx-builders
     * read. v1_0/v1_0_rc1: the settings object itself; v1_1+: `settings.config`.
     */
  }, {
    key: "settledVaultBacking",
    value:
    /**
     * Version hook: the USDr backing the stake/unstake exchange rate is
     * computed against. Defaults to the vault's full USDr balance (v1_0 /
     * v1_0_rc1 semantics). Versions with time-diffused yield (v1_1_rc1+)
     * override this to exclude the not-yet-diffused pending yield
     * (`settled_backing` in utilities.ak).
     */
    function settledVaultBacking(_parsedVaultDatum, vaultUSDr) {
      return vaultUSDr;
    }

    /**
     * Version hook: constrain the transaction validity interval on order
     * executions. Called once at the end of `buildExecuteOrdersTx`, right
     * before the builder is returned.
     *
     * No-op by default: v1_0 / v1_0_rc1 executions carry no validity
     * constraints. Versions with time-diffused yield (v1_1_rc1+) override this
     * to attach validFrom/validTo bounds on vault-touching executions.
     */
  }, {
    key: "applyExecutionValidityBounds",
    value: (function () {
      var _applyExecutionValidityBounds = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(_tx, _context) {
        return _regenerator().w(function (_context2) {
          while (1) switch (_context2.n) {
            case 0:
              return _context2.a(2);
          }
        }, _callee);
      }));
      function applyExecutionValidityBounds(_x, _x2) {
        return _applyExecutionValidityBounds.apply(this, arguments);
      }
      return applyExecutionValidityBounds;
    }()
    /**
     * Version hook: build the `Deposit` protocol action that goes into the
     * COSE-signed payload. v1_0 / v1_0_rc1 have no yield split — the validator
     * recomputes it from live state — so they take no `alpha` and reject one.
     * Versions that carry a signed `alpha` (v1_1_rc1+) override this and require
     * it: it is the batch's parameter, never something a signer derives.
     */
    )
  }, {
    key: "buildDepositAction",
    value: (function () {
      var _buildDepositAction = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(requests, alpha) {
        return _regenerator().w(function (_context3) {
          while (1) switch (_context3.n) {
            case 0:
              if (!alpha) {
                _context3.n = 1;
                break;
              }
              throw new Error("".concat(this.version, ": a deposit batch takes no yield-split alpha (the validator recomputes the split from live state)"));
            case 1:
              return _context3.a(2, {
                Deposit: {
                  requests: requests
                }
              });
          }
        }, _callee2, this);
      }));
      function buildDepositAction(_x3, _x4) {
        return _buildDepositAction.apply(this, arguments);
      }
      return buildDepositAction;
    }()
    /**
     * Version hook: split a deposit's total yield between the staked vault and
     * the unstaked pot at EXECUTION time.
     *
     * v1_0 / v1_0_rc1 (default): the on-chain validator recomputes the split from
     * live vault/treasury state, so recomputing it here from the same state
     * matches. v1_1_rc1+ carry a COSE-signed `alpha` in the Deposit action and
     * the validator splits against THAT — so those versions override this to echo
     * the signed alpha, never a second live read (which would diverge if state
     * moved between signing and execution). `action` is the signed action being
     * executed; the default ignores it.
     */
    )
  }, {
    key: "resolveDepositYieldShares",
    value: function resolveDepositYieldShares(totalYield, vaultUSDr, treasuryCirculating, _action) {
      return calculateYieldShares(totalYield, vaultUSDr, treasuryCirculating);
    }

    /**
     * Version hook: serialize the redeemer attached to the orchestrator
     * withdrawal. Defaults to the bare `SignedRedeemer<ExtraProtocolRedeemerV1>`
     * (v1_0 / v1_0_rc1). Versions whose orchestrator wraps execution in a
     * top-level dispatch enum (v1_1_rc1+: `ExecuteOrders(...)`/`PublishYieldOracle`)
     * override this to nest the signed redeemer inside that wrapper.
     */
  }, {
    key: "serializeOrchestratorWithdrawalRedeemer",
    value: function serializeOrchestratorWithdrawalRedeemer(redeemer) {
      return Data.serialize(this.signing.SignedRedeemer_ExtraProtocolRedeemerV1, redeemer);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Treasury Operations
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Mint the treasury NFT.
     */
  }, {
    key: "mintTreasuryNFT",
    value: function () {
      var _mintTreasuryNFT = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3(treasuryBootstrapUtxo) {
        var initialDatum,
          treasuryPolicyId,
          treasuryAssetName,
          datum,
          tx,
          _args3 = arguments;
        return _regenerator().w(function (_context4) {
          while (1) switch (_context4.n) {
            case 0:
              initialDatum = _args3.length > 1 && _args3[1] !== undefined ? _args3[1] : {
                circulating_supply: 0n
              };
              treasuryPolicyId = _sdk.Core.PolicyId(this.treasuryScriptHash);
              treasuryAssetName = _sdk.Core.AssetName((0, _core.toHex)(Buffer.from("treasury")));
              datum = Data.serialize(_index.TreasuryDatum, initialDatum);
              _context4.n = 1;
              return this.blaze.newTransaction().addInput(treasuryBootstrapUtxo).addMint(treasuryPolicyId, new Map([[treasuryAssetName, 1n]]), Data.Void()).lockAssets(this.treasuryAddress, (0, _sdk.makeValue)(10000000n, [this.treasuryNFTAssetId, 1n]), datum).provideScript(this.treasuryScript);
            case 1:
              tx = _context4.v;
              return _context4.a(2, {
                tx: tx,
                nftAssetId: this.treasuryNFTAssetId
              });
          }
        }, _callee3, this);
      }));
      function mintTreasuryNFT(_x5) {
        return _mintTreasuryNFT.apply(this, arguments);
      }
      return mintTreasuryNFT;
    }()
  }, {
    key: "deployTreasury",
    value: function () {
      var _deployTreasury = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4() {
        return _regenerator().w(function (_context5) {
          while (1) switch (_context5.n) {
            case 0:
              return _context5.a(2, (0, _index2.deployScript)(this.blaze, this.treasuryScript, this.scriptDeploymentAddress));
          }
        }, _callee4, this);
      }));
      function deployTreasury() {
        return _deployTreasury.apply(this, arguments);
      }
      return deployTreasury;
    }()
  }, {
    key: "deployOrderContract",
    value: function () {
      var _deployOrderContract = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee5() {
        return _regenerator().w(function (_context6) {
          while (1) switch (_context6.n) {
            case 0:
              return _context6.a(2, (0, _index2.deployScript)(this.blaze, this.orderScript, this.scriptDeploymentAddress));
          }
        }, _callee5, this);
      }));
      function deployOrderContract() {
        return _deployOrderContract.apply(this, arguments);
      }
      return deployOrderContract;
    }()
  }, {
    key: "getTreasuryDatum",
    value: function () {
      var _getTreasuryDatum = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee6() {
        var _yield$getDatumFromNF, treasuryUtxo, treasuryDatum, parsedTreasuryDatum;
        return _regenerator().w(function (_context7) {
          while (1) switch (_context7.n) {
            case 0:
              _context7.n = 1;
              return (0, _index2.getDatumFromNFT)(this.blaze, this.treasuryNFTAssetId, _index.TreasuryDatum);
            case 1:
              _yield$getDatumFromNF = _context7.v;
              treasuryUtxo = _yield$getDatumFromNF.utxo;
              treasuryDatum = _yield$getDatumFromNF.datum;
              parsedTreasuryDatum = _yield$getDatumFromNF.parsedDatum;
              if (treasuryUtxo) {
                _context7.n = 2;
                break;
              }
              throw new Error("No UTXO found with the treasury NFT");
            case 2:
              if (treasuryDatum) {
                _context7.n = 3;
                break;
              }
              throw new Error("No treasury datum found");
            case 3:
              return _context7.a(2, {
                treasuryUtxo: treasuryUtxo,
                treasuryDatum: treasuryDatum,
                parsedTreasuryDatum: parsedTreasuryDatum
              });
          }
        }, _callee6, this);
      }));
      function getTreasuryDatum() {
        return _getTreasuryDatum.apply(this, arguments);
      }
      return getTreasuryDatum;
    }() // ─────────────────────────────────────────────────────────────────────────────
    // Staking Vault Operations
    // ─────────────────────────────────────────────────────────────────────────────
    /**
     * Mint the staking vault NFT and create initial vault UTxO.
     */
  }, {
    key: "mintStakingVaultNFT",
    value: function () {
      var _mintStakingVaultNFT = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee7(stakingVaultBootstrapUtxo, initialDatum) {
        var vaultPolicyId, vaultAssetName, datum, tx;
        return _regenerator().w(function (_context8) {
          while (1) switch (_context8.n) {
            case 0:
              vaultPolicyId = _sdk.Core.PolicyId(this.stakingVaultScriptHash);
              vaultAssetName = _sdk.Core.AssetName((0, _core.toHex)(Buffer.from("staking_vault")));
              datum = Data.serialize(this.schemas.VaultDatumV1, initialDatum !== null && initialDatum !== void 0 ? initialDatum : this.buildInitialVaultDatum());
              _context8.n = 1;
              return this.blaze.newTransaction().addInput(stakingVaultBootstrapUtxo).addMint(vaultPolicyId, new Map([[vaultAssetName, 1n]]), Data.Void()).lockAssets(this.stakingVaultAddress, (0, _sdk.makeValue)(10000000n, [this.stakingVaultNFTAssetId, 1n]), datum).provideScript(this.stakingVaultScript);
            case 1:
              tx = _context8.v;
              return _context8.a(2, {
                tx: tx,
                nftAssetId: this.stakingVaultNFTAssetId
              });
          }
        }, _callee7, this);
      }));
      function mintStakingVaultNFT(_x6, _x7) {
        return _mintStakingVaultNFT.apply(this, arguments);
      }
      return mintStakingVaultNFT;
    }()
  }, {
    key: "deployStakingVault",
    value: function () {
      var _deployStakingVault = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee8() {
        return _regenerator().w(function (_context9) {
          while (1) switch (_context9.n) {
            case 0:
              return _context9.a(2, (0, _index2.deployScript)(this.blaze, this.stakingVaultScript, this.scriptDeploymentAddress));
          }
        }, _callee8, this);
      }));
      function deployStakingVault() {
        return _deployStakingVault.apply(this, arguments);
      }
      return deployStakingVault;
    }()
    /**
     * Deploy the protocol mint script as a reference script (V1.0 only).
     */
  }, {
    key: "deployProtocolMint",
    value: (function () {
      var _deployProtocolMint = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee9() {
        return _regenerator().w(function (_context0) {
          while (1) switch (_context0.n) {
            case 0:
              return _context0.a(2, (0, _index2.deployScript)(this.blaze, this.protocolMintScript, this.scriptDeploymentAddress));
          }
        }, _callee9, this);
      }));
      function deployProtocolMint() {
        return _deployProtocolMint.apply(this, arguments);
      }
      return deployProtocolMint;
    }()
    /**
     * Deploy the protocol stake script as a reference script (V1.0 only).
     */
    )
  }, {
    key: "deployProtocolStake",
    value: (function () {
      var _deployProtocolStake = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee0() {
        return _regenerator().w(function (_context1) {
          while (1) switch (_context1.n) {
            case 0:
              return _context1.a(2, (0, _index2.deployScript)(this.blaze, this.protocolStakeScript, this.scriptDeploymentAddress));
          }
        }, _callee0, this);
      }));
      function deployProtocolStake() {
        return _deployProtocolStake.apply(this, arguments);
      }
      return deployProtocolStake;
    }()
    /**
     * Deploy the protocol management script as a reference script (V1.0 only).
     */
    )
  }, {
    key: "deployProtocolManagement",
    value: (function () {
      var _deployProtocolManagement = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee1() {
        return _regenerator().w(function (_context10) {
          while (1) switch (_context10.n) {
            case 0:
              return _context10.a(2, (0, _index2.deployScript)(this.blaze, this.protocolManagementScript, this.scriptDeploymentAddress));
          }
        }, _callee1, this);
      }));
      function deployProtocolManagement() {
        return _deployProtocolManagement.apply(this, arguments);
      }
      return deployProtocolManagement;
    }()
    /**
     * Register the protocol mint stake credential (V1.0 sub-validator).
     */
    )
  }, {
    key: "registerProtocolMintStake",
    value: function registerProtocolMintStake() {
      var stakeCredential = (0, _index2.credentialFromScript)(this.protocolMintScript);
      return this.blaze.newTransaction().addRegisterStake(stakeCredential);
    }

    /**
     * Register the protocol stake stake credential (V1.0 sub-validator).
     */
  }, {
    key: "registerProtocolStakeStake",
    value: function registerProtocolStakeStake() {
      var stakeCredential = (0, _index2.credentialFromScript)(this.protocolStakeScript);
      return this.blaze.newTransaction().addRegisterStake(stakeCredential);
    }

    /**
     * Register the protocol management stake credential (V1.0 sub-validator).
     */
  }, {
    key: "registerProtocolManagementStake",
    value: function registerProtocolManagementStake() {
      var stakeCredential = (0, _index2.credentialFromScript)(this.protocolManagementScript);
      return this.blaze.newTransaction().addRegisterStake(stakeCredential);
    }

    /**
     * Register the staking vault stake credential (for stake/unstake operations).
     */
  }, {
    key: "registerStakingVaultStake",
    value: function registerStakingVaultStake() {
      var stakeCredential = (0, _index2.credentialFromScript)(this.stakingVaultScript);
      return this.blaze.newTransaction().addRegisterStake(stakeCredential);
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Batched bootstrap helpers (fast fresh-deploy path)
    //
    // The NFT mints CANNOT be batched: each one-shot mint validator runs
    // `mint_oneshots_strict`, which flattens the transaction's ENTIRE mint field
    // and fails unless it equals exactly that validator's single token. So a tx
    // minting more than one NFT fails phase-2 for all of them — the mints stay
    // one-tx-each. Deploys and stake registrations have no such constraint and
    // batch freely.
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Register all five protocol stake credentials (orchestrator + mint / stake /
     * management sub-validators + staking vault) in a SINGLE transaction.
     * Certificates are tiny, so there is no size constraint. Replaces five
     * `register*Stake` calls (and, for a cold wallet, five sign/submit cycles).
     */
  }, {
    key: "registerAllStakes",
    value: function registerAllStakes() {
      return this.blaze.newTransaction().addRegisterStake((0, _index2.credentialFromScript)(this.protocolScript)).addRegisterStake((0, _index2.credentialFromScript)(this.protocolMintScript)).addRegisterStake((0, _index2.credentialFromScript)(this.protocolStakeScript)).addRegisterStake((0, _index2.credentialFromScript)(this.protocolManagementScript)).addRegisterStake((0, _index2.credentialFromScript)(this.stakingVaultScript));
    }

    /**
     * Pack the eight protocol reference-script deployments into as few
     * transactions as fit under `budgetBytes` of script payload each, returning
     * one TxBuilder per batch in deploy order.
     *
     * Batches by measured script size (`script.toCbor()` bytes) rather than a
     * fixed count, because the validators are wildly uneven (~0.5–11 KB) and two
     * of the ~10 KB sub-validators cannot share a transaction. The default budget
     * (13 000) leaves headroom under the 16 384-byte tx limit for tx overhead and
     * future script growth; callers can lower it if a validator grows.
     *
     * Fresh-deploy only: it does NOT skip already-deployed scripts. To resume a
     * partial deploy, use the granular `deploy*` methods (which throw
     * `ScriptAlreadyDeployedError` for idempotent reruns).
     */
  }, {
    key: "deployScriptsBatched",
    value: function deployScriptsBatched() {
      var _this2 = this;
      var budgetBytes = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 13000;
      var scripts = [this.treasuryScript, this.protocolScript, this.protocolMintScript, this.protocolStakeScript, this.protocolManagementScript, this.mintProxyScript, this.orderScript, this.stakingVaultScript];
      var batches = [];
      var current = [];
      var currentBytes = 0;
      for (var _i2 = 0, _scripts = scripts; _i2 < _scripts.length; _i2++) {
        var script = _scripts[_i2];
        var size = script.toCbor().length / 2;
        if (current.length > 0 && currentBytes + size > budgetBytes) {
          batches.push(current);
          current = [];
          currentBytes = 0;
        }
        current.push(script);
        currentBytes += size;
      }
      if (current.length > 0) batches.push(current);
      return batches.map(function (batch) {
        var tx = _this2.blaze.newTransaction();
        var _iterator3 = _createForOfIteratorHelper(batch),
          _step3;
        try {
          for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
            var _script = _step3.value;
            tx = tx.deployScript(_script, _this2.scriptDeploymentAddress);
          }
        } catch (err) {
          _iterator3.e(err);
        } finally {
          _iterator3.f();
        }
        return tx;
      });
    }

    /** The sUSDr asset ID (stablecoin policy + staked-USDr asset name). */
  }, {
    key: "getSusdrAssetId",
    value: function getSusdrAssetId() {
      return _sdk.Core.AssetId(this.stablecoinPolicyId + this.sUSDrAssetNameHex);
    }
  }, {
    key: "getVaultDatum",
    value: function () {
      var _getVaultDatum = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee10() {
        var _yield$getDatumFromNF2, vaultUtxo, vaultDatum, parsedVaultDatum;
        return _regenerator().w(function (_context11) {
          while (1) switch (_context11.n) {
            case 0:
              _context11.n = 1;
              return (0, _index2.getDatumFromNFT)(this.blaze, this.stakingVaultNFTAssetId, this.schemas.VaultDatumV1);
            case 1:
              _yield$getDatumFromNF2 = _context11.v;
              vaultUtxo = _yield$getDatumFromNF2.utxo;
              vaultDatum = _yield$getDatumFromNF2.datum;
              parsedVaultDatum = _yield$getDatumFromNF2.parsedDatum;
              if (vaultUtxo) {
                _context11.n = 2;
                break;
              }
              throw new Error("No UTXO found with the staking vault NFT");
            case 2:
              if (vaultDatum) {
                _context11.n = 3;
                break;
              }
              throw new Error("No vault datum found");
            case 3:
              return _context11.a(2, {
                vaultUtxo: vaultUtxo,
                vaultDatum: vaultDatum,
                parsedVaultDatum: parsedVaultDatum
              });
          }
        }, _callee10, this);
      }));
      function getVaultDatum() {
        return _getVaultDatum.apply(this, arguments);
      }
      return getVaultDatum;
    }() // ─────────────────────────────────────────────────────────────────────────────
    // One-Shot Operations
    // ─────────────────────────────────────────────────────────────────────────────
  }, {
    key: "mintOneShot",
    value: function () {
      var _mintOneShot = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee11(receiverAddress, datum) {
        var utxo, serializedDatum, baseTx, tx;
        return _regenerator().w(function (_context12) {
          while (1) switch (_context12.n) {
            case 0:
              _context12.n = 1;
              return this.resolveBootstrapUtxo();
            case 1:
              utxo = _context12.v;
              serializedDatum = Data.serialize(this.schemas.ProxyDatumV1, {
                logic: datum.logic,
                settings: datum.settings
              });
              baseTx = this.blaze.newTransaction().addInput(utxo).addMint(this.oneShotPolicyId, new Map([[_sdk.Core.AssetName(""), 1n]]), Data.Void());
              tx = (0, _index2.lockOrPayAssets)(baseTx, receiverAddress, (0, _sdk.makeValue)(10000000n, [this.oneShotPolicyId, 1n]), serializedDatum).provideScript(this.oneShotScript);
              return _context12.a(2, {
                tx: tx,
                policyId: this.oneShotPolicyId
              });
          }
        }, _callee11, this);
      }));
      function mintOneShot(_x8, _x9) {
        return _mintOneShot.apply(this, arguments);
      }
      return mintOneShot;
    }()
  }, {
    key: "updateOneShotDatum",
    value: function () {
      var _updateOneShotDatum = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee12(receiverAddress, newDatum) {
        var oneshotUtxo, serializedDatum;
        return _regenerator().w(function (_context13) {
          while (1) switch (_context13.n) {
            case 0:
              _context13.n = 1;
              return this.blaze.provider.getUnspentOutputByNFT(_sdk.Core.AssetId(this.oneShotPolicyId));
            case 1:
              oneshotUtxo = _context13.v;
              if (oneshotUtxo) {
                _context13.n = 2;
                break;
              }
              throw new Error("No UTXO found with the one-shot NFT");
            case 2:
              serializedDatum = Data.serialize(this.schemas.ProxyDatumV1, {
                logic: newDatum.logic,
                settings: newDatum.settings
              });
              return _context13.a(2, (0, _index2.lockOrPayAssets)(this.blaze.newTransaction().addInput(oneshotUtxo), receiverAddress, (0, _sdk.makeValue)(10000000n, [this.oneShotPolicyId, 1n]), serializedDatum));
          }
        }, _callee12, this);
      }));
      function updateOneShotDatum(_x0, _x1) {
        return _updateOneShotDatum.apply(this, arguments);
      }
      return updateOneShotDatum;
    }()
  }, {
    key: "getParsedProxyDatum",
    value: function () {
      var _getParsedProxyDatum = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee13() {
        var _yield$this$getRawPro, proxyUtxo, proxyDatum, parsedProxyDatum, result;
        return _regenerator().w(function (_context14) {
          while (1) switch (_context14.n) {
            case 0:
              if (!this.cachedProxyDatumResult) {
                _context14.n = 1;
                break;
              }
              return _context14.a(2, this.cachedProxyDatumResult);
            case 1:
              _context14.n = 2;
              return this.getRawProxyDatum();
            case 2:
              _yield$this$getRawPro = _context14.v;
              proxyUtxo = _yield$this$getRawPro.proxyUtxo;
              proxyDatum = _yield$this$getRawPro.proxyDatum;
              parsedProxyDatum = (0, _data.parse)(this.schemas.ProxyDatumV1, proxyDatum);
              result = {
                proxyUtxo: proxyUtxo,
                proxyDatum: proxyDatum,
                parsedProxyDatum: parsedProxyDatum
              };
              this.cachedProxyDatumResult = result;
              return _context14.a(2, result);
          }
        }, _callee13, this);
      }));
      function getParsedProxyDatum() {
        return _getParsedProxyDatum.apply(this, arguments);
      }
      return getParsedProxyDatum;
    }()
    /**
     * Check if the protocol has been upgraded past this SDK version.
     *
     * Returns true if either:
     * - The order script hash no longer matches registry.order (order validator upgraded)
     * - The protocol logic no longer matches this SDK's protocol script hash (protocol upgraded)
     *
     * When this returns true, orders created with this SDK version can use the
     * `Invalidated` redeemer to recover funds via `buildInvalidatedOrdersTx`.
     */
  }, {
    key: "isProtocolUpgraded",
    value: (function () {
      var _isProtocolUpgraded = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee14() {
        var _yield$this$getParsed, parsedProxyDatum, registry, orderUpgraded, protocolUpgraded;
        return _regenerator().w(function (_context15) {
          while (1) switch (_context15.n) {
            case 0:
              _context15.n = 1;
              return this.getParsedProxyDatum();
            case 1:
              _yield$this$getParsed = _context15.v;
              parsedProxyDatum = _yield$this$getParsed.parsedProxyDatum;
              registry = this.settingsRegistry(parsedProxyDatum.settings);
              orderUpgraded = registry.order !== this.orderScriptHash;
              protocolUpgraded = parsedProxyDatum.logic !== this.protocolScriptHash;
              return _context15.a(2, orderUpgraded || protocolUpgraded);
          }
        }, _callee14, this);
      }));
      function isProtocolUpgraded() {
        return _isProtocolUpgraded.apply(this, arguments);
      }
      return isProtocolUpgraded;
    }() // ─────────────────────────────────────────────────────────────────────────────
    // Public Order-Scan / Settings Accessors
    // ─────────────────────────────────────────────────────────────────────────────
    /**
     * Read the version-agnostic settings config (`reserve_assets`,
     * `unstaked_yield_pot`) off the live proxy datum. Public accessor over the
     * `settingsConfig` / `getVersionSettings` seam so consumers read the shared
     * fields without casting a version-specific settings shape: v1_0 / v1_0_rc1
     * project the flat settings, v1_1+ project `settings.config`.
     */
    )
  }, {
    key: "getSettingsConfig",
    value: function () {
      var _getSettingsConfig = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee15() {
        var _t;
        return _regenerator().w(function (_context16) {
          while (1) switch (_context16.n) {
            case 0:
              _t = this;
              _context16.n = 1;
              return this.getVersionSettings();
            case 1:
              return _context16.a(2, _t.settingsConfig.call(_t, _context16.v));
          }
        }, _callee15, this);
      }));
      function getSettingsConfig() {
        return _getSettingsConfig.apply(this, arguments);
      }
      return getSettingsConfig;
    }()
    /**
     * Whether the batch covering these orders needs a yield-split alpha, i.e. it is
     * a deposit on a version that splits yield. Callers that both create and sign a
     * batch use it to decide whether to pick one (computeDepositAlpha); a co-signer
     * has no use for it — it reads the batch's stored alpha either way.
     */
  }, {
    key: "batchNeedsAlpha",
    value: (function () {
      var _batchNeedsAlpha = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee16(orderInputs) {
        var _yield$this$blaze$pro, _yield$this$blaze$pro2, utxo;
        return _regenerator().w(function (_context17) {
          while (1) switch (_context17.n) {
            case 0:
              if (!(orderInputs.length === 0)) {
                _context17.n = 1;
                break;
              }
              return _context17.a(2, false);
            case 1:
              _context17.n = 2;
              return this.blaze.provider.resolveUnspentOutputs([orderInputs[0]]);
            case 2:
              _yield$this$blaze$pro = _context17.v;
              _yield$this$blaze$pro2 = _slicedToArray(_yield$this$blaze$pro, 1);
              utxo = _yield$this$blaze$pro2[0];
              return _context17.a(2, this.classifyOrderUtxo(utxo).action.actionType === "deposit" && this.splitsYield);
          }
        }, _callee16, this);
      }));
      function batchNeedsAlpha(_x10) {
        return _batchNeedsAlpha.apply(this, arguments);
      }
      return batchNeedsAlpha;
    }()
    /**
     * Whether this version's Deposit action carries a signed yield split. False for
     * v1_0 / v1_0_rc1, whose validator recomputes the split from live state;
     * v1_1_rc1+ override it.
     */
    )
  }, {
    key: "splitsYield",
    get: function get() {
      return false;
    }

    /**
     * Decode and classify a single open order UTxO with this version's schema.
     *
     * Parses the UTxO's inline datum via `this.schemas.OrderDatumV1` — exactly
     * the way {@link parseOrderInfos} does — then classifies the action. Unlike
     * {@link parseOrders}, this imposes NO same-action-type constraint, so it is
     * the per-UTxO primitive for scanning a MIXED batch of open orders at the
     * order script address and handling each by its action type.
     *
     * @throws if the UTxO carries no inline datum, or the datum fails to decode
     *   under this version's order schema (e.g. a V1.1 order read by a V1.0 SDK).
     */
  }, {
    key: "classifyOrderUtxo",
    value: function classifyOrderUtxo(utxo) {
      var _utxo$output$datum;
      var datumData = (_utxo$output$datum = utxo.output().datum()) === null || _utxo$output$datum === void 0 ? void 0 : _utxo$output$datum.asInlineData();
      if (!datumData) {
        throw new Error("Order UTXO has no inline datum");
      }
      var datum = (0, _data.parse)(this.schemas.OrderDatumV1, datumData);
      return {
        datum: datum,
        action: this.classifyOrderAction(datum)
      };
    }

    /**
     * Decode a batch of order UTxOs into {@link IOrderInfo} objects, validating
     * they are ALL the same action type (throws on a mixed batch). Public
     * wrapper over {@link parseOrderInfos}; use it to prepare inputs for the
     * same-type execute builders. To scan a mixed batch, classify each UTxO
     * individually with {@link classifyOrderUtxo} instead.
     *
     * The optional `fees` map (keyed by `${txHash}#${outputIndex}`) stamps each
     * order with its locked fee in the action's output unit; missing entries
     * default to 0 (no fee retained).
     */
  }, {
    key: "parseOrders",
    value: function parseOrders(orderUtxos, fees) {
      return this.parseOrderInfos(orderUtxos, fees);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Order Builder Methods (8 methods: 6 from V0_4 + DirectMint + DirectBurn)
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Internal helper to build an order transaction.
     */
  }, {
    key: "_buildOrderTx",
    value: function () {
      var _buildOrderTx2 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee17(params) {
        var owner, serializedDatum, tx;
        return _regenerator().w(function (_context18) {
          while (1) switch (_context18.n) {
            case 0:
              _context18.n = 1;
              return this.resolveOrderOwner(params.owner);
            case 1:
              owner = _context18.v;
              serializedDatum = this.serializeOrderDatum(params.action, params.destination, owner, params.data);
              tx = this.newOrderTransaction(params.extraLabels);
              tx.lockAssets(this.orderScriptAddress, params.valueToLock, serializedDatum);
              return _context18.a(2, tx);
          }
        }, _callee17, this);
      }));
      function _buildOrderTx(_x11) {
        return _buildOrderTx2.apply(this, arguments);
      }
      return _buildOrderTx;
    }() /** Resolve the order owner exactly once for transaction and continuation builders. */
  }, {
    key: "resolveOrderOwner",
    value: (function () {
      var _resolveOrderOwner = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee18(owner) {
        var _t2, _t3;
        return _regenerator().w(function (_context19) {
          while (1) switch (_context19.n) {
            case 0:
              if (!owner) {
                _context19.n = 1;
                break;
              }
              return _context19.a(2, owner);
            case 1:
              _context19.n = 2;
              return this.blaze.wallet.getChangeAddress();
            case 2:
              _t2 = _context19.v.getProps().paymentPart.hash.toString();
              _t3 = {
                key_hash: _t2
              };
              return _context19.a(2, {
                Signature: _t3
              });
          }
        }, _callee18, this);
      }));
      function resolveOrderOwner(_x12) {
        return _resolveOrderOwner.apply(this, arguments);
      }
      return resolveOrderOwner;
    }() /** Serialize an order datum through the live version instance's schema seam. */)
  }, {
    key: "serializeOrderDatum",
    value: function serializeOrderDatum(action, destination, owner, data) {
      var orderDatum = {
        action: action,
        owner: owner,
        destination: destination,
        data: data !== null && data !== void 0 ? data : Data.Void()
      };
      return Data.serialize(this.schemas.OrderDatumV1, orderDatum);
    }

    /**
     * Build a mint order: lock reserve tokens, request USDr minting.
     */
  }, {
    key: "buildMintOrderTx",
    value: (function () {
      var _buildMintOrderTx = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee19(params) {
        var _params$orderLovelace, _params$minReceived;
        var orderLovelace, reserveAssetId, settings, ra, reserveAmount, minReceived, _t4;
        return _regenerator().w(function (_context20) {
          while (1) switch (_context20.n) {
            case 0:
              if (!(params.amount <= 0n)) {
                _context20.n = 1;
                break;
              }
              throw new Error("Mint amount must be positive");
            case 1:
              orderLovelace = (_params$orderLovelace = params.orderLovelace) !== null && _params$orderLovelace !== void 0 ? _params$orderLovelace : MIN_LOVELACE;
              if (!(orderLovelace < MIN_LOVELACE)) {
                _context20.n = 2;
                break;
              }
              throw new Error("Mint order lovelace cannot be less than MIN_LOVELACE");
            case 2:
              reserveAssetId = _sdk.Core.AssetId(params.reserveAsset[0] + params.reserveAsset[1]); // Convert USDr amount to reserve amount using ceiling division
              // to ensure enough reserve is locked for on-chain validation
              _t4 = this;
              _context20.n = 3;
              return this.getVersionSettings();
            case 3:
              settings = _t4.settingsConfig.call(_t4, _context20.v);
              ra = (0, _index2.findReserveAsset)(settings, params.reserveAsset);
              reserveAmount = (0, _index2.usdrToReserveCeil)(params.amount, ra); // Mint is 1:1 reserve→USDR with no protocol fee in v1_0, so the user
              // receives exactly `amount`. Default the floor to `amount`; callers can
              // lower it if a future fee makes that too tight.
              minReceived = (_params$minReceived = params.minReceived) !== null && _params$minReceived !== void 0 ? _params$minReceived : params.amount;
              assertPositiveMinReceived("Mint", minReceived);
              return _context20.a(2, this._buildOrderTx({
                action: {
                  OMint: {
                    amount: params.amount,
                    min_received: minReceived,
                    reserve_asset: params.reserveAsset
                  }
                },
                valueToLock: (0, _sdk.makeValue)(orderLovelace, [reserveAssetId, reserveAmount]),
                owner: params.owner,
                destination: params.destination,
                data: params.data
              }));
          }
        }, _callee19, this);
      }));
      function buildMintOrderTx(_x13) {
        return _buildMintOrderTx.apply(this, arguments);
      }
      return buildMintOrderTx;
    }()
    /**
     * Build a redeem (burn) order: lock USDr, request reserve token redemption.
     */
    )
  }, {
    key: "buildRedeemOrderTx",
    value: (function () {
      var _buildRedeemOrderTx = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee20(params) {
        var _params$minReceived2;
        var settings, ra, stablecoinAssetId, minReceived, _t5;
        return _regenerator().w(function (_context21) {
          while (1) switch (_context21.n) {
            case 0:
              if (!(params.amount <= 0n)) {
                _context21.n = 1;
                break;
              }
              throw new Error("Redeem amount must be positive");
            case 1:
              _t5 = this;
              _context21.n = 2;
              return this.getVersionSettings();
            case 2:
              settings = _t5.settingsConfig.call(_t5, _context21.v);
              ra = (0, _index2.findReserveAsset)(settings, params.reserveAsset);
              stablecoinAssetId = _sdk.Core.AssetId(this.stablecoinPolicyId + this.assetNameHex); // burn.ak caps delivery at usdr_to_reserve(amount, ra), so the default
              // floor must use the configured reserve multiplier rather than assume 1:1.
              minReceived = (_params$minReceived2 = params.minReceived) !== null && _params$minReceived2 !== void 0 ? _params$minReceived2 : (0, _index2.usdrToReserve)(params.amount, ra);
              assertPositiveMinReceived("Redeem", minReceived);
              return _context21.a(2, this._buildOrderTx({
                action: {
                  ORedeem: {
                    amount: params.amount,
                    min_received: minReceived,
                    reserve_asset: params.reserveAsset
                  }
                },
                valueToLock: (0, _sdk.makeValue)(MIN_LOVELACE, [stablecoinAssetId, params.amount]),
                owner: params.owner,
                destination: params.destination,
                data: params.data
              }));
          }
        }, _callee20, this);
      }));
      function buildRedeemOrderTx(_x14) {
        return _buildRedeemOrderTx.apply(this, arguments);
      }
      return buildRedeemOrderTx;
    }()
    /**
     * Build a deposit order: lock reserve tokens, request treasury deposit.
     */
    )
  }, {
    key: "buildDepositOrderTx",
    value: (function () {
      var _buildDepositOrderTx = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee21(params) {
        var settings, ra, reserveAssetId, valueToLock, totalUSDrBacking, reserveAmount, _vaultValue$multiasse, _vaultValue$multiasse2, principalReserve, stablecoinAssetId, _yield$this$getTreasu, parsedTreasuryDatum, vaultUtxo, vaultValue, vaultUSDr, treasuryCirculating, _calculateYieldShares, unstakedYieldShare, _t6;
        return _regenerator().w(function (_context22) {
          while (1) switch (_context22.n) {
            case 0:
              if (!(params.principal < 0n)) {
                _context22.n = 1;
                break;
              }
              throw new Error("Deposit principal must be non-negative");
            case 1:
              if (!(params.principal === 0n && params["yield"] === 0n)) {
                _context22.n = 2;
                break;
              }
              throw new Error("Deposit must have non-zero principal or yield");
            case 2:
              _t6 = this;
              _context22.n = 3;
              return this.getVersionSettings();
            case 3:
              settings = _t6.settingsConfig.call(_t6, _context22.v);
              ra = (0, _index2.findReserveAsset)(settings, params.reserveAsset);
              reserveAssetId = _sdk.Core.AssetId(params.reserveAsset[0] + params.reserveAsset[1]);
              if (!(params["yield"] >= 0n)) {
                _context22.n = 4;
                break;
              }
              // POSITIVE YIELD: need reserve backing for BOTH principal AND yield.
              // Contract validates: reserve_to_usdr(treasury_delta) >= principal + yield
              // So we must lock: usdrToReserveCeil(principal + yield) reserve tokens
              totalUSDrBacking = params.principal + params["yield"];
              if (totalUSDrBacking > 0n) {
                reserveAmount = (0, _index2.usdrToReserveCeil)(totalUSDrBacking, ra);
                valueToLock = (0, _sdk.makeValue)(MIN_LOVELACE, [reserveAssetId, reserveAmount]);
              } else {
                valueToLock = (0, _sdk.makeValue)(MIN_LOVELACE);
              }
              _context22.n = 7;
              break;
            case 4:
              // NEGATIVE YIELD: lock principal (in reserve) + unstaked yield share (in USDr).
              // The staked share comes from the vault (validated on-chain via vault USDr change).
              principalReserve = params.principal > 0n ? (0, _index2.usdrToReserveCeil)(params.principal, ra) : 0n;
              valueToLock = principalReserve > 0n ? (0, _sdk.makeValue)(MIN_LOVELACE, [reserveAssetId, principalReserve]) : (0, _sdk.makeValue)(MIN_LOVELACE);
              stablecoinAssetId = _sdk.Core.AssetId(this.stablecoinPolicyId + this.assetNameHex); // Fetch current state to calculate yield split
              _context22.n = 5;
              return this.getTreasuryDatum();
            case 5:
              _yield$this$getTreasu = _context22.v;
              parsedTreasuryDatum = _yield$this$getTreasu.parsedTreasuryDatum;
              _context22.n = 6;
              return this.getVaultDatum();
            case 6:
              vaultUtxo = _context22.v.vaultUtxo;
              vaultValue = vaultUtxo.output().amount();
              vaultUSDr = (_vaultValue$multiasse = (_vaultValue$multiasse2 = vaultValue.multiasset()) === null || _vaultValue$multiasse2 === void 0 ? void 0 : _vaultValue$multiasse2.get(stablecoinAssetId)) !== null && _vaultValue$multiasse !== void 0 ? _vaultValue$multiasse : 0n;
              treasuryCirculating = parsedTreasuryDatum.circulating_supply;
              _calculateYieldShares = calculateYieldShares(params["yield"], vaultUSDr, treasuryCirculating), unstakedYieldShare = _calculateYieldShares.unstakedYieldShare; // Lock only the unstaked portion (negated since unstakedYieldShare is negative)
              if (unstakedYieldShare < 0n) {
                valueToLock = _sdk.Value.merge(valueToLock, (0, _sdk.makeValue)(0n, [stablecoinAssetId, -unstakedYieldShare]));
              }
            case 7:
              return _context22.a(2, this._buildOrderTx({
                action: {
                  ODeposit: {
                    principal: params.principal,
                    "yield": params["yield"],
                    reserve_asset: params.reserveAsset
                  }
                },
                valueToLock: valueToLock,
                owner: params.owner,
                destination: params.destination,
                data: params.data
              }));
          }
        }, _callee21, this);
      }));
      function buildDepositOrderTx(_x15) {
        return _buildDepositOrderTx.apply(this, arguments);
      }
      return buildDepositOrderTx;
    }()
    /**
     * Build a withdraw order: lock min ADA, request reserve token withdrawal.
     */
    )
  }, {
    key: "buildWithdrawOrderTx",
    value: (function () {
      var _buildWithdrawOrderTx = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee22(params) {
        var settings, _t7;
        return _regenerator().w(function (_context23) {
          while (1) switch (_context23.n) {
            case 0:
              if (!(params.amount <= 0n)) {
                _context23.n = 1;
                break;
              }
              throw new Error("Withdraw amount must be positive");
            case 1:
              _t7 = this;
              _context23.n = 2;
              return this.getVersionSettings();
            case 2:
              settings = _t7.settingsConfig.call(_t7, _context23.v);
              (0, _index2.findReserveAsset)(settings, params.reserveAsset);
              return _context23.a(2, this._buildOrderTx({
                action: {
                  OWithdraw: {
                    amount: params.amount,
                    reserve_asset: params.reserveAsset
                  }
                },
                valueToLock: (0, _sdk.makeValue)(MIN_LOVELACE),
                owner: params.owner,
                destination: params.destination,
                data: params.data
              }));
          }
        }, _callee22, this);
      }));
      function buildWithdrawOrderTx(_x16) {
        return _buildWithdrawOrderTx.apply(this, arguments);
      }
      return buildWithdrawOrderTx;
    }()
    /**
     * Build a stake order: lock USDr, request sUSDr minting.
     */
    )
  }, {
    key: "buildStakeOrderTx",
    value: (function () {
      var _buildStakeOrderTx = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee23(params) {
        var _params$minReceived3;
        var stablecoinAssetId, minReceived, _t8;
        return _regenerator().w(function (_context24) {
          while (1) switch (_context24.n) {
            case 0:
              if (!(params.amount <= 0n)) {
                _context24.n = 1;
                break;
              }
              throw new Error("Stake amount must be positive");
            case 1:
              stablecoinAssetId = _sdk.Core.AssetId(this.stablecoinPolicyId + this.assetNameHex);
              if (!((_params$minReceived3 = params.minReceived) !== null && _params$minReceived3 !== void 0)) {
                _context24.n = 2;
                break;
              }
              _t8 = _params$minReceived3;
              _context24.n = 4;
              break;
            case 2:
              _context24.n = 3;
              return this.computeStakeMinReceived(params.amount, params.slippageToleranceBps);
            case 3:
              _t8 = _context24.v;
            case 4:
              minReceived = _t8;
              assertPositiveMinReceived("Stake", minReceived);
              return _context24.a(2, this._buildOrderTx({
                action: {
                  OStake: {
                    amount: params.amount,
                    min_received: minReceived
                  }
                },
                valueToLock: (0, _sdk.makeValue)(MIN_LOVELACE, [stablecoinAssetId, params.amount]),
                owner: params.owner,
                destination: params.destination,
                data: params.data
              }));
          }
        }, _callee23, this);
      }));
      function buildStakeOrderTx(_x17) {
        return _buildStakeOrderTx.apply(this, arguments);
      }
      return buildStakeOrderTx;
    }()
    /**
     * Build a stake-order continuation from a completed swap's guaranteed USDr
     * output. The swap quote remains observable to the caller, while the SDK
     * owns the RealFi amount, exchange-rate quote, schema, and request address.
     */
    )
  }, {
    key: "buildStakeContinuation",
    value: (function () {
      var _buildStakeContinuation = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee24(params) {
        var amount, expectedSundaeAssetId, minReceived, owner;
        return _regenerator().w(function (_context25) {
          while (1) switch (_context25.n) {
            case 0:
              amount = params.swap.minReceived.amount;
              if (!(amount <= 0n)) {
                _context25.n = 1;
                break;
              }
              throw new Error("Swap minReceived amount must be positive");
            case 1:
              expectedSundaeAssetId = "".concat(this.stablecoinPolicyId, ".").concat(this.assetNameHex);
              if (!(params.swap.minReceived.metadata.assetId !== expectedSundaeAssetId)) {
                _context25.n = 2;
                break;
              }
              throw new Error("Swap minReceived must be USDr (".concat(expectedSundaeAssetId, "), got ").concat(params.swap.minReceived.metadata.assetId));
            case 2:
              _context25.n = 3;
              return this.computeStakeMinReceived(amount, params.slippageToleranceBps);
            case 3:
              minReceived = _context25.v;
              assertPositiveMinReceived("Stake", minReceived);
              _context25.n = 4;
              return this.resolveOrderOwner(params.owner);
            case 4:
              owner = _context25.v;
              return _context25.a(2, {
                address: this.orderScriptAddress,
                datum: this.serializeOrderDatum({
                  OStake: {
                    amount: amount,
                    min_received: minReceived
                  }
                }, params.destination, owner, params.data)
              });
          }
        }, _callee24, this);
      }));
      function buildStakeContinuation(_x18) {
        return _buildStakeContinuation.apply(this, arguments);
      }
      return buildStakeContinuation;
    }())
  }, {
    key: "_buildUnstakeOrderTx",
    value: function () {
      var _buildUnstakeOrderTx2 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee25(params) {
        var _params$forfeit, _params$minReceived4;
        var forfeit, sUSDrAssetId, minReceived, _t9;
        return _regenerator().w(function (_context26) {
          while (1) switch (_context26.n) {
            case 0:
              if (!(params.amount <= 0n)) {
                _context26.n = 1;
                break;
              }
              throw new Error("Unstake amount must be positive");
            case 1:
              forfeit = (_params$forfeit = params.forfeit) !== null && _params$forfeit !== void 0 ? _params$forfeit : 0n;
              if (!(forfeit < 0n)) {
                _context26.n = 2;
                break;
              }
              throw new Error("Forfeit amount cannot be negative");
            case 2:
              sUSDrAssetId = _sdk.Core.AssetId(this.stablecoinPolicyId + this.sUSDrAssetNameHex);
              if (!((_params$minReceived4 = params.minReceived) !== null && _params$minReceived4 !== void 0)) {
                _context26.n = 3;
                break;
              }
              _t9 = _params$minReceived4;
              _context26.n = 5;
              break;
            case 3:
              _context26.n = 4;
              return this.computeUnstakeMinReceived(params.amount, forfeit, params.slippageToleranceBps);
            case 4:
              _t9 = _context26.v;
            case 5:
              minReceived = _t9;
              // Also catches a full forfeit, where computeUnstakeMinReceived nets to 0:
              // unstake.ak's own comment defers that case to `min_received > 0`, i.e. the
              // batch-wide crash. Refuse to create the order instead.
              assertPositiveMinReceived("Unstake", minReceived);
              return _context26.a(2, this._buildOrderTx({
                action: {
                  OUnstake: {
                    amount: params.amount,
                    min_received: minReceived,
                    forfeit: forfeit
                  }
                },
                valueToLock: (0, _sdk.makeValue)(MIN_LOVELACE, [sUSDrAssetId, params.amount]),
                owner: params.owner,
                destination: params.destination,
                data: params.data,
                extraLabels: params.extraLabels
              }));
          }
        }, _callee25, this);
      }));
      function _buildUnstakeOrderTx(_x19) {
        return _buildUnstakeOrderTx2.apply(this, arguments);
      }
      return _buildUnstakeOrderTx;
    }()
    /**
     * Build an unstake order: lock sUSDr, request USDr release.
     *
     * The destination is automatically set to a native script address that
     * enforces a timelock: AllOf { Signature(user), After(unlockSlot) }.
     * This means the released USDr can only be spent by the user after the
     * unlock time has passed.
     *
     * @param params.amount - Amount of sUSDr to unstake
     * @param params.destination - The user's actual destination (used to extract payment key hash)
     * @param params.unlockSlot - Slot number after which the user can spend the released USDr
     * @param params.forfeit - Optional amount of USDr to forfeit to yield pot (default: 0)
     * @param params.slippageToleranceBps - Optional min-received tolerance override in basis points
     */
  }, {
    key: "buildUnstakeOrderTx",
    value: (function () {
      var _buildUnstakeOrderTx3 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee26(params) {
        var timelockDestination, extraLabels;
        return _regenerator().w(function (_context27) {
          while (1) switch (_context27.n) {
            case 0:
              timelockDestination = (0, _index2.buildTimelockDestination)(params.destination, params.unlockSlot);
              extraLabels = new Map([[_index2.UNSTAKE_METADATA_LABEL, (0, _index2.buildUnstakeMetadatum)(params.destination, params.unlockSlot)]]);
              return _context27.a(2, this._buildUnstakeOrderTx({
                amount: params.amount,
                destination: timelockDestination,
                forfeit: params.forfeit,
                minReceived: params.minReceived,
                slippageToleranceBps: params.slippageToleranceBps,
                owner: params.owner,
                data: params.data,
                extraLabels: extraLabels
              }));
          }
        }, _callee26, this);
      }));
      function buildUnstakeOrderTx(_x20) {
        return _buildUnstakeOrderTx3.apply(this, arguments);
      }
      return buildUnstakeOrderTx;
    }()
    /**
     * Build a treasury-managed unstake order that wraps the destination in a
     * native timelock script controlled by the order owner.
     *
     * The destination is set to: AllOf { After(unlockSlot), owner }. This keeps
     * treasury multisig ownership on the released USDr while enforcing the same
     * unlock slot used by the retail unstake helper. The owner must be convertible
     * to a Cardano native script.
     */
    )
  }, {
    key: "buildTreasuryUnstakeOrderTx",
    value: (function () {
      var _buildTreasuryUnstakeOrderTx = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee27(params) {
        var nativeScript, timelockDestination, extraLabels, tx;
        return _regenerator().w(function (_context28) {
          while (1) switch (_context28.n) {
            case 0:
              nativeScript = (0, _index2.buildMultisigTimelockNativeScript)(params.owner, params.unlockSlot);
              timelockDestination = {
                address: {
                  payment_credential: {
                    Script: [nativeScript.hash()]
                  },
                  stake_credential: params.destination.address.stake_credential
                },
                datum: "NoDatum"
              }; // Attach the unstake metadata (label 55534472) exactly like the retail
              // path (buildUnstakeOrderTx). track-chain requires this label to index the
              // order; without it the confirmed unstake output is silently dropped
              // (WTB-1466). Mirror retail precisely: the metadatum is built from the
              // user-supplied destination (params.destination), not the derived timelock
              // destination, and carries the same unlock_time.
              extraLabels = new Map([[_index2.UNSTAKE_METADATA_LABEL, (0, _index2.buildUnstakeMetadatum)(params.destination, params.unlockSlot)]]);
              _context28.n = 1;
              return this._buildUnstakeOrderTx({
                amount: params.amount,
                destination: timelockDestination,
                forfeit: params.forfeit,
                minReceived: params.minReceived,
                slippageToleranceBps: params.slippageToleranceBps,
                owner: params.owner,
                data: params.data,
                extraLabels: extraLabels
              });
            case 1:
              tx = _context28.v;
              return _context28.a(2, {
                tx: tx,
                nativeScript: nativeScript
              });
          }
        }, _callee27, this);
      }));
      function buildTreasuryUnstakeOrderTx(_x21) {
        return _buildTreasuryUnstakeOrderTx.apply(this, arguments);
      }
      return buildTreasuryUnstakeOrderTx;
    }()
    /**
     * Compute the default `min_received` (output sUSDR floor) for a stake order
     * by reading the current staking-vault exchange rate and applying a
     * slippage tolerance buffer.
     *
     * Tolerance resolution: per-call > SDK-level (defaultSlippageToleranceBps)
     * > built-in 50bps (0.5%).
     *
     * Yield accrual moves `vault_usdr` up over time, so shares-per-USDR shrinks
     * between order placement and execution. The buffer protects the user from
     * receiving fewer shares than they expected at sign time.
     *
     * Bootstrap edge case: when the vault is empty (no USDR locked or no sUSDR
     * circulating), the rate is treated as 1:1 and the buffer is skipped.
     */
    )
  }, {
    key: "computeStakeMinReceived",
    value: (function () {
      var _computeStakeMinReceived = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee28(amount, perCallToleranceBps) {
        var _vaultUtxo$output$amo, _vaultUtxo$output$amo2;
        var toleranceBps, stablecoinAssetId, _yield$this$getVaultD, vaultUtxo, parsedVaultDatum, vaultUsdr, circulatingSusdr, expected;
        return _regenerator().w(function (_context29) {
          while (1) switch (_context29.n) {
            case 0:
              toleranceBps = this.resolveStakeSlippageToleranceBps(perCallToleranceBps);
              stablecoinAssetId = _sdk.Core.AssetId(this.stablecoinPolicyId + this.assetNameHex);
              _context29.n = 1;
              return this.getVaultDatum();
            case 1:
              _yield$this$getVaultD = _context29.v;
              vaultUtxo = _yield$this$getVaultD.vaultUtxo;
              parsedVaultDatum = _yield$this$getVaultD.parsedVaultDatum;
              vaultUsdr = this.settledVaultBacking(parsedVaultDatum, (_vaultUtxo$output$amo = (_vaultUtxo$output$amo2 = vaultUtxo.output().amount().multiasset()) === null || _vaultUtxo$output$amo2 === void 0 ? void 0 : _vaultUtxo$output$amo2.get(stablecoinAssetId)) !== null && _vaultUtxo$output$amo !== void 0 ? _vaultUtxo$output$amo : 0n);
              circulatingSusdr = parsedVaultDatum.circulating_susdr;
              if (!(vaultUsdr === 0n || circulatingSusdr === 0n)) {
                _context29.n = 2;
                break;
              }
              return _context29.a(2, amount);
            case 2:
              expected = amount * circulatingSusdr / vaultUsdr;
              return _context29.a(2, expected * (10000n - toleranceBps) / 10000n);
          }
        }, _callee28, this);
      }));
      function computeStakeMinReceived(_x22, _x23) {
        return _computeStakeMinReceived.apply(this, arguments);
      }
      return computeStakeMinReceived;
    }())
  }, {
    key: "resolveStakeSlippageToleranceBps",
    value: function resolveStakeSlippageToleranceBps(perCallToleranceBps) {
      var _ref;
      var toleranceBps = (_ref = perCallToleranceBps !== null && perCallToleranceBps !== void 0 ? perCallToleranceBps : this.defaultSlippageToleranceBps) !== null && _ref !== void 0 ? _ref : 50n;
      if (toleranceBps < 0n || toleranceBps > 10000n) {
        throw new Error("Slippage tolerance must be between 0 and 10000 bps");
      }
      return toleranceBps;
    }

    /**
     * Compute the default `min_received` (output USDR floor) for an unstake
     * order by reading the current staking-vault exchange rate.
     *
     * `forfeit` is subtracted from the gross expected USDR, then a slippage
     * tolerance protects the order from quote/provider drift. Tolerance
     * resolution is per-call > SDK-level > built-in 50bps (0.5%).
     *
     * Bootstrap edge case: when the vault is empty, the rate is treated as 1:1.
     */
  }, {
    key: "computeUnstakeMinReceived",
    value: (function () {
      var _computeUnstakeMinReceived = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee29(amount, forfeit, perCallToleranceBps) {
        var _vaultUtxo$output$amo3, _vaultUtxo$output$amo4;
        var stablecoinAssetId, _yield$this$getVaultD2, vaultUtxo, parsedVaultDatum, vaultUsdr, circulatingSusdr, expectedGross, expectedNet, toleranceBps;
        return _regenerator().w(function (_context30) {
          while (1) switch (_context30.n) {
            case 0:
              stablecoinAssetId = _sdk.Core.AssetId(this.stablecoinPolicyId + this.assetNameHex);
              _context30.n = 1;
              return this.getVaultDatum();
            case 1:
              _yield$this$getVaultD2 = _context30.v;
              vaultUtxo = _yield$this$getVaultD2.vaultUtxo;
              parsedVaultDatum = _yield$this$getVaultD2.parsedVaultDatum;
              vaultUsdr = this.settledVaultBacking(parsedVaultDatum, (_vaultUtxo$output$amo3 = (_vaultUtxo$output$amo4 = vaultUtxo.output().amount().multiasset()) === null || _vaultUtxo$output$amo4 === void 0 ? void 0 : _vaultUtxo$output$amo4.get(stablecoinAssetId)) !== null && _vaultUtxo$output$amo3 !== void 0 ? _vaultUtxo$output$amo3 : 0n);
              circulatingSusdr = parsedVaultDatum.circulating_susdr;
              expectedGross = vaultUsdr === 0n || circulatingSusdr === 0n ? amount : amount * vaultUsdr / circulatingSusdr;
              expectedNet = expectedGross > forfeit ? expectedGross - forfeit : 0n;
              toleranceBps = this.resolveStakeSlippageToleranceBps(perCallToleranceBps);
              return _context30.a(2, expectedNet * (10000n - toleranceBps) / 10000n);
          }
        }, _callee29, this);
      }));
      function computeUnstakeMinReceived(_x24, _x25, _x26) {
        return _computeUnstakeMinReceived.apply(this, arguments);
      }
      return computeUnstakeMinReceived;
    }()
    /**
     * Build a direct mint order: mint USDr without reserve asset backing.
     * Used for fiat wire scenarios where reserve arrives off-chain.
     */
    )
  }, {
    key: "buildDirectMintOrderTx",
    value: (function () {
      var _buildDirectMintOrderTx = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee30(params) {
        return _regenerator().w(function (_context31) {
          while (1) switch (_context31.n) {
            case 0:
              if (!(params.amount <= 0n)) {
                _context31.n = 1;
                break;
              }
              throw new Error("Direct mint amount must be positive");
            case 1:
              return _context31.a(2, this._buildOrderTx({
                action: {
                  ODirectMint: {
                    amount: params.amount
                  }
                },
                valueToLock: (0, _sdk.makeValue)(MIN_LOVELACE),
                owner: params.owner,
                destination: params.destination,
                data: params.data
              }));
          }
        }, _callee30, this);
      }));
      function buildDirectMintOrderTx(_x27) {
        return _buildDirectMintOrderTx.apply(this, arguments);
      }
      return buildDirectMintOrderTx;
    }()
    /**
     * Build a direct burn order: burn USDr without reserve asset redemption.
     * Used for fiat wire scenarios where reserve is sent off-chain.
     */
    )
  }, {
    key: "buildDirectBurnOrderTx",
    value: (function () {
      var _buildDirectBurnOrderTx = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee31(params) {
        var stablecoinAssetId;
        return _regenerator().w(function (_context32) {
          while (1) switch (_context32.n) {
            case 0:
              if (!(params.amount <= 0n)) {
                _context32.n = 1;
                break;
              }
              throw new Error("Direct burn amount must be positive");
            case 1:
              stablecoinAssetId = _sdk.Core.AssetId(this.stablecoinPolicyId + this.assetNameHex); // DirectBurn orders must lock the USDr being burned
              return _context32.a(2, this._buildOrderTx({
                action: {
                  ODirectBurn: {
                    amount: params.amount
                  }
                },
                valueToLock: (0, _sdk.makeValue)(MIN_LOVELACE, [stablecoinAssetId, params.amount]),
                owner: params.owner,
                destination: params.destination,
                data: params.data
              }));
          }
        }, _callee31, this);
      }));
      function buildDirectBurnOrderTx(_x28) {
        return _buildDirectBurnOrderTx.apply(this, arguments);
      }
      return buildDirectBurnOrderTx;
    }())
  }, {
    key: "getSignedPayloadFromOrderInputs",
    value: // ─────────────────────────────────────────────────────────────────────────────
    // Signed Payload and Signing
    // ─────────────────────────────────────────────────────────────────────────────
    /**
     * Build the V1_0 SignedPayload_ProtocolRedeemer from order inputs.
     * Returns both the CBOR hex string (for buildExecuteOrdersTx) and
     * the blake2b_256 hash (for CIP-30 signing).
     *
     * `alpha` is the batch's yield split, required by versions whose Deposit
     * action carries one (v1_1_rc1+) and rejected everywhere else. It is a
     * parameter of the batch, chosen once by whoever created it and read back from
     * the backend by every co-signer: on-chain, all signatures of a batch are
     * checked against ONE payload hash, so a signer that derived its own value
     * would produce bytes nobody else can co-sign.
     */
    function () {
      var _getSignedPayloadFromOrderInputs = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee32(orderInputs, alpha) {
        var sortedInputs, nonce, resolvedUtxos, actionType, exchangeRequests, treasuryRequests, stakeRequests, directRequests, _iterator4, _step4, _utxo$output$datum2, utxo, datumData, datum, origin, parsed, screened, _parsed$minReceived, _parsed$minReceived2, _parsed$forfeit, batchVerdict, action, payload, serialized, signedPayload, payloadHash, _t0, _t1;
        return _regenerator().w(function (_context33) {
          while (1) switch (_context33.p = _context33.n) {
            case 0:
              if (!(orderInputs.length === 0)) {
                _context33.n = 1;
                break;
              }
              throw new Error("At least one order input is required");
            case 1:
              sortedInputs = (0, _index2.sortOrderInputs)(orderInputs);
              nonce = (0, _index2.buildNonceFromUtxo)(sortedInputs[0]);
              _context33.n = 2;
              return this.blaze.provider.resolveUnspentOutputs(sortedInputs);
            case 2:
              resolvedUtxos = _context33.v;
              actionType = null;
              exchangeRequests = [];
              treasuryRequests = [];
              stakeRequests = [];
              directRequests = [];
              _iterator4 = _createForOfIteratorHelper(resolvedUtxos);
              _context33.p = 3;
              _iterator4.s();
            case 4:
              if ((_step4 = _iterator4.n()).done) {
                _context33.n = 11;
                break;
              }
              utxo = _step4.value;
              datumData = (_utxo$output$datum2 = utxo.output().datum()) === null || _utxo$output$datum2 === void 0 ? void 0 : _utxo$output$datum2.asInlineData();
              if (datumData) {
                _context33.n = 5;
                break;
              }
              throw new Error("Order UTXO has no inline datum");
            case 5:
              datum = (0, _data.parse)(this.schemas.OrderDatumV1, datumData);
              origin = {
                transaction_id: utxo.input().transactionId().toString(),
                output_index: utxo.input().index()
              };
              parsed = this.classifyOrderAction(datum); // WTB-1764: the validators check each request inside one zip_fold via
              // `expect validation(request)`, so a request that fails its predicate
              // crashes the WHOLE execution transaction — every valid order batched
              // alongside it dies too, with only an opaque "the validator crashed"
              // to go on. Refuse to package it, and say which order it was.
              _context33.n = 6;
              return this.screenOrderForExecution(utxo, parsed);
            case 6:
              screened = _context33.v;
              if (screened.ok) {
                _context33.n = 7;
                break;
              }
              throw new Error("Order ".concat(origin.transaction_id, "#").concat(origin.output_index, " cannot be executed: ") + "".concat(screened.reason, ". Every order batched with it would crash on-chain."));
            case 7:
              if (!(actionType === null)) {
                _context33.n = 8;
                break;
              }
              actionType = parsed.actionType;
              _context33.n = 9;
              break;
            case 8:
              if (!(actionType !== parsed.actionType)) {
                _context33.n = 9;
                break;
              }
              throw new Error("Mixed order types in inputs. All orders must be of the same type.");
            case 9:
              if (parsed.actionType === "mint" || parsed.actionType === "burn") {
                exchangeRequests.push({
                  destination: datum.destination,
                  amount: parsed.amount,
                  min_received: (_parsed$minReceived = parsed.minReceived) !== null && _parsed$minReceived !== void 0 ? _parsed$minReceived : 0n,
                  origin: origin,
                  reserve_asset: parsed.reserveAsset
                });
              } else if (parsed.actionType === "deposit" || parsed.actionType === "withdraw") {
                treasuryRequests.push(this.buildTreasuryRequest(datum, parsed, origin));
              } else if (parsed.actionType === "stake" || parsed.actionType === "unstake") {
                stakeRequests.push({
                  destination: datum.destination,
                  amount: parsed.amount,
                  min_received: (_parsed$minReceived2 = parsed.minReceived) !== null && _parsed$minReceived2 !== void 0 ? _parsed$minReceived2 : 0n,
                  origin: origin,
                  forfeit: (_parsed$forfeit = parsed.forfeit) !== null && _parsed$forfeit !== void 0 ? _parsed$forfeit : 0n
                });
              } else {
                directRequests.push({
                  destination: datum.destination,
                  amount: parsed.amount,
                  origin: origin
                });
              }
            case 10:
              _context33.n = 4;
              break;
            case 11:
              _context33.n = 13;
              break;
            case 12:
              _context33.p = 12;
              _t0 = _context33.v;
              _iterator4.e(_t0);
            case 13:
              _context33.p = 13;
              _iterator4.f();
              return _context33.f(13);
            case 14:
              if (!(alpha && actionType !== "deposit")) {
                _context33.n = 15;
                break;
              }
              throw new Error("a ".concat(actionType, " batch takes no yield-split alpha (only a deposit splits yield)"));
            case 15:
              if (!(actionType === "deposit")) {
                _context33.n = 16;
                break;
              }
              batchVerdict = (0, _orderSanity.screenDepositBatch)(treasuryRequests.map(function (request) {
                return {
                  actionType: "deposit",
                  amount: request.amount,
                  "yield": request["yield"]
                };
              }));
              if (batchVerdict.ok) {
                _context33.n = 16;
                break;
              }
              throw new Error("".concat(batchVerdict.reason, ". Every order batched with it would crash on-chain."));
            case 16:
              _t1 = actionType;
              _context33.n = _t1 === "mint" ? 17 : _t1 === "burn" ? 18 : _t1 === "withdraw" ? 19 : _t1 === "deposit" ? 20 : _t1 === "stake" ? 22 : _t1 === "unstake" ? 23 : _t1 === "direct_mint" ? 24 : _t1 === "direct_burn" ? 25 : 26;
              break;
            case 17:
              action = {
                Mint: {
                  requests: exchangeRequests
                }
              };
              return _context33.a(3, 27);
            case 18:
              action = {
                Burn: {
                  requests: exchangeRequests
                }
              };
              return _context33.a(3, 27);
            case 19:
              action = {
                Withdraw: {
                  requests: treasuryRequests
                }
              };
              return _context33.a(3, 27);
            case 20:
              _context33.n = 21;
              return this.buildDepositAction(treasuryRequests, alpha);
            case 21:
              action = _context33.v;
              return _context33.a(3, 27);
            case 22:
              action = {
                Stake: {
                  requests: stakeRequests
                }
              };
              return _context33.a(3, 27);
            case 23:
              action = {
                Unstake: {
                  requests: stakeRequests
                }
              };
              return _context33.a(3, 27);
            case 24:
              action = {
                DirectMint: {
                  requests: directRequests
                }
              };
              return _context33.a(3, 27);
            case 25:
              action = {
                DirectBurn: {
                  requests: directRequests
                }
              };
              return _context33.a(3, 27);
            case 26:
              throw new Error("No orders to process");
            case 27:
              payload = {
                action: action,
                nonce: nonce
              };
              serialized = Data.serialize(this.signing.SignedPayload_ProtocolRedeemerV1, payload);
              signedPayload = serialized.toCbor().toString();
              payloadHash = (0, _core.blake2b_256)((0, _core.HexBlob)(signedPayload));
              return _context33.a(2, {
                signedPayload: signedPayload,
                payloadHash: payloadHash
              });
          }
        }, _callee32, this, [[3, 12, 13, 14]]);
      }));
      function getSignedPayloadFromOrderInputs(_x29, _x30) {
        return _getSignedPayloadFromOrderInputs.apply(this, arguments);
      }
      return getSignedPayloadFromOrderInputs;
    }() // ─────────────────────────────────────────────────────────────────────────────
    // Execute Orders
    // ─────────────────────────────────────────────────────────────────────────────
    /**
     * Build a transaction to execute orders.
     *
     * Handles all 8 action types: mint, burn, deposit, withdraw, stake, unstake,
     * direct_mint, direct_burn.
     */
  }, {
    key: "buildExecuteOrdersTx",
    value: function () {
      var _buildExecuteOrdersTx = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee33(params) {
        var orderInputs, signedPayloadCbor, signatures, fees, signedPayload, sortedOrderInputs, orderUtxos, orderInfos, actionType, _yield$this$getParsed2, proxyUtxo, parsedProxyDatum, settings, needsTreasury, needsVault, isMintAction, isStakeAction, scriptHashesNeeded, refInputs, treasuryUtxo, parsedTreasuryDatum, treasuryResult, vaultUtxo, parsedVaultDatum, vaultResult, walletUtxos, excludedInputIds, utxoKey, _iterator5, _step5, orderInfo, _i3, _Object$values, refUtxo, feeUtxos, allInputRefs, _iterator6, _step6, feeUtxo, sortedAllInputRefs, findInputIdx, treasuryInputIdx, vaultInputIdx, signedRequests, originToRequestIdx, i, o, inputToRequests, requestToOutputs, outputIdx, input, key, requestIdx, numDestOutputs, numExtraOutputs, totalYield, _vaultValue$multiasse3, _vaultValue$multiasse4, vaultValue, _stablecoinAssetId, vaultUSDr, treasuryCirculating, _this$resolveDepositY, unstakedYieldShare, totalForfeit, treasuryOutputIdx, vaultOutputIdx, extra, serializedSignedRedeemer, executeRedeemer, tx, _iterator7, _step7, _orderInfo, _iterator8, _step8, _feeUtxo, orchestratorRewardAccount, subValidatorHash, subValidatorRewardAccount, voidRedeemer, stablecoinAssetId, sUSDrAssetId, _t10;
        return _regenerator().w(function (_context34) {
          while (1) switch (_context34.n) {
            case 0:
              orderInputs = params.orderInputs, signedPayloadCbor = params.signedPayload, signatures = params.signatures, fees = params.fees; // Deserialize CBOR hex to object for internal use
              signedPayload = (0, _data.parse)(this.signing.SignedPayload_ProtocolRedeemerV1, _core.PlutusData.fromCbor((0, _core.HexBlob)(signedPayloadCbor))); // 1. Sort and resolve order UTxOs
              sortedOrderInputs = (0, _index2.sortOrderInputs)(orderInputs);
              _context34.n = 1;
              return this.blaze.provider.resolveUnspentOutputs(sortedOrderInputs);
            case 1:
              orderUtxos = _context34.v;
              // 2. Parse orders and validate same type. The fees map (if any) stamps
              // each IOrderInfo with the locked fee that buildXxxExecute will subtract.
              orderInfos = this.parseOrderInfos(orderUtxos, fees);
              actionType = orderInfos[0].actionType; // 3. Get protocol settings
              _context34.n = 2;
              return this.getParsedProxyDatum();
            case 2:
              _yield$this$getParsed2 = _context34.v;
              proxyUtxo = _yield$this$getParsed2.proxyUtxo;
              parsedProxyDatum = _yield$this$getParsed2.parsedProxyDatum;
              settings = this.settingsConfig(parsedProxyDatum.settings); // 4. Determine what we need
              needsTreasury = ["mint", "burn", "withdraw", "deposit", "direct_mint", "direct_burn"].includes(actionType);
              needsVault = ["stake", "unstake", "deposit"].includes(actionType); // 5. Get script reference inputs
              // V1.0 requires the orchestrator and the relevant sub-validator script
              isMintAction = ["mint", "burn", "direct_mint", "direct_burn"].includes(actionType);
              isStakeAction = ["stake", "unstake"].includes(actionType);
              scriptHashesNeeded = {
                protocol: this.protocolScriptHash,
                order: this.orderScriptHash
              };
              if (isMintAction) {
                scriptHashesNeeded.protocolMint = this.protocolMintScriptHash;
              } else if (isStakeAction) {
                scriptHashesNeeded.protocolStake = this.protocolStakeScriptHash;
              } else {
                scriptHashesNeeded.protocolManagement = this.protocolManagementScriptHash;
              }
              if (needsTreasury) {
                scriptHashesNeeded.treasury = this.treasuryScriptHash;
              }
              if (needsVault) {
                scriptHashesNeeded.stakingVault = this.stakingVaultScriptHash;
              }
              _context34.n = 3;
              return this.getScriptReferenceInputs(scriptHashesNeeded);
            case 3:
              refInputs = _context34.v;
              if (!needsTreasury) {
                _context34.n = 5;
                break;
              }
              _context34.n = 4;
              return this.getTreasuryDatum();
            case 4:
              treasuryResult = _context34.v;
              treasuryUtxo = treasuryResult.treasuryUtxo;
              parsedTreasuryDatum = treasuryResult.parsedTreasuryDatum;
            case 5:
              if (!needsVault) {
                _context34.n = 7;
                break;
              }
              _context34.n = 6;
              return this.getVaultDatum();
            case 6:
              vaultResult = _context34.v;
              vaultUtxo = vaultResult.vaultUtxo;
              parsedVaultDatum = vaultResult.parsedVaultDatum;
            case 7:
              _context34.n = 8;
              return this.blaze.wallet.getUnspentOutputs();
            case 8:
              walletUtxos = _context34.v;
              excludedInputIds = new Set();
              utxoKey = function utxoKey(inp) {
                return "".concat(inp.transactionId().toString(), "#").concat(inp.index().toString());
              }; // Exclude script inputs (order, treasury, vault)
              _iterator5 = _createForOfIteratorHelper(orderInfos);
              try {
                for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
                  orderInfo = _step5.value;
                  excludedInputIds.add(utxoKey(orderInfo.utxo.input()));
                }
              } catch (err) {
                _iterator5.e(err);
              } finally {
                _iterator5.f();
              }
              if (treasuryUtxo) {
                excludedInputIds.add(utxoKey(treasuryUtxo.input()));
              }
              if (vaultUtxo) {
                excludedInputIds.add(utxoKey(vaultUtxo.input()));
              }
              // Exclude reference inputs (must be disjoint from regular inputs)
              excludedInputIds.add(utxoKey(proxyUtxo.input()));
              for (_i3 = 0, _Object$values = Object.values(refInputs); _i3 < _Object$values.length; _i3++) {
                refUtxo = _Object$values[_i3];
                if (refUtxo) {
                  excludedInputIds.add(utxoKey(refUtxo.input()));
                }
              }
              feeUtxos = walletUtxos.filter(function (utxo) {
                return !excludedInputIds.has(utxoKey(utxo.input()));
              }); // 8. Compute input indices (ledger sorts inputs by txHash + outputIndex).
              allInputRefs = orderInfos.map(function (o) {
                return o.utxo.input();
              });
              if (treasuryUtxo) {
                allInputRefs.push(treasuryUtxo.input());
              }
              if (vaultUtxo) {
                allInputRefs.push(vaultUtxo.input());
              }
              _iterator6 = _createForOfIteratorHelper(feeUtxos);
              try {
                for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
                  feeUtxo = _step6.value;
                  allInputRefs.push(feeUtxo.input());
                }
              } catch (err) {
                _iterator6.e(err);
              } finally {
                _iterator6.f();
              }
              sortedAllInputRefs = _toConsumableArray(allInputRefs).sort(function (a, b) {
                var txA = a.transactionId().toString();
                var txB = b.transactionId().toString();
                if (txA < txB) return -1;
                if (txA > txB) return 1;
                return Number(a.index()) - Number(b.index());
              });
              findInputIdx = function findInputIdx(input) {
                var idx = sortedAllInputRefs.findIndex(function (r) {
                  return r.transactionId().toString() === input.transactionId().toString() && r.index() === input.index();
                });
                return BigInt(idx);
              };
              treasuryInputIdx = treasuryUtxo ? findInputIdx(treasuryUtxo.input()) : 0n;
              vaultInputIdx = vaultUtxo ? findInputIdx(vaultUtxo.input()) : undefined; // 8a. Correlate order inputs to signed request indices via origin fields.
              // When all orders are present this produces the same identity mapping as before.
              // When a subset is passed (partial execution), it maps each input to the
              // correct request index in the signed payload.
              signedRequests = getRequestsFromAction(signedPayload.action);
              originToRequestIdx = new Map();
              for (i = 0; i < signedRequests.length; i++) {
                o = signedRequests[i].origin;
                originToRequestIdx.set("".concat(o.transaction_id, "#").concat(o.output_index), i);
              }
              inputToRequests = [];
              requestToOutputs = [];
              outputIdx = 0;
            case 9:
              if (!(outputIdx < orderInfos.length)) {
                _context34.n = 12;
                break;
              }
              input = orderInfos[outputIdx].utxo.input();
              key = "".concat(input.transactionId(), "#").concat(input.index());
              requestIdx = originToRequestIdx.get(key);
              if (!(requestIdx === undefined)) {
                _context34.n = 10;
                break;
              }
              throw new Error("Order input ".concat(key, " not found in signed payload"));
            case 10:
              inputToRequests.push(BigInt(requestIdx));
              requestToOutputs.push(BigInt(outputIdx));
            case 11:
              outputIdx++;
              _context34.n = 9;
              break;
            case 12:
              // 9. Build outputs and compute output indices
              numDestOutputs = orderInfos.length; // For deposit with positive yield, the yield pot output is inserted after destinations
              numExtraOutputs = 0;
              if (actionType === "deposit") {
                totalYield = orderInfos.reduce(function (sum, o) {
                  var _o$yield;
                  return sum + ((_o$yield = o["yield"]) !== null && _o$yield !== void 0 ? _o$yield : 0n);
                }, 0n);
                if (totalYield > 0n) {
                  vaultValue = vaultUtxo.output().amount();
                  _stablecoinAssetId = _sdk.Core.AssetId(this.stablecoinPolicyId + this.assetNameHex);
                  vaultUSDr = (_vaultValue$multiasse3 = (_vaultValue$multiasse4 = vaultValue.multiasset()) === null || _vaultValue$multiasse4 === void 0 ? void 0 : _vaultValue$multiasse4.get(_stablecoinAssetId)) !== null && _vaultValue$multiasse3 !== void 0 ? _vaultValue$multiasse3 : 0n;
                  treasuryCirculating = parsedTreasuryDatum.circulating_supply; // Use the signed split (rc1 echoes alpha; v1_0 recomputes) so pot-output
                  // existence/indexing agrees with buildDepositExecute and the validator.
                  _this$resolveDepositY = this.resolveDepositYieldShares(totalYield, vaultUSDr, treasuryCirculating, signedPayload.action), unstakedYieldShare = _this$resolveDepositY.unstakedYieldShare;
                  if (unstakedYieldShare > 0n) {
                    numExtraOutputs = 1;
                  }
                }
              }

              // For unstake, add yield pot output if forfeit is non-zero.
              if (actionType === "unstake") {
                totalForfeit = orderInfos.reduce(function (sum, o) {
                  var _o$forfeit;
                  return sum + ((_o$forfeit = o.forfeit) !== null && _o$forfeit !== void 0 ? _o$forfeit : 0n);
                }, 0n);
                if (totalForfeit > 0n) {
                  numExtraOutputs = 1;
                }
              }
              treasuryOutputIdx = needsTreasury ? BigInt(numDestOutputs + numExtraOutputs) : 0n;
              vaultOutputIdx = needsVault ? BigInt(numDestOutputs + numExtraOutputs + (needsTreasury ? 1 : 0)) : undefined; // 10. Build ExtraProtocolRedeemer
              extra = {
                request_to_outputs: requestToOutputs,
                input_to_requests: inputToRequests,
                treasury_input_idx: treasuryInputIdx,
                treasury_output_idx: treasuryOutputIdx,
                vault_input_idx: vaultInputIdx,
                vault_output_idx: vaultOutputIdx
              }; // 11. Build SignedRedeemer (versions may wrap it in a dispatch enum)
              serializedSignedRedeemer = this.serializeOrchestratorWithdrawalRedeemer({
                extra: extra,
                payload: signedPayload,
                signatures: signatures
              });
              executeRedeemer = Data.serialize(this.schemas.OrderRedeemerV1, "Execute"); // 12. Build the transaction
              tx = this.newOrderTransaction(); // Add order inputs with Execute redeemer
              _iterator7 = _createForOfIteratorHelper(orderInfos);
              try {
                for (_iterator7.s(); !(_step7 = _iterator7.n()).done;) {
                  _orderInfo = _step7.value;
                  tx.addInput(_orderInfo.utxo, executeRedeemer);
                }

                // Add wallet fee inputs explicitly
              } catch (err) {
                _iterator7.e(err);
              } finally {
                _iterator7.f();
              }
              _iterator8 = _createForOfIteratorHelper(feeUtxos);
              try {
                for (_iterator8.s(); !(_step8 = _iterator8.n()).done;) {
                  _feeUtxo = _step8.value;
                  tx.addInput(_feeUtxo);
                }

                // Add reference inputs
              } catch (err) {
                _iterator8.e(err);
              } finally {
                _iterator8.f();
              }
              tx.addReferenceInput(refInputs.protocol);
              tx.addReferenceInput(refInputs.order);
              tx.addReferenceInput(proxyUtxo);
              // V1.0 sub-validator reference inputs
              if (refInputs.protocolMint) {
                tx.addReferenceInput(refInputs.protocolMint);
              }
              if (refInputs.protocolStake) {
                tx.addReferenceInput(refInputs.protocolStake);
              }
              if (refInputs.protocolManagement) {
                tx.addReferenceInput(refInputs.protocolManagement);
              }
              if (refInputs.treasury) {
                tx.addReferenceInput(refInputs.treasury);
              }
              if (refInputs.stakingVault) {
                tx.addReferenceInput(refInputs.stakingVault);
              }

              // Add orchestrator withdrawal with signed redeemer
              orchestratorRewardAccount = _sdk.Core.RewardAccount.fromCredential({
                type: _sdk.Core.CredentialType.ScriptHash,
                hash: this.protocolScriptHash
              }, this.network);
              tx.addWithdrawal(orchestratorRewardAccount, 0n, serializedSignedRedeemer);

              // Determine which sub-validator to use based on action type
              subValidatorHash = actionType === "mint" || actionType === "burn" || actionType === "direct_mint" || actionType === "direct_burn" ? this.protocolMintScriptHash : actionType === "stake" || actionType === "unstake" ? this.protocolStakeScriptHash : this.protocolManagementScriptHash; // deposit, withdraw
              // Add sub-validator withdrawal with void redeemer
              subValidatorRewardAccount = _sdk.Core.RewardAccount.fromCredential({
                type: _sdk.Core.CredentialType.ScriptHash,
                hash: subValidatorHash
              }, this.network);
              voidRedeemer = Data.Void();
              tx.addWithdrawal(subValidatorRewardAccount, 0n, voidRedeemer);

              // Build per-action-type outputs, minting, and state updates
              stablecoinAssetId = _sdk.Core.AssetId(this.stablecoinPolicyId + this.assetNameHex);
              sUSDrAssetId = _sdk.Core.AssetId(this.stablecoinPolicyId + this.sUSDrAssetNameHex);
              _t10 = actionType;
              _context34.n = _t10 === "mint" ? 13 : _t10 === "burn" ? 14 : _t10 === "withdraw" ? 15 : _t10 === "deposit" ? 16 : _t10 === "stake" ? 17 : _t10 === "unstake" ? 18 : _t10 === "direct_mint" ? 19 : _t10 === "direct_burn" ? 20 : 21;
              break;
            case 13:
              this.buildMintExecute(tx, orderInfos, stablecoinAssetId, treasuryUtxo, parsedTreasuryDatum, settings);
              return _context34.a(3, 21);
            case 14:
              this.buildBurnExecute(tx, orderInfos, stablecoinAssetId, treasuryUtxo, parsedTreasuryDatum, settings);
              return _context34.a(3, 21);
            case 15:
              this.buildWithdrawExecute(tx, orderInfos, treasuryUtxo, parsedTreasuryDatum, settings);
              return _context34.a(3, 21);
            case 16:
              this.buildDepositExecute(tx, orderInfos, stablecoinAssetId, treasuryUtxo, parsedTreasuryDatum, vaultUtxo, parsedVaultDatum, settings, signedPayload.action);
              return _context34.a(3, 21);
            case 17:
              this.buildStakeExecute(tx, orderInfos, stablecoinAssetId, sUSDrAssetId, vaultUtxo, parsedVaultDatum);
              return _context34.a(3, 21);
            case 18:
              this.buildUnstakeExecute(tx, orderInfos, stablecoinAssetId, sUSDrAssetId, vaultUtxo, parsedVaultDatum, settings);
              return _context34.a(3, 21);
            case 19:
              this.buildDirectMintExecute(tx, orderInfos, stablecoinAssetId, treasuryUtxo, parsedTreasuryDatum);
              return _context34.a(3, 21);
            case 20:
              this.buildDirectBurnExecute(tx, orderInfos, stablecoinAssetId, treasuryUtxo, parsedTreasuryDatum);
              return _context34.a(3, 21);
            case 21:
              // Provide the mint proxy script for minting
              tx.provideScript(this.mintProxyScript);
              _context34.n = 22;
              return this.applyExecutionValidityBounds(tx, {
                actionType: actionType,
                vaultUtxo: vaultUtxo,
                parsedVaultDatum: parsedVaultDatum
              });
            case 22:
              return _context34.a(2, tx);
          }
        }, _callee33, this);
      }));
      function buildExecuteOrdersTx(_x31) {
        return _buildExecuteOrdersTx.apply(this, arguments);
      }
      return buildExecuteOrdersTx;
    }() // ─────────────────────────────────────────────────────────────────────────────
    // Per-Action Execute Builders
    // ─────────────────────────────────────────────────────────────────────────────
    /**
     * Mint: reserve goes to treasury, USDr minted to destinations.
     *
     * The per-order fee (in USDr, locked at index time) is retained by the
     * treasury: the user receives `amount − fee` USDr while `amount` is still
     * minted, so the protocol pockets the difference via the treasury balance.
     */
  }, {
    key: "buildMintExecute",
    value: function buildMintExecute(tx, orderInfos, stablecoinAssetId, treasuryUtxo, parsedTreasuryDatum, settings) {
      // The audited mint contract enforces `mint_amount == total_delivered`
      // and `circulating_supply` increases by `total_delivered` (cf.
      // utilities.ak::maintain_treasury_mint). So we mint and credit the
      // treasury for what users actually receive — `amount − fee` per order —
      // while the reserve consumed per request stays based on the full
      // signed `amount` (the user paid in reserve for the whole `amount`,
      // even though they receive less; the protocol keeps the spread in
      // reserve worth — this is the locked fee).
      var totalDelivered = orderInfos.reduce(function (sum, o) {
        return sum + (o.amount - o.fee);
      }, 0n);

      // Destination outputs: send `amount − fee` USDr to each destination.
      var _iterator9 = _createForOfIteratorHelper(orderInfos),
        _step9;
      try {
        for (_iterator9.s(); !(_step9 = _iterator9.n()).done;) {
          var orderInfo = _step9.value;
          var ra = (0, _index2.findReserveAsset)(settings, orderInfo.reserveAsset);
          var reserveAssetId = _sdk.Core.AssetId(orderInfo.reserveAsset[0] + orderInfo.reserveAsset[1]);
          var reserveAmount = (0, _index2.usdrToReserveCeil)(orderInfo.amount, ra);
          var userAmount = orderInfo.amount - orderInfo.fee;
          (0, _index2.addDestinationOutput)(tx, this.network, orderInfo.datum.destination, buildOrderDestinationValue(orderInfo, [[reserveAssetId, reserveAmount]], [[stablecoinAssetId, userAmount]]));
        }

        // Mint USDr — exactly what was delivered (contract invariant).
      } catch (err) {
        _iterator9.e(err);
      } finally {
        _iterator9.f();
      }
      tx.addMint(this.stablecoinPolicyId, new Map([[_sdk.Core.AssetName(this.assetNameHex), totalDelivered]]), Data.Void());

      // Reserve deltas: based on the full signed amounts (unchanged by fees).
      var reserveDeltas = (0, _index2.computeReserveDeltas)(orderInfos, settings);
      this.updateTreasuryOutput(tx, treasuryUtxo, parsedTreasuryDatum, reserveDeltas, totalDelivered);
    }

    /**
     * Burn: USDr burned, reserve sent to destinations.
     *
     * The audited contract decreases circulating_supply by the FULL signed
     * `amount` (the user burns the whole `amount` of USDr) and the reserve
     * outflow per asset equals what the user actually receives. The locked
     * fee (in reserve units) stays in the treasury — by paying out
     * `usdr_to_reserve(amount, ra) − fee` instead of the full natural
     * amount, the protocol pockets the difference.
     */
  }, {
    key: "buildBurnExecute",
    value: function buildBurnExecute(tx, orderInfos, stablecoinAssetId, treasuryUtxo, parsedTreasuryDatum, settings) {
      var totalAmount = orderInfos.reduce(function (sum, o) {
        return sum + o.amount;
      }, 0n);

      // Destination outputs: send `usdr_to_reserve(amount, ra) − fee` reserve
      // to each destination. Track the actually-delivered amount per reserve
      // asset so we can subtract the fee from the treasury reserve outflow.
      var deliveredByAsset = new Map();
      var _iterator0 = _createForOfIteratorHelper(orderInfos),
        _step0;
      try {
        for (_iterator0.s(); !(_step0 = _iterator0.n()).done;) {
          var _deliveredByAsset$get;
          var orderInfo = _step0.value;
          var ra = (0, _index2.findReserveAsset)(settings, orderInfo.reserveAsset);
          var reserveAssetId = _sdk.Core.AssetId(orderInfo.reserveAsset[0] + orderInfo.reserveAsset[1]);
          var naturalReserve = (0, _index2.usdrToReserve)(-orderInfo.amount, ra);
          var reserveAmount = naturalReserve - orderInfo.fee;
          (0, _index2.addDestinationOutput)(tx, this.network, orderInfo.datum.destination, buildOrderDestinationValue(orderInfo, [[stablecoinAssetId, -orderInfo.amount]], [[reserveAssetId, reserveAmount]]));
          var assetKey = orderInfo.reserveAsset[0] + orderInfo.reserveAsset[1];
          deliveredByAsset.set(assetKey, ((_deliveredByAsset$get = deliveredByAsset.get(assetKey)) !== null && _deliveredByAsset$get !== void 0 ? _deliveredByAsset$get : 0n) + reserveAmount);
        }

        // Burn USDr — full signed amount per request (totalAmount is negative).
      } catch (err) {
        _iterator0.e(err);
      } finally {
        _iterator0.f();
      }
      tx.addMint(this.stablecoinPolicyId, new Map([[_sdk.Core.AssetName(this.assetNameHex), totalAmount]]), Data.Void());

      // Reserve deltas: out by what we actually delivered (negated). The
      // protocol keeps the per-order fee inside the treasury balance.
      var reserveDeltas = new Map();
      var _iterator1 = _createForOfIteratorHelper(deliveredByAsset.entries()),
        _step1;
      try {
        for (_iterator1.s(); !(_step1 = _iterator1.n()).done;) {
          var _step1$value = _slicedToArray(_step1.value, 2),
            _assetKey = _step1$value[0],
            delivered = _step1$value[1];
          reserveDeltas.set(_assetKey, -delivered);
        }
      } catch (err) {
        _iterator1.e(err);
      } finally {
        _iterator1.f();
      }
      this.updateTreasuryOutput(tx, treasuryUtxo, parsedTreasuryDatum, reserveDeltas, totalAmount);
    }

    /**
     * Withdraw: reserve sent to destinations, no mint/burn.
     */
  }, {
    key: "buildWithdrawExecute",
    value: function buildWithdrawExecute(tx, orderInfos, treasuryUtxo, parsedTreasuryDatum, settings) {
      // Destination outputs: send reserve tokens to each destination
      var _iterator10 = _createForOfIteratorHelper(orderInfos),
        _step10;
      try {
        for (_iterator10.s(); !(_step10 = _iterator10.n()).done;) {
          var orderInfo = _step10.value;
          var ra = (0, _index2.findReserveAsset)(settings, orderInfo.reserveAsset);
          var reserveAssetId = _sdk.Core.AssetId(orderInfo.reserveAsset[0] + orderInfo.reserveAsset[1]);
          var reserveAmount = (0, _index2.usdrToReserve)(orderInfo.amount, ra);
          (0, _index2.addDestinationOutput)(tx, this.network, orderInfo.datum.destination, buildOrderDestinationValue(orderInfo, [], [[reserveAssetId, reserveAmount]]));
        }

        // Update treasury: reserve decreases, no circulating_supply change
      } catch (err) {
        _iterator10.e(err);
      } finally {
        _iterator10.f();
      }
      var reserveDeltas = (0, _index2.computeReserveDeltas)(orderInfos, settings, true);
      this.updateTreasuryOutput(tx, treasuryUtxo, parsedTreasuryDatum, reserveDeltas, 0n);
    }

    /**
     * Deposit: reserve deposited, interest USDr minted and split between vault and yield pot.
     */
  }, {
    key: "buildDepositExecute",
    value: function buildDepositExecute(tx, orderInfos, stablecoinAssetId, treasuryUtxo, parsedTreasuryDatum, vaultUtxo, parsedVaultDatum, settings, action) {
      var _vaultValue$multiasse5, _vaultValue$multiasse6;
      var totalYield = orderInfos.reduce(function (sum, o) {
        var _o$yield2;
        return sum + ((_o$yield2 = o["yield"]) !== null && _o$yield2 !== void 0 ? _o$yield2 : 0n);
      }, 0n);

      // Calculate yield split. rc1 echoes the COSE-signed alpha; v1_0 recomputes
      // from live state. Must NOT re-derive independently from vault/treasury —
      // the validator checks the split against the signed action.
      var vaultValue = vaultUtxo.output().amount();
      var vaultUSDr = (_vaultValue$multiasse5 = (_vaultValue$multiasse6 = vaultValue.multiasset()) === null || _vaultValue$multiasse6 === void 0 ? void 0 : _vaultValue$multiasse6.get(stablecoinAssetId)) !== null && _vaultValue$multiasse5 !== void 0 ? _vaultValue$multiasse5 : 0n;
      var treasuryCirculating = parsedTreasuryDatum.circulating_supply;
      var _this$resolveDepositY2 = this.resolveDepositYieldShares(totalYield, vaultUSDr, treasuryCirculating, action),
        stakedYieldShare = _this$resolveDepositY2.stakedYieldShare,
        unstakedYieldShare = _this$resolveDepositY2.unstakedYieldShare;
      var remainingOrderUSDrToBurn = unstakedYieldShare < 0n ? -unstakedYieldShare : 0n;

      // Destination outputs: return any order surplus after protocol consumption.
      var _iterator11 = _createForOfIteratorHelper(orderInfos),
        _step11;
      try {
        for (_iterator11.s(); !(_step11 = _iterator11.n()).done;) {
          var _orderInfo$yield;
          var orderInfo = _step11.value;
          var reserveAssetId = _sdk.Core.AssetId(orderInfo.reserveAsset[0] + orderInfo.reserveAsset[1]);
          var ra = (0, _index2.findReserveAsset)(settings, orderInfo.reserveAsset);
          var yieldValue = (_orderInfo$yield = orderInfo["yield"]) !== null && _orderInfo$yield !== void 0 ? _orderInfo$yield : 0n;
          var usdrBacking = yieldValue >= 0n ? orderInfo.amount + yieldValue : orderInfo.amount;
          var reserveAmount = (0, _index2.usdrToReserve)(usdrBacking, ra);
          var consumedAssets = [[reserveAssetId, reserveAmount]];
          if (remainingOrderUSDrToBurn > 0n) {
            var _orderInfo$utxo$outpu, _orderInfo$utxo$outpu2;
            var orderUSDr = (_orderInfo$utxo$outpu = (_orderInfo$utxo$outpu2 = orderInfo.utxo.output().amount().multiasset()) === null || _orderInfo$utxo$outpu2 === void 0 ? void 0 : _orderInfo$utxo$outpu2.get(stablecoinAssetId)) !== null && _orderInfo$utxo$outpu !== void 0 ? _orderInfo$utxo$outpu : 0n;
            var consumedUSDr = orderUSDr < remainingOrderUSDrToBurn ? orderUSDr : remainingOrderUSDrToBurn;
            if (consumedUSDr > 0n) {
              consumedAssets.push([stablecoinAssetId, consumedUSDr]);
              remainingOrderUSDrToBurn -= consumedUSDr;
            }
          }
          (0, _index2.addDestinationOutput)(tx, this.network, orderInfo.datum.destination, buildOrderDestinationValue(orderInfo, consumedAssets));
        }
      } catch (err) {
        _iterator11.e(err);
      } finally {
        _iterator11.f();
      }
      if (totalYield > 0n) {
        tx.addMint(this.stablecoinPolicyId, new Map([[_sdk.Core.AssetName(this.assetNameHex), totalYield]]), Data.Void());
        if (unstakedYieldShare > 0n) {
          // The yield pot is a script address in production (WTB-1172), so
          // build the output directly with NoDatum.
          (0, _index2.addDestinationOutput)(tx, this.network, {
            address: settings.unstaked_yield_pot,
            datum: "NoDatum"
          }, (0, _sdk.makeValue)(MIN_LOVELACE, [stablecoinAssetId, unstakedYieldShare]));
        }
      } else if (totalYield < 0n) {
        tx.addMint(this.stablecoinPolicyId, new Map([[_sdk.Core.AssetName(this.assetNameHex), totalYield]]), Data.Void());
      }

      // Update treasury
      var reserveDeltas = new Map();
      var _iterator12 = _createForOfIteratorHelper(orderInfos),
        _step12;
      try {
        for (_iterator12.s(); !(_step12 = _iterator12.n()).done;) {
          var _orderInfo2$yield, _reserveDeltas$get;
          var _orderInfo2 = _step12.value;
          var assetId = _orderInfo2.reserveAsset[0] + _orderInfo2.reserveAsset[1];
          var _ra = (0, _index2.findReserveAsset)(settings, _orderInfo2.reserveAsset);
          var _yieldValue = (_orderInfo2$yield = _orderInfo2["yield"]) !== null && _orderInfo2$yield !== void 0 ? _orderInfo2$yield : 0n;
          var _usdrBacking = _yieldValue >= 0n ? _orderInfo2.amount + _yieldValue : _orderInfo2.amount;
          var _reserveAmount = (0, _index2.usdrToReserve)(_usdrBacking, _ra);
          reserveDeltas.set(assetId, ((_reserveDeltas$get = reserveDeltas.get(assetId)) !== null && _reserveDeltas$get !== void 0 ? _reserveDeltas$get : 0n) + _reserveAmount);
        }
      } catch (err) {
        _iterator12.e(err);
      } finally {
        _iterator12.f();
      }
      this.updateTreasuryOutput(tx, treasuryUtxo, parsedTreasuryDatum, reserveDeltas, totalYield);

      // Update vault. Datum construction is delegated so versions with a
      // yield-diffusion window (v1_1_rc1) can set it from the batch's requests;
      // the v1_0 default just moves the vault USDr by the staked share.
      this.updateDepositVaultOutput(tx, vaultUtxo, parsedVaultDatum, {
        stakedYieldShare: stakedYieldShare,
        totalYield: totalYield,
        orderInfos: orderInfos
      });
    }

    /**
     * Version hook: lock the post-deposit vault output. v1_0 / v1_0_rc1 keep the
     * one-field datum and simply add `stakedYieldShare` USDr to the vault.
     * Versions with time-diffused yield override this to roll the staked share
     * into the diffusion window (`validate_deposit_diffusion` in deposit.ak).
     */
  }, {
    key: "updateDepositVaultOutput",
    value: function updateDepositVaultOutput(tx, vaultUtxo, parsedVaultDatum, ctx) {
      this.updateVaultOutput(tx, vaultUtxo, parsedVaultDatum, 0n, ctx.stakedYieldShare);
    }

    /**
     * Stake: USDr locked in vault, sUSDr minted to destinations.
     *
     * Stake is not fee-filtered (no protocol fee retained on stake), so the
     * vault receives the full `amount` USDr and mints sUSDr at the natural
     * rate.
     */
  }, {
    key: "buildStakeExecute",
    value: function buildStakeExecute(tx, orderInfos, stablecoinAssetId, sUSDrAssetId, vaultUtxo, parsedVaultDatum) {
      var _vaultValue$multiasse7, _vaultValue$multiasse8;
      var vaultValue = vaultUtxo.output().amount();
      var vaultUSDr = (_vaultValue$multiasse7 = (_vaultValue$multiasse8 = vaultValue.multiasset()) === null || _vaultValue$multiasse8 === void 0 ? void 0 : _vaultValue$multiasse8.get(stablecoinAssetId)) !== null && _vaultValue$multiasse7 !== void 0 ? _vaultValue$multiasse7 : 0n;
      // Rate is quoted against settled backing (v1_0: full balance; v1_1_rc1:
      // balance minus not-yet-diffused pending yield).
      var settledBacking = this.settledVaultBacking(parsedVaultDatum, vaultUSDr);
      var circulatingSUSDr = parsedVaultDatum.circulating_susdr;
      var totalUSDrToVault = 0n;
      var totalSUSDrMinted = 0n;
      var _iterator13 = _createForOfIteratorHelper(orderInfos),
        _step13;
      try {
        for (_iterator13.s(); !(_step13 = _iterator13.n()).done;) {
          var orderInfo = _step13.value;
          var usDrToVault = orderInfo.amount;
          totalUSDrToVault += usDrToVault;
          var sUSDrAmount = void 0;
          if (circulatingSUSDr === 0n || settledBacking === 0n) {
            // Bootstrap rate is 1:1 (cf. stake.ak).
            sUSDrAmount = usDrToVault;
          } else {
            sUSDrAmount = usDrToVault * circulatingSUSDr / settledBacking;
          }
          totalSUSDrMinted += sUSDrAmount;
          (0, _index2.addDestinationOutput)(tx, this.network, orderInfo.datum.destination, buildOrderDestinationValue(orderInfo, [[stablecoinAssetId, usDrToVault]], [[sUSDrAssetId, sUSDrAmount]]));
        }
      } catch (err) {
        _iterator13.e(err);
      } finally {
        _iterator13.f();
      }
      tx.addMint(this.stablecoinPolicyId, new Map([[_sdk.Core.AssetName(this.sUSDrAssetNameHex), totalSUSDrMinted]]), Data.Void());
      this.updateVaultOutput(tx, vaultUtxo, parsedVaultDatum, totalSUSDrMinted, totalUSDrToVault);
    }

    /**
     * Unstake: sUSDr burned, USDr sent to user's destination address.
     * V1_0: Supports forfeit parameter - forfeited USDr goes to yield pot.
     */
  }, {
    key: "buildUnstakeExecute",
    value: function buildUnstakeExecute(tx, orderInfos, stablecoinAssetId, sUSDrAssetId, vaultUtxo, parsedVaultDatum, settings) {
      var _vaultValue$multiasse9, _vaultValue$multiasse0;
      var totalSUSDrBurned = orderInfos.reduce(function (sum, o) {
        return sum + o.amount;
      }, 0n);
      var vaultValue = vaultUtxo.output().amount();
      var vaultUSDr = (_vaultValue$multiasse9 = (_vaultValue$multiasse0 = vaultValue.multiasset()) === null || _vaultValue$multiasse0 === void 0 ? void 0 : _vaultValue$multiasse0.get(stablecoinAssetId)) !== null && _vaultValue$multiasse9 !== void 0 ? _vaultValue$multiasse9 : 0n;
      // Entitlement is quoted against settled backing (v1_0: full balance;
      // v1_1_rc1: balance minus not-yet-diffused pending yield).
      var settledBacking = this.settledVaultBacking(parsedVaultDatum, vaultUSDr);
      var circulatingSUSDr = parsedVaultDatum.circulating_susdr;
      if (circulatingSUSDr === 0n) {
        throw new Error("Cannot unstake: no sUSDr in circulation");
      }

      // The user receives `entitled − forfeit` USDr. Forfeit goes to the
      // unstaked yield pot; the vault decreases by the full natural entitlement
      // for each order. (Unstake is not fee-filtered.)
      var totalUSDrLeavingVault = 0n;
      var totalForfeit = 0n;
      var _iterator14 = _createForOfIteratorHelper(orderInfos),
        _step14;
      try {
        for (_iterator14.s(); !(_step14 = _iterator14.n()).done;) {
          var _orderInfo$forfeit;
          var orderInfo = _step14.value;
          var uSDrEntitled = orderInfo.amount * settledBacking / circulatingSUSDr;
          var forfeit = (_orderInfo$forfeit = orderInfo.forfeit) !== null && _orderInfo$forfeit !== void 0 ? _orderInfo$forfeit : 0n;
          var uSDrAmount = uSDrEntitled - forfeit;
          totalUSDrLeavingVault += uSDrEntitled;
          totalForfeit += forfeit;
          (0, _index2.addDestinationOutput)(tx, this.network, orderInfo.datum.destination, buildOrderDestinationValue(orderInfo, [[sUSDrAssetId, orderInfo.amount]], [[stablecoinAssetId, uSDrAmount]]));
        }

        // Send forfeited USDr to yield pot if any
      } catch (err) {
        _iterator14.e(err);
      } finally {
        _iterator14.f();
      }
      var totalYieldPot = totalForfeit;
      if (totalYieldPot > 0n) {
        // Script pot in production (WTB-1172) — see buildDepositExecute.
        (0, _index2.addDestinationOutput)(tx, this.network, {
          address: settings.unstaked_yield_pot,
          datum: "NoDatum"
        }, (0, _sdk.makeValue)(MIN_LOVELACE, [stablecoinAssetId, totalYieldPot]));
      }
      tx.addMint(this.stablecoinPolicyId, new Map([[_sdk.Core.AssetName(this.sUSDrAssetNameHex), -totalSUSDrBurned]]), Data.Void());
      this.updateVaultOutput(tx, vaultUtxo, parsedVaultDatum, -totalSUSDrBurned, -totalUSDrLeavingVault);
    }

    /**
     * DirectMint: Mint USDr without reserve asset flow.
     * USDr is minted to destinations, treasury circulating_supply increases.
     * NO reserve asset changes.
     */
  }, {
    key: "buildDirectMintExecute",
    value: function buildDirectMintExecute(tx, orderInfos, stablecoinAssetId, treasuryUtxo, parsedTreasuryDatum) {
      var totalAmount = orderInfos.reduce(function (sum, o) {
        return sum + o.amount;
      }, 0n);

      // Destination outputs: send USDr to each destination
      var _iterator15 = _createForOfIteratorHelper(orderInfos),
        _step15;
      try {
        for (_iterator15.s(); !(_step15 = _iterator15.n()).done;) {
          var orderInfo = _step15.value;
          (0, _index2.addDestinationOutput)(tx, this.network, orderInfo.datum.destination, buildOrderDestinationValue(orderInfo, [], [[stablecoinAssetId, orderInfo.amount]]));
        }

        // Mint USDr
      } catch (err) {
        _iterator15.e(err);
      } finally {
        _iterator15.f();
      }
      tx.addMint(this.stablecoinPolicyId, new Map([[_sdk.Core.AssetName(this.assetNameHex), totalAmount]]), Data.Void());

      // Update treasury: circulating_supply increases, NO reserve changes
      this.updateTreasuryOutputNoReserve(tx, treasuryUtxo, parsedTreasuryDatum, totalAmount);
    }

    /**
     * DirectBurn: Burn USDr without reserve asset flow.
     * USDr is burned, treasury circulating_supply decreases.
     * NO reserve asset changes, NO destination outputs (fiat sent off-chain).
     */
  }, {
    key: "buildDirectBurnExecute",
    value: function buildDirectBurnExecute(tx, orderInfos, stablecoinAssetId, treasuryUtxo, parsedTreasuryDatum) {
      // totalAmount is negative for burns (from classifyOrderAction)
      var totalAmount = orderInfos.reduce(function (sum, o) {
        return sum + o.amount;
      }, 0n);

      // Fiat is sent off-chain. On-chain, return the order value minus the
      // burned USDr to the destination.
      var _iterator16 = _createForOfIteratorHelper(orderInfos),
        _step16;
      try {
        for (_iterator16.s(); !(_step16 = _iterator16.n()).done;) {
          var orderInfo = _step16.value;
          (0, _index2.addDestinationOutput)(tx, this.network, orderInfo.datum.destination, buildOrderDestinationValue(orderInfo, [[stablecoinAssetId, -orderInfo.amount]]));
        }

        // Burn USDr (totalAmount is negative)
      } catch (err) {
        _iterator16.e(err);
      } finally {
        _iterator16.f();
      }
      tx.addMint(this.stablecoinPolicyId, new Map([[_sdk.Core.AssetName(this.assetNameHex), totalAmount]]), Data.Void());

      // Update treasury: circulating_supply decreases, NO reserve changes
      this.updateTreasuryOutputNoReserve(tx, treasuryUtxo, parsedTreasuryDatum, totalAmount);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Cancel Orders
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Build a transaction to cancel orders.
     */
  }, {
    key: "buildCancelOrdersTx",
    value: function () {
      var _buildCancelOrdersTx = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee34(params) {
        var orderInputs, destination, availableSigners, versionHint, orderUtxos, cachedOrderRefs, orderRefInputs, cancelRedeemer, destAddress, tx, _iterator17, _step17, orderRefInput, currentOrderRefInput, requiredSigners, _iterator18, _step18, utxo, owner, _iterator20, _step20, keyHash, outputValue, effectiveSigners, _iterator19, _step19, _keyHash, _t11, _t12;
        return _regenerator().w(function (_context35) {
          while (1) switch (_context35.p = _context35.n) {
            case 0:
              orderInputs = params.orderInputs, destination = params.destination, availableSigners = params.availableSigners, versionHint = params.versionHint;
              _context35.n = 1;
              return this.blaze.provider.resolveUnspentOutputs(orderInputs);
            case 1:
              orderUtxos = _context35.v;
              if (!(orderUtxos.length === 0)) {
                _context35.n = 2;
                break;
              }
              throw new Error("No orders to cancel");
            case 2:
              cachedOrderRefs = this.cachedReferenceInputs.orderRefInput ? new Map([[this.orderScriptHash, this.cachedReferenceInputs.orderRefInput]]) : undefined;
              _context35.n = 3;
              return (0, _index2.resolveOrderReferenceInputs)(this.blaze, orderUtxos, cachedOrderRefs, this.scriptDeploymentAddress);
            case 3:
              orderRefInputs = _context35.v;
              cancelRedeemer = Data.serialize(this.schemas.OrderRedeemerV1, "Cancel");
              if (!(destination !== null && destination !== void 0)) {
                _context35.n = 4;
                break;
              }
              _t11 = destination;
              _context35.n = 6;
              break;
            case 4:
              _context35.n = 5;
              return this.blaze.wallet.getChangeAddress();
            case 5:
              _t11 = _context35.v;
            case 6:
              destAddress = _t11;
              tx = this.newOrderTransaction();
              _iterator17 = _createForOfIteratorHelper(orderRefInputs.values());
              try {
                for (_iterator17.s(); !(_step17 = _iterator17.n()).done;) {
                  orderRefInput = _step17.value;
                  tx.addReferenceInput(orderRefInput);
                }

                // cache current version of order script reference input
              } catch (err) {
                _iterator17.e(err);
              } finally {
                _iterator17.f();
              }
              currentOrderRefInput = orderRefInputs.get(this.orderScriptHash);
              if (currentOrderRefInput && !this.cachedReferenceInputs.orderRefInput) {
                this.cachedReferenceInputs.orderRefInput = currentOrderRefInput;
              }
              requiredSigners = new Set();
              _iterator18 = _createForOfIteratorHelper(orderUtxos);
              _context35.p = 7;
              _iterator18.s();
            case 8:
              if ((_step18 = _iterator18.n()).done) {
                _context35.n = 11;
                break;
              }
              utxo = _step18.value;
              _context35.n = 9;
              return (0, _index2.parseCancelOwner)(utxo, versionHint);
            case 9:
              owner = _context35.v;
              _iterator20 = _createForOfIteratorHelper((0, _index2.getSignatureKeyHashesFromMultisigScript)(owner));
              try {
                for (_iterator20.s(); !(_step20 = _iterator20.n()).done;) {
                  keyHash = _step20.value;
                  requiredSigners.add(keyHash);
                }
              } catch (err) {
                _iterator20.e(err);
              } finally {
                _iterator20.f();
              }
              tx.addInput(utxo, cancelRedeemer);
              outputValue = utxo.output().amount();
              (0, _index2.addDirectOutput)(tx, destAddress, outputValue);
            case 10:
              _context35.n = 8;
              break;
            case 11:
              _context35.n = 13;
              break;
            case 12:
              _context35.p = 12;
              _t12 = _context35.v;
              _iterator18.e(_t12);
            case 13:
              _context35.p = 13;
              _iterator18.f();
              return _context35.f(13);
            case 14:
              effectiveSigners = availableSigners ? new Set(_toConsumableArray(requiredSigners).filter(function (k) {
                return availableSigners.has(k);
              })) : requiredSigners;
              _iterator19 = _createForOfIteratorHelper(effectiveSigners);
              try {
                for (_iterator19.s(); !(_step19 = _iterator19.n()).done;) {
                  _keyHash = _step19.value;
                  tx.addRequiredSigner((0, _core.Ed25519KeyHashHex)(_keyHash));
                }
              } catch (err) {
                _iterator19.e(err);
              } finally {
                _iterator19.f();
              }
              return _context35.a(2, tx);
          }
        }, _callee34, this, [[7, 12, 13, 14]]);
      }));
      function buildCancelOrdersTx(_x32) {
        return _buildCancelOrdersTx.apply(this, arguments);
      }
      return buildCancelOrdersTx;
    }()
    /**
     * Build a transaction to recover funds from invalidated orders.
     * Only works when the protocol has been upgraded and the order validator
     * no longer matches the current protocol logic.
     *
     * IMPORTANT: Only works for orders with simple Signature owners.
     *
     * Output-at-same-index constraint: Each output must be at the same
     * transaction index as its corresponding input.
     */
  }, {
    key: "buildInvalidatedOrdersTx",
    value: (function () {
      var _buildInvalidatedOrdersTx = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee35(params) {
        var _this3 = this;
        var orderInputs, orderUtxos, cachedOrderRefs, orderRefInputs, _yield$this$getRawPro2, proxyUtxo, proxyDatum, parsedProxyDatum, registry, isProtocolUpgraded, hasActiveOrder, invalidatedRedeemer, walletUtxos, walletAddress, utxoKey, excludedInputIds, FEE_BUFFER, feeCandidates, feeUtxo, items, tx, _iterator21, _step21, orderRefInput, _iterator22, _step22, item, ownerCredential, ownerAddress, inputValue, fillerValue, _t13;
        return _regenerator().w(function (_context36) {
          while (1) switch (_context36.p = _context36.n) {
            case 0:
              orderInputs = params.orderInputs;
              _context36.n = 1;
              return this.blaze.provider.resolveUnspentOutputs(orderInputs);
            case 1:
              orderUtxos = _context36.v;
              if (!(orderUtxos.length === 0)) {
                _context36.n = 2;
                break;
              }
              throw new Error("No orders to invalidate");
            case 2:
              // Resolve references from the validators that actually hold the supplied
              // orders. A current SDK instance may be recovering same-schema orders left
              // at a superseded validator, so its own orderScriptHash is not necessarily
              // the script needed to spend these inputs.
              cachedOrderRefs = this.cachedReferenceInputs.orderRefInput ? new Map([[this.orderScriptHash, this.cachedReferenceInputs.orderRefInput]]) : undefined;
              _context36.n = 3;
              return (0, _index2.resolveOrderReferenceInputs)(this.blaze, orderUtxos, cachedOrderRefs, this.scriptDeploymentAddress);
            case 3:
              orderRefInputs = _context36.v;
              _context36.n = 4;
              return this.getRawProxyDatum();
            case 4:
              _yield$this$getRawPro2 = _context36.v;
              proxyUtxo = _yield$this$getRawPro2.proxyUtxo;
              proxyDatum = _yield$this$getRawPro2.proxyDatum;
              _context36.p = 5;
              parsedProxyDatum = (0, _data.parse)(this.schemas.ProxyDatumV1, proxyDatum);
              registry = this.settingsRegistry(parsedProxyDatum.settings);
              isProtocolUpgraded = parsedProxyDatum.logic !== this.protocolScriptHash;
              hasActiveOrder = _toConsumableArray(orderRefInputs.keys()).some(function (orderScriptHash) {
                return orderScriptHash === registry.order;
              });
              if (!(hasActiveOrder && !isProtocolUpgraded)) {
                _context36.n = 6;
                break;
              }
              throw new Error("Cannot use Invalidated redeemer: protocol has not been upgraded");
            case 6:
              _context36.n = 8;
              break;
            case 7:
              _context36.p = 7;
              _t13 = _context36.v;
              if (!(_t13 instanceof Error && _t13.message === "Cannot use Invalidated redeemer: protocol has not been upgraded")) {
                _context36.n = 8;
                break;
              }
              throw _t13;
            case 8:
              invalidatedRedeemer = Data.serialize(this.schemas.OrderRedeemerV1, "Invalidated"); // The order validator's Invalidated branch enforces
              // `outputs[index_of(self_input)] == owner_address`. The input index
              // is computed against the *full* canonical input sort, including any
              // wallet fee inputs. To make the alignment deterministic, pre-select
              // a single wallet UTxO to act as the fee input, build the canonical
              // sort across [orders + fee UTxO] up front, and lay outputs at
              // matching positions: owner payouts at order indices, a wallet
              // filler at the fee UTxO's index. Modeled on buildExecuteOrdersTx.
              _context36.n = 9;
              return this.blaze.wallet.getUnspentOutputs();
            case 9:
              walletUtxos = _context36.v;
              _context36.n = 10;
              return this.blaze.wallet.getChangeAddress();
            case 10:
              walletAddress = _context36.v;
              utxoKey = function utxoKey(inp) {
                return "".concat(inp.transactionId().toString(), "#").concat(inp.index().toString());
              };
              excludedInputIds = new Set([utxoKey(proxyUtxo.input())].concat(_toConsumableArray(_toConsumableArray(orderRefInputs.values()).map(function (refInput) {
                return utxoKey(refInput.input());
              })), _toConsumableArray(orderUtxos.map(function (u) {
                return utxoKey(u.input());
              })))); // 5 ADA buffer comfortably covers tx fees for any realistic invalidate
              // batch (1-20 inputs) plus min-UTxO for the change output Blaze appends.
              // Prefer an ADA-only input, but safely support a token-bearing one when
              // its explicit filler output still satisfies the ledger's min-ADA rule.
              FEE_BUFFER = 5000000n;
              feeCandidates = walletUtxos.filter(function (u) {
                return !excludedInputIds.has(utxoKey(u.input()));
              }).sort(function (a, b) {
                var _a$output$amount$mult, _a$output$amount$mult2, _b$output$amount$mult, _b$output$amount$mult2;
                var aHasAssets = ((_a$output$amount$mult = (_a$output$amount$mult2 = a.output().amount().multiasset()) === null || _a$output$amount$mult2 === void 0 ? void 0 : _a$output$amount$mult2.size) !== null && _a$output$amount$mult !== void 0 ? _a$output$amount$mult : 0) > 0;
                var bHasAssets = ((_b$output$amount$mult = (_b$output$amount$mult2 = b.output().amount().multiasset()) === null || _b$output$amount$mult2 === void 0 ? void 0 : _b$output$amount$mult2.size) !== null && _b$output$amount$mult !== void 0 ? _b$output$amount$mult : 0) > 0;
                return Number(aHasAssets) - Number(bHasAssets);
              });
              feeUtxo = feeCandidates.find(function (u) {
                var inputValue = u.output().amount();
                if (inputValue.coin() < FEE_BUFFER) return false;
                var fillerValue = new _sdk.Core.Value(inputValue.coin() - FEE_BUFFER, inputValue.multiasset());
                var fillerOutput = new _sdk.Core.TransactionOutput(walletAddress, fillerValue);
                return fillerValue.coin() >= (0, _sdk.calculateMinAda)(fillerOutput, _this3.blaze.params.coinsPerUtxoByte);
              });
              if (feeUtxo) {
                _context36.n = 11;
                break;
              }
              throw new Error("buildInvalidatedOrdersTx: no wallet UTxO can cover fees while retaining its minimum ADA");
            case 11:
              items = orderUtxos.map(function (utxo) {
                var _utxo$output$datum3;
                var datumData = (_utxo$output$datum3 = utxo.output().datum()) === null || _utxo$output$datum3 === void 0 ? void 0 : _utxo$output$datum3.asInlineData();
                if (!datumData) {
                  throw new Error("Order UTXO has no inline datum");
                }
                var datum = (0, _data.parse)(_this3.schemas.OrderDatumV1, datumData);
                if (!("Signature" in datum.owner)) {
                  throw new Error("Invalidated redeemer only supports simple Signature owners");
                }
                return {
                  kind: "order",
                  utxo: utxo,
                  ownerKeyHash: datum.owner.Signature.key_hash
                };
              });
              items.push({
                kind: "fee",
                utxo: feeUtxo
              });
              items.sort(function (a, b) {
                var txA = a.utxo.input().transactionId().toString();
                var txB = b.utxo.input().transactionId().toString();
                if (txA < txB) return -1;
                if (txA > txB) return 1;
                return Number(a.utxo.input().index()) - Number(b.utxo.input().index());
              });
              tx = this.newOrderTransaction();
              _iterator21 = _createForOfIteratorHelper(orderRefInputs.values());
              try {
                for (_iterator21.s(); !(_step21 = _iterator21.n()).done;) {
                  orderRefInput = _step21.value;
                  tx.addReferenceInput(orderRefInput);
                }
              } catch (err) {
                _iterator21.e(err);
              } finally {
                _iterator21.f();
              }
              tx.addReferenceInput(proxyUtxo);
              _iterator22 = _createForOfIteratorHelper(items);
              try {
                for (_iterator22.s(); !(_step22 = _iterator22.n()).done;) {
                  item = _step22.value;
                  if (item.kind === "order") {
                    ownerCredential = _sdk.Core.Credential.fromCore({
                      type: _sdk.Core.CredentialType.KeyHash,
                      hash: _sdk.Core.Hash28ByteBase16(item.ownerKeyHash)
                    });
                    ownerAddress = (0, _core.addressFromCredentials)(this.network, ownerCredential);
                    tx.addInput(item.utxo, invalidatedRedeemer);
                    // Owner gets back the order's full value at the matching output
                    // index. Per-input check `output_ada >= input_ada - tx.fee` holds
                    // trivially because output == input here; the tx fee is absorbed
                    // by the filler+change pair coming out of the wallet fee input.
                    (0, _index2.addDirectOutput)(tx, ownerAddress, item.utxo.output().amount());
                  } else {
                    tx.addInput(item.utxo);
                    // Wallet filler at the fee UTxO's canonical index. Sends value
                    // back to the wallet minus FEE_BUFFER, which Blaze then splits
                    // into the tx fee and an automatic change output (appended after
                    // all explicit outputs, beyond any script-input index — so no
                    // validator ever reads it).
                    inputValue = item.utxo.output().amount();
                    fillerValue = new _sdk.Core.Value(inputValue.coin() - FEE_BUFFER, inputValue.multiasset());
                    (0, _index2.addDirectOutput)(tx, walletAddress, fillerValue);
                  }
                }
              } catch (err) {
                _iterator22.e(err);
              } finally {
                _iterator22.f();
              }
              return _context36.a(2, tx);
          }
        }, _callee35, this, [[5, 7]]);
      }));
      function buildInvalidatedOrdersTx(_x33) {
        return _buildInvalidatedOrdersTx.apply(this, arguments);
      }
      return buildInvalidatedOrdersTx;
    }() // ─────────────────────────────────────────────────────────────────────────────
    // Protected Helpers
    // ─────────────────────────────────────────────────────────────────────────────
    /**
     * Parse order UTxOs into IOrderInfo objects and validate they are all the
     * same type. The optional `fees` map (keyed by `${txHash}#${outputIndex}`)
     * stamps each order with its locked fee in the action's output unit.
     * Missing entries default to 0 (no fee retained).
     */
    )
  }, {
    key: "parseOrderInfos",
    value: function parseOrderInfos(orderUtxos, fees) {
      var orderInfos = [];
      var expectedActionType = null;
      var _iterator23 = _createForOfIteratorHelper(orderUtxos),
        _step23;
      try {
        for (_iterator23.s(); !(_step23 = _iterator23.n()).done;) {
          var _utxo$output$datum4, _fees$get;
          var utxo = _step23.value;
          var datumData = (_utxo$output$datum4 = utxo.output().datum()) === null || _utxo$output$datum4 === void 0 ? void 0 : _utxo$output$datum4.asInlineData();
          if (!datumData) {
            throw new Error("Order UTXO has no inline datum");
          }
          var datum = (0, _data.parse)(this.schemas.OrderDatumV1, datumData);
          var classified = this.classifyOrderAction(datum);
          if (expectedActionType === null) {
            expectedActionType = classified.actionType;
          } else if (expectedActionType !== classified.actionType) {
            throw new Error("Mixed order types in inputs. All orders must be of the same type.");
          }
          var input = utxo.input();
          var key = "".concat(input.transactionId().toString(), "#").concat(input.index().toString());
          var fee = (_fees$get = fees === null || fees === void 0 ? void 0 : fees.get(key)) !== null && _fees$get !== void 0 ? _fees$get : 0n;
          orderInfos.push({
            utxo: utxo,
            datum: datum,
            actionType: classified.actionType,
            amount: classified.amount,
            "yield": classified["yield"],
            forfeit: classified.forfeit,
            minReceived: classified.minReceived,
            reserveAsset: classified.reserveAsset,
            fee: fee
          });
        }
      } catch (err) {
        _iterator23.e(err);
      } finally {
        _iterator23.f();
      }
      if (orderInfos.length === 0) {
        throw new Error("No orders to execute");
      }
      return orderInfos;
    }

    /**
     * Full executability screen for one open order (WTB-1764): the datum
     * predicates plus the two value-dependent aborts (input funding, unsatisfiable
     * `min_received`). Every consumer that decides whether an order may join a
     * batch should call this rather than `screenOrderAction` alone — the datum-only
     * screen cannot see an underfunded UTxO, which is the cheapest batch-killer.
     *
     * Reads settings for the reserve multiplier on mint/burn. `getParsedProxyDatum`
     * memoises, so the per-order cost after the first call is local arithmetic —
     * safe for the approvals cron's whole-address sweep.
     */
  }, {
    key: "screenOrderForExecution",
    value: (function () {
      var _screenOrderForExecution = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee36(utxo, action) {
        var datumVerdict, settings, _t14, _t15;
        return _regenerator().w(function (_context37) {
          while (1) switch (_context37.n) {
            case 0:
              datumVerdict = (0, _orderSanity.screenOrderAction)(action);
              if (datumVerdict.ok) {
                _context37.n = 1;
                break;
              }
              return _context37.a(2, datumVerdict);
            case 1:
              _context37.n = 2;
              return this.getValidatedScreeningSettings();
            case 2:
              settings = _context37.v;
              _t14 = _orderSanity.screenOrderUtxoFacts;
              _t15 = action;
              _context37.n = 3;
              return this.deriveOrderUtxoFacts(utxo, action, settings);
            case 3:
              return _context37.a(2, _t14(_t15, _context37.v));
          }
        }, _callee36, this);
      }));
      function screenOrderForExecution(_x34, _x35) {
        return _screenOrderForExecution.apply(this, arguments);
      }
      return screenOrderForExecution;
    }()
    /**
     * Derive the value-dependent facts {@link screenOrderUtxoFacts} needs. Mirrors
     * the per-action consumed asset and ceiling the validators use; see that
     * function's doc comment for the `.ak` line references.
     */
    )
  }, {
    key: "deriveOrderUtxoFacts",
    value: (function () {
      var _deriveOrderUtxoFacts = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee37(utxo, action, settings) {
        var multiasset, quantityOf, usdrAssetId, _t16;
        return _regenerator().w(function (_context38) {
          while (1) switch (_context38.p = _context38.n) {
            case 0:
              multiasset = utxo.output().amount().multiasset();
              quantityOf = function quantityOf(assetId) {
                var _multiasset$get;
                return (_multiasset$get = multiasset === null || multiasset === void 0 ? void 0 : multiasset.get(assetId)) !== null && _multiasset$get !== void 0 ? _multiasset$get : 0n;
              }; // These are deployment settings, not datum fields. Let invalid trusted
              // configuration and provider failures propagate to the caller instead of
              // hiding an operational outage as a poisoned order.
              usdrAssetId = _sdk.Core.AssetId(this.stablecoinPolicyId + this.assetNameHex); // Only deterministic datum-derived errors are a rejection: an unknown
              // reserve asset or an invalid asset id carried by the order datum.
              _context38.p = 1;
              return _context38.a(2, this.deriveOrderUtxoFactsUnsafe(action, settings, quantityOf, usdrAssetId));
            case 2:
              _context38.p = 2;
              _t16 = _context38.v;
              return _context38.a(2, {
                consumedRequired: 0n,
                consumedLocked: 0n,
                unresolvable: _t16 instanceof Error ? _t16.message : String(_t16)
              });
          }
        }, _callee37, this, [[1, 2]]);
      }));
      function deriveOrderUtxoFacts(_x36, _x37, _x38) {
        return _deriveOrderUtxoFacts.apply(this, arguments);
      }
      return deriveOrderUtxoFacts;
    }())
  }, {
    key: "deriveOrderUtxoFactsUnsafe",
    value: function deriveOrderUtxoFactsUnsafe(action, settings, quantityOf, usdrAssetId) {
      switch (action.actionType) {
        case "stake":
          return {
            consumedRequired: action.amount,
            consumedLocked: quantityOf(usdrAssetId)
          };
        case "unstake":
          return {
            consumedRequired: action.amount,
            consumedLocked: quantityOf(_sdk.Core.AssetId(this.stablecoinPolicyId + this.sUSDrAssetNameHex))
          };
        case "mint":
          {
            if (!action.reserveAsset) {
              return {
                consumedRequired: 0n,
                consumedLocked: 0n
              };
            }
            var ra = (0, _index2.findReserveAsset)(settings, action.reserveAsset);
            return {
              consumedRequired: (0, _index2.usdrToReserveCeil)(action.amount, ra),
              consumedLocked: quantityOf(_sdk.Core.AssetId(action.reserveAsset[0] + action.reserveAsset[1])),
              // mint.ak:140 passes request.amount as max_delivered.
              maxDelivered: action.amount
            };
          }
        case "burn":
          {
            // classifyOrderAction negates ORedeem.amount; the validator compares the
            // raw datum amount against the locked USDr.
            var rawAmount = -action.amount;
            if (!action.reserveAsset) {
              return {
                consumedRequired: rawAmount,
                consumedLocked: quantityOf(usdrAssetId)
              };
            }
            var _ra2 = (0, _index2.findReserveAsset)(settings, action.reserveAsset);
            return {
              consumedRequired: rawAmount,
              consumedLocked: quantityOf(usdrAssetId),
              // burn.ak:136 passes usdr_to_reserve(|amount|, ra) as max_delivered.
              maxDelivered: (0, _index2.usdrToReserve)(rawAmount, _ra2)
            };
          }
        case "direct_burn":
          // direct_burn DOES have a per-order funding predicate
          // (`v1_0/direct_burn.ak:50`), unlike direct_mint. Same sign flip as burn.
          // Unreachable from the approvals cron, which routes direct actions
          // out-of-scope, but getSignedPayloadFromOrderInputs builds direct-burn
          // batches for the treasury-admin flow.
          return {
            consumedRequired: -action.amount,
            consumedLocked: quantityOf(usdrAssetId)
          };
        case "deposit":
          {
            var _action$yield, _action$yield2;
            if (!action.reserveAsset) {
              return {
                consumedRequired: 0n,
                consumedLocked: 0n
              };
            }
            var _ra3 = (0, _index2.findReserveAsset)(settings, action.reserveAsset);
            var usdrBacking = ((_action$yield = action["yield"]) !== null && _action$yield !== void 0 ? _action$yield : 0n) >= 0n ? action.amount + ((_action$yield2 = action["yield"]) !== null && _action$yield2 !== void 0 ? _action$yield2 : 0n) : action.amount;
            return {
              consumedRequired: (0, _index2.usdrToReserve)(usdrBacking, _ra3),
              consumedLocked: quantityOf(_sdk.Core.AssetId(action.reserveAsset[0] + action.reserveAsset[1]))
            };
          }
        case "withdraw":
          if (action.reserveAsset) {
            // Withdrawal consumes treasury funds, but the order's asset must be
            // registered or buildWithdrawExecute will fail after signing.
            (0, _index2.findReserveAsset)(settings, action.reserveAsset);
          }
          return {
            consumedRequired: 0n,
            consumedLocked: 0n
          };
        default:
          // direct_mint has no per-order funding predicate.
          return {
            consumedRequired: 0n,
            consumedLocked: 0n
          };
      }
    }
  }, {
    key: "getValidatedScreeningSettings",
    value: function () {
      var _getValidatedScreeningSettings = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee38() {
        var settings, _iterator24, _step24, reserveAsset, _t17, _t18;
        return _regenerator().w(function (_context39) {
          while (1) switch (_context39.p = _context39.n) {
            case 0:
              _t17 = this;
              _context39.n = 1;
              return this.getVersionSettings();
            case 1:
              settings = _t17.settingsConfig.call(_t17, _context39.v);
              _iterator24 = _createForOfIteratorHelper(settings.reserve_assets);
              _context39.p = 2;
              _iterator24.s();
            case 3:
              if ((_step24 = _iterator24.n()).done) {
                _context39.n = 7;
                break;
              }
              reserveAsset = _step24.value;
              if (!(reserveAsset.numerator === 0n)) {
                _context39.n = 4;
                break;
              }
              throw new Error("Reserve asset numerator must be non-zero");
            case 4:
              if (!(reserveAsset.denominator === 0n)) {
                _context39.n = 5;
                break;
              }
              throw new Error("Reserve asset denominator must be non-zero");
            case 5:
              _sdk.Core.AssetId(reserveAsset.asset[0] + reserveAsset.asset[1]);
            case 6:
              _context39.n = 3;
              break;
            case 7:
              _context39.n = 9;
              break;
            case 8:
              _context39.p = 8;
              _t18 = _context39.v;
              _iterator24.e(_t18);
            case 9:
              _context39.p = 9;
              _iterator24.f();
              return _context39.f(9);
            case 10:
              return _context39.a(2, settings);
          }
        }, _callee38, this, [[2, 8, 9, 10]]);
      }));
      function getValidatedScreeningSettings() {
        return _getValidatedScreeningSettings.apply(this, arguments);
      }
      return getValidatedScreeningSettings;
    }()
    /**
     * Classify an order action from its datum.
     */
  }, {
    key: "classifyOrderAction",
    value: function classifyOrderAction(datum) {
      var action = datum.action;
      if ("OMint" in action) {
        return {
          actionType: "mint",
          amount: action.OMint.amount,
          minReceived: action.OMint.min_received,
          reserveAsset: action.OMint.reserve_asset,
          isTreasuryAction: true
        };
      } else if ("ORedeem" in action) {
        return {
          actionType: "burn",
          amount: -action.ORedeem.amount,
          minReceived: action.ORedeem.min_received,
          reserveAsset: action.ORedeem.reserve_asset,
          isTreasuryAction: true
        };
      } else if ("ODeposit" in action) {
        return {
          actionType: "deposit",
          amount: action.ODeposit.principal,
          "yield": action.ODeposit["yield"],
          reserveAsset: action.ODeposit.reserve_asset,
          isTreasuryAction: true
        };
      } else if ("OWithdraw" in action) {
        return {
          actionType: "withdraw",
          amount: action.OWithdraw.amount,
          reserveAsset: action.OWithdraw.reserve_asset,
          isTreasuryAction: true
        };
      } else if ("OStake" in action) {
        return {
          actionType: "stake",
          amount: action.OStake.amount,
          minReceived: action.OStake.min_received,
          isTreasuryAction: false
        };
      } else if ("OUnstake" in action) {
        return {
          actionType: "unstake",
          amount: action.OUnstake.amount,
          forfeit: action.OUnstake.forfeit,
          minReceived: action.OUnstake.min_received,
          isTreasuryAction: false
        };
      } else if ("ODirectMint" in action) {
        return {
          actionType: "direct_mint",
          amount: action.ODirectMint.amount,
          isTreasuryAction: true
        };
      } else if ("ODirectBurn" in action) {
        return {
          actionType: "direct_burn",
          amount: -action.ODirectBurn.amount,
          isTreasuryAction: true
        };
      }
      throw new Error("Unknown order action type");
    }

    /**
     * Build the signed-payload treasury request for a deposit/withdraw order.
     *
     * v1_0 / v1_0_rc1 emit the four-field request. Versions whose on-chain
     * `TreasuryRequestV1` carries extra fields (v1_1_rc1's `diffusion_end`, which
     * the validator requires the signed request to echo from the order datum)
     * override this to add them; the return stays assignable to the v1_0 shape,
     * and the extra fields are encoded by the version's own payload schema value.
     */
  }, {
    key: "buildTreasuryRequest",
    value: function buildTreasuryRequest(datum, parsed, origin) {
      var _parsed$yield;
      return {
        destination: datum.destination,
        amount: parsed.amount,
        "yield": (_parsed$yield = parsed["yield"]) !== null && _parsed$yield !== void 0 ? _parsed$yield : 0n,
        origin: origin,
        reserve_asset: parsed.reserveAsset
      };
    }

    /**
     * Update treasury output with new reserve and circulating supply.
     */
  }, {
    key: "updateTreasuryOutput",
    value: function updateTreasuryOutput(tx, treasuryUtxo, parsedTreasuryDatum, reserveDeltas, circulatingSupplyDelta) {
      var newTreasuryDatum = {
        circulating_supply: parsedTreasuryDatum.circulating_supply + circulatingSupplyDelta
      };
      var serializedTreasuryDatum = Data.serialize(_index.TreasuryDatum, newTreasuryDatum);
      tx.addInput(treasuryUtxo, Data.Void());
      var treasuryValue = treasuryUtxo.output().amount();
      var newTreasuryValue = (0, _sdk.makeValue)(treasuryValue.coin(), [this.treasuryNFTAssetId, 1n]);
      var modifiedAssetIds = new Set([this.treasuryNFTAssetId.toString()]);
      var _iterator25 = _createForOfIteratorHelper(reserveDeltas.entries()),
        _step25;
      try {
        for (_iterator25.s(); !(_step25 = _iterator25.n()).done;) {
          var _treasuryValue$multia, _treasuryValue$multia2;
          var _step25$value = _slicedToArray(_step25.value, 2),
            reserveAssetId = _step25$value[0],
            delta = _step25$value[1];
          var currentReserve = (_treasuryValue$multia = (_treasuryValue$multia2 = treasuryValue.multiasset()) === null || _treasuryValue$multia2 === void 0 ? void 0 : _treasuryValue$multia2.get(_sdk.Core.AssetId(reserveAssetId))) !== null && _treasuryValue$multia !== void 0 ? _treasuryValue$multia : 0n;
          var newReserve = currentReserve + delta;
          newTreasuryValue = _sdk.Value.merge(newTreasuryValue, (0, _sdk.makeValue)(0n, [_sdk.Core.AssetId(reserveAssetId), newReserve]));
          modifiedAssetIds.add(reserveAssetId);
        }
      } catch (err) {
        _iterator25.e(err);
      } finally {
        _iterator25.f();
      }
      var existingMultiasset = treasuryValue.multiasset();
      if (existingMultiasset) {
        var _iterator26 = _createForOfIteratorHelper(existingMultiasset.entries()),
          _step26;
        try {
          for (_iterator26.s(); !(_step26 = _iterator26.n()).done;) {
            var _step26$value = _slicedToArray(_step26.value, 2),
              assetId = _step26$value[0],
              amount = _step26$value[1];
            if (!modifiedAssetIds.has(assetId)) {
              newTreasuryValue = _sdk.Value.merge(newTreasuryValue, (0, _sdk.makeValue)(0n, [_sdk.Core.AssetId(assetId), amount]));
            }
          }
        } catch (err) {
          _iterator26.e(err);
        } finally {
          _iterator26.f();
        }
      }
      tx.lockAssets(this.treasuryAddress, newTreasuryValue, serializedTreasuryDatum);
    }

    /**
     * Update treasury output without reserve changes (for DirectMint/DirectBurn).
     */
  }, {
    key: "updateTreasuryOutputNoReserve",
    value: function updateTreasuryOutputNoReserve(tx, treasuryUtxo, parsedTreasuryDatum, circulatingSupplyDelta) {
      var newTreasuryDatum = {
        circulating_supply: parsedTreasuryDatum.circulating_supply + circulatingSupplyDelta
      };
      var serializedTreasuryDatum = Data.serialize(_index.TreasuryDatum, newTreasuryDatum);
      tx.addInput(treasuryUtxo, Data.Void());

      // Preserve exact treasury value (no reserve changes)
      var treasuryValue = treasuryUtxo.output().amount();
      tx.lockAssets(this.treasuryAddress, treasuryValue, serializedTreasuryDatum);
    }

    /**
     * Update vault output with new circulating_susdr and USDr balance.
     *
     * The datum construction is delegated to the version's
     * `buildUpdatedVaultDatum` seam; the value rebuild below is
     * datum-shape-agnostic and shared by all versions.
     */
  }, {
    key: "updateVaultOutput",
    value: function updateVaultOutput(tx, vaultUtxo, parsedVaultDatum, sUSDrDelta) {
      var uSDrDelta = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0n;
      this.updateVaultOutputWithDatum(tx, vaultUtxo, this.buildUpdatedVaultDatum(parsedVaultDatum, sUSDrDelta), uSDrDelta);
    }

    /**
     * Lock the vault output with an already-constructed datum, rebuilding its
     * USDr balance by `uSDrDelta`. The value rebuild is datum-shape-agnostic;
     * versions whose datum update needs more than `sUSDrDelta` (v1_1_rc1's
     * deposit diffusion window) build the datum themselves and call this.
     */
  }, {
    key: "updateVaultOutputWithDatum",
    value: function updateVaultOutputWithDatum(tx, vaultUtxo, newVaultDatum) {
      var uSDrDelta = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0n;
      var serializedVaultDatum = Data.serialize(this.schemas.VaultDatumV1, newVaultDatum);
      tx.addInput(vaultUtxo, Data.Void());
      var stablecoinAssetId = _sdk.Core.AssetId(this.stablecoinPolicyId + this.assetNameHex);
      var newVaultValue = vaultUtxo.output().amount();
      if (uSDrDelta !== 0n) {
        var _newVaultValue$multia, _newVaultValue$multia2;
        var currentUSDr = (_newVaultValue$multia = (_newVaultValue$multia2 = newVaultValue.multiasset()) === null || _newVaultValue$multia2 === void 0 ? void 0 : _newVaultValue$multia2.get(stablecoinAssetId)) !== null && _newVaultValue$multia !== void 0 ? _newVaultValue$multia : 0n;
        var newUSDr = currentUSDr + uSDrDelta;
        newVaultValue = (0, _sdk.makeValue)(newVaultValue.coin(), [this.stakingVaultNFTAssetId, 1n]);
        if (newUSDr > 0n) {
          newVaultValue = _sdk.Value.merge(newVaultValue, (0, _sdk.makeValue)(0n, [stablecoinAssetId, newUSDr]));
        }
        var existingMultiasset = vaultUtxo.output().amount().multiasset();
        if (existingMultiasset) {
          var _iterator27 = _createForOfIteratorHelper(existingMultiasset.entries()),
            _step27;
          try {
            for (_iterator27.s(); !(_step27 = _iterator27.n()).done;) {
              var _step27$value = _slicedToArray(_step27.value, 2),
                assetId = _step27$value[0],
                amount = _step27$value[1];
              if (assetId !== this.stakingVaultNFTAssetId.toString() && assetId !== stablecoinAssetId.toString()) {
                newVaultValue = _sdk.Value.merge(newVaultValue, (0, _sdk.makeValue)(0n, [_sdk.Core.AssetId(assetId), amount]));
              }
            }
          } catch (err) {
            _iterator27.e(err);
          } finally {
            _iterator27.f();
          }
        }
      }
      tx.lockAssets(this.stakingVaultAddress, newVaultValue, serializedVaultDatum);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Reserve Asset Conversion Utilities
    // ─────────────────────────────────────────────────────────────────────────────
  }, {
    key: "getVersionSettings",
    value: function () {
      var _getVersionSettings = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee39() {
        var _yield$this$getParsed3, parsedProxyDatum;
        return _regenerator().w(function (_context40) {
          while (1) switch (_context40.n) {
            case 0:
              _context40.n = 1;
              return this.getParsedProxyDatum();
            case 1:
              _yield$this$getParsed3 = _context40.v;
              parsedProxyDatum = _yield$this$getParsed3.parsedProxyDatum;
              return _context40.a(2, parsedProxyDatum.settings);
          }
        }, _callee39, this);
      }));
      function getVersionSettings() {
        return _getVersionSettings.apply(this, arguments);
      }
      return getVersionSettings;
    }()
  }]);
}(_index2.RealfiSDKBase);
_defineProperty(RealfiSDKV1Family, "buildTimelockNativeScript", _index2.buildTimelockNativeScript);
_defineProperty(RealfiSDKV1Family, "buildTimelockAddress", _index2.buildTimelockAddress);
_defineProperty(RealfiSDKV1Family, "buildMultisigTimelockNativeScript", _index2.buildMultisigTimelockNativeScript);
//# sourceMappingURL=family.js.map