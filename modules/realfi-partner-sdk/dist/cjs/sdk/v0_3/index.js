"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RealfiSDKV0_3 = void 0;
var _core = require("@blaze-cardano/core");
var _data = _interopRequireWildcard(require("@blaze-cardano/data"));
var Data = _data;
var _sdk = require("@blaze-cardano/sdk");
var _index = require("../../generated-types/index.js");
var _index2 = require("../../generated-types/v0_1/index.js");
var _index3 = require("../shared/index.js");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t7 in e) "default" !== _t7 && {}.hasOwnProperty.call(e, _t7) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t7)) && (i.get || i.set) ? o(f, _t7, i) : f[_t7] = e[_t7]); return f; })(e, t); }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
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
/**
 * Parsed order information extracted from a UTXO.
 */
/**
 * Treasury state for order execution.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
/**
 * V0_3 SDK implementation.
 *
 * Extends V0_1 with deposit and withdraw operations for treasury management.
 * All operations (oneshot, protocol, mint proxy, treasury) are consolidated here.
 */
var RealfiSDKV0_3 = exports.RealfiSDKV0_3 = /*#__PURE__*/function (_RealfiSDKBase) {
  function RealfiSDKV0_3(blaze, params, scripts, cachedReferenceInputs) {
    var _this;
    _classCallCheck(this, RealfiSDKV0_3);
    _this = _callSuper(this, RealfiSDKV0_3, [blaze, params, cachedReferenceInputs]);
    _defineProperty(_this, "version", "V0_3");
    // Script hashes and policy IDs
    _defineProperty(_this, "stablecoinPolicyId", void 0);
    _defineProperty(_this, "oneShotPolicyId", void 0);
    _defineProperty(_this, "protocolScriptHash", void 0);
    _defineProperty(_this, "treasuryScriptHash", void 0);
    _defineProperty(_this, "treasuryNFTAssetId", void 0);
    _defineProperty(_this, "orderScriptHash", void 0);
    _defineProperty(_this, "orderScriptAddress", void 0);
    _defineProperty(_this, "treasuryAddress", void 0);
    // Scripts
    _defineProperty(_this, "oneShotScript", void 0);
    _defineProperty(_this, "protocolScript", void 0);
    _defineProperty(_this, "mintProxyScript", void 0);
    _defineProperty(_this, "treasuryScript", void 0);
    _defineProperty(_this, "orderScript", void 0);
    _this.oneShotScript = scripts.oneShotScript;
    _this.protocolScript = scripts.protocolScript;
    _this.mintProxyScript = scripts.mintProxyScript;
    _this.treasuryScript = scripts.treasuryScript;
    _this.orderScript = scripts.orderScript;
    _this.treasuryAddress = (0, _core.addressFromValidator)(_this.network, _this.treasuryScript);
    _this.oneShotPolicyId = _sdk.Core.PolicyId(_this.oneShotScript.hash());
    _this.protocolScriptHash = _this.protocolScript.hash();
    _this.stablecoinPolicyId = _sdk.Core.PolicyId(_this.mintProxyScript.hash());
    _this.treasuryScriptHash = _this.treasuryScript.hash();
    _this.orderScriptHash = _this.orderScript.hash();
    _this.orderScriptAddress = (0, _core.addressFromValidator)(_this.network, _this.orderScript);

    // Derive treasury NFT asset ID from treasury script hash
    var treasuryAssetName = _sdk.Core.AssetName((0, _core.toHex)(Buffer.from("treasury")));
    _this.treasuryNFTAssetId = _sdk.Core.AssetId(_this.treasuryScriptHash + treasuryAssetName.toString());
    return _this;
  }

  /**
   * Create a V0_3 SDK instance.
   */
  _inherits(RealfiSDKV0_3, _RealfiSDKBase);
  return _createClass(RealfiSDKV0_3, [{
    key: "mintTreasuryNFT",
    value: // ─────────────────────────────────────────────────────────────────────────────
    // Treasury Operations
    // ─────────────────────────────────────────────────────────────────────────────
    /**
     * Mint the treasury NFT.
     * This creates a new treasury with an initial datum.
     * The treasury bootstrap UTxO must be provided to consume it.
     */
    function () {
      var _mintTreasuryNFT = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(treasuryBootstrapUtxo) {
        var initialDatum,
          treasuryPolicyId,
          treasuryAssetName,
          treasuryAddress,
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
              treasuryAddress = (0, _core.addressFromValidator)(this.network, this.treasuryScript);
              datum = Data.serialize(_index2.TreasuryDatum, initialDatum);
              _context.n = 1;
              return this.blaze.newTransaction().addInput(treasuryBootstrapUtxo).addMint(treasuryPolicyId, new Map([[treasuryAssetName, 1n]]), Data.Void()).lockAssets(treasuryAddress, (0, _sdk.makeValue)(10000000n, [this.treasuryNFTAssetId, 1n]), datum).provideScript(this.treasuryScript);
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
    /**
     * Deploy the treasury script as a reference script.
     */
  }, {
    key: "deployTreasury",
    value: (function () {
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
    /**
     * Deploy the Orders script as a reference script.
     */
    )
  }, {
    key: "deployOrderContract",
    value: (function () {
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
    /**
     * Get the treasury datum.
     */
    )
  }, {
    key: "getTreasuryDatum",
    value: (function () {
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
    // One-Shot Operations
    // ─────────────────────────────────────────────────────────────────────────────
    /**
     * Mint the one-shot NFT with the initial datum.
     * V0_3 uses ProxyDatum which includes withdraw/deposit permissions.
     */
    )
  }, {
    key: "mintOneShot",
    value: function () {
      var _mintOneShot = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee5(receiverAddress, datum) {
        var utxo, serializedDatum, baseTx, tx;
        return _regenerator().w(function (_context5) {
          while (1) switch (_context5.n) {
            case 0:
              _context5.n = 1;
              return this.resolveBootstrapUtxo();
            case 1:
              utxo = _context5.v;
              serializedDatum = Data.serialize(_index.V0_3Types.ProxyDatum, {
                logic: datum.logic,
                settings: datum.settings
              });
              baseTx = this.blaze.newTransaction().addInput(utxo).addMint(this.oneShotPolicyId, new Map([[_sdk.Core.AssetName(""), 1n]]), Data.Void());
              tx = (0, _index3.lockOrPayAssets)(baseTx, receiverAddress, (0, _sdk.makeValue)(10000000n, [this.oneShotPolicyId, 1n]), serializedDatum).provideScript(this.oneShotScript);
              return _context5.a(2, {
                tx: tx,
                policyId: this.oneShotPolicyId
              });
          }
        }, _callee5, this);
      }));
      function mintOneShot(_x2, _x3) {
        return _mintOneShot.apply(this, arguments);
      }
      return mintOneShot;
    }()
    /**
     * Update the one-shot datum.
     */
  }, {
    key: "updateOneShotDatum",
    value: (function () {
      var _updateOneShotDatum = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee6(receiverAddress, newDatum) {
        var oneshotUtxo, serializedDatum;
        return _regenerator().w(function (_context6) {
          while (1) switch (_context6.n) {
            case 0:
              _context6.n = 1;
              return this.blaze.provider.getUnspentOutputByNFT(_sdk.Core.AssetId(this.oneShotPolicyId));
            case 1:
              oneshotUtxo = _context6.v;
              if (oneshotUtxo) {
                _context6.n = 2;
                break;
              }
              throw new Error("No UTXO found with the one-shot NFT");
            case 2:
              serializedDatum = Data.serialize(_index.V0_3Types.ProxyDatum, {
                logic: newDatum.logic,
                settings: newDatum.settings
              });
              return _context6.a(2, (0, _index3.lockOrPayAssets)(this.blaze.newTransaction().addInput(oneshotUtxo), receiverAddress, (0, _sdk.makeValue)(10000000n, [this.oneShotPolicyId, 1n]), serializedDatum));
          }
        }, _callee6, this);
      }));
      function updateOneShotDatum(_x4, _x5) {
        return _updateOneShotDatum.apply(this, arguments);
      }
      return updateOneShotDatum;
    }()
    /**
     * Get the proxy datum from the one-shot token UTXO.
     * V0_3 returns ProxyDatum which includes withdraw/deposit permissions.
     * Result is cached after first fetch.
     */
    )
  }, {
    key: "getParsedProxyDatum",
    value: (function () {
      var _getParsedProxyDatum = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee7() {
        var _yield$this$getRawPro, proxyUtxo, proxyDatum, parsedProxyDatum, result;
        return _regenerator().w(function (_context7) {
          while (1) switch (_context7.n) {
            case 0:
              if (!this.cachedProxyDatumResult) {
                _context7.n = 1;
                break;
              }
              return _context7.a(2, this.cachedProxyDatumResult);
            case 1:
              _context7.n = 2;
              return this.getRawProxyDatum();
            case 2:
              _yield$this$getRawPro = _context7.v;
              proxyUtxo = _yield$this$getRawPro.proxyUtxo;
              proxyDatum = _yield$this$getRawPro.proxyDatum;
              parsedProxyDatum = (0, _data.parse)(_index.V0_3Types.ProxyDatum, proxyDatum);
              result = {
                proxyUtxo: proxyUtxo,
                proxyDatum: proxyDatum,
                parsedProxyDatum: parsedProxyDatum
              };
              this.cachedProxyDatumResult = result;
              return _context7.a(2, result);
          }
        }, _callee7, this);
      }));
      function getParsedProxyDatum() {
        return _getParsedProxyDatum.apply(this, arguments);
      }
      return getParsedProxyDatum;
    }() // ─────────────────────────────────────────────────────────────────────────────
    // Order Execution Helpers
    // ─────────────────────────────────────────────────────────────────────────────
    /**
     * Parse order UTXOs into IOrderInfo objects and validate they're all the same type.
     * @returns The parsed order infos and the action type (mint or burn)
     */
    )
  }, {
    key: "parseOrderInfos",
    value: function parseOrderInfos(orderUtxos) {
      var orderInfos = [];
      var actionType = null;
      var _iterator = _createForOfIteratorHelper(orderUtxos),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var _utxo$output$datum;
          var utxo = _step.value;
          var datumData = (_utxo$output$datum = utxo.output().datum()) === null || _utxo$output$datum === void 0 ? void 0 : _utxo$output$datum.asInlineData();
          if (!datumData) {
            throw new Error("Order UTXO has no inline datum");
          }
          var datum = (0, _data.parse)(_index.V0_3Types.OrderDatum, datumData);
          var action = void 0;
          var amount = void 0;
          if ("OMint" in datum.action) {
            action = "mint";
            amount = datum.action.OMint.amount;
          } else if ("ORedeem" in datum.action) {
            action = "burn";
            amount = datum.action.ORedeem.amount;
          } else {
            throw new Error("Unknown order action type");
          }

          // Verify all orders are the same type
          if (actionType === null) {
            actionType = action;
          } else if (actionType !== action) {
            throw new Error("Mixed order types in inputs. All orders must be of the same type.");
          }
          orderInfos.push({
            utxo: utxo,
            datum: datum,
            action: action,
            amount: amount
          });
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      if (!actionType) {
        throw new Error("No orders to execute");
      }
      return {
        orderInfos: orderInfos,
        actionType: actionType
      };
    }

    /**
     * Calculate treasury state for order execution.
     * Validates that treasury has sufficient reserve tokens for burn operations.
     */
  }, {
    key: "calculateTreasuryState",
    value: (function () {
      var _calculateTreasuryState = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee8(totalAmount, actionType, reserveTokenAssetId) {
        var _treasuryAssets$get;
        var _yield$this$getTreasu, treasuryUtxo, parsedTreasuryDatum, treasuryValue, treasuryAssets, currentReserve, newReserve;
        return _regenerator().w(function (_context8) {
          while (1) switch (_context8.n) {
            case 0:
              _context8.n = 1;
              return this.getTreasuryDatum();
            case 1:
              _yield$this$getTreasu = _context8.v;
              treasuryUtxo = _yield$this$getTreasu.treasuryUtxo;
              parsedTreasuryDatum = _yield$this$getTreasu.parsedTreasuryDatum;
              treasuryValue = treasuryUtxo.output().amount();
              treasuryAssets = treasuryValue.multiasset();
              currentReserve = (_treasuryAssets$get = treasuryAssets === null || treasuryAssets === void 0 ? void 0 : treasuryAssets.get(reserveTokenAssetId)) !== null && _treasuryAssets$get !== void 0 ? _treasuryAssets$get : 0n;
              newReserve = currentReserve + totalAmount; // For burn operations, validate treasury has enough reserve tokens
              if (!(actionType === "burn")) {
                _context8.n = 3;
                break;
              }
              if (!(currentReserve === 0n)) {
                _context8.n = 2;
                break;
              }
              throw new Error("Treasury has no reserve tokens. Cannot execute burn orders.");
            case 2:
              if (!(newReserve < 0n)) {
                _context8.n = 3;
                break;
              }
              throw new Error("Insufficient reserve tokens in treasury. Treasury has ".concat(currentReserve, " but burn requires ").concat(-totalAmount, "."));
            case 3:
              return _context8.a(2, {
                treasuryUtxo: treasuryUtxo,
                treasuryValue: treasuryValue,
                parsedTreasuryDatum: parsedTreasuryDatum,
                currentReserve: currentReserve,
                newReserve: newReserve
              });
          }
        }, _callee8, this);
      }));
      function calculateTreasuryState(_x6, _x7, _x8) {
        return _calculateTreasuryState.apply(this, arguments);
      }
      return calculateTreasuryState;
    }()
    /**
     * Add destination outputs for executed orders.
     * For mints: sends stablecoins to destinations.
     * For burns: sends reserve tokens to destinations.
     */
    )
  }, {
    key: "addDestinationOutputs",
    value: function addDestinationOutputs(tx, orderInfos, actionType, stablecoinAssetId, reserveTokenAssetId) {
      var _iterator2 = _createForOfIteratorHelper(orderInfos),
        _step2;
      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var orderInfo = _step2.value;
          var destAddress = (0, _index3.destinationToAddress)(this.network, orderInfo.datum.destination);
          if (actionType === "mint") {
            var outputValue = (0, _sdk.makeValue)(2000000n, [stablecoinAssetId, orderInfo.amount]);
            (0, _index3.addDirectOutput)(tx, destAddress, outputValue);
          } else {
            // For burns, amount is negative in the datum, so negate it for output
            var _outputValue = (0, _sdk.makeValue)(2000000n, [reserveTokenAssetId, -orderInfo.amount]);
            console.log(destAddress.toBech32(), orderInfo.amount);
            (0, _index3.addDirectOutput)(tx, destAddress, _outputValue);
          }
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
    }

    /**
     * Update treasury with new reserve balance and circulating supply.
     */
  }, {
    key: "updateTreasury",
    value: function updateTreasury(tx, treasuryState, totalAmount, reserveTokenAssetId) {
      var newTreasuryDatum = {
        circulating_supply: treasuryState.parsedTreasuryDatum.circulating_supply + totalAmount
      };
      var serializedTreasuryDatum = Data.serialize(_index2.TreasuryDatum, newTreasuryDatum);
      tx.addInput(treasuryState.treasuryUtxo, Data.Void());
      var newTreasuryValue = _sdk.Value.merge((0, _sdk.makeValue)(treasuryState.treasuryValue.coin(), [this.treasuryNFTAssetId, 1n]), (0, _sdk.makeValue)(0n, [reserveTokenAssetId, treasuryState.newReserve]));
      tx.lockAssets(this.treasuryAddress, newTreasuryValue, serializedTreasuryDatum);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Minting Operations
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     *
     * @param action "mint" | "burn"
     * @param amount amount of stablecoin to mint or burn
     * @param owner Optional owner multisig script. Defaults to the wallet's change address.
     * @param destination When minting, where to send the minted stablecoins. When burning, where to send the redeemed assets. A datum can be attached.
     * @param data Optional datum data. Defaults to Data.Void()
     * @returns TxBuilder
     */
  }, {
    key: "buildOrderTx",
    value: function () {
      var _buildOrderTx = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee9(_ref) {
        var action, amount, owner, destination, _ref$data, data, CONVERTION_RATIO, stableCoinAssetId, orderContractAddress, scriptTypes, orderAction, orderDatum, serializedDatum, proxyDatum, reserveTokenAssetId, tx, valueToLock, reserveTokenAmount, _t, _t2;
        return _regenerator().w(function (_context9) {
          while (1) switch (_context9.n) {
            case 0:
              action = _ref.action, amount = _ref.amount, owner = _ref.owner, destination = _ref.destination, _ref$data = _ref.data, data = _ref$data === void 0 ? Data.Void() : _ref$data;
              CONVERTION_RATIO = 1n; // Define conversion ratio between stablecoin and reserve token. Should come from datum/settings
              stableCoinAssetId = _sdk.Core.AssetId(this.stablecoinPolicyId + this.assetNameHex);
              orderContractAddress = (0, _core.addressFromValidator)(this.network, this.orderScript);
              if (owner) {
                _context9.n = 2;
                break;
              }
              _context9.n = 1;
              return this.blaze.wallet.getChangeAddress();
            case 1:
              _t = _context9.v.getProps().paymentPart.hash.toString();
              _t2 = {
                key_hash: _t
              };
              owner = {
                Signature: _t2
              };
              _context9.n = 3;
              break;
            case 2:
              scriptTypes = Object.keys(owner);
              if (!(scriptTypes.length !== 1 || scriptTypes[0] !== "Signature")) {
                _context9.n = 3;
                break;
              }
              throw new Error("Only Signature multisig script is currently supported for owner");
            case 3:
              orderAction = action === "mint" ? {
                OMint: {
                  amount: amount
                }
              } : {
                ORedeem: {
                  amount: -amount
                }
              };
              orderDatum = {
                action: orderAction,
                owner: owner,
                destination: destination,
                data: data
              };
              serializedDatum = Data.serialize(_index.V0_3Types.OrderDatum, orderDatum);
              _context9.n = 4;
              return this.getParsedProxyDatum();
            case 4:
              proxyDatum = _context9.v;
              reserveTokenAssetId = _sdk.Core.AssetId(proxyDatum.parsedProxyDatum.settings.reserve_token.join(""));
              tx = this.blaze.newTransaction();
              //TODO: include fees and min ada for when the order is executed?
              if (action === "mint") {
                // minting stablecoin, lock reserve token
                reserveTokenAmount = amount * CONVERTION_RATIO;
                valueToLock = (0, _sdk.makeValue)(1000000n, [reserveTokenAssetId, reserveTokenAmount]);
              } else {
                // burning stablecoin, lock stablecoin
                valueToLock = (0, _sdk.makeValue)(1000000n, [stableCoinAssetId, amount]);
              }
              tx.lockAssets(orderContractAddress, valueToLock, serializedDatum);
              return _context9.a(2, tx);
          }
        }, _callee9, this);
      }));
      function buildOrderTx(_x9) {
        return _buildOrderTx.apply(this, arguments);
      }
      return buildOrderTx;
    }()
    /**
     * Build the SignedPayload_ProtocolRedeemer from order inputs.
     * Returns CBOR hex string to be signed and included in SignedMessage.
     */
  }, {
    key: "getSignedPayloadFromOrderInputs",
    value: (function () {
      var _getSignedPayloadFromOrderInputs = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee0(orderUtxos) {
        var sortedInputs, nonce, resolvedUtxos, requestList, actionType, _iterator3, _step3, utxo, parsed, action, signedPayload, serialized, _t3;
        return _regenerator().w(function (_context0) {
          while (1) switch (_context0.p = _context0.n) {
            case 0:
              if (!(orderUtxos.length === 0)) {
                _context0.n = 1;
                break;
              }
              throw new Error("At least one order UTxO is required");
            case 1:
              // Sort inputs for deterministic ordering
              sortedInputs = (0, _index3.sortOrderInputs)(orderUtxos); // Build nonce from first UTxO
              nonce = (0, _index3.buildNonceFromUtxo)(sortedInputs[0]); // Resolve UTxOs and build request list
              _context0.n = 2;
              return this.blaze.provider.resolveUnspentOutputs(sortedInputs);
            case 2:
              resolvedUtxos = _context0.v;
              requestList = [];
              actionType = null;
              _iterator3 = _createForOfIteratorHelper(resolvedUtxos);
              _context0.p = 3;
              _iterator3.s();
            case 4:
              if ((_step3 = _iterator3.n()).done) {
                _context0.n = 8;
                break;
              }
              utxo = _step3.value;
              parsed = this.parseOrderActionForPayload(utxo); // Validate all orders are the same type
              if (!(actionType === null)) {
                _context0.n = 5;
                break;
              }
              actionType = parsed.actionType;
              _context0.n = 6;
              break;
            case 5:
              if (!(actionType !== parsed.actionType)) {
                _context0.n = 6;
                break;
              }
              throw new Error("Mixed order types in inputs. All orders must be of the same type.");
            case 6:
              requestList.push(this.buildRequestFromUtxo(utxo, parsed.amount, parsed.destination));
            case 7:
              _context0.n = 4;
              break;
            case 8:
              _context0.n = 10;
              break;
            case 9:
              _context0.p = 9;
              _t3 = _context0.v;
              _iterator3.e(_t3);
            case 10:
              _context0.p = 10;
              _iterator3.f();
              return _context0.f(10);
            case 11:
              // Build the action (ProtocolRedeemer)
              action = actionType === "OMint" ? {
                Mint: {
                  requests: requestList
                }
              } : {
                Burn: {
                  requests: requestList
                }
              }; // Build and serialize SignedPayload_ProtocolRedeemer
              signedPayload = {
                action: action,
                nonce: nonce
              };
              serialized = Data.serialize(_index.V0_3Types.SignedPayload_ProtocolRedeemer, signedPayload);
              return _context0.a(2, serialized.toCbor().toString());
          }
        }, _callee0, this, [[3, 9, 10, 11]]);
      }));
      function getSignedPayloadFromOrderInputs(_x0) {
        return _getSignedPayloadFromOrderInputs.apply(this, arguments);
      }
      return getSignedPayloadFromOrderInputs;
    }()
    /**
     * Parse an order UTxO and extract action type, amount, and destination.
     */
    )
  }, {
    key: "parseOrderActionForPayload",
    value: function parseOrderActionForPayload(utxo) {
      var _utxo$output$datum2;
      var datum = (_utxo$output$datum2 = utxo.output().datum()) === null || _utxo$output$datum2 === void 0 ? void 0 : _utxo$output$datum2.asInlineData();
      if (!datum) {
        throw new Error("Order UTXO has no inline datum");
      }
      var parsedDatum = (0, _data.parse)(_index.V0_3Types.OrderDatum, datum);
      if ("OMint" in parsedDatum.action) {
        return {
          actionType: "OMint",
          amount: parsedDatum.action.OMint.amount,
          destination: parsedDatum.destination
        };
      } else if ("ORedeem" in parsedDatum.action) {
        return {
          actionType: "ORedeem",
          amount: parsedDatum.action.ORedeem.amount,
          destination: parsedDatum.destination
        };
      }
      throw new Error("Unknown order action type");
    }

    /**
     * Build a Request from an order UTxO.
     * Serializes the origin (OutputReference) as CBOR to match Aiken's format.
     */
  }, {
    key: "buildRequestFromUtxo",
    value: function buildRequestFromUtxo(utxo, amount, destination) {
      var input = utxo.input();
      var txId = input.transactionId().toString();
      var outputIndex = input.index();

      // Serialize origin as PlutusData (matching Aiken's cbor.serialise format)
      // OutputReference struct: { transaction_id: ByteArray, output_index: Int }
      var fieldsList = new _sdk.Core.PlutusList();
      fieldsList.add(_sdk.Core.PlutusData.newBytes(Buffer.from(txId, "hex")));
      fieldsList.add(_sdk.Core.PlutusData.newInteger(outputIndex));
      var outputRefData = _sdk.Core.PlutusData.newConstrPlutusData(new _sdk.Core.ConstrPlutusData(0n, fieldsList));
      return {
        origin: outputRefData.toCbor(),
        amount: amount,
        destination: destination
      };
    }

    /**
     * Build a transaction to execute orders.
     * This consumes order UTXOs, validates the signed redeemer, mints/burns stablecoins,
     * and sends the results to the destinations specified in the orders.
     *
     * @param params.orderInputs - The order transaction inputs to execute
     * @param params.signedPayload - The signed payload hex string from getSignedPayloadFromOrderInputs
     * @param params.signatures - Array of signatures from each signer
     * @returns TxBuilder ready to be completed and signed
     */
  }, {
    key: "buildExecuteOrdersTx",
    value: (function () {
      var _buildExecuteOrdersTx = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee1(params) {
        var orderInputs, signedPayload, signatures, sortedOrderInputs, orderUtxos, _this$parseOrderInfos, orderInfos, actionType, _yield$this$getParsed, proxyUtxo, parsedProxyDatum, refInputs, protocolRefInput, orderRefInput, treasuryRefInput, totalAmount, reserveTokenAssetId, stablecoinAssetId, treasuryState, requestToOutputs, i, serializedSignedRedeemer, executeRedeemer, tx, _iterator4, _step4, orderInfo, protocolRewardAccount;
        return _regenerator().w(function (_context1) {
          while (1) switch (_context1.n) {
            case 0:
              orderInputs = params.orderInputs, signedPayload = params.signedPayload, signatures = params.signatures; // Sort and resolve order UTXOs
              sortedOrderInputs = (0, _index3.sortOrderInputs)(orderInputs);
              _context1.n = 1;
              return this.blaze.provider.resolveUnspentOutputs(sortedOrderInputs);
            case 1:
              orderUtxos = _context1.v;
              // Parse orders and validate they're all the same type
              _this$parseOrderInfos = this.parseOrderInfos(orderUtxos), orderInfos = _this$parseOrderInfos.orderInfos, actionType = _this$parseOrderInfos.actionType; // Get protocol datum for permissions and registry
              _context1.n = 2;
              return this.getParsedProxyDatum();
            case 2:
              _yield$this$getParsed = _context1.v;
              proxyUtxo = _yield$this$getParsed.proxyUtxo;
              parsedProxyDatum = _yield$this$getParsed.parsedProxyDatum;
              _context1.n = 3;
              return this.getScriptReferenceInputs({
                protocol: this.protocolScriptHash,
                order: this.orderScriptHash,
                treasury: this.treasuryScriptHash
              });
            case 3:
              refInputs = _context1.v;
              protocolRefInput = refInputs.protocol;
              orderRefInput = refInputs.order;
              treasuryRefInput = refInputs.treasury;
              if (!(!protocolRefInput || !orderRefInput || !treasuryRefInput)) {
                _context1.n = 4;
                break;
              }
              throw new Error("Missing reference script inputs. Make sure all scripts are deployed.");
            case 4:
              // Calculate total amount and get asset IDs
              totalAmount = orderInfos.reduce(function (sum, info) {
                return sum + info.amount;
              }, 0n);
              reserveTokenAssetId = _sdk.Core.AssetId(parsedProxyDatum.settings.reserve_token.join(""));
              stablecoinAssetId = _sdk.Core.AssetId(this.stablecoinPolicyId + this.assetNameHex); // Calculate treasury state and validate for burns
              _context1.n = 5;
              return this.calculateTreasuryState(totalAmount, actionType, reserveTokenAssetId);
            case 5:
              treasuryState = _context1.v;
              // Build request_to_outputs mapping (1:1 since outputs are in same order as inputs)
              requestToOutputs = {};
              for (i = 0; i < orderInfos.length; i++) {
                requestToOutputs[i] = BigInt(i);
              }

              // Serialize redeemers
              serializedSignedRedeemer = Data.serialize(_index.V0_3Types.SignedRedeemer_ExtraProtocolRedeemer, {
                extra: {
                  request_to_outputs: requestToOutputs
                },
                payload: signedPayload,
                signatures: signatures
              });
              executeRedeemer = Data.serialize(_index.V0_3Types.OrderRedeemer, "Execute"); // Build the transaction
              tx = this.blaze.newTransaction(); // Add order inputs with Execute redeemer
              _iterator4 = _createForOfIteratorHelper(orderInfos);
              try {
                for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
                  orderInfo = _step4.value;
                  tx.addInput(orderInfo.utxo, executeRedeemer);
                }

                // Add reference inputs
              } catch (err) {
                _iterator4.e(err);
              } finally {
                _iterator4.f();
              }
              tx.addReferenceInput(protocolRefInput);
              tx.addReferenceInput(orderRefInput);
              tx.addReferenceInput(proxyUtxo);
              tx.addReferenceInput(treasuryRefInput);

              // Add protocol withdrawal with signed redeemer
              protocolRewardAccount = _sdk.Core.RewardAccount.fromCredential({
                type: _sdk.Core.CredentialType.ScriptHash,
                hash: this.protocolScriptHash
              }, this.network);
              tx.addWithdrawal(protocolRewardAccount, 0n, serializedSignedRedeemer);

              // Mint/burn stablecoins
              tx.addMint(this.stablecoinPolicyId, new Map([[_sdk.Core.AssetName(this.assetNameHex), totalAmount]]), Data.Void());

              // Add destination outputs
              this.addDestinationOutputs(tx, orderInfos, actionType, stablecoinAssetId, reserveTokenAssetId);

              // Update treasury
              this.updateTreasury(tx, treasuryState, totalAmount, reserveTokenAssetId);

              // Provide the mint proxy script for minting
              tx.provideScript(this.mintProxyScript);
              return _context1.a(2, tx);
          }
        }, _callee1, this);
      }));
      function buildExecuteOrdersTx(_x1) {
        return _buildExecuteOrdersTx.apply(this, arguments);
      }
      return buildExecuteOrdersTx;
    }()
    /**
     * Build a transaction to cancel orders.
     * This returns the locked assets to the specified destination address.
     * The transaction must be signed by the owner(s) specified in each order's datum.
     *
     * @param params.orderInputs - The order transaction inputs to cancel
     * @param params.destination - Optional destination address. Defaults to the wallet's change address.
     * @returns TxBuilder ready to be completed and signed
     */
    )
  }, {
    key: "buildCancelOrdersTx",
    value: (function () {
      var _buildCancelOrdersTx = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee10(params) {
        var orderInputs, destination, versionHint, orderUtxos, cachedOrderRefs, orderRefInputs, cancelRedeemer, destAddress, tx, _iterator5, _step5, orderRefInput, currentOrderRefInput, requiredSigners, _iterator6, _step6, utxo, owner, _iterator8, _step8, keyHash, outputValue, _iterator7, _step7, _keyHash, _t4, _t5;
        return _regenerator().w(function (_context10) {
          while (1) switch (_context10.p = _context10.n) {
            case 0:
              orderInputs = params.orderInputs, destination = params.destination, versionHint = params.versionHint; // Resolve order UTXOs
              _context10.n = 1;
              return this.blaze.provider.resolveUnspentOutputs(orderInputs);
            case 1:
              orderUtxos = _context10.v;
              if (!(orderUtxos.length === 0)) {
                _context10.n = 2;
                break;
              }
              throw new Error("No orders to cancel");
            case 2:
              cachedOrderRefs = this.cachedReferenceInputs.orderRefInput ? new Map([[this.orderScriptHash, this.cachedReferenceInputs.orderRefInput]]) : undefined;
              _context10.n = 3;
              return (0, _index3.resolveOrderReferenceInputs)(this.blaze, orderUtxos, cachedOrderRefs, this.scriptDeploymentAddress);
            case 3:
              orderRefInputs = _context10.v;
              // Build the cancel redeemer
              cancelRedeemer = Data.serialize(_index.V0_3Types.OrderRedeemer, "Cancel"); // Determine destination address
              if (!(destination !== null && destination !== void 0)) {
                _context10.n = 4;
                break;
              }
              _t4 = destination;
              _context10.n = 6;
              break;
            case 4:
              _context10.n = 5;
              return this.blaze.wallet.getChangeAddress();
            case 5:
              _t4 = _context10.v;
            case 6:
              destAddress = _t4;
              // Build the transaction
              tx = this.blaze.newTransaction();
              _iterator5 = _createForOfIteratorHelper(orderRefInputs.values());
              try {
                for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
                  orderRefInput = _step5.value;
                  tx.addReferenceInput(orderRefInput);
                }

                // cache current version of order script reference input
              } catch (err) {
                _iterator5.e(err);
              } finally {
                _iterator5.f();
              }
              currentOrderRefInput = orderRefInputs.get(this.orderScriptHash);
              if (currentOrderRefInput && !this.cachedReferenceInputs.orderRefInput) {
                this.cachedReferenceInputs.orderRefInput = currentOrderRefInput;
              }

              // Collect all required signers from order owners
              requiredSigners = new Set(); // Process each order
              _iterator6 = _createForOfIteratorHelper(orderUtxos);
              _context10.p = 7;
              _iterator6.s();
            case 8:
              if ((_step6 = _iterator6.n()).done) {
                _context10.n = 11;
                break;
              }
              utxo = _step6.value;
              _context10.n = 9;
              return (0, _index3.parseCancelOwner)(utxo, versionHint);
            case 9:
              owner = _context10.v;
              // Extract required signers from the owner's MultisigScript
              _iterator8 = _createForOfIteratorHelper((0, _index3.getSignatureKeyHashesFromMultisigScript)(owner));
              try {
                for (_iterator8.s(); !(_step8 = _iterator8.n()).done;) {
                  keyHash = _step8.value;
                  requiredSigners.add(keyHash);
                }

                // Add order input with Cancel redeemer
              } catch (err) {
                _iterator8.e(err);
              } finally {
                _iterator8.f();
              }
              tx.addInput(utxo, cancelRedeemer);

              // Return the locked assets to destination
              outputValue = utxo.output().amount();
              (0, _index3.addDirectOutput)(tx, destAddress, outputValue);
            case 10:
              _context10.n = 8;
              break;
            case 11:
              _context10.n = 13;
              break;
            case 12:
              _context10.p = 12;
              _t5 = _context10.v;
              _iterator6.e(_t5);
            case 13:
              _context10.p = 13;
              _iterator6.f();
              return _context10.f(13);
            case 14:
              // Add all required signers to the transaction
              _iterator7 = _createForOfIteratorHelper(requiredSigners);
              try {
                for (_iterator7.s(); !(_step7 = _iterator7.n()).done;) {
                  _keyHash = _step7.value;
                  tx.addRequiredSigner((0, _core.Ed25519KeyHashHex)(_keyHash));
                }
              } catch (err) {
                _iterator7.e(err);
              } finally {
                _iterator7.f();
              }
              return _context10.a(2, tx);
          }
        }, _callee10, this, [[7, 12, 13, 14]]);
      }));
      function buildCancelOrdersTx(_x10) {
        return _buildCancelOrdersTx.apply(this, arguments);
      }
      return buildCancelOrdersTx;
    }() // ─────────────────────────────────────────────────────────────────────────────
    // Treasury Operations: Withdraw and Deposit
    // ─────────────────────────────────────────────────────────────────────────────
    /**
     * Build a transaction to withdraw reserve tokens from the treasury.
     * The transaction must be signed by the authorized withdraw permission signers.
     *
     * @param params.requests - Array of withdraw requests with destinations and amounts
     * @param params.signedPayload - The signed payload hex string from getSignedPayloadForWithdraw
     * @param params.signatures - Array of KeySignature tuples from authorized signers
     * @returns TxBuilder ready to be completed and signed
     */
    /**
     * Build a withdraw transaction to remove reserve from the treasury.
     * @param amount Amount to withdraw from treasury
     * @param receiverAddress Address to send withdrawn assets to; defaults to wallet address
     */
    )
  }, {
    key: "buildWithdrawTx",
    value: function () {
      var _buildWithdrawTx = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee11(assetAmount, receiverAddress) {
        var _assetAmount$id;
        var refInputs, receiver, _yield$this$getParsed2, proxyUtxo, parsedProxyDatum, _yield$this$getTreasu2, treasuryUtxo, treasuryDatum, serializedPayload, serializedSignedRedeemer, rewardAccount, requiredSigners, reserveToken, treasuryAddress, inititalTreasuryValue, withdrawValue, newTreasuryValue, tx, _iterator9, _step9, signer, _t6;
        return _regenerator().w(function (_context11) {
          while (1) switch (_context11.n) {
            case 0:
              _context11.n = 1;
              return this.getScriptReferenceInputs({
                protocol: this.protocolScriptHash,
                proxy: this.mintProxyScript.hash(),
                treasury: this.treasuryScriptHash
              });
            case 1:
              refInputs = _context11.v;
              if (!receiverAddress) {
                _context11.n = 2;
                break;
              }
              _t6 = _sdk.Core.Address.fromBech32(receiverAddress);
              _context11.n = 4;
              break;
            case 2:
              _context11.n = 3;
              return this.blaze.wallet.getChangeAddress();
            case 3:
              _t6 = _context11.v;
            case 4:
              receiver = _t6;
              _context11.n = 5;
              return this.getParsedProxyDatum();
            case 5:
              _yield$this$getParsed2 = _context11.v;
              proxyUtxo = _yield$this$getParsed2.proxyUtxo;
              parsedProxyDatum = _yield$this$getParsed2.parsedProxyDatum;
              _context11.n = 6;
              return this.getTreasuryDatum();
            case 6:
              _yield$this$getTreasu2 = _context11.v;
              treasuryUtxo = _yield$this$getTreasu2.treasuryUtxo;
              treasuryDatum = _yield$this$getTreasu2.treasuryDatum;
              serializedPayload = (0, _index3.getSignedPayloadForWithdraw)(assetAmount.amount, treasuryUtxo); // Build SignedRedeemer_ExtraProtocolRedeemer
              serializedSignedRedeemer = Data.serialize(_index.V0_3Types.SignedRedeemer_ExtraProtocolRedeemer, {
                extra: {
                  request_to_outputs: {
                    0: 0n
                  }
                },
                payload: serializedPayload,
                signatures: []
              });
              rewardAccount = this.getProtocolRewardAccount();
              requiredSigners = (0, _index3.getSignatureKeyHashesFromMultisigScript)(parsedProxyDatum.settings.withdraw_permission).map(function (key) {
                return _sdk.Core.Ed25519KeyHashHex(key);
              });
              reserveToken = (0, _core.AssetId)((_assetAmount$id = assetAmount.id) !== null && _assetAmount$id !== void 0 ? _assetAmount$id : parsedProxyDatum.settings.reserve_token.join(""));
              treasuryAddress = (0, _core.addressFromCredential)(this.network, (0, _index3.credentialFromScriptHash)((0, _core.Hash28ByteBase16)(parsedProxyDatum.settings.registry.treasury)));
              inititalTreasuryValue = treasuryUtxo.output().amount();
              withdrawValue = (0, _sdk.makeValue)(0n, [reserveToken, -assetAmount.amount]);
              newTreasuryValue = _sdk.Value.merge(inititalTreasuryValue, withdrawValue);
              tx = this.blaze.newTransaction().addWithdrawal(rewardAccount, 0n, serializedSignedRedeemer).addReferenceInput(proxyUtxo).addReferenceInput(refInputs.protocol).addReferenceInput(refInputs.proxy).addReferenceInput(refInputs.treasury).addInput(treasuryUtxo, Data.Void());
              (0, _index3.addDirectOutput)(tx, receiver, (0, _sdk.makeValue)(0n, [reserveToken, assetAmount.amount]));
              tx.lockAssets(treasuryAddress, newTreasuryValue, treasuryDatum);
              _iterator9 = _createForOfIteratorHelper(requiredSigners);
              try {
                for (_iterator9.s(); !(_step9 = _iterator9.n()).done;) {
                  signer = _step9.value;
                  tx.addRequiredSigner(signer);
                }
              } catch (err) {
                _iterator9.e(err);
              } finally {
                _iterator9.f();
              }
              return _context11.a(2, tx);
          }
        }, _callee11, this);
      }));
      function buildWithdrawTx(_x11, _x12) {
        return _buildWithdrawTx.apply(this, arguments);
      }
      return buildWithdrawTx;
    }()
  }, {
    key: "buildDepositTx",
    value: function () {
      var _buildDepositTx = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee12(assetAmount) {
        var _assetAmount$id2;
        var refInputs, _yield$this$getParsed3, proxyUtxo, parsedProxyDatum, _yield$this$getTreasu3, treasuryUtxo, treasuryDatum, serializedPayload, serializedSignedRedeemer, rewardAccount, requiredSigners, reserveToken, treasuryAddress, inititalTreasuryValue, depositValue, newTreasuryValue, tx, _iterator0, _step0, signer;
        return _regenerator().w(function (_context12) {
          while (1) switch (_context12.n) {
            case 0:
              _context12.n = 1;
              return this.getScriptReferenceInputs({
                protocol: this.protocolScriptHash,
                proxy: this.mintProxyScript.hash(),
                treasury: this.treasuryScriptHash
              });
            case 1:
              refInputs = _context12.v;
              _context12.n = 2;
              return this.getParsedProxyDatum();
            case 2:
              _yield$this$getParsed3 = _context12.v;
              proxyUtxo = _yield$this$getParsed3.proxyUtxo;
              parsedProxyDatum = _yield$this$getParsed3.parsedProxyDatum;
              _context12.n = 3;
              return this.getTreasuryDatum();
            case 3:
              _yield$this$getTreasu3 = _context12.v;
              treasuryUtxo = _yield$this$getTreasu3.treasuryUtxo;
              treasuryDatum = _yield$this$getTreasu3.treasuryDatum;
              serializedPayload = (0, _index3.getSignedPayloadForDeposit)(assetAmount.amount, treasuryUtxo); // Build SignedRedeemer_ExtraProtocolRedeemer
              serializedSignedRedeemer = Data.serialize(_index.V0_3Types.SignedRedeemer_ExtraProtocolRedeemer, {
                extra: {
                  request_to_outputs: {
                    0: 0n
                  }
                },
                payload: serializedPayload,
                signatures: []
              });
              rewardAccount = this.getProtocolRewardAccount();
              requiredSigners = (0, _index3.getSignatureKeyHashesFromMultisigScript)(parsedProxyDatum.settings.deposit_permission).map(function (key) {
                return _sdk.Core.Ed25519KeyHashHex(key);
              });
              reserveToken = (0, _core.AssetId)((_assetAmount$id2 = assetAmount.id) !== null && _assetAmount$id2 !== void 0 ? _assetAmount$id2 : parsedProxyDatum.settings.reserve_token.join(""));
              treasuryAddress = (0, _core.addressFromCredential)(this.network, (0, _index3.credentialFromScriptHash)((0, _core.Hash28ByteBase16)(parsedProxyDatum.settings.registry.treasury)));
              inititalTreasuryValue = treasuryUtxo.output().amount();
              depositValue = (0, _sdk.makeValue)(0n, [reserveToken, assetAmount.amount]);
              newTreasuryValue = _sdk.Value.merge(inititalTreasuryValue, depositValue);
              tx = this.blaze.newTransaction().addWithdrawal(rewardAccount, 0n, serializedSignedRedeemer).addReferenceInput(proxyUtxo).addReferenceInput(refInputs.protocol).addReferenceInput(refInputs.proxy).addReferenceInput(refInputs.treasury).addInput(treasuryUtxo, Data.Void()).lockAssets(treasuryAddress, newTreasuryValue, treasuryDatum);
              _iterator0 = _createForOfIteratorHelper(requiredSigners);
              try {
                for (_iterator0.s(); !(_step0 = _iterator0.n()).done;) {
                  signer = _step0.value;
                  tx.addRequiredSigner(signer);
                }
              } catch (err) {
                _iterator0.e(err);
              } finally {
                _iterator0.f();
              }
              return _context12.a(2, tx);
          }
        }, _callee12, this);
      }));
      function buildDepositTx(_x13) {
        return _buildDepositTx.apply(this, arguments);
      }
      return buildDepositTx;
    }()
  }], [{
    key: "create",
    value: function create(blaze, params) {
      var _params$enableTrace, _params$referenceInpu, _params$referenceInpu2, _params$referenceInpu3, _params$referenceInpu4;
      var enableTrace = (_params$enableTrace = params.enableTrace) !== null && _params$enableTrace !== void 0 ? _params$enableTrace : false;

      // Instantiate one-shot script
      var oneShotScript = new _index.BaseTypes.BaseOneshotOneshotMint({
        transaction_id: params.proxyBootstrap.txHash,
        output_index: params.proxyBootstrap.outputIndex
      }, enableTrace).Script;
      var oneShotPolicyId = oneShotScript.hash();
      // Instantiate protocol script (V0_3 uses V0_3ProtocolProtocolWithdraw)
      var protocolScript = new _index.V0_3Types.V0_3ProtocolProtocolWithdraw(oneShotPolicyId, enableTrace).Script;
      // Instantiate mint proxy script (parameterized by one-shot policy ID)
      var mintProxyScript = new _index.BaseTypes.BaseMintProxyMintProxyMint(oneShotPolicyId, enableTrace).Script;
      // Instantiate treasury script from treasury bootstrap
      var treasuryScript = new _index.V0_1Types.V0_1TreasuryTreasurySpend({
        transaction_id: params.treasuryBootstrap.txHash,
        output_index: params.treasuryBootstrap.outputIndex
      }, oneShotPolicyId, enableTrace).Script;
      var orderScript = new _index.V0_3Types.V0_3OrderOrderSpend(oneShotPolicyId, enableTrace).Script;
      return new RealfiSDKV0_3(blaze, {
        version: "V0_3",
        proxyBootstrap: params.proxyBootstrap,
        assetNameHex: params.assetNameHex,
        enableTrace: enableTrace,
        scriptDeploymentAddress: params.scriptDeploymentAddress
      }, {
        oneShotScript: oneShotScript,
        protocolScript: protocolScript,
        mintProxyScript: mintProxyScript,
        treasuryScript: treasuryScript,
        orderScript: orderScript
      }, {
        protocolRefInput: (_params$referenceInpu = params.referenceInputs) === null || _params$referenceInpu === void 0 ? void 0 : _params$referenceInpu.protocolRefInput,
        proxyRefInput: (_params$referenceInpu2 = params.referenceInputs) === null || _params$referenceInpu2 === void 0 ? void 0 : _params$referenceInpu2.proxyRefInput,
        treasuryRefInput: (_params$referenceInpu3 = params.referenceInputs) === null || _params$referenceInpu3 === void 0 ? void 0 : _params$referenceInpu3.treasuryRefInput,
        orderRefInput: (_params$referenceInpu4 = params.referenceInputs) === null || _params$referenceInpu4 === void 0 ? void 0 : _params$referenceInpu4.orderRefInput
      });
    }
  }]);
}(_index3.RealfiSDKBase);
//# sourceMappingURL=index.js.map