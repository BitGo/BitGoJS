"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RealfiSDKV0_4 = void 0;
var _core = require("@blaze-cardano/core");
var _data = _interopRequireWildcard(require("@blaze-cardano/data"));
var Data = _data;
var _sdk = require("@blaze-cardano/sdk");
var _index = require("../../generated-types/index.js");
var _index2 = require("../../generated-types/v0_1/index.js");
var _index3 = require("../shared/index.js");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t7 in e) "default" !== _t7 && {}.hasOwnProperty.call(e, _t7) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t7)) && (i.get || i.set) ? o(f, _t7, i) : f[_t7] = e[_t7]); return f; })(e, t); }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
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
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parsed order information extracted from a UTXO.
 */

var MIN_LOVELACE = 2000000n;

/**
 * Floor division for BigInt (rounds toward negative infinity).
 * JavaScript BigInt `/` truncates toward zero, but Aiken (Plutus)
 * uses floor division. These differ for negative dividends.
 */
/**
 * Extract the requests list from a signed payload action, regardless of action type.
 * Both TreasuryRequest and Request have `origin: { transaction_id, output_index }`.
 */
function getRequestsFromAction(action) {
  if ("Mint" in action) return action.Mint.requests;
  if ("Burn" in action) return action.Burn.requests;
  if ("Withdraw" in action) return action.Withdraw.requests;
  if ("Deposit" in action) return action.Deposit.requests;
  if ("Stake" in action) return action.Stake.requests;
  if ("Unstake" in action) return action.Unstake.requests;
  throw new Error("Unknown action type in signed payload");
}
function floorDiv(a, b) {
  var q = a / b;
  // Adjust if signs differ and there's a remainder
  if ((a ^ b) < 0n && q * b !== a) {
    return q - 1n;
  }
  return q;
}

/**
 * Calculate yield split between staked and unstaked portions.
 * Matches on-chain deposit.ak logic: staked_yield_share = total_yield * vault_usdr / treasury_circulating
 */
function calculateYieldShares(totalYield, vaultUSDr, treasuryCirculating) {
  var stakedYieldShare = treasuryCirculating > 0n ? floorDiv(totalYield * vaultUSDr, treasuryCirculating) : 0n;
  var unstakedYieldShare = totalYield - stakedYieldShare;
  return {
    stakedYieldShare: stakedYieldShare,
    unstakedYieldShare: unstakedYieldShare
  };
}
function toSpendOrderingKey(input) {
  return "".concat(input.transactionId().toString()).concat(input.index().toString());
}

// eslint-disable-next-line @typescript-eslint/naming-convention
// ─────────────────────────────────────────────────────────────────────────────
// SDK Class
// ─────────────────────────────────────────────────────────────────────────────
/**
 * V0_4 SDK implementation.
 *
 * Extends the protocol with staking (USDr->sUSDr), unstaking (sUSDr->USDr),
 * multi-reserve assets, deposit with interest splitting, and index-based optimization.
 * All order types (mint, burn, deposit, withdraw, stake, unstake) are request-based.
 */
