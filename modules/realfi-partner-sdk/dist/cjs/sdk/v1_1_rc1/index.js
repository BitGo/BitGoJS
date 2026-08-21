"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "MAX_DIFFUSION_RATE_SPAN_MS", {
  enumerable: true,
  get: function get() {
    return _diffusion.MAX_DIFFUSION_RATE_SPAN_MS;
  }
});
exports.RealfiSDKV1_1Rc1 = void 0;
var _core = require("@blaze-cardano/core");
var _data = _interopRequireWildcard(require("@blaze-cardano/data"));
var Data = _data;
var _sdk = require("@blaze-cardano/sdk");
var _index = require("../../generated-types/index.js");
var _index2 = require("../shared/index.js");
var _family = require("../v1/family.js");
var _diffusion = require("./diffusion.js");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t2 in e) "default" !== _t2 && {}.hasOwnProperty.call(e, _t2) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t2)) && (i.get || i.set) ? o(f, _t2, i) : f[_t2] = e[_t2]); return f; })(e, t); }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
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
function _superPropGet(t, o, e, r) { var p = _get(_getPrototypeOf(1 & r ? t.prototype : t), o, e); return 2 & r && "function" == typeof p ? function (t) { return p.apply(e, t); } : p; }
function _get() { return _get = "undefined" != typeof Reflect && Reflect.get ? Reflect.get.bind() : function (e, t, r) { var p = _superPropBase(e, t); if (p) { var n = Object.getOwnPropertyDescriptor(p, t); return n.get ? n.get.call(arguments.length < 3 ? e : r) : n.value; } }, _get.apply(null, arguments); }
function _superPropBase(t, o) { for (; !{}.hasOwnProperty.call(t, o) && null !== (t = _getPrototypeOf(t));); return t; }
function _getPrototypeOf(t) { return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) { return t.__proto__ || Object.getPrototypeOf(t); }, _getPrototypeOf(t); }
function _inherits(t, e) { if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function"); t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } }), Object.defineProperty(t, "prototype", { writable: !1 }), e && _setPrototypeOf(t, e); }
function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); } /** V1_1-specific knobs threaded from the public params to the constructor. */ // eslint-disable-next-line @typescript-eslint/naming-convention
// eslint-disable-next-line @typescript-eslint/naming-convention

var DEFAULT_EXECUTION_VALIDITY_WINDOW_MS = 1800000n; // 30 minutes

/**
 * How far in the past to open a vault-touching execution's validity interval
 * when using the default wall clock.
 *
 * The validator requires the vault's `diffusion_start` to equal the validity
 * lower bound. Backing off both values absorbs submitter clock skew without
 * shortening duration-based order windows or the forward execution window.
 * Injected clocks are used verbatim for deterministic emulator tests.
 */
var DEFAULT_CLOCK_BACKOFF_MS = 120000n; // 2 minutes

// ─────────────────────────────────────────────────────────────────────────────
// SDK Class
// ─────────────────────────────────────────────────────────────────────────────

/**
 * V1_1_Rc1 SDK implementation.
 *
 * The release candidate keeps V1_0's order/redeemer taxonomy (fees,
 * `min_received`, `ExchangeRequestV1`/`TreasuryRequestV1`/`StakeRequestV1`) and
 * adds **time-diffused yield**: the staking vault datum grows to four fields
 * (`circulating_susdr`, `pending_yield`, `diffusion_start`, `diffusion_end`)
 * and deposited staked yield releases into the exchange rate linearly over a
 * window rather than instantly.
 *
 * Because the redeemer shape is V1_0 plus an additive `diffusion_end`, this
 * class reuses {@link RealfiSDKV1Family}'s V1_0-semantics tx-builders wholesale
 * and overrides only the diffusion seams:
 * - the four-field vault datum ({@link buildInitialVaultDatum} /
 *   {@link buildUpdatedVaultDatum}) and nested settings adapters;
 * - {@link settledVaultBacking}: quote stake/unstake rates against settled
 *   backing (balance minus not-yet-diffused pending yield);
 * - {@link buildTreasuryRequest}: echo the order datum's `diffusion_end` into
 *   the signed payload;
 * - {@link updateDepositVaultOutput}: roll the staked share into the diffusion
 *   window on deposit;
 * - {@link buildDepositOrderTx}: expose the `diffusion_end` order parameter;
 * - {@link applyExecutionValidityBounds}: attach the validity range the
 *   diffusion rate time is read from.
 */
