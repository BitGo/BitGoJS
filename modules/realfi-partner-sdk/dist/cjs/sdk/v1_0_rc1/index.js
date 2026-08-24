"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RealfiSDKV1_0Rc1 = exports.DIRECT_ACTION_PADDING_ASSET = void 0;
var _core = require("@blaze-cardano/core");
var _data = _interopRequireWildcard(require("@blaze-cardano/data"));
var Data = _data;
var _sdk = require("@blaze-cardano/sdk");
var _index = require("../../generated-types/index.js");
var _index2 = require("../shared/index.js");
var _family = require("../v1/family.js");
var _orderSanity = require("../v1/order-sanity.js");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t6 in e) "default" !== _t6 && {}.hasOwnProperty.call(e, _t6) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t6)) && (i.get || i.set) ? o(f, _t6, i) : f[_t6] = e[_t6]); return f; })(e, t); }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
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
function _getPrototypeOf(t) { return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) { return t.__proto__ || Object.getPrototypeOf(t); }, _getPrototypeOf(t); }
function _inherits(t, e) { if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function"); t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } }), Object.defineProperty(t, "prototype", { writable: !1 }), e && _setPrototypeOf(t, e); }
function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sentinel `reserve_asset` used in V1_0_Rc1 TreasuryRequestV1 redeemers for
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

// eslint-disable-next-line @typescript-eslint/naming-convention
// ─────────────────────────────────────────────────────────────────────────────
// SDK Class
// ─────────────────────────────────────────────────────────────────────────────
/**
 * V1_0Rc1 SDK implementation.
 *
 * Extends V0_4 with:
 * - DirectMint/DirectBurn: Mint/burn USDr without reserve asset flow (for fiat wire scenarios)
 * - Invalidated redeemer: Allow order owners to recover funds when protocol is upgraded
 * - Forfeit parameter: Support yield forfeiture during unstake operations
 * - New Settings fields: direct_mint_permission, direct_burn_permission
 *
 * Scaffolding (scripts, deploy/register, treasury, vault, one-shot, cancel,
 * invalidate) is inherited from {@link RealfiSDKV1Family}. The release
 * candidate's protocol redeemer schema is structurally different from v1_0
 * (`TreasuryRequestV1[]` + `RequestV1[]`, no fees, no `min_received`), so the
 * order builders, signed-payload construction, and execute builders override
 * the family's v1_0-semantics defaults with the rc1 behavior verbatim. No
 * signing schemas are passed to the family constructor — both consumers are
 * overridden here.
 */
var RealfiSDKV1_0Rc1 = exports.RealfiSDKV1_0Rc1 = /*#__PURE__*/function (_RealfiSDKV1Family) {
  function RealfiSDKV1_0Rc1() {
    var _this;
    _classCallCheck(this, RealfiSDKV1_0Rc1);
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    _this = _callSuper(this, RealfiSDKV1_0Rc1, [].concat(args));
    _defineProperty(_this, "version", "V1_0_Rc1");
    return _this;
  }
  _inherits(RealfiSDKV1_0Rc1, _RealfiSDKV1Family);
  return _createClass(RealfiSDKV1_0Rc1, [{
    key: "settingsConfig",
    value:
    // ─────────────────────────────────────────────────────────────────────────────
    // Version Seams
    // ─────────────────────────────────────────────────────────────────────────────

    function settingsConfig(settings) {
      // V1_0_Rc1 settings are flat: the settings object IS the config.
      return settings;
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
        circulating_susdr: 0n
      };
    }
  }, {
    key: "buildUpdatedVaultDatum",
    value: function buildUpdatedVaultDatum(previous, sUSDrDelta) {
      return {
        circulating_susdr: previous.circulating_susdr + sUSDrDelta
      };
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Order Builder Methods (rc1 order datums carry no min_received)
    // ─────────────────────────────────────────────────────────────────────────────
  }, {
    key: "buildStakeContinuation",
    value: function () {
      var _buildStakeContinuation = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(_params) {
        return _regenerator().w(function (_context) {
          while (1) switch (_context.n) {
            case 0:
              throw new Error("Stake continuations are not supported on V1_0_Rc1 because its order schema has no min_received");
            case 1:
              return _context.a(2);
          }
        }, _callee);
      }));
      function buildStakeContinuation(_x) {
        return _buildStakeContinuation.apply(this, arguments);
      }
      return buildStakeContinuation;
    }()
    /**
     * Internal helper to build an order transaction.
     */
  }, {
    key: "_buildOrderTx",
    value: (function () {
      var _buildOrderTx2 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(params) {
        var _params$data;
        var orderContractAddress, owner, orderDatum, serializedDatum, tx, _t, _t2;
        return _regenerator().w(function (_context2) {
          while (1) switch (_context2.n) {
            case 0:
              orderContractAddress = (0, _core.addressFromValidator)(this.network, this.orderScript);
              owner = params.owner;
              if (owner) {
                _context2.n = 2;
                break;
              }
              _context2.n = 1;
              return this.blaze.wallet.getChangeAddress();
            case 1:
              _t = _context2.v.getProps().paymentPart.hash.toString();
              _t2 = {
                key_hash: _t
              };
              owner = {
                Signature: _t2
              };
            case 2:
              orderDatum = {
                action: params.action,
                owner: owner,
                destination: params.destination,
                data: (_params$data = params.data) !== null && _params$data !== void 0 ? _params$data : Data.Void()
              };
              serializedDatum = Data.serialize(_index.V1_0Rc1Types.OrderDatumV1, orderDatum);
              tx = this.newOrderTransaction(params.extraLabels);
              tx.lockAssets(orderContractAddress, params.valueToLock, serializedDatum);
              return _context2.a(2, tx);
          }
        }, _callee2, this);
      }));
      function _buildOrderTx(_x2) {
        return _buildOrderTx2.apply(this, arguments);
      }
      return _buildOrderTx;
    }()
    /**
     * Build a mint order: lock reserve tokens, request USDr minting.
     */
    )
  }, {
    key: "buildMintOrderTx",
    value: (function () {
      var _buildMintOrderTx = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3(params) {
        var reserveAssetId, settings, ra, reserveAmount;
        return _regenerator().w(function (_context3) {
          while (1) switch (_context3.n) {
            case 0:
              if (!(params.amount <= 0n)) {
                _context3.n = 1;
                break;
              }
              throw new Error("Mint amount must be positive");
            case 1:
              reserveAssetId = _sdk.Core.AssetId(params.reserveAsset[0] + params.reserveAsset[1]); // Convert USDr amount to reserve amount using ceiling division
              // to ensure enough reserve is locked for on-chain validation
              _context3.n = 2;
              return this.getVersionSettings();
            case 2:
              settings = _context3.v;
              ra = (0, _index2.findReserveAsset)(settings, params.reserveAsset);
              reserveAmount = (0, _index2.usdrToReserveCeil)(params.amount, ra);
              return _context3.a(2, this._buildOrderTx({
                action: {
                  OMint: {
                    amount: params.amount,
                    reserve_asset: params.reserveAsset
                  }
                },
                valueToLock: (0, _sdk.makeValue)(_family.MIN_LOVELACE, [reserveAssetId, reserveAmount]),
                owner: params.owner,
                destination: params.destination,
                data: params.data
              }));
          }
        }, _callee3, this);
      }));
      function buildMintOrderTx(_x3) {
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
      var _buildRedeemOrderTx = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4(params) {
        var settings, stablecoinAssetId;
        return _regenerator().w(function (_context4) {
          while (1) switch (_context4.n) {
            case 0:
              if (!(params.amount <= 0n)) {
                _context4.n = 1;
                break;
              }
              throw new Error("Redeem amount must be positive");
            case 1:
              _context4.n = 2;
              return this.getVersionSettings();
            case 2:
              settings = _context4.v;
              (0, _index2.findReserveAsset)(settings, params.reserveAsset);
              stablecoinAssetId = _sdk.Core.AssetId(this.stablecoinPolicyId + this.assetNameHex);
              return _context4.a(2, this._buildOrderTx({
                action: {
                  ORedeem: {
                    amount: params.amount,
                    reserve_asset: params.reserveAsset
                  }
                },
                valueToLock: (0, _sdk.makeValue)(_family.MIN_LOVELACE, [stablecoinAssetId, params.amount]),
                owner: params.owner,
                destination: params.destination,
                data: params.data
              }));
          }
        }, _callee4, this);
      }));
      function buildRedeemOrderTx(_x4) {
        return _buildRedeemOrderTx.apply(this, arguments);
      }
      return buildRedeemOrderTx;
    }()
    /**
     * Build a stake order: lock USDr, request sUSDr minting.
     */
    )
  }, {
    key: "buildStakeOrderTx",
    value: (function () {
      var _buildStakeOrderTx = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee5(params) {
        var stablecoinAssetId;
        return _regenerator().w(function (_context5) {
          while (1) switch (_context5.n) {
            case 0:
              if (!(params.amount <= 0n)) {
                _context5.n = 1;
                break;
              }
              throw new Error("Stake amount must be positive");
            case 1:
              stablecoinAssetId = _sdk.Core.AssetId(this.stablecoinPolicyId + this.assetNameHex);
              return _context5.a(2, this._buildOrderTx({
                action: {
                  OStake: {
                    amount: params.amount
                  }
                },
                valueToLock: (0, _sdk.makeValue)(_family.MIN_LOVELACE, [stablecoinAssetId, params.amount]),
                owner: params.owner,
                destination: params.destination,
                data: params.data
              }));
          }
        }, _callee5, this);
      }));
      function buildStakeOrderTx(_x5) {
        return _buildStakeOrderTx.apply(this, arguments);
      }
      return buildStakeOrderTx;
    }())
  }, {
    key: "_buildUnstakeOrderTx",
    value: function () {
      var _buildUnstakeOrderTx2 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee6(params) {
        var _params$forfeit;
        var forfeit, sUSDrAssetId;
        return _regenerator().w(function (_context6) {
          while (1) switch (_context6.n) {
            case 0:
              if (!(params.amount <= 0n)) {
                _context6.n = 1;
                break;
              }
              throw new Error("Unstake amount must be positive");
            case 1:
              forfeit = (_params$forfeit = params.forfeit) !== null && _params$forfeit !== void 0 ? _params$forfeit : 0n;
              if (!(forfeit < 0n)) {
                _context6.n = 2;
                break;
              }
              throw new Error("Forfeit amount cannot be negative");
            case 2:
              sUSDrAssetId = _sdk.Core.AssetId(this.stablecoinPolicyId + this.sUSDrAssetNameHex);
              return _context6.a(2, this._buildOrderTx({
                action: {
                  OUnstake: {
                    amount: params.amount,
                    forfeit: forfeit
                  }
                },
                valueToLock: (0, _sdk.makeValue)(_family.MIN_LOVELACE, [sUSDrAssetId, params.amount]),
                owner: params.owner,
                destination: params.destination,
                data: params.data,
                extraLabels: params.extraLabels
              }));
          }
        }, _callee6, this);
      }));
      function _buildUnstakeOrderTx(_x6) {
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
     */
  }, {
    key: "buildUnstakeOrderTx",
    value: (function () {
      var _buildUnstakeOrderTx3 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee7(params) {
        var timelockDestination, extraLabels;
        return _regenerator().w(function (_context7) {
          while (1) switch (_context7.n) {
            case 0:
              timelockDestination = (0, _index2.buildTimelockDestination)(params.destination, params.unlockSlot);
              extraLabels = new Map([[_index2.UNSTAKE_METADATA_LABEL, (0, _index2.buildUnstakeMetadatum)(params.destination, params.unlockSlot)]]);
              return _context7.a(2, this._buildUnstakeOrderTx({
                amount: params.amount,
                destination: timelockDestination,
                forfeit: params.forfeit,
                owner: params.owner,
                data: params.data,
                extraLabels: extraLabels
              }));
          }
        }, _callee7, this);
      }));
      function buildUnstakeOrderTx(_x7) {
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
      var _buildTreasuryUnstakeOrderTx = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee8(params) {
        var nativeScript, timelockDestination, extraLabels, tx;
        return _regenerator().w(function (_context8) {
          while (1) switch (_context8.n) {
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
              _context8.n = 1;
              return this._buildUnstakeOrderTx({
                amount: params.amount,
                destination: timelockDestination,
                forfeit: params.forfeit,
                owner: params.owner,
                data: params.data,
                extraLabels: extraLabels
              });
            case 1:
              tx = _context8.v;
              return _context8.a(2, {
                tx: tx,
                nativeScript: nativeScript
              });
          }
        }, _callee8, this);
      }));
      function buildTreasuryUnstakeOrderTx(_x8) {
        return _buildTreasuryUnstakeOrderTx.apply(this, arguments);
      }
      return buildTreasuryUnstakeOrderTx;
    }() // ─────────────────────────────────────────────────────────────────────────────
    // Signed Payload and Signing
    // ─────────────────────────────────────────────────────────────────────────────
    /**
     * Build the V1_0Rc1 SignedPayload_ProtocolRedeemer from order inputs.
     * Returns both the CBOR hex string (for buildExecuteOrdersTx) and
     * the blake2b_256 hash (for CIP-30 signing).
     */
    )
  }, {
    key: "getSignedPayloadFromOrderInputs",
    value: function () {
      var _getSignedPayloadFromOrderInputs = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee9(orderInputs) {
        var sortedInputs, nonce, resolvedUtxos, actionType, treasuryRequests, requests, _iterator, _step, _utxo$output$datum, utxo, datumData, datum, origin, parsed, screened, _parsed$reserveAsset, _parsed$yield, reserveAsset, _parsed$forfeit, batchVerdict, action, payload, serialized, signedPayload, payloadHash, _t3, _t4;
        return _regenerator().w(function (_context9) {
          while (1) switch (_context9.p = _context9.n) {
            case 0:
              if (!(orderInputs.length === 0)) {
                _context9.n = 1;
                break;
              }
              throw new Error("At least one order input is required");
            case 1:
              sortedInputs = (0, _index2.sortOrderInputs)(orderInputs);
              nonce = (0, _index2.buildNonceFromUtxo)(sortedInputs[0]);
              _context9.n = 2;
              return this.blaze.provider.resolveUnspentOutputs(sortedInputs);
            case 2:
              resolvedUtxos = _context9.v;
              actionType = null;
              treasuryRequests = [];
              requests = [];
              _iterator = _createForOfIteratorHelper(resolvedUtxos);
              _context9.p = 3;
              _iterator.s();
            case 4:
              if ((_step = _iterator.n()).done) {
                _context9.n = 11;
                break;
              }
              utxo = _step.value;
              datumData = (_utxo$output$datum = utxo.output().datum()) === null || _utxo$output$datum === void 0 ? void 0 : _utxo$output$datum.asInlineData();
              if (datumData) {
                _context9.n = 5;
                break;
              }
              throw new Error("Order UTXO has no inline datum");
            case 5:
              datum = (0, _data.parse)(_index.V1_0Rc1Types.OrderDatumV1, datumData);
              origin = {
                transaction_id: utxo.input().transactionId().toString(),
                output_index: utxo.input().index()
              };
              parsed = this.classifyOrderAction(datum); // WTB-1764: same screen the family applies. rc1 has no min_received, but
              // its predicates still demand an amount sign (`v1_0_rc1/stake.ak:64`,
              // `unstake.ak:64`) and every one of them is an `expect` inside a single
              // fold, so a request that fails takes the whole transaction with it.
              _context9.n = 6;
              return this.screenOrderForExecution(utxo, parsed);
            case 6:
              screened = _context9.v;
              if (screened.ok) {
                _context9.n = 7;
                break;
              }
              throw new Error("Order ".concat(origin.transaction_id, "#").concat(origin.output_index, " cannot be executed: ") + "".concat(screened.reason, ". Every order batched with it would crash on-chain."));
            case 7:
              if (!(actionType === null)) {
                _context9.n = 8;
                break;
              }
              actionType = parsed.actionType;
              _context9.n = 9;
              break;
            case 8:
              if (!(actionType !== parsed.actionType)) {
                _context9.n = 9;
                break;
              }
              throw new Error("Mixed order types in inputs. All orders must be of the same type.");
            case 9:
              if (parsed.isTreasuryAction) {
                // DirectMint/DirectBurn datums have no reserve_asset; the redeemer
                // struct requires one but the on-chain validator ignores it for
                // direct actions, so we pad with DIRECT_ACTION_PADDING_ASSET.
                reserveAsset = (_parsed$reserveAsset = parsed.reserveAsset) !== null && _parsed$reserveAsset !== void 0 ? _parsed$reserveAsset : DIRECT_ACTION_PADDING_ASSET;
                treasuryRequests.push({
                  destination: datum.destination,
                  amount: parsed.amount,
                  "yield": (_parsed$yield = parsed["yield"]) !== null && _parsed$yield !== void 0 ? _parsed$yield : 0n,
                  origin: origin,
                  reserve_asset: reserveAsset
                });
              } else {
                requests.push({
                  destination: datum.destination,
                  amount: parsed.amount,
                  origin: origin,
                  forfeit: (_parsed$forfeit = parsed.forfeit) !== null && _parsed$forfeit !== void 0 ? _parsed$forfeit : 0n
                });
              }
            case 10:
              _context9.n = 4;
              break;
            case 11:
              _context9.n = 13;
              break;
            case 12:
              _context9.p = 12;
              _t3 = _context9.v;
              _iterator.e(_t3);
            case 13:
              _context9.p = 13;
              _iterator.f();
              return _context9.f(13);
            case 14:
              if (!(actionType === "deposit")) {
                _context9.n = 15;
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
                _context9.n = 15;
                break;
              }
              throw new Error("".concat(batchVerdict.reason, ". Every order batched with it would crash on-chain."));
            case 15:
              _t4 = actionType;
              _context9.n = _t4 === "mint" ? 16 : _t4 === "burn" ? 17 : _t4 === "withdraw" ? 18 : _t4 === "deposit" ? 19 : _t4 === "stake" ? 20 : _t4 === "unstake" ? 21 : _t4 === "direct_mint" ? 22 : _t4 === "direct_burn" ? 23 : 24;
              break;
            case 16:
              action = {
                Mint: {
                  requests: treasuryRequests
                }
              };
              return _context9.a(3, 25);
            case 17:
              action = {
                Burn: {
                  requests: treasuryRequests
                }
              };
              return _context9.a(3, 25);
            case 18:
              action = {
                Withdraw: {
                  requests: treasuryRequests
                }
              };
              return _context9.a(3, 25);
            case 19:
              action = {
                Deposit: {
                  requests: treasuryRequests
                }
              };
              return _context9.a(3, 25);
            case 20:
              action = {
                Stake: {
                  requests: requests
                }
              };
              return _context9.a(3, 25);
            case 21:
              action = {
                Unstake: {
                  requests: requests
                }
              };
              return _context9.a(3, 25);
            case 22:
              action = {
                DirectMint: {
                  requests: treasuryRequests
                }
              };
              return _context9.a(3, 25);
            case 23:
              action = {
                DirectBurn: {
                  requests: treasuryRequests
                }
              };
              return _context9.a(3, 25);
            case 24:
              throw new Error("No orders to process");
            case 25:
              payload = {
                action: action,
                nonce: nonce
              };
              serialized = Data.serialize(_index.V1_0Rc1Types.SignedPayload_v1_0_ProtocolRedeemerV1, payload);
              signedPayload = serialized.toCbor().toString();
              payloadHash = (0, _core.blake2b_256)((0, _core.HexBlob)(signedPayload));
              return _context9.a(2, {
                signedPayload: signedPayload,
                payloadHash: payloadHash
              });
          }
        }, _callee9, this, [[3, 12, 13, 14]]);
      }));
      function getSignedPayloadFromOrderInputs(_x9) {
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
      var _buildExecuteOrdersTx = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee0(params) {
        var orderInputs, signedPayloadCbor, signatures, signedPayload, sortedOrderInputs, orderUtxos, orderInfos, actionType, _yield$this$getParsed, proxyUtxo, parsedProxyDatum, settings, needsTreasury, needsVault, isMintAction, isStakeAction, scriptHashesNeeded, refInputs, treasuryUtxo, parsedTreasuryDatum, treasuryResult, vaultUtxo, parsedVaultDatum, vaultResult, walletUtxos, excludedInputIds, utxoKey, _iterator2, _step2, orderInfo, _i, _Object$values, refUtxo, feeUtxos, allInputRefs, _iterator3, _step3, feeUtxo, sortedAllInputRefs, findInputIdx, treasuryInputIdx, vaultInputIdx, signedRequests, originToRequestIdx, i, o, inputToRequests, requestToOutputs, outputIdx, input, key, requestIdx, numDestOutputs, numExtraOutputs, totalYield, _vaultValue$multiasse, _vaultValue$multiasse2, vaultValue, _stablecoinAssetId2, vaultUSDr, treasuryCirculating, _calculateYieldShares, unstakedYieldShare, totalForfeit, treasuryOutputIdx, vaultOutputIdx, extra, serializedSignedRedeemer, executeRedeemer, tx, _iterator4, _step4, _orderInfo, _iterator5, _step5, _feeUtxo, orchestratorRewardAccount, subValidatorHash, subValidatorRewardAccount, voidRedeemer, stablecoinAssetId, sUSDrAssetId, _t5;
        return _regenerator().w(function (_context0) {
          while (1) switch (_context0.n) {
            case 0:
              orderInputs = params.orderInputs, signedPayloadCbor = params.signedPayload, signatures = params.signatures; // Deserialize CBOR hex to object for internal use
              signedPayload = (0, _data.parse)(_index.V1_0Rc1Types.SignedPayload_v1_0_ProtocolRedeemerV1, _core.PlutusData.fromCbor((0, _core.HexBlob)(signedPayloadCbor))); // 1. Sort and resolve order UTxOs
              sortedOrderInputs = (0, _index2.sortOrderInputs)(orderInputs);
              _context0.n = 1;
              return this.blaze.provider.resolveUnspentOutputs(sortedOrderInputs);
            case 1:
              orderUtxos = _context0.v;
              // 2. Parse orders and validate same type
              orderInfos = this.parseOrderInfos(orderUtxos);
              actionType = orderInfos[0].actionType; // 3. Get protocol settings
              _context0.n = 2;
              return this.getParsedProxyDatum();
            case 2:
              _yield$this$getParsed = _context0.v;
              proxyUtxo = _yield$this$getParsed.proxyUtxo;
              parsedProxyDatum = _yield$this$getParsed.parsedProxyDatum;
              settings = parsedProxyDatum.settings; // 4. Determine what we need
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
              _context0.n = 3;
              return this.getScriptReferenceInputs(scriptHashesNeeded);
            case 3:
              refInputs = _context0.v;
              if (!needsTreasury) {
                _context0.n = 5;
                break;
              }
              _context0.n = 4;
              return this.getTreasuryDatum();
            case 4:
              treasuryResult = _context0.v;
              treasuryUtxo = treasuryResult.treasuryUtxo;
              parsedTreasuryDatum = treasuryResult.parsedTreasuryDatum;
            case 5:
              if (!needsVault) {
                _context0.n = 7;
                break;
              }
              _context0.n = 6;
              return this.getVaultDatum();
            case 6:
              vaultResult = _context0.v;
              vaultUtxo = vaultResult.vaultUtxo;
              parsedVaultDatum = vaultResult.parsedVaultDatum;
            case 7:
              _context0.n = 8;
              return this.blaze.wallet.getUnspentOutputs();
            case 8:
              walletUtxos = _context0.v;
              excludedInputIds = new Set();
              utxoKey = function utxoKey(inp) {
                return "".concat(inp.transactionId().toString(), "#").concat(inp.index().toString());
              }; // Exclude script inputs (order, treasury, vault)
              _iterator2 = _createForOfIteratorHelper(orderInfos);
              try {
                for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                  orderInfo = _step2.value;
                  excludedInputIds.add(utxoKey(orderInfo.utxo.input()));
                }
              } catch (err) {
                _iterator2.e(err);
              } finally {
                _iterator2.f();
              }
              if (treasuryUtxo) {
                excludedInputIds.add(utxoKey(treasuryUtxo.input()));
              }
              if (vaultUtxo) {
                excludedInputIds.add(utxoKey(vaultUtxo.input()));
              }
              // Exclude reference inputs (must be disjoint from regular inputs)
              excludedInputIds.add(utxoKey(proxyUtxo.input()));
              for (_i = 0, _Object$values = Object.values(refInputs); _i < _Object$values.length; _i++) {
                refUtxo = _Object$values[_i];
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
              _iterator3 = _createForOfIteratorHelper(feeUtxos);
              try {
                for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
                  feeUtxo = _step3.value;
                  allInputRefs.push(feeUtxo.input());
                }
              } catch (err) {
                _iterator3.e(err);
              } finally {
                _iterator3.f();
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
                _context0.n = 12;
                break;
              }
              input = orderInfos[outputIdx].utxo.input();
              key = "".concat(input.transactionId(), "#").concat(input.index());
              requestIdx = originToRequestIdx.get(key);
              if (!(requestIdx === undefined)) {
                _context0.n = 10;
                break;
              }
              throw new Error("Order input ".concat(key, " not found in signed payload"));
            case 10:
              inputToRequests.push(BigInt(requestIdx));
              requestToOutputs.push(BigInt(outputIdx));
            case 11:
              outputIdx++;
              _context0.n = 9;
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
                  _stablecoinAssetId2 = _sdk.Core.AssetId(this.stablecoinPolicyId + this.assetNameHex);
                  vaultUSDr = (_vaultValue$multiasse = (_vaultValue$multiasse2 = vaultValue.multiasset()) === null || _vaultValue$multiasse2 === void 0 ? void 0 : _vaultValue$multiasse2.get(_stablecoinAssetId2)) !== null && _vaultValue$multiasse !== void 0 ? _vaultValue$multiasse : 0n;
                  treasuryCirculating = parsedTreasuryDatum.circulating_supply;
                  _calculateYieldShares = (0, _family.calculateYieldShares)(totalYield, vaultUSDr, treasuryCirculating), unstakedYieldShare = _calculateYieldShares.unstakedYieldShare;
                  if (unstakedYieldShare > 0n) {
                    numExtraOutputs = 1;
                  }
                }
              }

              // For unstake with forfeit, add yield pot output
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
              }; // 11. Build SignedRedeemer
              serializedSignedRedeemer = Data.serialize(_index.V1_0Rc1Types.SignedRedeemer_v1_0_ExtraProtocolRedeemerV1, {
                extra: extra,
                payload: signedPayload,
                signatures: signatures
              });
              executeRedeemer = Data.serialize(_index.V1_0Rc1Types.OrderRedeemerV1, "Execute"); // 12. Build the transaction
              tx = this.newOrderTransaction(); // Add order inputs with Execute redeemer
              _iterator4 = _createForOfIteratorHelper(orderInfos);
              try {
                for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
                  _orderInfo = _step4.value;
                  tx.addInput(_orderInfo.utxo, executeRedeemer);
                }

                // Add wallet fee inputs explicitly
              } catch (err) {
                _iterator4.e(err);
              } finally {
                _iterator4.f();
              }
              _iterator5 = _createForOfIteratorHelper(feeUtxos);
              try {
                for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
                  _feeUtxo = _step5.value;
                  tx.addInput(_feeUtxo);
                }

                // Add reference inputs
              } catch (err) {
                _iterator5.e(err);
              } finally {
                _iterator5.f();
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
              _t5 = actionType;
              _context0.n = _t5 === "mint" ? 13 : _t5 === "burn" ? 14 : _t5 === "withdraw" ? 15 : _t5 === "deposit" ? 16 : _t5 === "stake" ? 17 : _t5 === "unstake" ? 18 : _t5 === "direct_mint" ? 19 : _t5 === "direct_burn" ? 20 : 21;
              break;
            case 13:
              this.buildMintExecute(tx, orderInfos, stablecoinAssetId, treasuryUtxo, parsedTreasuryDatum, settings);
              return _context0.a(3, 21);
            case 14:
              this.buildBurnExecute(tx, orderInfos, stablecoinAssetId, treasuryUtxo, parsedTreasuryDatum, settings);
              return _context0.a(3, 21);
            case 15:
              this.buildWithdrawExecute(tx, orderInfos, treasuryUtxo, parsedTreasuryDatum, settings);
              return _context0.a(3, 21);
            case 16:
              this.buildDepositExecute(tx, orderInfos, stablecoinAssetId, treasuryUtxo, parsedTreasuryDatum, vaultUtxo, parsedVaultDatum, settings);
              return _context0.a(3, 21);
            case 17:
              this.buildStakeExecute(tx, orderInfos, stablecoinAssetId, sUSDrAssetId, vaultUtxo, parsedVaultDatum);
              return _context0.a(3, 21);
            case 18:
              this.buildUnstakeExecute(tx, orderInfos, stablecoinAssetId, sUSDrAssetId, vaultUtxo, parsedVaultDatum, settings);
              return _context0.a(3, 21);
            case 19:
              this.buildDirectMintExecute(tx, orderInfos, stablecoinAssetId, treasuryUtxo, parsedTreasuryDatum);
              return _context0.a(3, 21);
            case 20:
              this.buildDirectBurnExecute(tx, orderInfos, stablecoinAssetId, treasuryUtxo, parsedTreasuryDatum);
              return _context0.a(3, 21);
            case 21:
              // Provide the mint proxy script for minting
              tx.provideScript(this.mintProxyScript);
              return _context0.a(2, tx);
          }
        }, _callee0, this);
      }));
      function buildExecuteOrdersTx(_x0) {
        return _buildExecuteOrdersTx.apply(this, arguments);
      }
      return buildExecuteOrdersTx;
    }() // ─────────────────────────────────────────────────────────────────────────────
    // Per-Action Execute Builders (rc1: no fees, plain min-ADA destination outputs)
    // ─────────────────────────────────────────────────────────────────────────────
    /**
     * Mint: reserve goes to treasury, USDr minted to destinations.
     */
  }, {
    key: "buildMintExecute",
    value: function buildMintExecute(tx, orderInfos, stablecoinAssetId, treasuryUtxo, parsedTreasuryDatum, settings) {
      var totalAmount = orderInfos.reduce(function (sum, o) {
        return sum + o.amount;
      }, 0n);

      // Destination outputs: send USDr to each destination
      var _iterator6 = _createForOfIteratorHelper(orderInfos),
        _step6;
      try {
        for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
          var orderInfo = _step6.value;
          var destAddress = (0, _index2.destinationToAddress)(this.network, orderInfo.datum.destination);
          (0, _index2.addDirectOutput)(tx, destAddress, (0, _sdk.makeValue)(_family.MIN_LOVELACE, [stablecoinAssetId, orderInfo.amount]));
        }

        // Mint USDr
      } catch (err) {
        _iterator6.e(err);
      } finally {
        _iterator6.f();
      }
      tx.addMint(this.stablecoinPolicyId, new Map([[_sdk.Core.AssetName(this.assetNameHex), totalAmount]]), Data.Void());

      // Compute per-reserve-asset deltas
      var reserveDeltas = (0, _index2.computeReserveDeltas)(orderInfos, settings);
      this.updateTreasuryOutput(tx, treasuryUtxo, parsedTreasuryDatum, reserveDeltas, totalAmount);
    }

    /**
     * Burn: USDr burned, reserve sent to destinations.
     */
  }, {
    key: "buildBurnExecute",
    value: function buildBurnExecute(tx, orderInfos, stablecoinAssetId, treasuryUtxo, parsedTreasuryDatum, settings) {
      var totalAmount = orderInfos.reduce(function (sum, o) {
        return sum + o.amount;
      }, 0n);

      // Destination outputs: send reserve tokens to each destination
      var _iterator7 = _createForOfIteratorHelper(orderInfos),
        _step7;
      try {
        for (_iterator7.s(); !(_step7 = _iterator7.n()).done;) {
          var orderInfo = _step7.value;
          var destAddress = (0, _index2.destinationToAddress)(this.network, orderInfo.datum.destination);
          var ra = (0, _index2.findReserveAsset)(settings, orderInfo.reserveAsset);
          var reserveAssetId = _sdk.Core.AssetId(orderInfo.reserveAsset[0] + orderInfo.reserveAsset[1]);
          var reserveAmount = (0, _index2.usdrToReserve)(-orderInfo.amount, ra);
          (0, _index2.addDirectOutput)(tx, destAddress, (0, _sdk.makeValue)(_family.MIN_LOVELACE, [reserveAssetId, reserveAmount]));
        }

        // Burn USDr (totalAmount is negative)
      } catch (err) {
        _iterator7.e(err);
      } finally {
        _iterator7.f();
      }
      tx.addMint(this.stablecoinPolicyId, new Map([[_sdk.Core.AssetName(this.assetNameHex), totalAmount]]), Data.Void());

      // Compute per-reserve-asset deltas
      var reserveDeltas = (0, _index2.computeReserveDeltas)(orderInfos, settings);
      this.updateTreasuryOutput(tx, treasuryUtxo, parsedTreasuryDatum, reserveDeltas, totalAmount);
    }

    /**
     * Withdraw: reserve sent to destinations, no mint/burn.
     */
  }, {
    key: "buildWithdrawExecute",
    value: function buildWithdrawExecute(tx, orderInfos, treasuryUtxo, parsedTreasuryDatum, settings) {
      // Destination outputs: send reserve tokens to each destination
      var _iterator8 = _createForOfIteratorHelper(orderInfos),
        _step8;
      try {
        for (_iterator8.s(); !(_step8 = _iterator8.n()).done;) {
          var orderInfo = _step8.value;
          var destAddress = (0, _index2.destinationToAddress)(this.network, orderInfo.datum.destination);
          var ra = (0, _index2.findReserveAsset)(settings, orderInfo.reserveAsset);
          var reserveAssetId = _sdk.Core.AssetId(orderInfo.reserveAsset[0] + orderInfo.reserveAsset[1]);
          var reserveAmount = (0, _index2.usdrToReserve)(orderInfo.amount, ra);
          (0, _index2.addDirectOutput)(tx, destAddress, (0, _sdk.makeValue)(_family.MIN_LOVELACE, [reserveAssetId, reserveAmount]));
        }

        // Update treasury: reserve decreases, no circulating_supply change
      } catch (err) {
        _iterator8.e(err);
      } finally {
        _iterator8.f();
      }
      var reserveDeltas = (0, _index2.computeReserveDeltas)(orderInfos, settings, true);
      this.updateTreasuryOutput(tx, treasuryUtxo, parsedTreasuryDatum, reserveDeltas, 0n);
    }

    /**
     * Deposit: reserve deposited, interest USDr minted and split between vault and yield pot.
     */
  }, {
    key: "buildDepositExecute",
    value: function buildDepositExecute(tx, orderInfos, stablecoinAssetId, treasuryUtxo, parsedTreasuryDatum, vaultUtxo, parsedVaultDatum, settings) {
      var _vaultValue$multiasse3, _vaultValue$multiasse4;
      var totalYield = orderInfos.reduce(function (sum, o) {
        var _o$yield2;
        return sum + ((_o$yield2 = o["yield"]) !== null && _o$yield2 !== void 0 ? _o$yield2 : 0n);
      }, 0n);

      // Destination outputs: min ADA to each destination
      var _iterator9 = _createForOfIteratorHelper(orderInfos),
        _step9;
      try {
        for (_iterator9.s(); !(_step9 = _iterator9.n()).done;) {
          var orderInfo = _step9.value;
          var destAddress = (0, _index2.destinationToAddress)(this.network, orderInfo.datum.destination);
          (0, _index2.addDirectOutput)(tx, destAddress, (0, _sdk.makeValue)(_family.MIN_LOVELACE));
        }

        // Calculate yield split
      } catch (err) {
        _iterator9.e(err);
      } finally {
        _iterator9.f();
      }
      var vaultValue = vaultUtxo.output().amount();
      var vaultUSDr = (_vaultValue$multiasse3 = (_vaultValue$multiasse4 = vaultValue.multiasset()) === null || _vaultValue$multiasse4 === void 0 ? void 0 : _vaultValue$multiasse4.get(stablecoinAssetId)) !== null && _vaultValue$multiasse3 !== void 0 ? _vaultValue$multiasse3 : 0n;
      var treasuryCirculating = parsedTreasuryDatum.circulating_supply;
      var _calculateYieldShares2 = (0, _family.calculateYieldShares)(totalYield, vaultUSDr, treasuryCirculating),
        stakedYieldShare = _calculateYieldShares2.stakedYieldShare,
        unstakedYieldShare = _calculateYieldShares2.unstakedYieldShare;
      if (totalYield > 0n) {
        tx.addMint(this.stablecoinPolicyId, new Map([[_sdk.Core.AssetName(this.assetNameHex), totalYield]]), Data.Void());
        if (unstakedYieldShare > 0n) {
          var yieldPotAddress = (0, _index2.destinationToAddress)(this.network, {
            address: settings.unstaked_yield_pot,
            datum: "NoDatum"
          });
          (0, _index2.addDirectOutput)(tx, yieldPotAddress, (0, _sdk.makeValue)(_family.MIN_LOVELACE, [stablecoinAssetId, unstakedYieldShare]));
        }
      } else if (totalYield < 0n) {
        tx.addMint(this.stablecoinPolicyId, new Map([[_sdk.Core.AssetName(this.assetNameHex), totalYield]]), Data.Void());
      }

      // Update treasury
      var reserveDeltas = new Map();
      var _iterator0 = _createForOfIteratorHelper(orderInfos),
        _step0;
      try {
        for (_iterator0.s(); !(_step0 = _iterator0.n()).done;) {
          var _orderInfo2$yield, _reserveDeltas$get;
          var _orderInfo2 = _step0.value;
          var assetId = _orderInfo2.reserveAsset[0] + _orderInfo2.reserveAsset[1];
          var ra = (0, _index2.findReserveAsset)(settings, _orderInfo2.reserveAsset);
          var yieldValue = (_orderInfo2$yield = _orderInfo2["yield"]) !== null && _orderInfo2$yield !== void 0 ? _orderInfo2$yield : 0n;
          var usdrBacking = yieldValue >= 0n ? _orderInfo2.amount + yieldValue : _orderInfo2.amount;
          var reserveAmount = (0, _index2.usdrToReserve)(usdrBacking, ra);
          reserveDeltas.set(assetId, ((_reserveDeltas$get = reserveDeltas.get(assetId)) !== null && _reserveDeltas$get !== void 0 ? _reserveDeltas$get : 0n) + reserveAmount);
        }
      } catch (err) {
        _iterator0.e(err);
      } finally {
        _iterator0.f();
      }
      this.updateTreasuryOutput(tx, treasuryUtxo, parsedTreasuryDatum, reserveDeltas, totalYield);

      // Update vault
      this.updateVaultOutput(tx, vaultUtxo, parsedVaultDatum, 0n, stakedYieldShare);
    }

    /**
     * Stake: USDr locked in vault, sUSDr minted to destinations.
     */
  }, {
    key: "buildStakeExecute",
    value: function buildStakeExecute(tx, orderInfos, stablecoinAssetId, sUSDrAssetId, vaultUtxo, parsedVaultDatum) {
      var _vaultValue$multiasse5, _vaultValue$multiasse6;
      var totalUSDrStaked = orderInfos.reduce(function (sum, o) {
        return sum + o.amount;
      }, 0n);
      var vaultValue = vaultUtxo.output().amount();
      var vaultUSDr = (_vaultValue$multiasse5 = (_vaultValue$multiasse6 = vaultValue.multiasset()) === null || _vaultValue$multiasse6 === void 0 ? void 0 : _vaultValue$multiasse6.get(stablecoinAssetId)) !== null && _vaultValue$multiasse5 !== void 0 ? _vaultValue$multiasse5 : 0n;
      var circulatingSUSDr = parsedVaultDatum.circulating_susdr;
      var totalSUSDrMinted;
      if (circulatingSUSDr === 0n || vaultUSDr === 0n) {
        totalSUSDrMinted = totalUSDrStaked;
      } else {
        totalSUSDrMinted = totalUSDrStaked * circulatingSUSDr / vaultUSDr;
      }
      var _iterator1 = _createForOfIteratorHelper(orderInfos),
        _step1;
      try {
        for (_iterator1.s(); !(_step1 = _iterator1.n()).done;) {
          var orderInfo = _step1.value;
          var sUSDrAmount = void 0;
          if (circulatingSUSDr === 0n || vaultUSDr === 0n) {
            sUSDrAmount = orderInfo.amount;
          } else {
            sUSDrAmount = orderInfo.amount * circulatingSUSDr / vaultUSDr;
          }
          var destAddress = (0, _index2.destinationToAddress)(this.network, orderInfo.datum.destination);
          (0, _index2.addDirectOutput)(tx, destAddress, (0, _sdk.makeValue)(_family.MIN_LOVELACE, [sUSDrAssetId, sUSDrAmount]));
        }
      } catch (err) {
        _iterator1.e(err);
      } finally {
        _iterator1.f();
      }
      tx.addMint(this.stablecoinPolicyId, new Map([[_sdk.Core.AssetName(this.sUSDrAssetNameHex), totalSUSDrMinted]]), Data.Void());
      this.updateVaultOutput(tx, vaultUtxo, parsedVaultDatum, totalSUSDrMinted, totalUSDrStaked);
    }

    /**
     * Unstake: sUSDr burned, USDr sent to user's destination address.
     * V1_0Rc1: Supports forfeit parameter - forfeited USDr goes to yield pot.
     */
  }, {
    key: "buildUnstakeExecute",
    value: function buildUnstakeExecute(tx, orderInfos, stablecoinAssetId, sUSDrAssetId, vaultUtxo, parsedVaultDatum, settings) {
      var _vaultValue$multiasse7, _vaultValue$multiasse8;
      var totalSUSDrBurned = orderInfos.reduce(function (sum, o) {
        return sum + o.amount;
      }, 0n);
      var vaultValue = vaultUtxo.output().amount();
      var vaultUSDr = (_vaultValue$multiasse7 = (_vaultValue$multiasse8 = vaultValue.multiasset()) === null || _vaultValue$multiasse8 === void 0 ? void 0 : _vaultValue$multiasse8.get(stablecoinAssetId)) !== null && _vaultValue$multiasse7 !== void 0 ? _vaultValue$multiasse7 : 0n;
      var circulatingSUSDr = parsedVaultDatum.circulating_susdr;
      if (circulatingSUSDr === 0n) {
        throw new Error("Cannot unstake: no sUSDr in circulation");
      }
      var totalUSDrReleased = 0n;
      var totalForfeit = 0n;
      var _iterator10 = _createForOfIteratorHelper(orderInfos),
        _step10;
      try {
        for (_iterator10.s(); !(_step10 = _iterator10.n()).done;) {
          var _orderInfo$forfeit;
          var orderInfo = _step10.value;
          var uSDrEntitled = orderInfo.amount * vaultUSDr / circulatingSUSDr;
          var forfeit = (_orderInfo$forfeit = orderInfo.forfeit) !== null && _orderInfo$forfeit !== void 0 ? _orderInfo$forfeit : 0n;
          var uSDrAmount = uSDrEntitled - forfeit;
          totalUSDrReleased += uSDrEntitled;
          totalForfeit += forfeit;
          var destAddress = (0, _index2.destinationToAddress)(this.network, orderInfo.datum.destination);
          var output = new _sdk.Core.TransactionOutput(destAddress, (0, _sdk.makeValue)(_family.MIN_LOVELACE, [stablecoinAssetId, uSDrAmount]));
          tx.addOutput(output);
        }

        // Send forfeited USDr to yield pot if any
      } catch (err) {
        _iterator10.e(err);
      } finally {
        _iterator10.f();
      }
      if (totalForfeit > 0n) {
        var yieldPotAddress = (0, _index2.destinationToAddress)(this.network, {
          address: settings.unstaked_yield_pot,
          datum: "NoDatum"
        });
        (0, _index2.addDirectOutput)(tx, yieldPotAddress, (0, _sdk.makeValue)(_family.MIN_LOVELACE, [stablecoinAssetId, totalForfeit]));
      }
      tx.addMint(this.stablecoinPolicyId, new Map([[_sdk.Core.AssetName(this.sUSDrAssetNameHex), -totalSUSDrBurned]]), Data.Void());
      this.updateVaultOutput(tx, vaultUtxo, parsedVaultDatum, -totalSUSDrBurned, -totalUSDrReleased);
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
      var _iterator11 = _createForOfIteratorHelper(orderInfos),
        _step11;
      try {
        for (_iterator11.s(); !(_step11 = _iterator11.n()).done;) {
          var orderInfo = _step11.value;
          var destAddress = (0, _index2.destinationToAddress)(this.network, orderInfo.datum.destination);
          (0, _index2.addDirectOutput)(tx, destAddress, (0, _sdk.makeValue)(_family.MIN_LOVELACE, [stablecoinAssetId, orderInfo.amount]));
        }

        // Mint USDr
      } catch (err) {
        _iterator11.e(err);
      } finally {
        _iterator11.f();
      }
      tx.addMint(this.stablecoinPolicyId, new Map([[_sdk.Core.AssetName(this.assetNameHex), totalAmount]]), Data.Void());

      // Update treasury: circulating_supply increases, NO reserve changes
      this.updateTreasuryOutputNoReserve(tx, treasuryUtxo, parsedTreasuryDatum, totalAmount);
    }

    /**
     * DirectBurn: Burn USDr without reserve asset flow.
     * USDr is burned, treasury circulating_supply decreases.
     * NO reserve asset changes, NO destination outputs (fiat sent off-chain).
     *
     * The `_stablecoinAssetId` parameter exists only to keep the override
     * signature compatible with the family's; rc1's direct-burn output is
     * min-ADA only and does not touch the stablecoin asset.
     */
  }, {
    key: "buildDirectBurnExecute",
    value: function buildDirectBurnExecute(tx, orderInfos, _stablecoinAssetId, treasuryUtxo, parsedTreasuryDatum) {
      // totalAmount is negative for burns (from classifyOrderAction)
      var totalAmount = orderInfos.reduce(function (sum, o) {
        return sum + o.amount;
      }, 0n);

      // CRITICAL: No destination outputs for DirectBurn
      // USDr is burned, fiat is sent off-chain. Nothing goes to user on-chain.
      // We just need to return min ADA to the destination (contract may require this)
      var _iterator12 = _createForOfIteratorHelper(orderInfos),
        _step12;
      try {
        for (_iterator12.s(); !(_step12 = _iterator12.n()).done;) {
          var orderInfo = _step12.value;
          var destAddress = (0, _index2.destinationToAddress)(this.network, orderInfo.datum.destination);
          (0, _index2.addDirectOutput)(tx, destAddress, (0, _sdk.makeValue)(_family.MIN_LOVELACE));
        }

        // Burn USDr (totalAmount is negative)
      } catch (err) {
        _iterator12.e(err);
      } finally {
        _iterator12.f();
      }
      tx.addMint(this.stablecoinPolicyId, new Map([[_sdk.Core.AssetName(this.assetNameHex), totalAmount]]), Data.Void());

      // Update treasury: circulating_supply decreases, NO reserve changes
      this.updateTreasuryOutputNoReserve(tx, treasuryUtxo, parsedTreasuryDatum, totalAmount);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Protected Helpers
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Classify an order action from its datum (rc1 actions carry no min_received).
     */
  }, {
    key: "classifyOrderAction",
    value: function classifyOrderAction(datum) {
      var action = datum.action;
      if ("OMint" in action) {
        return {
          actionType: "mint",
          amount: action.OMint.amount,
          reserveAsset: action.OMint.reserve_asset,
          isTreasuryAction: true
        };
      } else if ("ORedeem" in action) {
        return {
          actionType: "burn",
          amount: -action.ORedeem.amount,
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
          isTreasuryAction: false
        };
      } else if ("OUnstake" in action) {
        return {
          actionType: "unstake",
          amount: action.OUnstake.amount,
          forfeit: action.OUnstake.forfeit,
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
  }], [{
    key: "create",
    value:
    /**
     * Create a V1_0Rc1 SDK instance.
     */
    function create(blaze, params) {
      var _params$enableTrace, _params$referenceInpu, _params$referenceInpu2, _params$referenceInpu3, _params$referenceInpu4, _params$referenceInpu5;
      var enableTrace = (_params$enableTrace = params.enableTrace) !== null && _params$enableTrace !== void 0 ? _params$enableTrace : false;

      // 1. Create oneshot script
      var oneShotScript = new _index.BaseTypes.BaseOneshotOneshotMint({
        transaction_id: params.proxyBootstrap.txHash,
        output_index: params.proxyBootstrap.outputIndex
      }, enableTrace).Script;
      var oneShotPolicyId = oneShotScript.hash();

      // 2. Create sub-validator scripts first (they only need proxy policy)
      var protocolMintScript = new _index.V1_0Rc1Types.V1_0Rc1ProtocolMintProtocolMintWithdraw(oneShotPolicyId, enableTrace).Script;
      var protocolStakeScript = new _index.V1_0Rc1Types.V1_0Rc1ProtocolStakeProtocolStakeWithdraw(oneShotPolicyId, enableTrace).Script;
      var protocolManagementScript = new _index.V1_0Rc1Types.V1_0Rc1ProtocolManagementProtocolManagementWithdraw(oneShotPolicyId, enableTrace).Script;

      // 3. Create orchestrator with sub-validator hashes
      var protocolOrchestratorScript = new _index.V1_0Rc1Types.V1_0Rc1ProtocolOrchestratorProtocolOrchestratorWithdraw(oneShotPolicyId, protocolMintScript.hash(), protocolStakeScript.hash(), protocolManagementScript.hash(), enableTrace).Script;
      var mintProxyScript = new _index.BaseTypes.BaseMintProxyMintProxyMint(oneShotPolicyId, enableTrace).Script;

      // Use V0.1 or V1.0 treasury script based on option
      // V0.1 is needed for protocol-only upgrades where treasury stays at V0.1 address
      var treasuryScript = params.useV0_1Treasury ? new _index.V0_1Types.V0_1TreasuryTreasurySpend({
        transaction_id: params.treasuryBootstrap.txHash,
        output_index: params.treasuryBootstrap.outputIndex
      }, oneShotPolicyId, enableTrace).Script : new _index.V1_0Rc1Types.V1_0Rc1TreasuryTreasurySpend({
        transaction_id: params.treasuryBootstrap.txHash,
        output_index: params.treasuryBootstrap.outputIndex
      }, oneShotPolicyId, enableTrace).Script;

      // 4. Create order script with orchestrator hash (order needs to know the protocol)
      var orderScript = new _index.V1_0Rc1Types.V1_0Rc1OrderOrderSpend(oneShotPolicyId, protocolOrchestratorScript.hash(), enableTrace).Script;

      // Use V0.4 or V1.0 staking vault script based on option
      // V0.4 is needed for protocol-only upgrades where vault stays at V0.4 address
      var stakingVaultScript = params.useV0_4StakingVault ? new _index.V0_4Types.V0_4StakingVaultStakingVaultSpend({
        transaction_id: params.stakingVaultBootstrap.txHash,
        output_index: params.stakingVaultBootstrap.outputIndex
      }, oneShotPolicyId, enableTrace).Script : new _index.V1_0Rc1Types.V1_0Rc1StakingVaultStakingVaultSpend({
        transaction_id: params.stakingVaultBootstrap.txHash,
        output_index: params.stakingVaultBootstrap.outputIndex
      }, oneShotPolicyId, enableTrace).Script;
      return new RealfiSDKV1_0Rc1(blaze, {
        version: "V1_0_Rc1",
        proxyBootstrap: params.proxyBootstrap,
        assetNameHex: params.assetNameHex,
        sUSDrAssetNameHex: params.sUSDrAssetNameHex,
        enableTrace: enableTrace,
        scriptDeploymentAddress: params.scriptDeploymentAddress,
        clientSource: params.clientSource,
        deployedValidators: params.deployedValidators
      }, _index.V1_0Rc1Types, {
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
      });
    }
  }]);
}(_family.RealfiSDKV1Family);
//# sourceMappingURL=index.js.map