var RealfiSDKV0_4 = exports.RealfiSDKV0_4 = /*#__PURE__*/function (_RealfiSDKBase) {
  function RealfiSDKV0_4(blaze, params, scripts, cachedReferenceInputs) {
    var _this;
    _classCallCheck(this, RealfiSDKV0_4);
    _this = _callSuper(this, RealfiSDKV0_4, [blaze, {
      version: "V0_4",
      proxyBootstrap: params.proxyBootstrap,
      assetNameHex: params.assetNameHex,
      enableTrace: params.enableTrace,
      scriptDeploymentAddress: params.scriptDeploymentAddress,
      clientSource: params.clientSource
    }, cachedReferenceInputs]);
    _defineProperty(_this, "version", "V0_4");
    // Script hashes and policy IDs
    _defineProperty(_this, "stablecoinPolicyId", void 0);
    _defineProperty(_this, "oneShotPolicyId", void 0);
    _defineProperty(_this, "protocolScriptHash", void 0);
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
    _defineProperty(_this, "mintProxyScript", void 0);
    _defineProperty(_this, "treasuryScript", void 0);
    _defineProperty(_this, "orderScript", void 0);
    _defineProperty(_this, "stakingVaultScript", void 0);
    _this.sUSDrAssetNameHex = params.sUSDrAssetNameHex;
    _this.oneShotScript = scripts.oneShotScript;
    _this.protocolScript = scripts.protocolScript;
    _this.mintProxyScript = scripts.mintProxyScript;
    _this.treasuryScript = scripts.treasuryScript;
    _this.orderScript = scripts.orderScript;
    _this.stakingVaultScript = scripts.stakingVaultScript;
    _this.oneShotPolicyId = _sdk.Core.PolicyId(_this.oneShotScript.hash());
    _this.protocolScriptHash = _this.protocolScript.hash();
    _this.stablecoinPolicyId = _sdk.Core.PolicyId(_this.mintProxyScript.hash());
    _this.treasuryScriptHash = _this.treasuryScript.hash();
    _this.orderScriptHash = _this.orderScript.hash();
    _this.stakingVaultScriptHash = _this.stakingVaultScript.hash();
    _this.treasuryAddress = (0, _core.addressFromValidator)(_this.network, _this.treasuryScript);
    _this.orderScriptAddress = (0, _core.addressFromValidator)(_this.network, _this.orderScript);
    _this.stakingVaultAddress = (0, _core.addressFromValidator)(_this.network, _this.stakingVaultScript);

    // Treasury NFT: policy = treasury script hash, name = "treasury"
    var treasuryAssetName = _sdk.Core.AssetName((0, _core.toHex)(Buffer.from("treasury")));
    _this.treasuryNFTAssetId = _sdk.Core.AssetId(_this.treasuryScriptHash + treasuryAssetName.toString());

    // Staking vault NFT: policy = staking vault script hash, name = "staking_vault"
    var vaultAssetName = _sdk.Core.AssetName((0, _core.toHex)(Buffer.from("staking_vault")));
    _this.stakingVaultNFTAssetId = _sdk.Core.AssetId(_this.stakingVaultScriptHash + vaultAssetName.toString());
    return _this;
  }

  /**
   * Create a V0_4 SDK instance.
   */
  _inherits(RealfiSDKV0_4, _RealfiSDKBase);
  return _createClass(RealfiSDKV0_4, [{
    key: "mintTreasuryNFT",
    value: // ─────────────────────────────────────────────────────────────────────────────
    // Treasury Operations
    // ─────────────────────────────────────────────────────────────────────────────
    /**
     * Mint the treasury NFT.
     */
    function () {
      var _mintTreasuryNFT = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(treasuryBootstrapUtxo) {
        var initialDatum,
          treasuryPolicyId,
          treasuryAssetName,
          datum,
          tx,
          _args = arguments;
        return _regenerator().w(function (_context) {
          while (1) switch (_context.n) {
            case 0:
              initialDatum = _args.length > 1 && _args[1] !== undefined ? _args[1] : {
                circulating_supply: 0n
              };
              treasuryPolicyId = _sdk.Core.PolicyId(this.treasuryScriptHash);
              treasuryAssetName = _sdk.Core.AssetName((0, _core.toHex)(Buffer.from("treasury")));
              datum = Data.serialize(_index2.TreasuryDatum, initialDatum);
              _context.n = 1;
              return this.blaze.newTransaction().addInput(treasuryBootstrapUtxo).addMint(treasuryPolicyId, new Map([[treasuryAssetName, 1n]]), Data.Void()).lockAssets(this.treasuryAddress, (0, _sdk.makeValue)(10000000n, [this.treasuryNFTAssetId, 1n]), datum).provideScript(this.treasuryScript);
            case 1:
              tx = _context.v;
              return _context.a(2, {
                tx: tx,
                nftAssetId: this.treasuryNFTAssetId
              });
          }
        }, _callee, this);
      }));
      function mintTreasuryNFT(_x) {
        return _mintTreasuryNFT.apply(this, arguments);
      }
      return mintTreasuryNFT;
    }()
  }, {
    key: "deployTreasury",
    value: function () {
      var _deployTreasury = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2() {
        return _regenerator().w(function (_context2) {
          while (1) switch (_context2.n) {
            case 0:
              return _context2.a(2, (0, _index3.deployScript)(this.blaze, this.treasuryScript, this.scriptDeploymentAddress));
          }
        }, _callee2, this);
      }));
      function deployTreasury() {
        return _deployTreasury.apply(this, arguments);
      }
      return deployTreasury;
    }()
  }, {
    key: "deployOrderContract",
    value: function () {
      var _deployOrderContract = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3() {
        return _regenerator().w(function (_context3) {
          while (1) switch (_context3.n) {
            case 0:
              return _context3.a(2, (0, _index3.deployScript)(this.blaze, this.orderScript, this.scriptDeploymentAddress));
          }
        }, _callee3, this);
      }));
      function deployOrderContract() {
        return _deployOrderContract.apply(this, arguments);
      }
      return deployOrderContract;
    }()
  }, {
    key: "getTreasuryDatum",
    value: function () {
      var _getTreasuryDatum = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4() {
        var _yield$getDatumFromNF, treasuryUtxo, treasuryDatum, parsedTreasuryDatum;
        return _regenerator().w(function (_context4) {
          while (1) switch (_context4.n) {
            case 0:
              _context4.n = 1;
              return (0, _index3.getDatumFromNFT)(this.blaze, this.treasuryNFTAssetId, _index2.TreasuryDatum);
            case 1:
              _yield$getDatumFromNF = _context4.v;
              treasuryUtxo = _yield$getDatumFromNF.utxo;
              treasuryDatum = _yield$getDatumFromNF.datum;
              parsedTreasuryDatum = _yield$getDatumFromNF.parsedDatum;
              if (treasuryUtxo) {
                _context4.n = 2;
                break;
              }
              throw new Error("No UTXO found with the treasury NFT");
            case 2:
              if (treasuryDatum) {
                _context4.n = 3;
                break;
              }
              throw new Error("No treasury datum found");
            case 3:
              return _context4.a(2, {
                treasuryUtxo: treasuryUtxo,
                treasuryDatum: treasuryDatum,
                parsedTreasuryDatum: parsedTreasuryDatum
              });
          }
        }, _callee4, this);
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
      var _mintStakingVaultNFT = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee5(stakingVaultBootstrapUtxo) {
        var initialDatum,
          vaultPolicyId,
          vaultAssetName,
          datum,
          tx,
          _args5 = arguments;
        return _regenerator().w(function (_context5) {
          while (1) switch (_context5.n) {
            case 0:
              initialDatum = _args5.length > 1 && _args5[1] !== undefined ? _args5[1] : {
                circulating_susdr: 0n
              };
              vaultPolicyId = _sdk.Core.PolicyId(this.stakingVaultScriptHash);
              vaultAssetName = _sdk.Core.AssetName((0, _core.toHex)(Buffer.from("staking_vault")));
              datum = Data.serialize(_index.V0_4Types.VaultDatum, initialDatum);
              _context5.n = 1;
              return this.blaze.newTransaction().addInput(stakingVaultBootstrapUtxo).addMint(vaultPolicyId, new Map([[vaultAssetName, 1n]]), Data.Void()).lockAssets(this.stakingVaultAddress, (0, _sdk.makeValue)(10000000n, [this.stakingVaultNFTAssetId, 1n]), datum).provideScript(this.stakingVaultScript);
            case 1:
              tx = _context5.v;
              return _context5.a(2, {
                tx: tx,
                nftAssetId: this.stakingVaultNFTAssetId
              });
          }
        }, _callee5, this);
      }));
      function mintStakingVaultNFT(_x2) {
        return _mintStakingVaultNFT.apply(this, arguments);
      }
      return mintStakingVaultNFT;
    }()
  }, {
    key: "deployStakingVault",
    value: function () {
      var _deployStakingVault = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee6() {
        return _regenerator().w(function (_context6) {
          while (1) switch (_context6.n) {
            case 0:
              return _context6.a(2, (0, _index3.deployScript)(this.blaze, this.stakingVaultScript, this.scriptDeploymentAddress));
          }
        }, _callee6, this);
      }));
      function deployStakingVault() {
        return _deployStakingVault.apply(this, arguments);
      }
      return deployStakingVault;
    }() /** The sUSDr asset ID (stablecoin policy + staked-USDr asset name). */
  }, {
    key: "getSusdrAssetId",
    value: function getSusdrAssetId() {
      return _sdk.Core.AssetId(this.stablecoinPolicyId + this.sUSDrAssetNameHex);
    }
  }, {
    key: "getVaultDatum",
    value: function () {
      var _getVaultDatum = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee7() {
        var _yield$getDatumFromNF2, vaultUtxo, vaultDatum, parsedVaultDatum;
        return _regenerator().w(function (_context7) {
          while (1) switch (_context7.n) {
            case 0:
              _context7.n = 1;
              return (0, _index3.getDatumFromNFT)(this.blaze, this.stakingVaultNFTAssetId, _index.V0_4Types.VaultDatum);
            case 1:
              _yield$getDatumFromNF2 = _context7.v;
              vaultUtxo = _yield$getDatumFromNF2.utxo;
              vaultDatum = _yield$getDatumFromNF2.datum;
              parsedVaultDatum = _yield$getDatumFromNF2.parsedDatum;
              if (vaultUtxo) {
                _context7.n = 2;
                break;
              }
              throw new Error("No UTXO found with the staking vault NFT");
            case 2:
              if (vaultDatum) {
                _context7.n = 3;
                break;
              }
              throw new Error("No vault datum found");
            case 3:
              return _context7.a(2, {
                vaultUtxo: vaultUtxo,
                vaultDatum: vaultDatum,
                parsedVaultDatum: parsedVaultDatum
              });
          }
        }, _callee7, this);
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
      var _mintOneShot = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee8(receiverAddress, datum) {
        var utxo, serializedDatum, baseTx, tx;
        return _regenerator().w(function (_context8) {
          while (1) switch (_context8.n) {
            case 0:
              _context8.n = 1;
              return this.resolveBootstrapUtxo();
            case 1:
              utxo = _context8.v;
              serializedDatum = Data.serialize(_index.V0_4Types.ProxyDatum, {
                logic: datum.logic,
                settings: datum.settings
              });
              baseTx = this.blaze.newTransaction().addInput(utxo).addMint(this.oneShotPolicyId, new Map([[_sdk.Core.AssetName(""), 1n]]), Data.Void());
              tx = (0, _index3.lockOrPayAssets)(baseTx, receiverAddress, (0, _sdk.makeValue)(10000000n, [this.oneShotPolicyId, 1n]), serializedDatum).provideScript(this.oneShotScript);
              return _context8.a(2, {
                tx: tx,
                policyId: this.oneShotPolicyId
              });
          }
        }, _callee8, this);
      }));
      function mintOneShot(_x3, _x4) {
        return _mintOneShot.apply(this, arguments);
      }
      return mintOneShot;
    }()
  }, {
    key: "updateOneShotDatum",
    value: function () {
      var _updateOneShotDatum = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee9(receiverAddress, newDatum) {
        var oneshotUtxo, serializedDatum;
        return _regenerator().w(function (_context9) {
          while (1) switch (_context9.n) {
            case 0:
              _context9.n = 1;
              return this.blaze.provider.getUnspentOutputByNFT(_sdk.Core.AssetId(this.oneShotPolicyId));
            case 1:
              oneshotUtxo = _context9.v;
              if (oneshotUtxo) {
                _context9.n = 2;
                break;
              }
              throw new Error("No UTXO found with the one-shot NFT");
            case 2:
              serializedDatum = Data.serialize(_index.V0_4Types.ProxyDatum, {
                logic: newDatum.logic,
                settings: newDatum.settings
              });
              return _context9.a(2, (0, _index3.lockOrPayAssets)(this.blaze.newTransaction().addInput(oneshotUtxo), receiverAddress, (0, _sdk.makeValue)(10000000n, [this.oneShotPolicyId, 1n]), serializedDatum));
          }
        }, _callee9, this);
      }));
      function updateOneShotDatum(_x5, _x6) {
        return _updateOneShotDatum.apply(this, arguments);
      }
      return updateOneShotDatum;
    }()
  }, {
    key: "getParsedProxyDatum",
    value: function () {
      var _getParsedProxyDatum = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee0() {
        var _yield$this$getRawPro, proxyUtxo, proxyDatum, parsedProxyDatum, result;
        return _regenerator().w(function (_context0) {
          while (1) switch (_context0.n) {
            case 0:
              if (!this.cachedProxyDatumResult) {
                _context0.n = 1;
                break;
              }
              return _context0.a(2, this.cachedProxyDatumResult);
            case 1:
              _context0.n = 2;
              return this.getRawProxyDatum();
            case 2:
              _yield$this$getRawPro = _context0.v;
              proxyUtxo = _yield$this$getRawPro.proxyUtxo;
              proxyDatum = _yield$this$getRawPro.proxyDatum;
              parsedProxyDatum = (0, _data.parse)(_index.V0_4Types.ProxyDatum, proxyDatum);
              result = {
                proxyUtxo: proxyUtxo,
                proxyDatum: proxyDatum,
                parsedProxyDatum: parsedProxyDatum
              };
              this.cachedProxyDatumResult = result;
              return _context0.a(2, result);
          }
        }, _callee0, this);
      }));
      function getParsedProxyDatum() {
        return _getParsedProxyDatum.apply(this, arguments);
      }
      return getParsedProxyDatum;
    }() // ─────────────────────────────────────────────────────────────────────────────
    // Order Builder Methods (6 separate methods, shared _buildOrderTx helper)
    // ─────────────────────────────────────────────────────────────────────────────
    /**
     * Internal helper to build an order transaction.
     */
  }, {
    key: "_buildOrderTx",
    value: function () {
      var _buildOrderTx2 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee1(params) {
        var _params$data;
        var orderContractAddress, owner, _addressProps$delegat, _addressProps$delegat2, _addressProps$payment, addressProps, keyHash, orderDatum, serializedDatum, tx;
        return _regenerator().w(function (_context1) {
          while (1) switch (_context1.n) {
            case 0:
              orderContractAddress = (0, _core.addressFromValidator)(this.network, this.orderScript);
              owner = params.owner;
              if (owner) {
                _context1.n = 3;
                break;
              }
              _context1.n = 1;
              return this.blaze.wallet.getChangeAddress();
            case 1:
              addressProps = _context1.v.getProps();
              keyHash = (_addressProps$delegat = (_addressProps$delegat2 = addressProps.delegationPart) === null || _addressProps$delegat2 === void 0 ? void 0 : _addressProps$delegat2.hash) !== null && _addressProps$delegat !== void 0 ? _addressProps$delegat : (_addressProps$payment = addressProps.paymentPart) === null || _addressProps$payment === void 0 ? void 0 : _addressProps$payment.hash;
              if (keyHash) {
                _context1.n = 2;
                break;
              }
              throw new Error("Could not derive owner key hash from wallet address");
            case 2:
              owner = {
                Signature: {
                  key_hash: keyHash.toString()
                }
              };
            case 3:
              orderDatum = {
                action: params.action,
                owner: owner,
                destination: params.destination,
                data: (_params$data = params.data) !== null && _params$data !== void 0 ? _params$data : Data.Void()
              };
              serializedDatum = Data.serialize(_index.V0_4Types.OrderDatum, orderDatum);
              tx = this.newOrderTransaction(params.extraLabels);
              tx.lockAssets(orderContractAddress, params.valueToLock, serializedDatum);
              return _context1.a(2, tx);
          }
        }, _callee1, this);
      }));
      function _buildOrderTx(_x7) {
        return _buildOrderTx2.apply(this, arguments);
      }
      return _buildOrderTx;
    }()
    /**
     * Build a mint order: lock reserve tokens, request USDr minting.
     */
  }, {
    key: "buildMintOrderTx",
    value: (function () {
      var _buildMintOrderTx = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee10(params) {
        var reserveAssetId, settings, ra, reserveAmount;
        return _regenerator().w(function (_context10) {
          while (1) switch (_context10.n) {
            case 0:
              if (!(params.amount <= 0n)) {
                _context10.n = 1;
                break;
              }
              throw new Error("Mint amount must be positive");
            case 1:
              reserveAssetId = _sdk.Core.AssetId(params.reserveAsset[0] + params.reserveAsset[1]); // Convert USDr amount to reserve amount using ceiling division
              // to ensure enough reserve is locked for on-chain validation
              _context10.n = 2;
              return this.getVersionSettings();
            case 2:
              settings = _context10.v;
              ra = (0, _index3.findReserveAsset)(settings, params.reserveAsset);
              reserveAmount = (0, _index3.usdrToReserveCeil)(params.amount, ra);
              return _context10.a(2, this._buildOrderTx({
                action: {
                  OMint: {
                    amount: params.amount,
                    reserve_asset: params.reserveAsset
                  }
                },
                valueToLock: (0, _sdk.makeValue)(MIN_LOVELACE, [reserveAssetId, reserveAmount]),
                owner: params.owner,
                destination: params.destination,
                data: params.data
              }));
          }
        }, _callee10, this);
      }));
      function buildMintOrderTx(_x8) {
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
      var _buildRedeemOrderTx = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee11(params) {
        var settings, stablecoinAssetId;
        return _regenerator().w(function (_context11) {
          while (1) switch (_context11.n) {
            case 0:
              if (!(params.amount <= 0n)) {
                _context11.n = 1;
                break;
              }
              throw new Error("Redeem amount must be positive");
            case 1:
              _context11.n = 2;
              return this.getVersionSettings();
            case 2:
              settings = _context11.v;
              (0, _index3.findReserveAsset)(settings, params.reserveAsset);
              stablecoinAssetId = _sdk.Core.AssetId(this.stablecoinPolicyId + this.assetNameHex);
              return _context11.a(2, this._buildOrderTx({
                action: {
                  ORedeem: {
                    amount: params.amount,
                    reserve_asset: params.reserveAsset
                  }
                },
                valueToLock: (0, _sdk.makeValue)(MIN_LOVELACE, [stablecoinAssetId, params.amount]),
                owner: params.owner,
                destination: params.destination,
                data: params.data
              }));
          }
        }, _callee11, this);
      }));
      function buildRedeemOrderTx(_x9) {
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
      var _buildDepositOrderTx = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee12(params) {
        var settings, ra, reserveAssetId, valueToLock, totalUSDrBacking, reserveAmount, _vaultValue$multiasse, _vaultValue$multiasse2, principalReserve, stablecoinAssetId, _yield$this$getTreasu, parsedTreasuryDatum, vaultUtxo, vaultValue, vaultUSDr, treasuryCirculating, _calculateYieldShares, unstakedYieldShare;
        return _regenerator().w(function (_context12) {
          while (1) switch (_context12.n) {
            case 0:
              if (!(params.principal < 0n)) {
                _context12.n = 1;
                break;
              }
              throw new Error("Deposit principal must be non-negative");
            case 1:
              if (!(params.principal === 0n && params["yield"] === 0n)) {
                _context12.n = 2;
                break;
              }
              throw new Error("Deposit must have non-zero principal or yield");
            case 2:
              _context12.n = 3;
              return this.getVersionSettings();
            case 3:
              settings = _context12.v;
              ra = (0, _index3.findReserveAsset)(settings, params.reserveAsset);
              reserveAssetId = _sdk.Core.AssetId(params.reserveAsset[0] + params.reserveAsset[1]);
              if (!(params["yield"] >= 0n)) {
                _context12.n = 4;
                break;
              }
              // POSITIVE YIELD: need reserve backing for BOTH principal AND yield.
              // Contract validates: reserve_to_usdr(treasury_delta) >= principal + yield
              // So we must lock: usdrToReserveCeil(principal + yield) reserve tokens
              totalUSDrBacking = params.principal + params["yield"];
              if (totalUSDrBacking > 0n) {
                reserveAmount = (0, _index3.usdrToReserveCeil)(totalUSDrBacking, ra);
                valueToLock = (0, _sdk.makeValue)(MIN_LOVELACE, [reserveAssetId, reserveAmount]);
              } else {
                valueToLock = (0, _sdk.makeValue)(MIN_LOVELACE);
              }
              _context12.n = 7;
              break;
            case 4:
              // NEGATIVE YIELD: lock principal (in reserve) + unstaked yield share (in USDr).
              // The staked share comes from the vault (validated on-chain via vault USDr change).
              principalReserve = params.principal > 0n ? (0, _index3.usdrToReserveCeil)(params.principal, ra) : 0n;
              valueToLock = principalReserve > 0n ? (0, _sdk.makeValue)(MIN_LOVELACE, [reserveAssetId, principalReserve]) : (0, _sdk.makeValue)(MIN_LOVELACE);
              stablecoinAssetId = _sdk.Core.AssetId(this.stablecoinPolicyId + this.assetNameHex); // Fetch current state to calculate yield split
              _context12.n = 5;
              return this.getTreasuryDatum();
            case 5:
              _yield$this$getTreasu = _context12.v;
              parsedTreasuryDatum = _yield$this$getTreasu.parsedTreasuryDatum;
              _context12.n = 6;
              return this.getVaultDatum();
            case 6:
              vaultUtxo = _context12.v.vaultUtxo;
              vaultValue = vaultUtxo.output().amount();
              vaultUSDr = (_vaultValue$multiasse = (_vaultValue$multiasse2 = vaultValue.multiasset()) === null || _vaultValue$multiasse2 === void 0 ? void 0 : _vaultValue$multiasse2.get(stablecoinAssetId)) !== null && _vaultValue$multiasse !== void 0 ? _vaultValue$multiasse : 0n;
              treasuryCirculating = parsedTreasuryDatum.circulating_supply;
              _calculateYieldShares = calculateYieldShares(params["yield"], vaultUSDr, treasuryCirculating), unstakedYieldShare = _calculateYieldShares.unstakedYieldShare; // Lock only the unstaked portion (negated since unstakedYieldShare is negative)
              if (unstakedYieldShare < 0n) {
                valueToLock = _sdk.Value.merge(valueToLock, (0, _sdk.makeValue)(0n, [stablecoinAssetId, -unstakedYieldShare]));
              }
            case 7:
              return _context12.a(2, this._buildOrderTx({
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
        }, _callee12, this);
      }));
      function buildDepositOrderTx(_x0) {
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
      var _buildWithdrawOrderTx = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee13(params) {
        var settings;
        return _regenerator().w(function (_context13) {
          while (1) switch (_context13.n) {
            case 0:
              if (!(params.amount <= 0n)) {
                _context13.n = 1;
                break;
              }
              throw new Error("Withdraw amount must be positive");
            case 1:
              _context13.n = 2;
              return this.getVersionSettings();
            case 2:
              settings = _context13.v;
              (0, _index3.findReserveAsset)(settings, params.reserveAsset);
              return _context13.a(2, this._buildOrderTx({
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
        }, _callee13, this);
      }));
      function buildWithdrawOrderTx(_x1) {
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
      var _buildStakeOrderTx = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee14(params) {
        var stablecoinAssetId;
        return _regenerator().w(function (_context14) {
          while (1) switch (_context14.n) {
            case 0:
              if (!(params.amount <= 0n)) {
                _context14.n = 1;
                break;
              }
              throw new Error("Stake amount must be positive");
            case 1:
              stablecoinAssetId = _sdk.Core.AssetId(this.stablecoinPolicyId + this.assetNameHex);
              return _context14.a(2, this._buildOrderTx({
                action: {
                  OStake: {
                    amount: params.amount
                  }
                },
                valueToLock: (0, _sdk.makeValue)(MIN_LOVELACE, [stablecoinAssetId, params.amount]),
                owner: params.owner,
                destination: params.destination,
                data: params.data
              }));
          }
        }, _callee14, this);
      }));
      function buildStakeOrderTx(_x10) {
        return _buildStakeOrderTx.apply(this, arguments);
      }
      return buildStakeOrderTx;
    }()
    /**
     * Build an unstake order: lock sUSDr, request USDr release.
     *
     * The destination is automatically set to a native script address that
     * enforces a timelock: AllOf { Signature(user), After(unlockTime) }.
     * This means the released USDr can only be spent by the user after the
     * unlock time has passed.
     *
     * @param params.amount - Amount of sUSDr to unstake
     * @param params.destination - The user's actual destination (used to extract payment key hash)
     * @param params.unlockTime - Slot number after which the user can spend the released USDr
     */
    )
  }, {
    key: "buildUnstakeOrderTx",
    value: (function () {
      var _buildUnstakeOrderTx = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee15(params) {
        var sUSDrAssetId, timelockDestination, extraLabels;
        return _regenerator().w(function (_context15) {
          while (1) switch (_context15.n) {
            case 0:
              if (!(params.amount <= 0n)) {
                _context15.n = 1;
                break;
              }
              throw new Error("Unstake amount must be positive");
            case 1:
              sUSDrAssetId = _sdk.Core.AssetId(this.stablecoinPolicyId + this.sUSDrAssetNameHex); // Build the timelock native script destination from the user's key hash
              timelockDestination = (0, _index3.buildTimelockDestination)(params.destination, params.unlockSlot);
              extraLabels = new Map([[_index3.UNSTAKE_METADATA_LABEL, (0, _index3.buildUnstakeMetadatum)(params.destination, params.unlockSlot)]]);
              return _context15.a(2, this._buildOrderTx({
                action: {
                  OUnstake: {
                    amount: params.amount
                  }
                },
                valueToLock: (0, _sdk.makeValue)(MIN_LOVELACE, [sUSDrAssetId, params.amount]),
                owner: params.owner,
                destination: timelockDestination,
                data: params.data,
                extraLabels: extraLabels
              }));
          }
        }, _callee15, this);
      }));
      function buildUnstakeOrderTx(_x11) {
        return _buildUnstakeOrderTx.apply(this, arguments);
      }
      return buildUnstakeOrderTx;
    }()
    /**
     * Build a timelock Destination from a user's destination and unlock time.
     *
     * Creates a native script: AllOf { Signature(userKeyHash), After(unlockTime) }
     * and returns a Destination pointing to that script's address.
     */
    )
  }, {
    key: "getSignedPayloadFromOrderInputs",
    value: // ─────────────────────────────────────────────────────────────────────────────
    // Signed Payload and Signing
    // ─────────────────────────────────────────────────────────────────────────────
    /**
     * Build the V0_4 SignedPayload_ProtocolRedeemer from order inputs.
     * Returns both the CBOR hex string (for buildExecuteOrdersTx) and
     * the blake2b_256 hash (for CIP-30 signing).
     *
     * V0.4 contract requires signing the blake2b_256 hash of the payload,
     * not the raw CBOR like V0.3.
     */
    function () {
      var _getSignedPayloadFromOrderInputs = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee16(orderInputs) {
        var sortedInputs, nonce, resolvedUtxos, actionType, treasuryRequests, requests, _iterator, _step, _utxo$output$datum, utxo, datumData, datum, origin, parsed, _parsed$yield, action, payload, serialized, signedPayload, payloadHash, _t, _t2;
        return _regenerator().w(function (_context16) {
          while (1) switch (_context16.p = _context16.n) {
            case 0:
              if (!(orderInputs.length === 0)) {
                _context16.n = 1;
                break;
              }
              throw new Error("At least one order input is required");
            case 1:
              sortedInputs = (0, _index3.sortOrderInputs)(orderInputs);
              nonce = (0, _index3.buildNonceFromUtxo)(sortedInputs[0]);
              _context16.n = 2;
              return this.blaze.provider.resolveUnspentOutputs(sortedInputs);
            case 2:
              resolvedUtxos = _context16.v;
              actionType = null;
              treasuryRequests = [];
              requests = [];
              _iterator = _createForOfIteratorHelper(resolvedUtxos);
              _context16.p = 3;
              _iterator.s();
            case 4:
              if ((_step = _iterator.n()).done) {
                _context16.n = 9;
                break;
              }
              utxo = _step.value;
              datumData = (_utxo$output$datum = utxo.output().datum()) === null || _utxo$output$datum === void 0 ? void 0 : _utxo$output$datum.asInlineData();
              if (datumData) {
                _context16.n = 5;
                break;
              }
              throw new Error("Order UTXO has no inline datum");
            case 5:
              datum = (0, _data.parse)(_index.V0_4Types.OrderDatum, datumData);
              origin = {
                transaction_id: utxo.input().transactionId().toString(),
                output_index: utxo.input().index()
              };
              parsed = this.classifyOrderAction(datum);
              if (!(actionType === null)) {
                _context16.n = 6;
                break;
              }
              actionType = parsed.actionType;
              _context16.n = 7;
              break;
            case 6:
              if (!(actionType !== parsed.actionType)) {
                _context16.n = 7;
                break;
              }
              throw new Error("Mixed order types in inputs. All orders must be of the same type.");
            case 7:
              if (parsed.isTreasuryAction) {
                treasuryRequests.push({
                  destination: datum.destination,
                  amount: parsed.amount,
                  "yield": (_parsed$yield = parsed["yield"]) !== null && _parsed$yield !== void 0 ? _parsed$yield : 0n,
                  origin: origin,
                  reserve_asset: parsed.reserveAsset
                });
              } else {
                requests.push({
                  destination: datum.destination,
                  amount: parsed.amount,
                  origin: origin
                });
              }
            case 8:
              _context16.n = 4;
              break;
            case 9:
              _context16.n = 11;
              break;
            case 10:
              _context16.p = 10;
              _t = _context16.v;
              _iterator.e(_t);
            case 11:
              _context16.p = 11;
              _iterator.f();
              return _context16.f(11);
            case 12:
              _t2 = actionType;
              _context16.n = _t2 === "mint" ? 13 : _t2 === "burn" ? 14 : _t2 === "withdraw" ? 15 : _t2 === "deposit" ? 16 : _t2 === "stake" ? 17 : _t2 === "unstake" ? 18 : 19;
              break;
            case 13:
              action = {
                Mint: {
                  requests: treasuryRequests
                }
              };
              return _context16.a(3, 20);
            case 14:
              action = {
                Burn: {
                  requests: treasuryRequests
                }
              };
              return _context16.a(3, 20);
            case 15:
              action = {
                Withdraw: {
                  requests: treasuryRequests
                }
              };
              return _context16.a(3, 20);
            case 16:
              action = {
                Deposit: {
                  requests: treasuryRequests
                }
              };
              return _context16.a(3, 20);
            case 17:
              action = {
                Stake: {
                  requests: requests
                }
              };
              return _context16.a(3, 20);
            case 18:
              action = {
                Unstake: {
                  requests: requests
                }
              };
              return _context16.a(3, 20);
            case 19:
              throw new Error("No orders to process");
            case 20:
              payload = {
                action: action,
                nonce: nonce
              };
              serialized = Data.serialize(_index.V0_4Types.SignedPayload_ProtocolRedeemer, payload);
              signedPayload = serialized.toCbor().toString();
              payloadHash = (0, _core.blake2b_256)((0, _core.HexBlob)(signedPayload));
              return _context16.a(2, {
                signedPayload: signedPayload,
                payloadHash: payloadHash
              });
          }
        }, _callee16, this, [[3, 10, 11, 12]]);
      }));
      function getSignedPayloadFromOrderInputs(_x12) {
        return _getSignedPayloadFromOrderInputs.apply(this, arguments);
      }
      return getSignedPayloadFromOrderInputs;
    }() // ─────────────────────────────────────────────────────────────────────────────
    // Execute Orders
    // ─────────────────────────────────────────────────────────────────────────────
    /**
     * Build a transaction to execute orders.
     *
     * Handles all 6 action types: mint, burn, deposit, withdraw, stake, unstake.
     * The signedPayload is a CBOR hex string (matching V0.3 style).
     *
     * NOTE: All wallet fee inputs are pre-added to the transaction so that
     * input indices for the ExtraProtocolRedeemer are stable. Coin selection
     * during complete() should be a no-op since all wallet UTxOs are already
     * included, but it cannot be disabled because Blaze also uses that phase
     * to prepare collateral.
     */
  }, {
    key: "buildExecuteOrdersTx",
    value: function () {
      var _buildExecuteOrdersTx = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee17(params) {
        var orderInputs, signedPayloadCbor, signatures, signedPayload, sortedOrderInputs, orderUtxos, orderInfos, actionType, _yield$this$getParsed, proxyUtxo, parsedProxyDatum, settings, needsTreasury, needsVault, scriptHashesNeeded, refInputs, treasuryUtxo, parsedTreasuryDatum, treasuryResult, vaultUtxo, parsedVaultDatum, vaultResult, walletUtxos, excludedInputIds, utxoKey, _iterator2, _step2, orderInfo, _i, _Object$values, refUtxo, feeUtxos, allInputRefs, _iterator3, _step3, feeUtxo, sortedAllInputRefs, findInputIdx, treasuryInputIdx, vaultInputIdx, signedRequests, originToRequestIdx, i, o, inputToRequests, requestToOutputs, outputIdx, input, key, requestIdx, numDestOutputs, numExtraOutputs, totalYield, _vaultValue$multiasse3, _vaultValue$multiasse4, vaultValue, _stablecoinAssetId, vaultUSDr, treasuryCirculating, _calculateYieldShares2, unstakedYieldShare, treasuryOutputIdx, vaultOutputIdx, extra, serializedSignedRedeemer, executeRedeemer, feeUtxoByKey, orderInfoByKey, treasuryInputKey, vaultInputKey, spendRedeemerInputs, tx, _iterator4, _step4, inputRef, inputKey, _orderInfo, _feeUtxo, protocolRewardAccount, stablecoinAssetId, sUSDrAssetId, _t3, _t4;
        return _regenerator().w(function (_context17) {
          while (1) switch (_context17.p = _context17.n) {
            case 0:
              orderInputs = params.orderInputs, signedPayloadCbor = params.signedPayload, signatures = params.signatures; // Deserialize CBOR hex to object for internal use
              signedPayload = (0, _data.parse)(_index.V0_4Types.SignedPayload_ProtocolRedeemer, _core.PlutusData.fromCbor((0, _core.HexBlob)(signedPayloadCbor))); // 1. Sort and resolve order UTxOs
              sortedOrderInputs = (0, _index3.sortOrderInputs)(orderInputs);
              _context17.n = 1;
              return this.blaze.provider.resolveUnspentOutputs(sortedOrderInputs);
            case 1:
              orderUtxos = _context17.v;
              // 2. Parse orders and validate same type
              orderInfos = this.parseOrderInfos(orderUtxos);
              actionType = orderInfos[0].actionType; // 3. Get protocol settings
              _context17.n = 2;
              return this.getParsedProxyDatum();
            case 2:
              _yield$this$getParsed = _context17.v;
              proxyUtxo = _yield$this$getParsed.proxyUtxo;
              parsedProxyDatum = _yield$this$getParsed.parsedProxyDatum;
              settings = parsedProxyDatum.settings; // 4. Determine what we need
              needsTreasury = ["mint", "burn", "withdraw", "deposit"].includes(actionType);
              needsVault = ["stake", "unstake", "deposit"].includes(actionType); // 5. Get script reference inputs
              scriptHashesNeeded = {
                protocol: this.protocolScriptHash,
                order: this.orderScriptHash
              };
              if (needsTreasury) {
                scriptHashesNeeded.treasury = this.treasuryScriptHash;
              }
              if (needsVault) {
                scriptHashesNeeded.stakingVault = this.stakingVaultScriptHash;
              }
              _context17.n = 3;
              return this.getScriptReferenceInputs(scriptHashesNeeded);
            case 3:
              refInputs = _context17.v;
              if (!needsTreasury) {
                _context17.n = 5;
                break;
              }
              _context17.n = 4;
              return this.getTreasuryDatum();
            case 4:
              treasuryResult = _context17.v;
              treasuryUtxo = treasuryResult.treasuryUtxo;
              parsedTreasuryDatum = treasuryResult.parsedTreasuryDatum;
            case 5:
              if (!needsVault) {
                _context17.n = 7;
                break;
              }
              _context17.n = 6;
              return this.getVaultDatum();
            case 6:
              vaultResult = _context17.v;
              vaultUtxo = vaultResult.vaultUtxo;
              parsedVaultDatum = vaultResult.parsedVaultDatum;
            case 7:
              _context17.n = 8;
              return this.blaze.wallet.getUnspentOutputs();
            case 8:
              walletUtxos = _context17.v;
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
              // Include ALL inputs: order, treasury, vault, AND wallet fee inputs.
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
                _context17.n = 12;
                break;
              }
              input = orderInfos[outputIdx].utxo.input();
              key = "".concat(input.transactionId(), "#").concat(input.index());
              requestIdx = originToRequestIdx.get(key);
              if (!(requestIdx === undefined)) {
                _context17.n = 10;
                break;
              }
              throw new Error("Order input ".concat(key, " not found in signed payload"));
            case 10:
              inputToRequests.push(BigInt(requestIdx));
              requestToOutputs.push(BigInt(outputIdx));
            case 11:
              outputIdx++;
              _context17.n = 9;
              break;
            case 12:
              // 9. Build outputs and compute output indices
              // Output layout:
              //   [destination outputs] [extra outputs*] [treasury output if needed] [vault output if needed]
              // *extra outputs: yield pot output for deposit with non-zero positive yield
              numDestOutputs = orderInfos.length; // For deposit with positive yield, the yield pot output is inserted after destinations
              numExtraOutputs = 0;
              if (actionType === "deposit") {
                totalYield = orderInfos.reduce(function (sum, o) {
                  var _o$yield;
                  return sum + ((_o$yield = o["yield"]) !== null && _o$yield !== void 0 ? _o$yield : 0n);
                }, 0n);
                if (totalYield > 0n) {
                  // Check if unstaked yield share is > 0
                  vaultValue = vaultUtxo.output().amount();
                  _stablecoinAssetId = _sdk.Core.AssetId(this.stablecoinPolicyId + this.assetNameHex);
                  vaultUSDr = (_vaultValue$multiasse3 = (_vaultValue$multiasse4 = vaultValue.multiasset()) === null || _vaultValue$multiasse4 === void 0 ? void 0 : _vaultValue$multiasse4.get(_stablecoinAssetId)) !== null && _vaultValue$multiasse3 !== void 0 ? _vaultValue$multiasse3 : 0n;
                  treasuryCirculating = parsedTreasuryDatum.circulating_supply;
                  _calculateYieldShares2 = calculateYieldShares(totalYield, vaultUSDr, treasuryCirculating), unstakedYieldShare = _calculateYieldShares2.unstakedYieldShare;
                  if (unstakedYieldShare > 0n) {
                    numExtraOutputs = 1;
                  }
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
              }; // 11. Build SignedRedeemer (payload is deserialized object in v0_4)
              serializedSignedRedeemer = Data.serialize(_index.V0_4Types.SignedRedeemer_ExtraProtocolRedeemer, {
                extra: extra,
                payload: signedPayload,
                signatures: signatures
              });
              executeRedeemer = Data.serialize(_index.V0_4Types.OrderRedeemer, "Execute");
              feeUtxoByKey = new Map(feeUtxos.map(function (utxo) {
                return [utxoKey(utxo.input()), utxo];
              }));
              orderInfoByKey = new Map(orderInfos.map(function (orderInfo) {
                return [utxoKey(orderInfo.utxo.input()), orderInfo];
              }));
              treasuryInputKey = treasuryUtxo ? utxoKey(treasuryUtxo.input()) : null;
              vaultInputKey = vaultUtxo ? utxoKey(vaultUtxo.input()) : null;
              spendRedeemerInputs = _toConsumableArray(orderInfos.map(function (orderInfo) {
                return orderInfo.utxo.input();
              }));
              if (treasuryUtxo) {
                spendRedeemerInputs.push(treasuryUtxo.input());
              }
              if (vaultUtxo) {
                spendRedeemerInputs.push(vaultUtxo.input());
              }

              // 12. Build the transaction
              tx = this.newOrderTransaction(); // Add all spend inputs in ledger order so the generated spend redeemer
              // pointers line up with the final transaction input indices.
              _iterator4 = _createForOfIteratorHelper(sortedAllInputRefs);
              _context17.p = 13;
              _iterator4.s();
            case 14:
              if ((_step4 = _iterator4.n()).done) {
                _context17.n = 20;
                break;
              }
              inputRef = _step4.value;
              inputKey = utxoKey(inputRef);
              _orderInfo = orderInfoByKey.get(inputKey);
              if (!_orderInfo) {
                _context17.n = 15;
                break;
              }
              tx.addInput(_orderInfo.utxo, executeRedeemer);
              return _context17.a(3, 19);
            case 15:
              if (!(treasuryInputKey && inputKey === treasuryInputKey)) {
                _context17.n = 16;
                break;
              }
              tx.addInput(treasuryUtxo, Data.Void());
              return _context17.a(3, 19);
            case 16:
              if (!(vaultInputKey && inputKey === vaultInputKey)) {
                _context17.n = 17;
                break;
              }
              tx.addInput(vaultUtxo, Data.Void());
              return _context17.a(3, 19);
            case 17:
              _feeUtxo = feeUtxoByKey.get(inputKey);
              if (!_feeUtxo) {
                _context17.n = 18;
                break;
              }
              tx.addInput(_feeUtxo);
              return _context17.a(3, 19);
            case 18:
              throw new Error("buildExecuteOrdersTx: missing input metadata for ".concat(inputKey));
            case 19:
              _context17.n = 14;
              break;
            case 20:
              _context17.n = 22;
              break;
            case 21:
              _context17.p = 21;
              _t3 = _context17.v;
              _iterator4.e(_t3);
            case 22:
              _context17.p = 22;
              _iterator4.f();
              return _context17.f(22);
            case 23:
              // Add reference inputs
              tx.addReferenceInput(refInputs.protocol);
              tx.addReferenceInput(refInputs.order);
              tx.addReferenceInput(proxyUtxo);
              if (refInputs.treasury) {
                tx.addReferenceInput(refInputs.treasury);
              }
              if (refInputs.stakingVault) {
                tx.addReferenceInput(refInputs.stakingVault);
              }

              // Add protocol withdrawal with signed redeemer
              protocolRewardAccount = _sdk.Core.RewardAccount.fromCredential({
                type: _sdk.Core.CredentialType.ScriptHash,
                hash: this.protocolScriptHash
              }, this.network);
              tx.addWithdrawal(protocolRewardAccount, 0n, serializedSignedRedeemer);

              // Build per-action-type outputs, minting, and state updates
              stablecoinAssetId = _sdk.Core.AssetId(this.stablecoinPolicyId + this.assetNameHex);
              sUSDrAssetId = _sdk.Core.AssetId(this.stablecoinPolicyId + this.sUSDrAssetNameHex);
              _t4 = actionType;
              _context17.n = _t4 === "mint" ? 24 : _t4 === "burn" ? 25 : _t4 === "withdraw" ? 26 : _t4 === "deposit" ? 27 : _t4 === "stake" ? 28 : _t4 === "unstake" ? 29 : 30;
              break;
            case 24:
              this.buildMintExecute(tx, orderInfos, stablecoinAssetId, treasuryUtxo, parsedTreasuryDatum, settings);
              return _context17.a(3, 30);
            case 25:
              this.buildBurnExecute(tx, orderInfos, stablecoinAssetId, treasuryUtxo, parsedTreasuryDatum, settings);
              return _context17.a(3, 30);
            case 26:
              this.buildWithdrawExecute(tx, orderInfos, treasuryUtxo, parsedTreasuryDatum, settings);
              return _context17.a(3, 30);
            case 27:
              this.buildDepositExecute(tx, orderInfos, stablecoinAssetId, treasuryUtxo, parsedTreasuryDatum, vaultUtxo, parsedVaultDatum, settings);
              return _context17.a(3, 30);
            case 28:
              this.buildStakeExecute(tx, orderInfos, stablecoinAssetId, sUSDrAssetId, vaultUtxo, parsedVaultDatum);
              return _context17.a(3, 30);
            case 29:
              this.buildUnstakeExecute(tx, orderInfos, stablecoinAssetId, sUSDrAssetId, vaultUtxo, parsedVaultDatum);
              return _context17.a(3, 30);
            case 30:
              // Provide the mint proxy script for minting
              tx.provideScript(this.mintProxyScript);
              this.realignSpendRedeemerIndices(tx, spendRedeemerInputs);
              return _context17.a(2, tx);
          }
        }, _callee17, this, [[13, 21, 22, 23]]);
      }));
      function buildExecuteOrdersTx(_x13) {
        return _buildExecuteOrdersTx.apply(this, arguments);
      }
      return buildExecuteOrdersTx;
    }()
  }, {
    key: "realignSpendRedeemerIndices",
    value: function realignSpendRedeemerIndices(tx, spendRedeemerInputs) {
      var txInternals = tx;
      var bodyInputs = txInternals.body.inputs().values();
      var redeemers = _toConsumableArray(txInternals.redeemers.values());
      var spendRedeemers = redeemers.filter(function (redeemer) {
        return redeemer.tag() === _sdk.Core.RedeemerTag.Spend;
      }).sort(function (a, b) {
        return Number(a.index() - b.index());
      });
      if (spendRedeemers.length !== spendRedeemerInputs.length) {
        throw new Error("buildExecuteOrdersTx: spend redeemer count mismatch. inputs=".concat(spendRedeemerInputs.length, " redeemers=").concat(spendRedeemers.length));
      }
      var expectedOrdering = _toConsumableArray(spendRedeemerInputs).sort(function (a, b) {
        return toSpendOrderingKey(a).localeCompare(toSpendOrderingKey(b));
      });
      var _loop = function _loop() {
        var input = expectedOrdering[i];
        var actualIndex = bodyInputs.findIndex(function (bodyInput) {
          return bodyInput.transactionId().toString() === input.transactionId().toString() && bodyInput.index() === input.index();
        });
        if (actualIndex < 0) {
          throw new Error("buildExecuteOrdersTx: could not find spend input ".concat(input.transactionId().toString(), "#").concat(input.index().toString(), " in tx body"));
        }
        spendRedeemers[i].setIndex(BigInt(actualIndex));
      };
      for (var i = 0; i < spendRedeemers.length; i++) {
        _loop();
      }
      txInternals.redeemers.setValues(redeemers);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Per-Action Execute Builders
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
      var _iterator5 = _createForOfIteratorHelper(orderInfos),
        _step5;
      try {
        for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
          var orderInfo = _step5.value;
          (0, _index3.addDestinationOutput)(tx, this.network, orderInfo.datum.destination, (0, _sdk.makeValue)(MIN_LOVELACE, [stablecoinAssetId, orderInfo.amount]));
        }

        // Mint USDr
      } catch (err) {
        _iterator5.e(err);
      } finally {
        _iterator5.f();
      }
      tx.addMint(this.stablecoinPolicyId, new Map([[_sdk.Core.AssetName(this.assetNameHex), totalAmount]]), Data.Void());

      // Compute per-reserve-asset deltas
      var reserveDeltas = (0, _index3.computeReserveDeltas)(orderInfos, settings);
      this.updateTreasuryOutput(tx, treasuryUtxo, parsedTreasuryDatum, reserveDeltas, totalAmount);
    }

    /**
     * Burn: USDr burned, reserve sent to destinations.
     */
  }, {
    key: "buildBurnExecute",
    value: function buildBurnExecute(tx, orderInfos, stablecoinAssetId, treasuryUtxo, parsedTreasuryDatum, settings) {
      // Amount is negative in datum for burns
      var totalAmount = orderInfos.reduce(function (sum, o) {
        return sum + o.amount;
      }, 0n);

      // Destination outputs: send reserve tokens to each destination
      // Convert USDr amount to reserve amount using floor division (protocol-protective)
      var _iterator6 = _createForOfIteratorHelper(orderInfos),
        _step6;
      try {
        for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
          var orderInfo = _step6.value;
          var ra = (0, _index3.findReserveAsset)(settings, orderInfo.reserveAsset);
          var reserveAssetId = _sdk.Core.AssetId(orderInfo.reserveAsset[0] + orderInfo.reserveAsset[1]);
          var reserveAmount = (0, _index3.usdrToReserve)(-orderInfo.amount, ra);
          (0, _index3.addDestinationOutput)(tx, this.network, orderInfo.datum.destination, (0, _sdk.makeValue)(MIN_LOVELACE, [reserveAssetId, reserveAmount]));
        }

        // Burn USDr (totalAmount is negative)
      } catch (err) {
        _iterator6.e(err);
      } finally {
        _iterator6.f();
      }
      tx.addMint(this.stablecoinPolicyId, new Map([[_sdk.Core.AssetName(this.assetNameHex), totalAmount]]), Data.Void());

      // Compute per-reserve-asset deltas
      var reserveDeltas = (0, _index3.computeReserveDeltas)(orderInfos, settings);
      this.updateTreasuryOutput(tx, treasuryUtxo, parsedTreasuryDatum, reserveDeltas, totalAmount);
    }

    /**
     * Withdraw: reserve sent to destinations, no mint/burn.
     */
  }, {
    key: "buildWithdrawExecute",
    value: function buildWithdrawExecute(tx, orderInfos, treasuryUtxo, parsedTreasuryDatum, settings) {
      // Destination outputs: send reserve tokens to each destination
      // Convert USDr amount to reserve amount using floor division
      var _iterator7 = _createForOfIteratorHelper(orderInfos),
        _step7;
      try {
        for (_iterator7.s(); !(_step7 = _iterator7.n()).done;) {
          var orderInfo = _step7.value;
          var ra = (0, _index3.findReserveAsset)(settings, orderInfo.reserveAsset);
          var reserveAssetId = _sdk.Core.AssetId(orderInfo.reserveAsset[0] + orderInfo.reserveAsset[1]);
          var reserveAmount = (0, _index3.usdrToReserve)(orderInfo.amount, ra);
          (0, _index3.addDestinationOutput)(tx, this.network, orderInfo.datum.destination, (0, _sdk.makeValue)(MIN_LOVELACE, [reserveAssetId, reserveAmount]));
        }

        // Update treasury: reserve decreases, no circulating_supply change
        // On-chain: amount_sign = -1 for withdraw, expected_delta = usdr_to_reserve(-amount, ra)
      } catch (err) {
        _iterator7.e(err);
      } finally {
        _iterator7.f();
      }
      var reserveDeltas = (0, _index3.computeReserveDeltas)(orderInfos, settings, true);
      this.updateTreasuryOutput(tx, treasuryUtxo, parsedTreasuryDatum, reserveDeltas, 0n);
    }

    /**
     * Deposit: reserve deposited, interest USDr minted and split between vault and yield pot.
     */
  }, {
    key: "buildDepositExecute",
    value: function buildDepositExecute(tx, orderInfos, stablecoinAssetId, treasuryUtxo, parsedTreasuryDatum, vaultUtxo, parsedVaultDatum, settings) {
      var _vaultValue$multiasse5, _vaultValue$multiasse6;
      var totalYield = orderInfos.reduce(function (sum, o) {
        var _o$yield2;
        return sum + ((_o$yield2 = o["yield"]) !== null && _o$yield2 !== void 0 ? _o$yield2 : 0n);
      }, 0n);

      // Destination outputs: min ADA to each destination (contract validates via request_to_outputs)
      var _iterator8 = _createForOfIteratorHelper(orderInfos),
        _step8;
      try {
        for (_iterator8.s(); !(_step8 = _iterator8.n()).done;) {
          var orderInfo = _step8.value;
          (0, _index3.addDestinationOutput)(tx, this.network, orderInfo.datum.destination, (0, _sdk.makeValue)(MIN_LOVELACE));
        }

        // Calculate yield split matching on-chain deposit.ak logic
      } catch (err) {
        _iterator8.e(err);
      } finally {
        _iterator8.f();
      }
      var vaultValue = vaultUtxo.output().amount();
      var vaultUSDr = (_vaultValue$multiasse5 = (_vaultValue$multiasse6 = vaultValue.multiasset()) === null || _vaultValue$multiasse6 === void 0 ? void 0 : _vaultValue$multiasse6.get(stablecoinAssetId)) !== null && _vaultValue$multiasse5 !== void 0 ? _vaultValue$multiasse5 : 0n;
      var treasuryCirculating = parsedTreasuryDatum.circulating_supply;
      var _calculateYieldShares3 = calculateYieldShares(totalYield, vaultUSDr, treasuryCirculating),
        stakedYieldShare = _calculateYieldShares3.stakedYieldShare,
        unstakedYieldShare = _calculateYieldShares3.unstakedYieldShare;
      if (totalYield > 0n) {
        // Positive yield: mint USDr for the yield amount
        tx.addMint(this.stablecoinPolicyId, new Map([[_sdk.Core.AssetName(this.assetNameHex), totalYield]]), Data.Void());

        // Send unstaked yield share to the yield pot address
        if (unstakedYieldShare > 0n) {
          (0, _index3.addDestinationOutput)(tx, this.network, {
            address: settings.unstaked_yield_pot,
            datum: "NoDatum"
          }, (0, _sdk.makeValue)(MIN_LOVELACE, [stablecoinAssetId, unstakedYieldShare]));
        }
      } else if (totalYield < 0n) {
        // Negative yield: burn USDr (sourced from order inputs already consumed)
        tx.addMint(this.stablecoinPolicyId, new Map([[_sdk.Core.AssetName(this.assetNameHex), totalYield]]), Data.Void());
      }
      // totalYield === 0n: no mint/burn needed

      // Update treasury: reserve increases, circulating_supply changes by yield.
      // For positive yield, treasury receives reserve backing for BOTH principal AND yield.
      // For negative yield, treasury only receives reserve backing for principal.
      var reserveDeltas = new Map();
      var _iterator9 = _createForOfIteratorHelper(orderInfos),
        _step9;
      try {
        for (_iterator9.s(); !(_step9 = _iterator9.n()).done;) {
          var _orderInfo2$yield, _reserveDeltas$get;
          var _orderInfo2 = _step9.value;
          var assetId = _orderInfo2.reserveAsset[0] + _orderInfo2.reserveAsset[1];
          var ra = (0, _index3.findReserveAsset)(settings, _orderInfo2.reserveAsset);
          var yieldValue = (_orderInfo2$yield = _orderInfo2["yield"]) !== null && _orderInfo2$yield !== void 0 ? _orderInfo2$yield : 0n;

          // Calculate USDr backing needed based on yield sign
          var usdrBacking = yieldValue >= 0n ? _orderInfo2.amount + yieldValue // principal + yield for positive yield
          : _orderInfo2.amount; // just principal for negative yield

          // Convert USDr backing to reserve amount
          var reserveAmount = (0, _index3.usdrToReserve)(usdrBacking, ra);
          reserveDeltas.set(assetId, ((_reserveDeltas$get = reserveDeltas.get(assetId)) !== null && _reserveDeltas$get !== void 0 ? _reserveDeltas$get : 0n) + reserveAmount);
        }
      } catch (err) {
        _iterator9.e(err);
      } finally {
        _iterator9.f();
      }
      this.updateTreasuryOutput(tx, treasuryUtxo, parsedTreasuryDatum, reserveDeltas, totalYield);

      // Update vault: sUSDr unchanged, USDr changes by staked yield share
      this.updateVaultOutput(tx, vaultUtxo, parsedVaultDatum, 0n, stakedYieldShare);
    }

    /**
     * Stake: USDr locked in vault, sUSDr minted to destinations.
     */
  }, {
    key: "buildStakeExecute",
    value: function buildStakeExecute(tx, orderInfos, stablecoinAssetId, sUSDrAssetId, vaultUtxo, parsedVaultDatum) {
      var _vaultValue$multiasse7, _vaultValue$multiasse8;
      var totalUSDrStaked = orderInfos.reduce(function (sum, o) {
        return sum + o.amount;
      }, 0n);

      // Calculate vault USDr balance
      var vaultValue = vaultUtxo.output().amount();
      var vaultUSDr = (_vaultValue$multiasse7 = (_vaultValue$multiasse8 = vaultValue.multiasset()) === null || _vaultValue$multiasse8 === void 0 ? void 0 : _vaultValue$multiasse8.get(stablecoinAssetId)) !== null && _vaultValue$multiasse7 !== void 0 ? _vaultValue$multiasse7 : 0n;
      var circulatingSUSDr = parsedVaultDatum.circulating_susdr;

      // Calculate total sUSDr to mint using batch formula (matches on-chain stake.ak)
      // On-chain: susdr_to_mint = total_usdr_staked * circulating_susdr_before / vault_usdr_before
      var totalSUSDrMinted;
      if (circulatingSUSDr === 0n || vaultUSDr === 0n) {
        totalSUSDrMinted = totalUSDrStaked;
      } else {
        totalSUSDrMinted = totalUSDrStaked * circulatingSUSDr / vaultUSDr;
      }

      // Calculate per-order sUSDr for destination outputs (matches validate_stake_outputs).
      // Note: sum(per-order floors) may be less than totalSUSDrMinted by at most (n-1) units
      // due to floor(sum) >= sum(floor). The difference ("dust") is minted but not assigned
      // to any destination output — it ends up in the executor's change output. This is an
      // inherent consequence of the on-chain contract requiring both aggregate mint equality
      // and per-request floor equality on outputs.
      var _iterator0 = _createForOfIteratorHelper(orderInfos),
        _step0;
      try {
        for (_iterator0.s(); !(_step0 = _iterator0.n()).done;) {
          var orderInfo = _step0.value;
          var sUSDrAmount = void 0;
          if (circulatingSUSDr === 0n || vaultUSDr === 0n) {
            sUSDrAmount = orderInfo.amount;
          } else {
            sUSDrAmount = orderInfo.amount * circulatingSUSDr / vaultUSDr;
          }
          (0, _index3.addDestinationOutput)(tx, this.network, orderInfo.datum.destination, (0, _sdk.makeValue)(MIN_LOVELACE, [sUSDrAssetId, sUSDrAmount]));
        }

        // Mint sUSDr
      } catch (err) {
        _iterator0.e(err);
      } finally {
        _iterator0.f();
      }
      tx.addMint(this.stablecoinPolicyId, new Map([[_sdk.Core.AssetName(this.sUSDrAssetNameHex), totalSUSDrMinted]]), Data.Void());

      // Update vault: USDr increases by staked amount, circulating_susdr increases
      this.updateVaultOutput(tx, vaultUtxo, parsedVaultDatum, totalSUSDrMinted, totalUSDrStaked);
    }

    /**
     * Unstake: sUSDr burned, USDr sent to user's destination address.
     */
  }, {
    key: "buildUnstakeExecute",
    value: function buildUnstakeExecute(tx, orderInfos, stablecoinAssetId, sUSDrAssetId, vaultUtxo, parsedVaultDatum) {
      var _vaultValue$multiasse9, _vaultValue$multiasse0;
      var totalSUSDrBurned = orderInfos.reduce(function (sum, o) {
        return sum + o.amount;
      }, 0n);

      // Calculate vault USDr balance
      var vaultValue = vaultUtxo.output().amount();
      var vaultUSDr = (_vaultValue$multiasse9 = (_vaultValue$multiasse0 = vaultValue.multiasset()) === null || _vaultValue$multiasse0 === void 0 ? void 0 : _vaultValue$multiasse0.get(stablecoinAssetId)) !== null && _vaultValue$multiasse9 !== void 0 ? _vaultValue$multiasse9 : 0n;
      var circulatingSUSDr = parsedVaultDatum.circulating_susdr;
      if (circulatingSUSDr === 0n) {
        throw new Error("Cannot unstake: no sUSDr in circulation");
      }

      // Calculate USDr to release for each order
      var totalUSDrReleased = 0n;
      var _iterator1 = _createForOfIteratorHelper(orderInfos),
        _step1;
      try {
        for (_iterator1.s(); !(_step1 = _iterator1.n()).done;) {
          var orderInfo = _step1.value;
          var uSDrAmount = orderInfo.amount * vaultUSDr / circulatingSUSDr;
          totalUSDrReleased += uSDrAmount;

          // Send USDr to the destination (native script timelock address).
          // Use an explicit output because lockAssets requires a datum, but the
          // contract expects NoDatum.
          var destAddress = (0, _index3.destinationToAddress)(this.network, orderInfo.datum.destination);
          var output = new _sdk.Core.TransactionOutput(destAddress, (0, _sdk.makeValue)(MIN_LOVELACE, [stablecoinAssetId, uSDrAmount]));
          tx.addOutput(output);
        }

        // Burn sUSDr
      } catch (err) {
        _iterator1.e(err);
      } finally {
        _iterator1.f();
      }
      tx.addMint(this.stablecoinPolicyId, new Map([[_sdk.Core.AssetName(this.sUSDrAssetNameHex), -totalSUSDrBurned]]), Data.Void());

      // Update vault: USDr decreases, circulating_susdr decreases
      this.updateVaultOutput(tx, vaultUtxo, parsedVaultDatum, -totalSUSDrBurned, -totalUSDrReleased);
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
      var _buildCancelOrdersTx = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee18(params) {
        var orderInputs, destination, availableSigners, versionHint, orderUtxos, cachedOrderRefs, orderRefInputs, cancelRedeemer, destAddress, tx, _iterator10, _step10, orderRefInput, currentOrderRefInput, requiredSigners, _iterator11, _step11, utxo, owner, _iterator13, _step13, keyHash, outputValue, effectiveSigners, _iterator12, _step12, _keyHash, _t5, _t6;
        return _regenerator().w(function (_context18) {
          while (1) switch (_context18.p = _context18.n) {
            case 0:
              orderInputs = params.orderInputs, destination = params.destination, availableSigners = params.availableSigners, versionHint = params.versionHint;
              _context18.n = 1;
              return this.blaze.provider.resolveUnspentOutputs(orderInputs);
            case 1:
              orderUtxos = _context18.v;
              if (!(orderUtxos.length === 0)) {
                _context18.n = 2;
                break;
              }
              throw new Error("No orders to cancel");
            case 2:
              cachedOrderRefs = this.cachedReferenceInputs.orderRefInput ? new Map([[this.orderScriptHash, this.cachedReferenceInputs.orderRefInput]]) : undefined;
              _context18.n = 3;
              return (0, _index3.resolveOrderReferenceInputs)(this.blaze, orderUtxos, cachedOrderRefs, this.scriptDeploymentAddress);
            case 3:
              orderRefInputs = _context18.v;
              cancelRedeemer = Data.serialize(_index.V0_4Types.OrderRedeemer, "Cancel");
              if (!(destination !== null && destination !== void 0)) {
                _context18.n = 4;
                break;
              }
              _t5 = destination;
              _context18.n = 6;
              break;
            case 4:
              _context18.n = 5;
              return this.blaze.wallet.getChangeAddress();
            case 5:
              _t5 = _context18.v;
            case 6:
              destAddress = _t5;
              tx = this.newOrderTransaction();
              _iterator10 = _createForOfIteratorHelper(orderRefInputs.values());
              try {
                for (_iterator10.s(); !(_step10 = _iterator10.n()).done;) {
                  orderRefInput = _step10.value;
                  tx.addReferenceInput(orderRefInput);
                }

                // cache current version of order script reference input
              } catch (err) {
                _iterator10.e(err);
              } finally {
                _iterator10.f();
              }
              currentOrderRefInput = orderRefInputs.get(this.orderScriptHash);
              if (currentOrderRefInput && !this.cachedReferenceInputs.orderRefInput) {
                this.cachedReferenceInputs.orderRefInput = currentOrderRefInput;
              }
              requiredSigners = new Set();
              _iterator11 = _createForOfIteratorHelper(orderUtxos);
              _context18.p = 7;
              _iterator11.s();
            case 8:
              if ((_step11 = _iterator11.n()).done) {
                _context18.n = 11;
                break;
              }
              utxo = _step11.value;
              _context18.n = 9;
              return (0, _index3.parseCancelOwner)(utxo, versionHint);
            case 9:
              owner = _context18.v;
              _iterator13 = _createForOfIteratorHelper((0, _index3.getSignatureKeyHashesFromMultisigScript)(owner));
              try {
                for (_iterator13.s(); !(_step13 = _iterator13.n()).done;) {
                  keyHash = _step13.value;
                  requiredSigners.add(keyHash);
                }
              } catch (err) {
                _iterator13.e(err);
              } finally {
                _iterator13.f();
              }
              tx.addInput(utxo, cancelRedeemer);
              outputValue = utxo.output().amount();
              (0, _index3.addDirectOutput)(tx, destAddress, outputValue);
            case 10:
              _context18.n = 8;
              break;
            case 11:
              _context18.n = 13;
              break;
            case 12:
              _context18.p = 12;
              _t6 = _context18.v;
              _iterator11.e(_t6);
            case 13:
              _context18.p = 13;
              _iterator11.f();
              return _context18.f(13);
            case 14:
              effectiveSigners = availableSigners ? new Set(_toConsumableArray(requiredSigners).filter(function (k) {
                return availableSigners.has(k);
              })) : requiredSigners;
              _iterator12 = _createForOfIteratorHelper(effectiveSigners);
              try {
                for (_iterator12.s(); !(_step12 = _iterator12.n()).done;) {
                  _keyHash = _step12.value;
                  tx.addRequiredSigner((0, _core.Ed25519KeyHashHex)(_keyHash));
                }
              } catch (err) {
                _iterator12.e(err);
              } finally {
                _iterator12.f();
              }
              return _context18.a(2, tx);
          }
        }, _callee18, this, [[7, 12, 13, 14]]);
      }));
      function buildCancelOrdersTx(_x14) {
        return _buildCancelOrdersTx.apply(this, arguments);
      }
      return buildCancelOrdersTx;
    }() // ─────────────────────────────────────────────────────────────────────────────
    // Private Helpers
    // ─────────────────────────────────────────────────────────────────────────────
    /**
     * Parse order UTxOs into IOrderInfo objects and validate they are all the same type.
     */
  }, {
    key: "parseOrderInfos",
    value: function parseOrderInfos(orderUtxos) {
      var orderInfos = [];
      var expectedActionType = null;
      var _iterator14 = _createForOfIteratorHelper(orderUtxos),
        _step14;
      try {
        for (_iterator14.s(); !(_step14 = _iterator14.n()).done;) {
          var _utxo$output$datum2;
          var utxo = _step14.value;
          var datumData = (_utxo$output$datum2 = utxo.output().datum()) === null || _utxo$output$datum2 === void 0 ? void 0 : _utxo$output$datum2.asInlineData();
          if (!datumData) {
            throw new Error("Order UTXO has no inline datum");
          }
          var datum = (0, _data.parse)(_index.V0_4Types.OrderDatum, datumData);
          var classified = this.classifyOrderAction(datum);
          if (expectedActionType === null) {
            expectedActionType = classified.actionType;
          } else if (expectedActionType !== classified.actionType) {
            throw new Error("Mixed order types in inputs. All orders must be of the same type.");
          }
          orderInfos.push({
            utxo: utxo,
            datum: datum,
            actionType: classified.actionType,
            amount: classified.amount,
            "yield": classified["yield"],
            reserveAsset: classified.reserveAsset
          });
        }
      } catch (err) {
        _iterator14.e(err);
      } finally {
        _iterator14.f();
      }
      if (orderInfos.length === 0) {
        throw new Error("No orders to execute");
      }
      return orderInfos;
    }

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
          reserveAsset: action.OMint.reserve_asset,
          isTreasuryAction: true
        };
      } else if ("ORedeem" in action) {
        return {
          actionType: "burn",
          // ORedeem.amount is positive (absolute value locked in order UTxO).
          // Negate it so the request.amount is negative for burn (USDr leaving circulation),
          // matching the contract's expectation: ORedeem.amount == -request.amount.
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
          isTreasuryAction: false
        };
      }
      throw new Error("Unknown order action type");
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
      var serializedTreasuryDatum = Data.serialize(_index2.TreasuryDatum, newTreasuryDatum);
      var treasuryValue = treasuryUtxo.output().amount();

      // Start with ADA + treasury NFT
      var newTreasuryValue = (0, _sdk.makeValue)(treasuryValue.coin(), [this.treasuryNFTAssetId, 1n]);

      // Apply all reserve asset deltas
      var modifiedAssetIds = new Set([this.treasuryNFTAssetId.toString()]);
      var _iterator15 = _createForOfIteratorHelper(reserveDeltas.entries()),
        _step15;
      try {
        for (_iterator15.s(); !(_step15 = _iterator15.n()).done;) {
          var _treasuryValue$multia, _treasuryValue$multia2;
          var _step15$value = _slicedToArray(_step15.value, 2),
            reserveAssetId = _step15$value[0],
            delta = _step15$value[1];
          var currentReserve = (_treasuryValue$multia = (_treasuryValue$multia2 = treasuryValue.multiasset()) === null || _treasuryValue$multia2 === void 0 ? void 0 : _treasuryValue$multia2.get(_sdk.Core.AssetId(reserveAssetId))) !== null && _treasuryValue$multia !== void 0 ? _treasuryValue$multia : 0n;
          var newReserve = currentReserve + delta;
          newTreasuryValue = _sdk.Value.merge(newTreasuryValue, (0, _sdk.makeValue)(0n, [_sdk.Core.AssetId(reserveAssetId), newReserve]));
          modifiedAssetIds.add(reserveAssetId);
        }

        // Preserve any other assets not modified
      } catch (err) {
        _iterator15.e(err);
      } finally {
        _iterator15.f();
      }
      var existingMultiasset = treasuryValue.multiasset();
      if (existingMultiasset) {
        var _iterator16 = _createForOfIteratorHelper(existingMultiasset.entries()),
          _step16;
        try {
          for (_iterator16.s(); !(_step16 = _iterator16.n()).done;) {
            var _step16$value = _slicedToArray(_step16.value, 2),
              assetId = _step16$value[0],
              amount = _step16$value[1];
            if (!modifiedAssetIds.has(assetId)) {
              newTreasuryValue = _sdk.Value.merge(newTreasuryValue, (0, _sdk.makeValue)(0n, [_sdk.Core.AssetId(assetId), amount]));
            }
          }
        } catch (err) {
          _iterator16.e(err);
        } finally {
          _iterator16.f();
        }
      }
      tx.lockAssets(this.treasuryAddress, newTreasuryValue, serializedTreasuryDatum);
    }

    /**
     * Update vault output with new circulating_susdr and USDr balance.
     */
  }, {
    key: "updateVaultOutput",
    value: function updateVaultOutput(tx, vaultUtxo, parsedVaultDatum, sUSDrDelta) {
      var uSDrDelta = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0n;
      var newVaultDatum = {
        circulating_susdr: parsedVaultDatum.circulating_susdr + sUSDrDelta
      };
      var serializedVaultDatum = Data.serialize(_index.V0_4Types.VaultDatum, newVaultDatum);
      var stablecoinAssetId = _sdk.Core.AssetId(this.stablecoinPolicyId + this.assetNameHex);

      // Start with existing vault value, then adjust USDr
      var newVaultValue = vaultUtxo.output().amount();
      if (uSDrDelta !== 0n) {
        var _newVaultValue$multia, _newVaultValue$multia2;
        var currentUSDr = (_newVaultValue$multia = (_newVaultValue$multia2 = newVaultValue.multiasset()) === null || _newVaultValue$multia2 === void 0 ? void 0 : _newVaultValue$multia2.get(stablecoinAssetId)) !== null && _newVaultValue$multia !== void 0 ? _newVaultValue$multia : 0n;
        var newUSDr = currentUSDr + uSDrDelta;
        newVaultValue = (0, _sdk.makeValue)(newVaultValue.coin(), [this.stakingVaultNFTAssetId, 1n]);
        if (newUSDr > 0n) {
          newVaultValue = _sdk.Value.merge(newVaultValue, (0, _sdk.makeValue)(0n, [stablecoinAssetId, newUSDr]));
        }
        // Preserve any other assets from the original vault
        var existingMultiasset = vaultUtxo.output().amount().multiasset();
        if (existingMultiasset) {
          var _iterator17 = _createForOfIteratorHelper(existingMultiasset.entries()),
            _step17;
          try {
            for (_iterator17.s(); !(_step17 = _iterator17.n()).done;) {
              var _step17$value = _slicedToArray(_step17.value, 2),
                assetId = _step17$value[0],
                amount = _step17$value[1];
              if (assetId !== this.stakingVaultNFTAssetId.toString() && assetId !== stablecoinAssetId.toString()) {
                newVaultValue = _sdk.Value.merge(newVaultValue, (0, _sdk.makeValue)(0n, [_sdk.Core.AssetId(assetId), amount]));
              }
            }
          } catch (err) {
            _iterator17.e(err);
          } finally {
            _iterator17.f();
          }
        }
      }
      tx.lockAssets(this.stakingVaultAddress, newVaultValue, serializedVaultDatum);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Reserve Asset Conversion Utilities
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Get protocol settings from proxy datum (cached).
     */
  }, {
    key: "getVersionSettings",
    value: function () {
      var _getVersionSettings = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee19() {
        var _yield$this$getParsed2, parsedProxyDatum;
        return _regenerator().w(function (_context19) {
          while (1) switch (_context19.n) {
            case 0:
              _context19.n = 1;
              return this.getParsedProxyDatum();
            case 1:
              _yield$this$getParsed2 = _context19.v;
              parsedProxyDatum = _yield$this$getParsed2.parsedProxyDatum;
              return _context19.a(2, parsedProxyDatum.settings);
          }
        }, _callee19, this);
      }));
      function getVersionSettings() {
        return _getVersionSettings.apply(this, arguments);
      }
      return getVersionSettings;
    }()
  }], [{
    key: "create",
    value: function create(blaze, params) {
      var _params$enableTrace, _params$referenceInpu, _params$referenceInpu2, _params$referenceInpu3, _params$referenceInpu4, _params$referenceInpu5;
      var enableTrace = (_params$enableTrace = params.enableTrace) !== null && _params$enableTrace !== void 0 ? _params$enableTrace : false;
      var oneShotScript = new _index.BaseTypes.BaseOneshotOneshotMint({
        transaction_id: params.proxyBootstrap.txHash,
        output_index: params.proxyBootstrap.outputIndex
      }, enableTrace).Script;
      var oneShotPolicyId = oneShotScript.hash();
      var protocolScript = new _index.V0_4Types.V0_4ProtocolProtocolWithdraw(oneShotPolicyId, enableTrace).Script;
      var mintProxyScript = new _index.BaseTypes.BaseMintProxyMintProxyMint(oneShotPolicyId, enableTrace).Script;
      var treasuryScript = new _index.V0_1Types.V0_1TreasuryTreasurySpend({
        transaction_id: params.treasuryBootstrap.txHash,
        output_index: params.treasuryBootstrap.outputIndex
      }, oneShotPolicyId, enableTrace).Script;
      var orderScript = new _index.V0_4Types.V0_4OrderOrderSpend(oneShotPolicyId, enableTrace).Script;
      var stakingVaultScript = new _index.V0_4Types.V0_4StakingVaultStakingVaultSpend({
        transaction_id: params.stakingVaultBootstrap.txHash,
        output_index: params.stakingVaultBootstrap.outputIndex
      }, oneShotPolicyId, enableTrace).Script;
      return new RealfiSDKV0_4(blaze, {
        version: "V0_4",
        proxyBootstrap: params.proxyBootstrap,
        assetNameHex: params.assetNameHex,
        sUSDrAssetNameHex: params.sUSDrAssetNameHex,
        enableTrace: enableTrace,
        scriptDeploymentAddress: params.scriptDeploymentAddress,
        clientSource: params.clientSource
      }, {
        oneShotScript: oneShotScript,
        protocolScript: protocolScript,
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
}(_index3.RealfiSDKBase);
_defineProperty(RealfiSDKV0_4, "buildTimelockNativeScript", _index3.buildTimelockNativeScript);
_defineProperty(RealfiSDKV0_4, "buildTimelockAddress", _index3.buildTimelockAddress);
//# sourceMappingURL=index.js.map