var RealfiSDKV1_1Rc1 = exports.RealfiSDKV1_1Rc1 = /*#__PURE__*/function (_RealfiSDKV1Family) {
  function RealfiSDKV1_1Rc1(blaze, params, schemas, scripts, cachedReferenceInputs, signingSchemas, options) {
    var _options$now, _options$diffusionSho, _options$throwOnDiffu, _options$executionVal;
    var _this;
    _classCallCheck(this, RealfiSDKV1_1Rc1);
    _this = _callSuper(this, RealfiSDKV1_1Rc1, [blaze, params, schemas, scripts, cachedReferenceInputs, signingSchemas]);
    _defineProperty(_this, "version", "V1_1_Rc1");
    _defineProperty(_this, "nowFn", void 0);
    _defineProperty(_this, "defaultDiffusionDurationMs", void 0);
    _defineProperty(_this, "executionValidityWindowMs", void 0);
    _defineProperty(_this, "executionClockBackoffMs", void 0);
    _defineProperty(_this, "diffusionShortfallThresholdMs", void 0);
    _defineProperty(_this, "throwOnDiffusionWindowShortfall", void 0);
    /**
     * The `distribution_oracle` (publish-logic) validator hash. Exposed so
     * settings datums can point `registry.yield_oracle` at it — that is the
     * withdrawal the orchestrator's PublishYieldOracle path requires. NOTE: this
     * is NOT the orchestrator's 5th compile-time parameter; that parameter is the
     * `yield_oracle` validator hash (the mint+spend validator that holds the
     * oracle UTxO), which is a different validator with a different hash.
     */
    _defineProperty(_this, "distributionOracleScriptHash", void 0);
    /**
     * The `protocol_migration_v1_0_to_v1_1` withdraw validator and its hash.
     * The validator is registry-gated (whitelisted via `registry.migration`), NOT
     * an orchestrator compile-time parameter, so it lives version-locally on this
     * class. Deploy it (`deployMigration`) + register its stake
     * (`registerMigrationStake`), then run `buildMigrateStateTx` to migrate a
     * v1_0 one-field vault datum to the four-field v1_1 shape in place.
     */
    _defineProperty(_this, "migrationScript", void 0);
    _defineProperty(_this, "migrationScriptHash", void 0);
    /**
     * Slot-aligned execution bounds for the in-flight `buildExecuteOrdersTx`.
     * `executionNowMs` is the backed-off lower bound used by the diffusion datum
     * and rate quote; `executionValidUntilMs` is based on the unshifted wall time.
     * Both are undefined outside an execution build.
     */
    _defineProperty(_this, "executionNowMs", void 0);
    _defineProperty(_this, "executionValidUntilMs", void 0);
    _this.nowFn = (_options$now = options.now) !== null && _options$now !== void 0 ? _options$now : function () {
      return BigInt(Date.now());
    };
    _this.executionClockBackoffMs = options.now === undefined ? DEFAULT_CLOCK_BACKOFF_MS : 0n;
    _this.defaultDiffusionDurationMs = options.defaultDiffusionDurationMs;
    _this.diffusionShortfallThresholdMs = (_options$diffusionSho = options.diffusionShortfallThresholdMs) !== null && _options$diffusionSho !== void 0 ? _options$diffusionSho : 0n;
    // A negative threshold would silently suppress detection of a window that
    // HAS lapsed (remaining is negative by then), defeating the whole guard —
    // and, with throwOnDiffusionWindowShortfall set, defeating it silently.
    if (_this.diffusionShortfallThresholdMs < 0n) {
      throw new RangeError("diffusionShortfallThresholdMs must be non-negative, got ".concat(_this.diffusionShortfallThresholdMs, " ms."));
    }
    _this.throwOnDiffusionWindowShortfall = (_options$throwOnDiffu = options.throwOnDiffusionWindowShortfall) !== null && _options$throwOnDiffu !== void 0 ? _options$throwOnDiffu : false;
    _this.executionValidityWindowMs = (_options$executionVal = options.executionValidityWindowMs) !== null && _options$executionVal !== void 0 ? _options$executionVal : DEFAULT_EXECUTION_VALIDITY_WINDOW_MS;
    var validitySpanMs = _this.executionClockBackoffMs + _this.executionValidityWindowMs;
    if (_this.executionValidityWindowMs < 0n || validitySpanMs > _diffusion.MAX_DIFFUSION_RATE_SPAN_MS) {
      throw new RangeError("Execution validity span must be at most 1 hour (".concat(_diffusion.MAX_DIFFUSION_RATE_SPAN_MS, " ms), got ").concat(validitySpanMs, " ms."));
    }
    _this.distributionOracleScriptHash = options.distributionOracleScriptHash;
    _this.migrationScript = options.migrationScript;
    _this.migrationScriptHash = options.migrationScript.hash();
    return _this;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Version Seams
  // ─────────────────────────────────────────────────────────────────────────────
  _inherits(RealfiSDKV1_1Rc1, _RealfiSDKV1Family);
  return _createClass(RealfiSDKV1_1Rc1, [{
    key: "settingsConfig",
    value: function settingsConfig(settings) {
      // V1_1 settings are nested: the reserve/pot config lives under `config`.
      return settings.config;
    }
  }, {
    key: "settingsRegistry",
    value: function settingsRegistry(settings) {
      return settings.registry;
    }
  }, {
    key: "buildInitialVaultDatum",
    value: function buildInitialVaultDatum() {
      return {
        circulating_susdr: 0n,
        pending_yield: 0n,
        diffusion_start: 0n,
        diffusion_end: 0n
      };
    }
  }, {
    key: "buildUpdatedVaultDatum",
    value: function buildUpdatedVaultDatum(previous, sUSDrDelta) {
      // Stake / unstake move only circulating_susdr; the diffusion window passes
      // through untouched (stake.ak / unstake.ak enforce this). Deposit builds
      // its datum via updateDepositVaultOutput, not this seam.
      return {
        circulating_susdr: previous.circulating_susdr + sUSDrDelta,
        pending_yield: previous.pending_yield,
        diffusion_start: previous.diffusion_start,
        diffusion_end: previous.diffusion_end
      };
    }
  }, {
    key: "settledVaultBacking",
    value: function settledVaultBacking(parsedVaultDatum, vaultUSDr) {
      return (0, _diffusion.settledBacking)(vaultUSDr, parsedVaultDatum, this.rateTimeMs());
    }
  }, {
    key: "buildTreasuryRequest",
    value: function buildTreasuryRequest(datum, parsed, origin) {
      var _parsed$yield;
      // The signed request must echo the order datum's diffusion_end
      // (utilities.ak enforces request.diffusion_end == order.diffusion_end).
      var action = datum.action;
      var diffusionEnd = "ODeposit" in action ? action.ODeposit.diffusion_end : 0n;
      return {
        destination: datum.destination,
        amount: parsed.amount,
        "yield": (_parsed$yield = parsed["yield"]) !== null && _parsed$yield !== void 0 ? _parsed$yield : 0n,
        diffusion_end: diffusionEnd,
        origin: origin,
        reserve_asset: parsed.reserveAsset
      };
    }
  }, {
    key: "splitsYield",
    get: function get() {
      return true;
    }

    /**
     * The yield split a deposit batch's creator should pick:
     * vault_usdr / treasury_circulating, i.e. the share of the circulating supply
     * that is staked. Pinning it to that ratio makes the SIGNED split reproduce
     * exactly the integer staked share the executor writes to the vault —
     * deposit.ak recomputes staked_yield_share = total_yield * numerator /
     * denominator with the same truncation-toward-zero, and the same two values
     * feed the execute path's calculateYieldShares.
     *
     * Only the creator of a batch calls this. A co-signer must NOT: it reads live
     * state, and two signers reading it at different chain states would produce
     * different payload bytes, which cannot be co-signed (the orchestrator checks
     * every signature against one payload hash). Co-signers read the batch's alpha
     * back from the backend and pass it to getSignedPayloadFromOrderInputs.
     */
  }, {
    key: "computeDepositAlpha",
    value: (function () {
      var _computeDepositAlpha = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
        var _vaultUtxo$output$amo, _vaultUtxo$output$amo2;
        var stablecoinAssetId, _yield$this$getVaultD, vaultUtxo, vaultUSDr, _yield$this$getTreasu, parsedTreasuryDatum, treasuryCirculating;
        return _regenerator().w(function (_context) {
          while (1) switch (_context.n) {
            case 0:
              stablecoinAssetId = _sdk.Core.AssetId(this.stablecoinPolicyId + this.assetNameHex);
              _context.n = 1;
              return this.getVaultDatum();
            case 1:
              _yield$this$getVaultD = _context.v;
              vaultUtxo = _yield$this$getVaultD.vaultUtxo;
              vaultUSDr = (_vaultUtxo$output$amo = (_vaultUtxo$output$amo2 = vaultUtxo.output().amount().multiasset()) === null || _vaultUtxo$output$amo2 === void 0 ? void 0 : _vaultUtxo$output$amo2.get(stablecoinAssetId)) !== null && _vaultUtxo$output$amo !== void 0 ? _vaultUtxo$output$amo : 0n;
              _context.n = 2;
              return this.getTreasuryDatum();
            case 2:
              _yield$this$getTreasu = _context.v;
              parsedTreasuryDatum = _yield$this$getTreasu.parsedTreasuryDatum;
              treasuryCirculating = parsedTreasuryDatum.circulating_supply;
              return _context.a(2, treasuryCirculating > 0n ? {
                numerator: vaultUSDr,
                denominator: treasuryCirculating
              } : {
                numerator: 0n,
                denominator: 1n
              });
          }
        }, _callee, this);
      }));
      function computeDepositAlpha() {
        return _computeDepositAlpha.apply(this, arguments);
      }
      return computeDepositAlpha;
    }())
  }, {
    key: "buildDepositAction",
    value: function () {
      var _buildDepositAction = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(requests, alpha) {
        return _regenerator().w(function (_context2) {
          while (1) switch (_context2.n) {
            case 0:
              if (alpha) {
                _context2.n = 1;
                break;
              }
              throw new Error("v1_1_rc1: a deposit batch needs its yield-split alpha — pass the batch's stored alpha (created with computeDepositAlpha)");
            case 1:
              if (!(alpha.denominator <= 0n)) {
                _context2.n = 2;
                break;
              }
              throw new Error("v1_1_rc1: yield-split alpha denominator must be positive, got ".concat(alpha.denominator));
            case 2:
              if (!(alpha.numerator < 0n || alpha.numerator > alpha.denominator)) {
                _context2.n = 3;
                break;
              }
              throw new Error("v1_1_rc1: yield-split alpha must be within [0, 1], got ".concat(alpha.numerator, "/").concat(alpha.denominator));
            case 3:
              return _context2.a(2, {
                Deposit: {
                  requests: requests,
                  alpha: alpha
                }
              });
          }
        }, _callee2);
      }));
      function buildDepositAction(_x, _x2) {
        return _buildDepositAction.apply(this, arguments);
      }
      return buildDepositAction;
    }()
    /**
     * rc1's Deposit carries a COSE-signed `alpha`; `deposit.ak` splits total_yield
     * against that signed ratio (quotient_integer), NOT live vault/treasury state.
     * Echo the signed alpha here so the executor's vault/pot outputs (and the
     * pot-output indexing) match what the validator checks — re-reading state
     * would diverge if the vault or treasury moved between signing and execution.
     */
  }, {
    key: "resolveDepositYieldShares",
    value: function resolveDepositYieldShares(totalYield, vaultUSDr, treasuryCirculating, action) {
      var deposit = action.Deposit;
      if (!deposit) {
        // Defensive: a non-Deposit action routed here → live-state split.
        return _superPropGet(RealfiSDKV1_1Rc1, "resolveDepositYieldShares", this, 3)([totalYield, vaultUSDr, treasuryCirculating, action]);
      }
      var _deposit$alpha = deposit.alpha,
        numerator = _deposit$alpha.numerator,
        denominator = _deposit$alpha.denominator;
      // BigInt division truncates toward zero, matching Aiken quotient_integer.
      var stakedYieldShare = denominator > 0n ? totalYield * numerator / denominator : 0n;
      return {
        stakedYieldShare: stakedYieldShare,
        unstakedYieldShare: totalYield - stakedYieldShare
      };
    }
  }, {
    key: "serializeOrchestratorWithdrawalRedeemer",
    value: function serializeOrchestratorWithdrawalRedeemer(redeemer) {
      // v1_1_rc1's orchestrator dispatch wraps order execution in
      // ExecuteOrders(...) (the sibling PublishYieldOracle path is a follow-up
      // PR). Nest the family's signed redeemer inside the wrapper. The redeemer is
      // v1_0-typed at the family layer (Deposit carries `alpha` only at runtime,
      // injected by buildDepositAction); cast to the wrapper's static.
      return Data.serialize(_index.V1_1Rc1Types.ProtocolOrchestratorRedeemerV1, {
        ExecuteOrders: [redeemer]
      });
    }
  }, {
    key: "updateDepositVaultOutput",
    value: function updateDepositVaultOutput(tx, vaultUtxo, parsedVaultDatum, ctx) {
      // Vault window end = max diffusion_end across the batch's deposit orders
      // (max_end in deposit.ak). Read from each order datum's ODeposit action.
      var windowEndMs = 0n;
      var _iterator = _createForOfIteratorHelper(ctx.orderInfos),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var orderInfo = _step.value;
          var action = orderInfo.datum.action;
          if ("ODeposit" in action && action.ODeposit.diffusion_end > windowEndMs) {
            windowEndMs = action.ODeposit.diffusion_end;
          }
        }

        // One timestamp for both the shortfall check and the datum, so the warning
        // can never describe a different execution time than the one written.
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      var nowMs = this.rateTimeMs();
      this.checkDiffusionWindow(parsedVaultDatum, ctx, windowEndMs, nowMs);
      var window = (0, _diffusion.nextDepositDiffusion)(parsedVaultDatum, ctx.stakedYieldShare, ctx.totalYield, windowEndMs, nowMs);
      this.updateVaultOutputWithDatum(tx, vaultUtxo, _objectSpread({
        circulating_susdr: parsedVaultDatum.circulating_susdr
      }, window), ctx.stakedYieldShare);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Deposit order builder (adds the diffusion_end datum field)
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Build a deposit order. Identical to the family default except the ODeposit
     * datum carries `diffusion_end` — the absolute POSIX-ms timestamp the staked
     * yield diffuses until, set at ORDER CREATION and echoed by the executed
     * request. Resolution: explicit `diffusionEnd` > `diffusionDurationMs` added to
     * the order-creation time > the SDK's `defaultDiffusionDurationMs` added to the
     * order-creation time > `0n` (instant).
     *
     * NB: because the window is absolute and fixed here, any delay before the
     * execute lands (batching, cold/multisig signature collection) shortens the
     * effective window; a window that fully elapses before execution collapses the
     * deposit to instant on-chain.
     */
  }, {
    key: "buildDepositOrderTx",
    value: function () {
      var _buildDepositOrderTx = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3(params) {
        var settings, ra, reserveAssetId, valueToLock, totalUSDrBacking, _vaultUtxo$output$amo3, _vaultUtxo$output$amo4, principalReserve, stablecoinAssetId, _yield$this$getTreasu2, parsedTreasuryDatum, vaultUtxo, vaultUSDr, _calculateYieldShares, unstakedYieldShare, action, _t;
        return _regenerator().w(function (_context3) {
          while (1) switch (_context3.n) {
            case 0:
              if (!(params.principal < 0n)) {
                _context3.n = 1;
                break;
              }
              throw new Error("Deposit principal must be non-negative");
            case 1:
              if (!(params.principal === 0n && params["yield"] === 0n)) {
                _context3.n = 2;
                break;
              }
              throw new Error("Deposit must have non-zero principal or yield");
            case 2:
              _t = this;
              _context3.n = 3;
              return this.getVersionSettings();
            case 3:
              settings = _t.settingsConfig.call(_t, _context3.v);
              ra = (0, _index2.findReserveAsset)(settings, params.reserveAsset);
              reserveAssetId = _sdk.Core.AssetId(params.reserveAsset[0] + params.reserveAsset[1]);
              if (!(params["yield"] >= 0n)) {
                _context3.n = 4;
                break;
              }
              // Positive yield: lock reserve backing for BOTH principal AND yield.
              totalUSDrBacking = params.principal + params["yield"];
              valueToLock = totalUSDrBacking > 0n ? (0, _sdk.makeValue)(_family.MIN_LOVELACE, [reserveAssetId, (0, _index2.usdrToReserveCeil)(totalUSDrBacking, ra)]) : (0, _sdk.makeValue)(_family.MIN_LOVELACE);
              _context3.n = 7;
              break;
            case 4:
              // Negative yield: lock principal (reserve) + unstaked yield share (USDr).
              principalReserve = params.principal > 0n ? (0, _index2.usdrToReserveCeil)(params.principal, ra) : 0n;
              valueToLock = principalReserve > 0n ? (0, _sdk.makeValue)(_family.MIN_LOVELACE, [reserveAssetId, principalReserve]) : (0, _sdk.makeValue)(_family.MIN_LOVELACE);
              stablecoinAssetId = _sdk.Core.AssetId(this.stablecoinPolicyId + this.assetNameHex);
              _context3.n = 5;
              return this.getTreasuryDatum();
            case 5:
              _yield$this$getTreasu2 = _context3.v;
              parsedTreasuryDatum = _yield$this$getTreasu2.parsedTreasuryDatum;
              _context3.n = 6;
              return this.getVaultDatum();
            case 6:
              vaultUtxo = _context3.v.vaultUtxo;
              vaultUSDr = (_vaultUtxo$output$amo3 = (_vaultUtxo$output$amo4 = vaultUtxo.output().amount().multiasset()) === null || _vaultUtxo$output$amo4 === void 0 ? void 0 : _vaultUtxo$output$amo4.get(stablecoinAssetId)) !== null && _vaultUtxo$output$amo3 !== void 0 ? _vaultUtxo$output$amo3 : 0n;
              _calculateYieldShares = (0, _family.calculateYieldShares)(params["yield"], vaultUSDr, parsedTreasuryDatum.circulating_supply), unstakedYieldShare = _calculateYieldShares.unstakedYieldShare;
              if (unstakedYieldShare < 0n) {
                valueToLock = _sdk.Value.merge(valueToLock, (0, _sdk.makeValue)(0n, [stablecoinAssetId, -unstakedYieldShare]));
              }
            case 7:
              // Typed as the v1_1 action (carries diffusion_end); assignable to the
              // family's v1_0 action param since the extra field is additive.
              action = {
                ODeposit: {
                  principal: params.principal,
                  "yield": params["yield"],
                  diffusion_end: this.resolveDiffusionEnd(params),
                  reserve_asset: params.reserveAsset
                }
              };
              return _context3.a(2, this._buildOrderTx({
                action: action,
                valueToLock: valueToLock,
                owner: params.owner,
                destination: params.destination,
                data: params.data
              }));
          }
        }, _callee3, this);
      }));
      function buildDepositOrderTx(_x3) {
        return _buildDepositOrderTx.apply(this, arguments);
      }
      return buildDepositOrderTx;
    }() // ─────────────────────────────────────────────────────────────────────────────
    // Execution validity / diffusion rate time
    // ─────────────────────────────────────────────────────────────────────────────
  }, {
    key: "buildExecuteOrdersTx",
    value: function () {
      var _buildExecuteOrdersTx = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4(params) {
        var provider, wallNowMs;
        return _regenerator().w(function (_context4) {
          while (1) switch (_context4.p = _context4.n) {
            case 0:
              // Pin both execution bounds once and align them to integer slots. The
              // backed-off lower bound drives diffusion_start and rate math; the upper
              // bound stays relative to unshifted wall time so skew protection does not
              // shorten the configured forward window.
              provider = this.blaze.provider;
              wallNowMs = (0, _index2.slotAlignedTimeMs)(provider, this.nowFn());
              this.executionNowMs = (0, _index2.slotAlignedTimeMs)(provider, wallNowMs - this.executionClockBackoffMs);
              this.executionValidUntilMs = (0, _index2.slotAlignedTimeMs)(provider, wallNowMs + this.executionValidityWindowMs);
              _context4.p = 1;
              _context4.n = 2;
              return _superPropGet(RealfiSDKV1_1Rc1, "buildExecuteOrdersTx", this, 3)([params]);
            case 2:
              return _context4.a(2, _context4.v);
            case 3:
              _context4.p = 3;
              this.executionNowMs = undefined;
              this.executionValidUntilMs = undefined;
              return _context4.f(3);
            case 4:
              return _context4.a(2);
          }
        }, _callee4, this, [[1,, 3, 4]]);
      }));
      function buildExecuteOrdersTx(_x4) {
        return _buildExecuteOrdersTx.apply(this, arguments);
      }
      return buildExecuteOrdersTx;
    }()
  }, {
    key: "applyExecutionValidityBounds",
    value: function () {
      var _applyExecutionValidityBounds = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee5(tx, context) {
        var _parsedVaultDatum$pen;
        var nowMs, validUntilMs, actionType, parsedVaultDatum, needsBounds;
        return _regenerator().w(function (_context5) {
          while (1) switch (_context5.n) {
            case 0:
              nowMs = this.executionNowMs;
              validUntilMs = this.executionValidUntilMs;
              if (!(nowMs === undefined || validUntilMs === undefined)) {
                _context5.n = 1;
                break;
              }
              return _context5.a(2);
            case 1:
              actionType = context.actionType, parsedVaultDatum = context.parsedVaultDatum; // Deposit always reads the diffusion rate time once a window is requested
              // or already active; setting bounds unconditionally on deposit is safe
              // (the validator only caps the span when it reads it). Stake/unstake need
              // bounds only when a diffusion window is active.
              needsBounds = actionType === "deposit" || (actionType === "stake" || actionType === "unstake") && ((_parsedVaultDatum$pen = parsedVaultDatum === null || parsedVaultDatum === void 0 ? void 0 : parsedVaultDatum.pending_yield) !== null && _parsedVaultDatum$pen !== void 0 ? _parsedVaultDatum$pen : 0n) > 0n;
              if (needsBounds) {
                _context5.n = 2;
                break;
              }
              return _context5.a(2);
            case 2:
              // Both bounds are already slot-aligned times, but go through `slotFloor`
              // anyway: it is the only conversion allowed to reach the tx builder, and it
              // guarantees an integer slot (the CBOR writer would silently truncate a
              // fractional one, putting a different value on-chain than the datum's).
              tx.setValidFrom((0, _index2.slotFloor)(this.blaze.provider, nowMs));
              tx.setValidUntil((0, _index2.slotFloor)(this.blaze.provider, validUntilMs));
            case 3:
              return _context5.a(2);
          }
        }, _callee5, this);
      }));
      function applyExecutionValidityBounds(_x5, _x6) {
        return _applyExecutionValidityBounds.apply(this, arguments);
      }
      return applyExecutionValidityBounds;
    }() // ─────────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────────
    /**
     * The diffusion rate timestamp (POSIX ms): the pinned execution time during
     * an execution build, else the current wall-clock time (used by order-build
     * min-received estimation, where an exact rate time is not yet knowable).
     */
  }, {
    key: "rateTimeMs",
    value: function rateTimeMs() {
      var _this$executionNowMs;
      return (_this$executionNowMs = this.executionNowMs) !== null && _this$executionNowMs !== void 0 ? _this$executionNowMs : this.nowFn();
    }
  }, {
    key: "resolveDiffusionEnd",
    value: function resolveDiffusionEnd(params) {
      var _params$diffusionDura;
      if (params.diffusionEnd !== undefined) {
        return params.diffusionEnd;
      }
      var duration = (_params$diffusionDura = params.diffusionDurationMs) !== null && _params$diffusionDura !== void 0 ? _params$diffusionDura : this.defaultDiffusionDurationMs;
      return duration !== undefined ? this.nowFn() + duration : 0n;
    }

    /**
     * Surface a diffusion-window shortfall on a deposit execution.
     *
     * `diffusion_end` is absolute and fixed at ORDER CREATION, so waiting to
     * execute (batching, cold/multisig signing) eats the window. Once it is gone,
     * `validate_deposit_diffusion` (utilities.ak:1117) zeroes the window and the
     * deposit settles instantly — a VALID on-chain outcome, so the tx succeeds and
     * nothing else in the stack complains. This is the only place that sees it:
     * the operator would otherwise have to read the resulting vault datum.
     *
     * Advisory by default; {@link IRealfiSDKParamsV1_1Rc1.throwOnDiffusionWindowShortfall}
     * turns it into a refusal.
     */
  }, {
    key: "checkDiffusionWindow",
    value: function checkDiffusionWindow(vaultIn, ctx, windowEndMs, nowMs) {
      // A loss freezes the window rather than collapsing it (utilities.ak:1143).
      if (ctx.totalYield < 0n) {
        return;
      }
      // What the vault still owes the exchange rate — NOT `pending_yield`, which
      // keeps its original value in the datum until a tx rewrites it and so stays
      // positive long after the window has run its course. Only an unfinished
      // window has anything left to lose.
      var pendingLeftUsdr = (0, _diffusion.pendingRemaining)(vaultIn, nowMs);
      // No window requested and nothing left owed: the validator zeroes the datum
      // as its benign no-op case (utilities.ak:1128) — either a plain instant
      // deposit, or bookkeeping cleanup after a window ran to completion.
      if (windowEndMs <= 0n && pendingLeftUsdr <= 0n) {
        return;
      }
      // Nothing to diffuse: no staked share arriving and nothing still owed.
      if (ctx.stakedYieldShare <= 0n && pendingLeftUsdr <= 0n) {
        return;
      }
      var remainingMs = windowEndMs - nowMs;
      var message;
      if (windowEndMs > 0n) {
        if (remainingMs > this.diffusionShortfallThresholdMs) {
          return;
        }
        // Distinct outcomes: a lapsed window collapses to instant, while a
        // near-lapsed one still opens and diffuses over what is left.
        if (remainingMs <= 0n) {
          message = "deposit diffusion window lapsed ".concat(-remainingMs, "ms before execution ") + "(diffusion_end=".concat(windowEndMs, ", execution time=").concat(nowMs, "); the staked ") + "yield settles INSTANTLY instead of diffusing. Re-create the order " + "with a longer window to diffuse it.";
        } else {
          message = "deposit diffusion window has only ".concat(remainingMs, "ms left at ") + "execution (diffusion_end=".concat(windowEndMs, "); the staked yield diffuses ") + "over that remainder.";
        }
      } else {
        // No window requested while one is unfinished: the validator clears the
        // active window instead of carrying it (utilities.ak:1128-1136).
        message = "deposit requests no diffusion window while ".concat(pendingLeftUsdr, " USDr has ") + "not yet diffused (of ".concat(vaultIn.pending_yield, " pending, at execution ") + "time ".concat(nowMs, "); the active window is CLEARED and that remainder ") + "settles instantly.";
      }
      var text = "[realfi-sdk] ".concat(message);
      if (this.throwOnDiffusionWindowShortfall) {
        throw new Error(text);
      }
      console.warn(text);
    }

    // ───────────────────────────────────────────────────────────────────────────
    // In-place v1_0 → v1_1_rc1 upgrade: vault-datum migration (MigrateState)
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Deploy the migration validator as a reference script. Required before its
     * withdrawal can be attached in {@link buildMigrateStateTx}.
     */
  }, {
    key: "deployMigration",
    value: function () {
      var _deployMigration = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee6() {
        return _regenerator().w(function (_context6) {
          while (1) switch (_context6.n) {
            case 0:
              return _context6.a(2, (0, _index2.deployScript)(this.blaze, this.migrationScript, this.scriptDeploymentAddress));
          }
        }, _callee6, this);
      }));
      function deployMigration() {
        return _deployMigration.apply(this, arguments);
      }
      return deployMigration;
    }()
    /**
     * Register the migration validator's stake credential. Its withdrawal cannot
     * be exercised until the stake credential is registered.
     */
  }, {
    key: "registerMigrationStake",
    value: function registerMigrationStake() {
      return this.blaze.newTransaction().addRegisterStake((0, _index2.credentialFromScript)(this.migrationScript));
    }

    /**
     * Read the staking-vault UTxO holding a legacy v1_0 (one-field) datum. The
     * inherited {@link getVaultDatum} parses the four-field v1_1 schema and THROWS
     * on a pre-migration vault, so the migration path reads the input with the
     * v1_0 single-field schema (`circulating_susdr` only).
     */
  }, {
    key: "readLegacyVaultDatum",
    value: (function () {
      var _readLegacyVaultDatum = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee7() {
        var _yield$getDatumFromNF, utxo, parsedDatum, legacy;
        return _regenerator().w(function (_context7) {
          while (1) switch (_context7.n) {
            case 0:
              _context7.n = 1;
              return (0, _index2.getDatumFromNFT)(this.blaze, this.stakingVaultNFTAssetId, _index.V1_0Types.VaultDatumV1);
            case 1:
              _yield$getDatumFromNF = _context7.v;
              utxo = _yield$getDatumFromNF.utxo;
              parsedDatum = _yield$getDatumFromNF.parsedDatum;
              legacy = parsedDatum;
              return _context7.a(2, {
                vaultUtxo: utxo,
                circulatingSusdr: legacy.circulating_susdr
              });
          }
        }, _callee7, this);
      }));
      function readLegacyVaultDatum() {
        return _readLegacyVaultDatum.apply(this, arguments);
      }
      return readLegacyVaultDatum;
    }()
    /**
     * Build the COSE payload for a `MigrateState` action. Unlike the order path
     * (whose nonce derives from the sorted order inputs), migration spends the
     * vault UTxO, so the nonce is anchored to the vault input. Returns the CBOR
     * payload (for {@link buildMigrateStateTx}) and its blake2b-256 hash (for
     * CIP-30 signing by the `permissions.migrate` signer(s)).
     */
    )
  }, {
    key: "getMigrateStatePayload",
    value: (function () {
      var _getMigrateStatePayload = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee8() {
        var _yield$this$readLegac, vaultUtxo, nonce, payload, serialized, signedPayload, payloadHash;
        return _regenerator().w(function (_context8) {
          while (1) switch (_context8.n) {
            case 0:
              _context8.n = 1;
              return this.readLegacyVaultDatum();
            case 1:
              _yield$this$readLegac = _context8.v;
              vaultUtxo = _yield$this$readLegac.vaultUtxo;
              nonce = (0, _index2.buildNonceFromUtxo)(vaultUtxo.input()); // The family signing-schema key is v1_0-typed at compile time (its action
              // union predates MigrateState), but the runtime schema is the v1_1 one whose
              // ProtocolRedeemerV1 includes the MigrateState literal (ctor 8). Cast the
              // payload to the family payload type the serializer expects.
              payload = {
                action: "MigrateState",
                nonce: nonce
              };
              serialized = Data.serialize(this.signing.SignedPayload_ProtocolRedeemerV1, payload);
              signedPayload = serialized.toCbor().toString();
              payloadHash = (0, _core.blake2b_256)((0, _core.HexBlob)(signedPayload));
              return _context8.a(2, {
                signedPayload: signedPayload,
                payloadHash: payloadHash
              });
          }
        }, _callee8, this);
      }));
      function getMigrateStatePayload() {
        return _getMigrateStatePayload.apply(this, arguments);
      }
      return getMigrateStatePayload;
    }()
    /**
     * Build the in-place vault-datum migration transaction (`MigrateState`). Spends
     * the staking-vault UTxO (still holding the v1_0 one-field datum) and re-locks
     * it at the SAME address and value with the four-field v1_1 datum
     * (`circulating_susdr` preserved, diffusion window zeroed). Operator-only — not
     * on the partner surface, like {@link buildExecuteOrdersTx}.
     *
     * Requires (per `protocol_migration_v1_0_to_v1_1.ak` + the orchestrator's
     * MigrateState branch): the migration validator deployed + stake-registered,
     * `registry.migration = Some(migrationScriptHash)` in the live settings, and
     * `signatures` = the `permissions.migrate` COSE signatures over the payload
     * hash from {@link getMigrateStatePayload}.
     */
    )
  }, {
    key: "buildMigrateStateTx",
    value: (function () {
      var _buildMigrateStateTx = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee9(params) {
        var signedPayload, _yield$this$readLegac2, vaultUtxo, circulatingSusdr, refInputs, _yield$this$getParsed, proxyUtxo, walletUtxos, utxoKey, excluded, _i, _Object$values, ref, feeUtxos, sortedInputRefs, vaultInputIdx, migratedDatum, extra, orchestratorRedeemer, tx, _iterator2, _step2, feeUtxo;
        return _regenerator().w(function (_context9) {
          while (1) switch (_context9.n) {
            case 0:
              signedPayload = (0, _data.parse)(this.signing.SignedPayload_ProtocolRedeemerV1, _core.PlutusData.fromCbor((0, _core.HexBlob)(params.signedPayload)));
              _context9.n = 1;
              return this.readLegacyVaultDatum();
            case 1:
              _yield$this$readLegac2 = _context9.v;
              vaultUtxo = _yield$this$readLegac2.vaultUtxo;
              circulatingSusdr = _yield$this$readLegac2.circulatingSusdr;
              _context9.n = 2;
              return this.getScriptReferenceInputs({
                protocol: this.protocolScriptHash,
                stakingVault: this.stakingVaultScriptHash,
                migration: this.migrationScriptHash
              });
            case 2:
              refInputs = _context9.v;
              _context9.n = 3;
              return this.getParsedProxyDatum();
            case 3:
              _yield$this$getParsed = _context9.v;
              proxyUtxo = _yield$this$getParsed.proxyUtxo;
              _context9.n = 4;
              return this.blaze.wallet.getUnspentOutputs();
            case 4:
              walletUtxos = _context9.v;
              utxoKey = function utxoKey(inp) {
                return "".concat(inp.transactionId().toString(), "#").concat(inp.index().toString());
              };
              excluded = new Set([utxoKey(vaultUtxo.input()), utxoKey(proxyUtxo.input())]);
              for (_i = 0, _Object$values = Object.values(refInputs); _i < _Object$values.length; _i++) {
                ref = _Object$values[_i];
                if (ref) {
                  excluded.add(utxoKey(ref.input()));
                }
              }
              feeUtxos = walletUtxos.filter(function (u) {
                return !excluded.has(utxoKey(u.input()));
              }); // Vault input index in the ledger-sorted input set (txHash, then index).
              sortedInputRefs = [vaultUtxo.input()].concat(_toConsumableArray(feeUtxos.map(function (u) {
                return u.input();
              }))).sort(function (a, b) {
                var txA = a.transactionId().toString();
                var txB = b.transactionId().toString();
                if (txA < txB) return -1;
                if (txA > txB) return 1;
                return Number(a.index()) - Number(b.index());
              });
              vaultInputIdx = BigInt(sortedInputRefs.findIndex(function (r) {
                return r.transactionId().toString() === vaultUtxo.input().transactionId().toString() && r.index() === vaultUtxo.input().index();
              })); // Migrated datum: preserve circulating_susdr, zero the diffusion window (no
              // pending yield at migration time). The vault output is the first output the
              // builder adds, so its index is 0 (change outputs are appended after).
              migratedDatum = {
                circulating_susdr: circulatingSusdr,
                pending_yield: 0n,
                diffusion_start: 0n,
                diffusion_end: 0n
              }; // No order requests travel in a migration; the request/treasury indices are
              // dummies (the migration branch reads only the vault indices).
              extra = {
                request_to_outputs: [],
                input_to_requests: [],
                treasury_input_idx: 0n,
                treasury_output_idx: 0n,
                vault_input_idx: vaultInputIdx,
                vault_output_idx: 0n
              };
              orchestratorRedeemer = this.serializeOrchestratorWithdrawalRedeemer({
                extra: extra,
                payload: signedPayload,
                signatures: params.signatures
              });
              tx = this.newOrderTransaction(); // Spend the vault with DeferToProtocol (Void); the vault script resolves
              // from the staking-vault reference input.
              tx.addInput(vaultUtxo, Data.Void());
              _iterator2 = _createForOfIteratorHelper(feeUtxos);
              try {
                for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                  feeUtxo = _step2.value;
                  tx.addInput(feeUtxo);
                }
              } catch (err) {
                _iterator2.e(err);
              } finally {
                _iterator2.f();
              }
              tx.addReferenceInput(refInputs.protocol);
              tx.addReferenceInput(refInputs.stakingVault);
              tx.addReferenceInput(refInputs.migration);
              tx.addReferenceInput(proxyUtxo);

              // Re-lock exactly one vault output at the SAME address (payment + stake) and
              // the SAME value, no reference script, carrying the four-field datum.
              tx.lockAssets(vaultUtxo.output().address(), vaultUtxo.output().amount(), Data.serialize(this.schemas.VaultDatumV1, migratedDatum));

              // Orchestrator withdrawal carries the ExecuteOrders(MigrateState) redeemer
              // plus the permissions.migrate COSE signatures.
              tx.addWithdrawal(_sdk.Core.RewardAccount.fromCredential({
                type: _sdk.Core.CredentialType.ScriptHash,
                hash: this.protocolScriptHash
              }, this.network), 0n, orchestratorRedeemer);
              // Migration validator withdrawal (Void); enforces the migration tx shape.
              tx.addWithdrawal(_sdk.Core.RewardAccount.fromCredential({
                type: _sdk.Core.CredentialType.ScriptHash,
                hash: this.migrationScriptHash
              }, this.network), 0n, Data.Void());
              return _context9.a(2, tx);
          }
        }, _callee9, this);
      }));
      function buildMigrateStateTx(_x7) {
        return _buildMigrateStateTx.apply(this, arguments);
      }
      return buildMigrateStateTx;
    }())
  }], [{
    key: "create",
    value: function create(blaze, params) {
      var _params$enableTrace, _params$yieldOracleBo, _params$referenceInpu, _params$referenceInpu2, _params$referenceInpu3, _params$referenceInpu4, _params$referenceInpu5;
      var enableTrace = (_params$enableTrace = params.enableTrace) !== null && _params$enableTrace !== void 0 ? _params$enableTrace : false;

      // 1. Create oneshot script
      var oneShotScript = new _index.BaseTypes.BaseOneshotOneshotMint({
        transaction_id: params.proxyBootstrap.txHash,
        output_index: params.proxyBootstrap.outputIndex
      }, enableTrace).Script;
      var oneShotPolicyId = oneShotScript.hash();

      // 2. Create sub-validator scripts first (they only need proxy policy)
      var protocolMintScript = new _index.V1_1Rc1Types.V1_1Rc1ProtocolMintProtocolMintWithdraw(oneShotPolicyId, enableTrace).Script;
      var protocolStakeScript = new _index.V1_1Rc1Types.V1_1Rc1ProtocolStakeProtocolStakeWithdraw(oneShotPolicyId, enableTrace).Script;
      var protocolManagementScript = new _index.V1_1Rc1Types.V1_1Rc1ProtocolManagementProtocolManagementWithdraw(oneShotPolicyId, enableTrace).Script;

      // 3. Derive the two oracle validators. They are DISTINCT scripts with
      // distinct roles and hashes (the shared "yield_oracle" naming is a contract
      // quirk):
      //   - `yield_oracle` is a mint+spend validator: its single hash is both the
      //     oracle-NFT policy id AND the address holding the long-lived oracle
      //     UTxO. This is the orchestrator's `yield_oracle_validator` compile-time
      //     param — ExecuteOrders' `no_script_input` guard protects that UTxO from
      //     being drained by a normal execution.
      //   - `distribution_oracle` is the withdraw-only publish-logic validator.
      //     Its hash is what `registry.yield_oracle` must hold (PublishYieldOracle
      //     requires THIS validator's withdrawal).
      // Seeded by its OWN dedicated bootstrap UTxO (NOT proxyBootstrap, which the
      // proxy NFT mint consumes) so the oracle one-shot stays satisfiable when the
      // publish flow later bootstraps the oracle NFT. Only the hashes are needed
      // here (the publish path / NFT mint is a follow-up).
      // A deferred oracle omits the seed → default to the placeholder (a
      // permanently un-consumable reference). A deployment that runs the oracle
      // supplies a real seed. Either way the orchestrator hash is deterministic.
      var yieldOracleBootstrap = (_params$yieldOracleBo = params.yieldOracleBootstrap) !== null && _params$yieldOracleBo !== void 0 ? _params$yieldOracleBo : _index2.YIELD_ORACLE_BOOTSTRAP_PLACEHOLDER;
      var yieldOracleScript = new _index.V1_1Rc1Types.V1_1Rc1YieldOracleYieldOracleMint({
        transaction_id: yieldOracleBootstrap.txHash,
        output_index: yieldOracleBootstrap.outputIndex
      }, oneShotPolicyId, enableTrace).Script;
      var yieldOracleValidatorHash = yieldOracleScript.hash();
      // The oracle NFT is minted under the yield_oracle validator's own policy, so
      // the NFT policy id equals that validator's hash.
      var oracleNftPolicyId = yieldOracleValidatorHash;
      var distributionOracleScript = new _index.V1_1Rc1Types.V1_1Rc1DistributionOracleDistributionOracleWithdraw(oneShotPolicyId, oracleNftPolicyId, enableTrace).Script;
      var distributionOracleScriptHash = distributionOracleScript.hash();

      // The v1_0→v1_1 migration validator. Withdraw-only and registry-gated (not
      // an orchestrator compile param): whitelisted at runtime via
      // `registry.migration`. Only the proxy policy id parametrizes it.
      var migrationScript = new _index.V1_1Rc1Types.V1_1Rc1ProtocolMigrationV1_0ToV1_1ProtocolMigrationV1_0ToV1_1Withdraw(oneShotPolicyId, enableTrace).Script;

      // 4. Create orchestrator with sub-validator hashes + the yield_oracle
      // validator hash (the validator that HOLDS the oracle UTxO — NOT
      // distribution_oracle).
      var protocolOrchestratorScript = new _index.V1_1Rc1Types.V1_1Rc1ProtocolOrchestratorProtocolOrchestratorWithdraw(oneShotPolicyId, protocolMintScript.hash(), protocolStakeScript.hash(), protocolManagementScript.hash(), yieldOracleValidatorHash, enableTrace).Script;
      var mintProxyScript = new _index.BaseTypes.BaseMintProxyMintProxyMint(oneShotPolicyId, enableTrace).Script;

      // Use V0.1 or V1.1 treasury script based on option
      var treasuryScript = params.useV0_1Treasury ? new _index.V0_1Types.V0_1TreasuryTreasurySpend({
        transaction_id: params.treasuryBootstrap.txHash,
        output_index: params.treasuryBootstrap.outputIndex
      }, oneShotPolicyId, enableTrace).Script : new _index.V1_1Rc1Types.V1_1Rc1TreasuryTreasurySpend({
        transaction_id: params.treasuryBootstrap.txHash,
        output_index: params.treasuryBootstrap.outputIndex
      }, oneShotPolicyId, enableTrace).Script;

      // 4. Create order script with orchestrator hash
      var orderScript = new _index.V1_1Rc1Types.V1_1Rc1OrderOrderSpend(oneShotPolicyId, protocolOrchestratorScript.hash(), enableTrace).Script;

      // Use V0.4 or V1.1 staking vault script based on option
      var stakingVaultScript = params.useV0_4StakingVault ? new _index.V0_4Types.V0_4StakingVaultStakingVaultSpend({
        transaction_id: params.stakingVaultBootstrap.txHash,
        output_index: params.stakingVaultBootstrap.outputIndex
      }, oneShotPolicyId, enableTrace).Script : new _index.V1_1Rc1Types.V1_1Rc1StakingVaultStakingVaultSpend({
        transaction_id: params.stakingVaultBootstrap.txHash,
        output_index: params.stakingVaultBootstrap.outputIndex
      }, oneShotPolicyId, enableTrace).Script;
      return new RealfiSDKV1_1Rc1(blaze, {
        version: "V1_1_Rc1",
        proxyBootstrap: params.proxyBootstrap,
        assetNameHex: params.assetNameHex,
        sUSDrAssetNameHex: params.sUSDrAssetNameHex,
        enableTrace: enableTrace,
        defaultSlippageToleranceBps: params.defaultSlippageToleranceBps,
        scriptDeploymentAddress: params.scriptDeploymentAddress,
        deployedValidators: params.deployedValidators
      }, _index.V1_1Rc1Types, {
        oneShotScript: oneShotScript,
        protocolOrchestratorScript: protocolOrchestratorScript,
        protocolMintScript: protocolMintScript,
        protocolStakeScript: protocolStakeScript,
        protocolManagementScript: protocolManagementScript,
        mintProxyScript: mintProxyScript,
        treasuryScript: treasuryScript,
        orderScript: orderScript,
        stakingVaultScript: stakingVaultScript
      }, {
        protocolRefInput: (_params$referenceInpu = params.referenceInputs) === null || _params$referenceInpu === void 0 ? void 0 : _params$referenceInpu.protocolRefInput,
        proxyRefInput: (_params$referenceInpu2 = params.referenceInputs) === null || _params$referenceInpu2 === void 0 ? void 0 : _params$referenceInpu2.proxyRefInput,
        treasuryRefInput: (_params$referenceInpu3 = params.referenceInputs) === null || _params$referenceInpu3 === void 0 ? void 0 : _params$referenceInpu3.treasuryRefInput,
        orderRefInput: (_params$referenceInpu4 = params.referenceInputs) === null || _params$referenceInpu4 === void 0 ? void 0 : _params$referenceInpu4.orderRefInput,
        stakingVaultRefInput: (_params$referenceInpu5 = params.referenceInputs) === null || _params$referenceInpu5 === void 0 ? void 0 : _params$referenceInpu5.stakingVaultRefInput
      },
      // The v1_1 signed-payload / signed-redeemer schemas are the V1_0-shaped
      // payload plus TreasuryRequestV1.diffusion_end (additive), so they map
      // onto the family's stable signing-schema keys. blaze mangles the
      // orchestrator generics with a `_v1_1_` infix (see the codegen note in
      // project_v1_1_rc1_vs_audited_v1_1_divergence); remap them here.
      {
        SignedPayload_ProtocolRedeemerV1: _index.V1_1Rc1Types.SignedPayload_v1_1_ProtocolRedeemerV1,
        SignedRedeemer_ExtraProtocolRedeemerV1: _index.V1_1Rc1Types.SignedRedeemer_v1_1_ExtraProtocolRedeemerV1
      }, {
        now: params.now,
        defaultDiffusionDurationMs: params.defaultDiffusionDurationMs,
        executionValidityWindowMs: params.executionValidityWindowMs,
        diffusionShortfallThresholdMs: params.diffusionShortfallThresholdMs,
        throwOnDiffusionWindowShortfall: params.throwOnDiffusionWindowShortfall,
        distributionOracleScriptHash: distributionOracleScriptHash,
        migrationScript: migrationScript
      });
    }
  }]);
}(_family.RealfiSDKV1Family);
/** Re-exported for parity with the sibling version modules. */
//# sourceMappingURL=index.js.map