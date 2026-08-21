"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RealfiSDKV0 = exports.AdminDatum = void 0;
var _data = _interopRequireWildcard(require("@blaze-cardano/data"));
var Data = _data;
var _sdk = require("@blaze-cardano/sdk");
var _index = require("../../generated-types/index.js");
var _index2 = require("../shared/index.js");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t in e) "default" !== _t && {}.hasOwnProperty.call(e, _t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t)) && (i.get || i.set) ? o(f, _t, i) : f[_t] = e[_t]); return f; })(e, t); }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
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
 * V0 datum type - simple datum with logic hash and no settings
 */
var AdminDatum = exports.AdminDatum = Data.Type.Object({
  logic: Data.Type.String(),
  settings: Data.Type.Void()
}, {
  ctor: 0n
});
/**
 * V0 SDK implementation.
 *
 * Simple minting without treasury management.
 * All operations (oneshot, protocol, mint proxy) are consolidated here.
 */
var RealfiSDKV0 = exports.RealfiSDKV0 = /*#__PURE__*/function (_RealfiSDKBase) {
  function RealfiSDKV0(blaze, params, scripts, cachedReferenceInputs) {
    var _this;
    _classCallCheck(this, RealfiSDKV0);
    _this = _callSuper(this, RealfiSDKV0, [blaze, params, cachedReferenceInputs]);
    _defineProperty(_this, "version", "V0");
    // Script hashes and policy IDs
    _defineProperty(_this, "stablecoinPolicyId", void 0);
    _defineProperty(_this, "oneShotPolicyId", void 0);
    _defineProperty(_this, "protocolScriptHash", void 0);
    // Scripts
    _defineProperty(_this, "oneShotScript", void 0);
    _defineProperty(_this, "protocolScript", void 0);
    _defineProperty(_this, "mintProxyScript", void 0);
    _this.oneShotScript = scripts.oneShotScript;
    _this.protocolScript = scripts.protocolScript;
    _this.mintProxyScript = scripts.mintProxyScript;
    _this.oneShotPolicyId = _sdk.Core.PolicyId(_this.oneShotScript.hash());
    _this.protocolScriptHash = _this.protocolScript.hash();
    _this.stablecoinPolicyId = _sdk.Core.PolicyId(_this.mintProxyScript.hash());
    return _this;
  }

  /**
   * Create a V0 SDK instance.
   */
  _inherits(RealfiSDKV0, _RealfiSDKBase);
  return _createClass(RealfiSDKV0, [{
    key: "mintOneShot",
    value: // ─────────────────────────────────────────────────────────────────────────────
    // One-Shot Operations
    // ─────────────────────────────────────────────────────────────────────────────
    /**
     * Mint the one-shot NFT with the initial datum.
     * This consumes the bootstrap UTXO and can only be done once.
     */
    function () {
      var _mintOneShot = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(receiverAddress, datum) {
        var utxo, serializedDatum, baseTx, tx;
        return _regenerator().w(function (_context) {
          while (1) switch (_context.n) {
            case 0:
              _context.n = 1;
              return this.resolveBootstrapUtxo();
            case 1:
              utxo = _context.v;
              serializedDatum = Data.serialize(AdminDatum, {
                logic: datum.logic,
                settings: datum.settings
              });
              baseTx = this.blaze.newTransaction().addInput(utxo).addMint(this.oneShotPolicyId, new Map([[_sdk.Core.AssetName(""), 1n]]), Data.Void());
              tx = (0, _index2.lockOrPayAssets)(baseTx, receiverAddress, (0, _sdk.makeValue)(1000000n, [this.oneShotPolicyId, 1n]), serializedDatum).provideScript(this.oneShotScript);
              return _context.a(2, {
                tx: tx,
                policyId: this.oneShotPolicyId
              });
          }
        }, _callee, this);
      }));
      function mintOneShot(_x, _x2) {
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
      var _updateOneShotDatum = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(receiverAddress, newDatum) {
        var oneshotUtxo, serializedDatum;
        return _regenerator().w(function (_context2) {
          while (1) switch (_context2.n) {
            case 0:
              _context2.n = 1;
              return this.blaze.provider.getUnspentOutputByNFT(_sdk.Core.AssetId(this.oneShotPolicyId));
            case 1:
              oneshotUtxo = _context2.v;
              if (oneshotUtxo) {
                _context2.n = 2;
                break;
              }
              throw new Error("No UTXO found with the one-shot NFT");
            case 2:
              serializedDatum = Data.serialize(AdminDatum, {
                logic: newDatum.logic,
                settings: newDatum.settings
              });
              return _context2.a(2, (0, _index2.lockOrPayAssets)(this.blaze.newTransaction().addInput(oneshotUtxo), receiverAddress, (0, _sdk.makeValue)(1000000n, [this.oneShotPolicyId, 1n]), serializedDatum));
          }
        }, _callee2, this);
      }));
      function updateOneShotDatum(_x3, _x4) {
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
      var _getParsedProxyDatum = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3() {
        var _yield$this$getRawPro, proxyUtxo, proxyDatum, parsedProxyDatum, result;
        return _regenerator().w(function (_context3) {
          while (1) switch (_context3.n) {
            case 0:
              if (!this.cachedProxyDatumResult) {
                _context3.n = 1;
                break;
              }
              return _context3.a(2, this.cachedProxyDatumResult);
            case 1:
              _context3.n = 2;
              return this.getRawProxyDatum();
            case 2:
              _yield$this$getRawPro = _context3.v;
              proxyUtxo = _yield$this$getRawPro.proxyUtxo;
              proxyDatum = _yield$this$getRawPro.proxyDatum;
              parsedProxyDatum = (0, _data.parse)(AdminDatum, proxyDatum);
              result = {
                proxyUtxo: proxyUtxo,
                proxyDatum: proxyDatum,
                parsedProxyDatum: parsedProxyDatum
              };
              this.cachedProxyDatumResult = result;
              return _context3.a(2, result);
          }
        }, _callee3, this);
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
     * V0 minting is simple - no treasury involvement.
     */
    )
  }, {
    key: "buildMintTx",
    value: function () {
      var _buildMintTx = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4(amount) {
        var rewardAccount, utxo, refInputs, tx;
        return _regenerator().w(function (_context4) {
          while (1) switch (_context4.n) {
            case 0:
              rewardAccount = this.getProtocolRewardAccount();
              _context4.n = 1;
              return this.blaze.provider.getUnspentOutputByNFT(_sdk.Core.AssetId(this.oneShotPolicyId));
            case 1:
              utxo = _context4.v;
              if (utxo) {
                _context4.n = 2;
                break;
              }
              throw new Error("No UTXO found with the one-shot NFT");
            case 2:
              _context4.n = 3;
              return this.getScriptReferenceInputs({
                protocol: this.protocolScriptHash,
                proxy: this.mintProxyScript.hash()
              });
            case 3:
              refInputs = _context4.v;
              tx = this.blaze.newTransaction().addReferenceInput(utxo).addWithdrawal(rewardAccount, 0n, (0, _data.Void)()).addReferenceInput(refInputs.protocol).addReferenceInput(refInputs.proxy).addMint(this.stablecoinPolicyId, new Map([[_sdk.Core.AssetName(this.assetNameHex), amount.amount]]), (0, _data.Void)());
              return _context4.a(2, tx);
          }
        }, _callee4, this);
      }));
      function buildMintTx(_x5) {
        return _buildMintTx.apply(this, arguments);
      }
      return buildMintTx;
    }()
  }], [{
    key: "create",
    value: function create(blaze, params) {
      var _params$enableTrace, _params$referenceInpu, _params$referenceInpu2;
      var enableTrace = (_params$enableTrace = params.enableTrace) !== null && _params$enableTrace !== void 0 ? _params$enableTrace : false;

      // Instantiate one-shot script
      var oneShotScript = new _index.BaseTypes.BaseOneshotOneshotMint({
        transaction_id: params.proxyBootstrap.txHash,
        output_index: params.proxyBootstrap.outputIndex
      }, enableTrace).Script;

      // Instantiate protocol script (V0 uses no parameters)
      var protocolScript = new _index.V0Types.V0ProtocolProtocolWithdraw(enableTrace).Script;

      // Instantiate mint proxy script (parameterized by one-shot policy ID)
      var oneShotPolicyId = oneShotScript.hash();
      var mintProxyScript = new _index.BaseTypes.BaseMintProxyMintProxyMint(oneShotPolicyId, enableTrace).Script;
      return new RealfiSDKV0(blaze, {
        version: "V0",
        proxyBootstrap: params.proxyBootstrap,
        assetNameHex: params.assetNameHex,
        enableTrace: enableTrace,
        scriptDeploymentAddress: params.scriptDeploymentAddress
      }, {
        oneShotScript: oneShotScript,
        protocolScript: protocolScript,
        mintProxyScript: mintProxyScript
      }, {
        protocolRefInput: (_params$referenceInpu = params.referenceInputs) === null || _params$referenceInpu === void 0 ? void 0 : _params$referenceInpu.protocolRefInput,
        proxyRefInput: (_params$referenceInpu2 = params.referenceInputs) === null || _params$referenceInpu2 === void 0 ? void 0 : _params$referenceInpu2.proxyRefInput
      });
    }
  }]);
}(_index2.RealfiSDKBase);
//# sourceMappingURL=index.js.map