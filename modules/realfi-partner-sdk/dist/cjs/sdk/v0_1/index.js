"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RealfiSDKV0_1 = void 0;
var _core = require("@blaze-cardano/core");
var _data = _interopRequireWildcard(require("@blaze-cardano/data"));
var Data = _data;
var _sdk = require("@blaze-cardano/sdk");
var _index = require("../../generated-types/index.js");
var _index2 = require("../shared/index.js");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t in e) "default" !== _t && {}.hasOwnProperty.call(e, _t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t)) && (i.get || i.set) ? o(f, _t, i) : f[_t] = e[_t]); return f; })(e, t); }
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
// eslint-disable-next-line @typescript-eslint/naming-convention
/**
 * V0_1 SDK implementation.
 *
 * Includes treasury management, reserve backing, and circulating supply tracking.
 * All operations (oneshot, protocol, mint proxy, treasury) are consolidated here.
 */
var RealfiSDKV0_1 = exports.RealfiSDKV0_1 = /*#__PURE__*/function (_RealfiSDKBase) {
  function RealfiSDKV0_1(blaze, params, scripts, treasuryNFTAssetId, cachedReferenceInputs) {
    var _this;
    _classCallCheck(this, RealfiSDKV0_1);
    _this = _callSuper(this, RealfiSDKV0_1, [blaze, params, cachedReferenceInputs]);
    _defineProperty(_this, "version", "V0_1");
    // Script hashes and policy IDs
    _defineProperty(_this, "stablecoinPolicyId", void 0);
    _defineProperty(_this, "oneShotPolicyId", void 0);
    _defineProperty(_this, "protocolScriptHash", void 0);
    _defineProperty(_this, "treasuryScriptHash", void 0);
    _defineProperty(_this, "treasuryNFTAssetId", void 0);
    // Scripts
    _defineProperty(_this, "oneShotScript", void 0);
    _defineProperty(_this, "protocolScript", void 0);
    _defineProperty(_this, "mintProxyScript", void 0);
    _defineProperty(_this, "treasuryScript", void 0);
    _this.oneShotScript = scripts.oneShotScript;
    _this.protocolScript = scripts.protocolScript;
    _this.mintProxyScript = scripts.mintProxyScript;
    _this.treasuryScript = scripts.treasuryScript;
    _this.oneShotPolicyId = _sdk.Core.PolicyId(_this.oneShotScript.hash());
    _this.protocolScriptHash = _this.protocolScript.hash();
    _this.stablecoinPolicyId = _sdk.Core.PolicyId(_this.mintProxyScript.hash());
    _this.treasuryScriptHash = _this.treasuryScript.hash();
    _this.treasuryNFTAssetId = treasuryNFTAssetId;
    return _this;
  }

  /**
   * Create a V0_1 SDK instance.
   */
  _inherits(RealfiSDKV0_1, _RealfiSDKBase);
  return _createClass(RealfiSDKV0_1, [{
    key: "mintTreasuryNFT",
    value: // ─────────────────────────────────────────────────────────────────────────────
    // Treasury Operations
    // ─────────────────────────────────────────────────────────────────────────────
    /**
     * Mint the treasury NFT.
     * This creates a new treasury with an initial datum.
     * Uses the treasury bootstrap UTXO that was provided when creating the SDK.
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
              treasuryPolicyId = _sdk.Core.PolicyId(this.treasuryScript.hash());
              treasuryAssetName = _sdk.Core.AssetName((0, _core.toHex)(Buffer.from("treasury")));
              treasuryAddress = (0, _core.addressFromValidator)(this.network, this.treasuryScript);
              datum = Data.serialize(_index.V0_1Types.TreasuryDatum, initialDatum);
              tx = this.blaze.newTransaction().addInput(treasuryBootstrapUtxo).addMint(treasuryPolicyId, new Map([[treasuryAssetName, 1n]]), Data.Void()).lockAssets(treasuryAddress, (0, _sdk.makeValue)(1000000n, [this.treasuryNFTAssetId, 1n]), datum).provideScript(this.treasuryScript);
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
              return _context2.a(2, (0, _index2.deployScript)(this.blaze, this.treasuryScript, this.scriptDeploymentAddress));
          }
        }, _callee2, this);
      }));
      function deployTreasury() {
        return _deployTreasury.apply(this, arguments);
      }
      return deployTreasury;
    }()
    /**
     * Get the treasury datum.
     */
    )
  }, {
    key: "getTreasuryDatum",
    value: (function () {
      var _getTreasuryDatum = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3() {
        var _yield$getDatumFromNF, treasuryUtxo, treasuryDatum, parsedTreasuryDatum;
        return _regenerator().w(function (_context3) {
          while (1) switch (_context3.n) {
            case 0:
              _context3.n = 1;
              return (0, _index2.getDatumFromNFT)(this.blaze, this.treasuryNFTAssetId, _index.V0_1Types.TreasuryDatum);
            case 1:
              _yield$getDatumFromNF = _context3.v;
              treasuryUtxo = _yield$getDatumFromNF.utxo;
              treasuryDatum = _yield$getDatumFromNF.datum;
              parsedTreasuryDatum = _yield$getDatumFromNF.parsedDatum;
              if (treasuryUtxo) {
                _context3.n = 2;
                break;
              }
              throw new Error("No UTXO found with the treasury NFT");
            case 2:
              if (treasuryDatum) {
                _context3.n = 3;
                break;
              }
              throw new Error("No treasury datum found");
            case 3:
              return _context3.a(2, {
                treasuryUtxo: treasuryUtxo,
                treasuryDatum: treasuryDatum,
                parsedTreasuryDatum: parsedTreasuryDatum
              });
          }
        }, _callee3, this);
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
     * This consumes the bootstrap UTXO and can only be done once.
     */
    )
  }, {
    key: "mintOneShot",
    value: function () {
      var _mintOneShot = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4(receiverAddress, datum) {
        var utxo, serializedDatum, baseTx, tx;
        return _regenerator().w(function (_context4) {
          while (1) switch (_context4.n) {
            case 0:
              _context4.n = 1;
              return this.resolveBootstrapUtxo();
            case 1:
              utxo = _context4.v;
              serializedDatum = Data.serialize(_index.V0_1Types.ProxyDatum, {
                logic: datum.logic,
                settings: datum.settings
              });
              baseTx = this.blaze.newTransaction().addInput(utxo).addMint(this.oneShotPolicyId, new Map([[_sdk.Core.AssetName(""), 1n]]), Data.Void());
              tx = (0, _index2.lockOrPayAssets)(baseTx, receiverAddress, (0, _sdk.makeValue)(1000000n, [this.oneShotPolicyId, 1n]), serializedDatum).provideScript(this.oneShotScript);
              return _context4.a(2, {
                tx: tx,
                policyId: this.oneShotPolicyId
              });
          }
        }, _callee4, this);
      }));
      function mintOneShot(_x2, _x3) {
        return _mintOneShot.apply(this, arguments);
      }
      return mintOneShot;
    }()
    /**
     * Update the one-shot datum.
     * This spends the one-shot UTXO and sends it back to the receiver with new datum.
     */
  }, {
    key: "updateOneShotDatum",
    value: (function () {
      var _updateOneShotDatum = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee5(receiverAddress, newDatum) {
        var oneshotUtxo, serializedDatum, tx;
        return _regenerator().w(function (_context5) {
          while (1) switch (_context5.n) {
            case 0:
              _context5.n = 1;
              return this.blaze.provider.getUnspentOutputByNFT(_sdk.Core.AssetId(this.oneShotPolicyId));
            case 1:
              oneshotUtxo = _context5.v;
              if (oneshotUtxo) {
                _context5.n = 2;
                break;
              }
              throw new Error("No UTXO found with the one-shot NFT");
            case 2:
              serializedDatum = Data.serialize(_index.V0_1Types.ProxyDatum, {
                logic: newDatum.logic,
                settings: newDatum.settings
              });
              tx = (0, _index2.lockOrPayAssets)(this.blaze.newTransaction().addInput(oneshotUtxo), receiverAddress, (0, _sdk.makeValue)(1000000n, [this.oneShotPolicyId, 1n]), serializedDatum);
              return _context5.a(2, tx);
          }
        }, _callee5, this);
      }));
      function updateOneShotDatum(_x4, _x5) {
        return _updateOneShotDatum.apply(this, arguments);
      }
      return updateOneShotDatum;
    }()
    /**
     * Get the proxy datum from the one-shot token UTXO.
     * Result is cached after first fetch.
     */
    )
  }, {
    key: "getParsedProxyDatum",
    value: (function () {
      var _getParsedProxyDatum = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee6() {
        var _yield$this$getRawPro, proxyUtxo, proxyDatum, parsedProxyDatum, result;
        return _regenerator().w(function (_context6) {
          while (1) switch (_context6.n) {
            case 0:
              if (!this.cachedProxyDatumResult) {
                _context6.n = 1;
                break;
              }
              return _context6.a(2, this.cachedProxyDatumResult);
            case 1:
              _context6.n = 2;
              return this.getRawProxyDatum();
            case 2:
              _yield$this$getRawPro = _context6.v;
              proxyUtxo = _yield$this$getRawPro.proxyUtxo;
              proxyDatum = _yield$this$getRawPro.proxyDatum;
              parsedProxyDatum = (0, _data.parse)(_index.V0_1Types.ProxyDatum, proxyDatum);
              result = {
                proxyUtxo: proxyUtxo,
                proxyDatum: proxyDatum,
                parsedProxyDatum: parsedProxyDatum
              };
              this.cachedProxyDatumResult = result;
              return _context6.a(2, result);
          }
        }, _callee6, this);
      }));
      function getParsedProxyDatum() {
        return _getParsedProxyDatum.apply(this, arguments);
      }
      return getParsedProxyDatum;
    }() // ─────────────────────────────────────────────────────────────────────────────
    // Minting Operations
    // ─────────────────────────────────────────────────────────────────────────────
    /**
     * Build a mint (positive amount) or burn (negative amount) transaction.
     * V0_1 minting includes treasury update for circulating supply tracking.
     */
    )
  }, {
    key: "buildMintTx",
    value: function () {
      var _buildMintTx = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee7(assetAmount) {
        var isBurn, rewardAccount, _yield$this$getParsed, proxyUtxo, parsedProxyDatum, treasuryScriptHash, refInputs, _yield$getDatumFromNF2, treasuryUtxo, parsedTreasuryDatum, circulatingSupply, newCirculatingSupply, newTreasuryDatum, reserveToken, treasuryAddress, redeemer, assetName, initialTreasuryValue, valueToAdd, updatedTreasuryValue, tx, requiredSigners, _iterator, _step, signer, receiverAddress, _requiredSigners, _iterator2, _step2, _signer;
        return _regenerator().w(function (_context7) {
          while (1) switch (_context7.n) {
            case 0:
              isBurn = assetAmount.amount < 0n;
              rewardAccount = this.getProtocolRewardAccount();
              _context7.n = 1;
              return this.getParsedProxyDatum();
            case 1:
              _yield$this$getParsed = _context7.v;
              proxyUtxo = _yield$this$getParsed.proxyUtxo;
              parsedProxyDatum = _yield$this$getParsed.parsedProxyDatum;
              treasuryScriptHash = (0, _core.Hash28ByteBase16)(parsedProxyDatum.settings.registry.treasury); // Get all reference inputs in one call (cached after first fetch)
              _context7.n = 2;
              return this.getScriptReferenceInputs({
                protocol: this.protocolScriptHash,
                proxy: this.mintProxyScript.hash(),
                treasury: treasuryScriptHash
              });
            case 2:
              refInputs = _context7.v;
              _context7.n = 3;
              return (0, _index2.getDatumFromNFT)(this.blaze, this.treasuryNFTAssetId, _index.V0_1Types.TreasuryDatum);
            case 3:
              _yield$getDatumFromNF2 = _context7.v;
              treasuryUtxo = _yield$getDatumFromNF2.utxo;
              parsedTreasuryDatum = _yield$getDatumFromNF2.parsedDatum;
              circulatingSupply = parsedTreasuryDatum.circulating_supply;
              newCirculatingSupply = circulatingSupply + assetAmount.amount;
              newTreasuryDatum = Data.serialize(_index.V0_1Types.TreasuryDatum, {
                circulating_supply: newCirculatingSupply
              });
              reserveToken = parsedProxyDatum.settings.reserve_token.join("");
              treasuryAddress = (0, _core.addressFromCredential)(this.network, (0, _index2.credentialFromScriptHash)(treasuryScriptHash));
              redeemer = isBurn ? Data.serialize(_index.V0_1Types.ProtocolRedeemer, "Burn") : Data.serialize(_index.V0_1Types.ProtocolRedeemer, "Mint");
              assetName = _sdk.Core.AssetName(this.assetNameHex);
              initialTreasuryValue = treasuryUtxo.output().amount();
              valueToAdd = (0, _sdk.makeValue)(0n, [reserveToken, assetAmount.amount]);
              updatedTreasuryValue = _sdk.Value.merge(initialTreasuryValue, valueToAdd);
              tx = this.blaze.newTransaction().addReferenceInput(proxyUtxo).addWithdrawal(rewardAccount, 0n, redeemer).addReferenceInput(refInputs.protocol).addReferenceInput(refInputs.proxy).addReferenceInput(refInputs.treasury).addInput(treasuryUtxo, (0, _data.Void)()).addMint(this.stablecoinPolicyId, new Map([[assetName, assetAmount.amount]]), (0, _data.Void)()).lockAssets(treasuryAddress, updatedTreasuryValue, newTreasuryDatum);
              if (!isBurn) {
                _context7.n = 5;
                break;
              }
              requiredSigners = (0, _index2.getSignatureKeyHashesFromMultisigScript)(parsedProxyDatum.settings.burn_permission).map(function (key) {
                return _sdk.Core.Ed25519KeyHashHex(key);
              });
              _iterator = _createForOfIteratorHelper(requiredSigners);
              try {
                for (_iterator.s(); !(_step = _iterator.n()).done;) {
                  signer = _step.value;
                  tx.addRequiredSigner(signer);
                }
              } catch (err) {
                _iterator.e(err);
              } finally {
                _iterator.f();
              }
              _context7.n = 4;
              return this.blaze.wallet.getChangeAddress();
            case 4:
              receiverAddress = _context7.v;
              (0, _index2.addDirectOutput)(tx, receiverAddress, (0, _sdk.makeValue)(0n, [reserveToken, -assetAmount.amount]));
              _context7.n = 6;
              break;
            case 5:
              _requiredSigners = (0, _index2.getSignatureKeyHashesFromMultisigScript)(parsedProxyDatum.settings.mint_permission).map(function (key) {
                return _sdk.Core.Ed25519KeyHashHex(key);
              });
              _iterator2 = _createForOfIteratorHelper(_requiredSigners);
              try {
                for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                  _signer = _step2.value;
                  tx.addRequiredSigner(_signer);
                }
              } catch (err) {
                _iterator2.e(err);
              } finally {
                _iterator2.f();
              }
            case 6:
              return _context7.a(2, tx);
          }
        }, _callee7, this);
      }));
      function buildMintTx(_x6) {
        return _buildMintTx.apply(this, arguments);
      }
      return buildMintTx;
    }()
  }], [{
    key: "create",
    value: function create(blaze, params) {
      var _params$enableTrace, _params$referenceInpu, _params$referenceInpu2, _params$referenceInpu3;
      var enableTrace = (_params$enableTrace = params.enableTrace) !== null && _params$enableTrace !== void 0 ? _params$enableTrace : false;

      // Instantiate one-shot script
      var oneShotScript = new _index.BaseTypes.BaseOneshotOneshotMint({
        transaction_id: params.proxyBootstrap.txHash,
        output_index: params.proxyBootstrap.outputIndex
      }, enableTrace).Script;
      var oneShotPolicyId = oneShotScript.hash();

      // Instantiate protocol script (V0_1 parameterized by one-shot policy ID)
      var protocolScript = new _index.V0_1Types.V0_1ProtocolProtocolWithdraw(oneShotPolicyId, enableTrace).Script;

      // Instantiate mint proxy script (parameterized by one-shot policy ID)
      var mintProxyScript = new _index.BaseTypes.BaseMintProxyMintProxyMint(oneShotPolicyId, enableTrace).Script;

      // Instantiate treasury script (parameterized by UTXO ref and one-shot policy ID)
      var treasuryScript = new _index.V0_1Types.V0_1TreasuryTreasurySpend({
        transaction_id: params.treasuryBootstrap.txHash,
        output_index: params.treasuryBootstrap.outputIndex
      }, oneShotPolicyId, enableTrace).Script;

      // Derive treasury NFT asset ID from treasury script hash
      var treasuryAssetName = _sdk.Core.AssetName((0, _core.toHex)(Buffer.from("treasury")));
      var treasuryNFTAssetId = _sdk.Core.AssetId(treasuryScript.hash() + treasuryAssetName.toString());
      return new RealfiSDKV0_1(blaze, {
        version: "V0_1",
        proxyBootstrap: params.proxyBootstrap,
        assetNameHex: params.assetNameHex,
        enableTrace: enableTrace,
        scriptDeploymentAddress: params.scriptDeploymentAddress
      }, {
        oneShotScript: oneShotScript,
        protocolScript: protocolScript,
        mintProxyScript: mintProxyScript,
        treasuryScript: treasuryScript
      }, treasuryNFTAssetId, {
        protocolRefInput: (_params$referenceInpu = params.referenceInputs) === null || _params$referenceInpu === void 0 ? void 0 : _params$referenceInpu.protocolRefInput,
        proxyRefInput: (_params$referenceInpu2 = params.referenceInputs) === null || _params$referenceInpu2 === void 0 ? void 0 : _params$referenceInpu2.proxyRefInput,
        treasuryRefInput: (_params$referenceInpu3 = params.referenceInputs) === null || _params$referenceInpu3 === void 0 ? void 0 : _params$referenceInpu3.treasuryRefInput
      });
    }
  }]);
}(_index2.RealfiSDKBase);
//# sourceMappingURL=index.js.map