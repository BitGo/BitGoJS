"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RealfiSDKBase = void 0;
var _sdk = require("@blaze-cardano/sdk");
var _clientId = require("./client-id.js");
var _timelock = require("./timelock.js");
var _utils = require("./utils.js");
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
/**
 * Base interface for SDK version implementations.
 * Each version implements this with version-specific logic.
 */

/**
 * Extended interface for SDK versions with treasury support (V0_1+)
 */

var isRecord = function isRecord(value) {
  return _typeof(value) === "object" && value !== null;
};
var isFlatProxySettings = function isFlatProxySettings(value) {
  return isRecord(value) && "mint_permission" in value && "burn_permission" in value && "withdraw_permission" in value && "deposit_permission" in value && "stake_permission" in value && "unstake_permission" in value && Array.isArray(value.reserve_assets);
};
var isNestedProxySettings = function isNestedProxySettings(value) {
  return isRecord(value) && isRecord(value.permissions) && "mint" in value.permissions && "burn" in value.permissions && "withdraw" in value.permissions && "deposit" in value.permissions && "stake" in value.permissions && "unstake" in value.permissions && isRecord(value.config) && Array.isArray(value.config.reserve_assets);
};
/**
 * Abstract base class for SDK versions.
 * Provides common implementation and utilities.
 */
var RealfiSDKBase = exports.RealfiSDKBase = /*#__PURE__*/function () {
  function RealfiSDKBase(blaze, params, cachedReferenceInputs) {
    var _params$enableTrace, _params$clientSource;
    _classCallCheck(this, RealfiSDKBase);
    /** Blaze instance for blockchain interactions */
    _defineProperty(this, "blaze", void 0);
    /** Bootstrap parameters */
    _defineProperty(this, "proxyBootstrap", void 0);
    /** Asset name hex for the stablecoin */
    _defineProperty(this, "assetNameHex", void 0);
    /** Cached reference inputs for performance (populated on first fetch) */
    _defineProperty(this, "cachedReferenceInputs", void 0);
    /**
     * Address used to deploy reference scripts and to resolve them from.
     * When undefined, Blaze's burn address is used for both.
     */
    _defineProperty(this, "scriptDeploymentAddress", void 0);
    /** Cached raw proxy datum result (populated on first fetch) */
    _defineProperty(this, "cachedRawProxyDatumResult", void 0);
    /** Cached parsed proxy datum result (populated on first fetch) */
    _defineProperty(this, "cachedProxyDatumResult", void 0);
    /** One-shot output reference (derived from bootstrap) */
    _defineProperty(this, "oneShotTxoRef", void 0);
    /** Enable trace output in Plutus scripts */
    _defineProperty(this, "enableTrace", void 0);
    /** Origin attached to all built order transactions. */
    _defineProperty(this, "clientSource", void 0);
    /** SDK version attached to all built order transactions. */
    _defineProperty(this, "sdkVersion", void 0);
    // Abstract properties - each version must provide these
    _defineProperty(this, "version", void 0);
    _defineProperty(this, "stablecoinPolicyId", void 0);
    _defineProperty(this, "oneShotPolicyId", void 0);
    _defineProperty(this, "protocolScriptHash", void 0);
    // Scripts - each version stores its own instantiated scripts
    _defineProperty(this, "oneShotScript", void 0);
    _defineProperty(this, "protocolScript", void 0);
    _defineProperty(this, "mintProxyScript", void 0);
    this.blaze = blaze;
    this.proxyBootstrap = params.proxyBootstrap;
    this.assetNameHex = params.assetNameHex;
    this.enableTrace = (_params$enableTrace = params.enableTrace) !== null && _params$enableTrace !== void 0 ? _params$enableTrace : false;
    this.cachedReferenceInputs = cachedReferenceInputs !== null && cachedReferenceInputs !== void 0 ? cachedReferenceInputs : {};
    this.scriptDeploymentAddress = params.scriptDeploymentAddress;
    this.clientSource = (_params$clientSource = params.clientSource) !== null && _params$clientSource !== void 0 ? _params$clientSource : _clientId.DEFAULT_CLIENT_SOURCE;
    this.sdkVersion = _clientId.SDK_VERSION;
    this.oneShotTxoRef = {
      transaction_id: params.proxyBootstrap.txHash,
      output_index: params.proxyBootstrap.outputIndex
    };
  }

  /** Get the network from blaze */
  return _createClass(RealfiSDKBase, [{
    key: "network",
    get: function get() {
      return this.blaze.provider.network;
    }

    /**
     * Start a transaction with a single setMetadata call. Origin label (55534473) is always
     * present and not overridable; extra labels are merged in before the origin is set.
     */
  }, {
    key: "newOrderTransaction",
    value: function newOrderTransaction(extraLabels) {
      var map = new Map(extraLabels !== null && extraLabels !== void 0 ? extraLabels : []);
      map.set(_timelock.ORDER_ORIGIN_METADATA_LABEL, (0, _timelock.buildOrderOriginMetadatum)(this.clientSource, this.sdkVersion));
      return this.blaze.newTransaction().setMetadata(new _sdk.Core.Metadata(map));
    }

    /**
     * Helper to get reference inputs for scripts.
     * Fetched values are cached for subsequent calls.
     */
  }, {
    key: "getScriptReferenceInputs",
    value: (function () {
      var _getScriptReferenceInputs = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(scriptHashes) {
        var cached, result;
        return _regenerator().w(function (_context) {
          while (1) switch (_context.n) {
            case 0:
              cached = {};
              if (this.cachedReferenceInputs.protocolRefInput) {
                cached.protocol = this.cachedReferenceInputs.protocolRefInput;
              }
              if (this.cachedReferenceInputs.proxyRefInput) {
                cached.proxy = this.cachedReferenceInputs.proxyRefInput;
              }
              if (this.cachedReferenceInputs.treasuryRefInput) {
                cached.treasury = this.cachedReferenceInputs.treasuryRefInput;
              }
              if (this.cachedReferenceInputs.orderRefInput) {
                cached.order = this.cachedReferenceInputs.orderRefInput;
              }
              if (this.cachedReferenceInputs.stakingVaultRefInput) {
                cached.stakingVault = this.cachedReferenceInputs.stakingVaultRefInput;
              }
              // V1.0 additional protocol scripts
              if (this.cachedReferenceInputs.protocolMintRefInput) {
                cached.protocolMint = this.cachedReferenceInputs.protocolMintRefInput;
              }
              if (this.cachedReferenceInputs.protocolStakeRefInput) {
                cached.protocolStake = this.cachedReferenceInputs.protocolStakeRefInput;
              }
              if (this.cachedReferenceInputs.protocolManagementRefInput) {
                cached.protocolManagement = this.cachedReferenceInputs.protocolManagementRefInput;
              }
              _context.n = 1;
              return (0, _utils.getReferenceInputs)(this.blaze, scriptHashes, cached, this.scriptDeploymentAddress);
            case 1:
              result = _context.v;
              // Cache fetched values for subsequent calls
              if (result.protocol && !this.cachedReferenceInputs.protocolRefInput) {
                this.cachedReferenceInputs.protocolRefInput = result.protocol;
              }
              if (result.proxy && !this.cachedReferenceInputs.proxyRefInput) {
                this.cachedReferenceInputs.proxyRefInput = result.proxy;
              }
              if (result.treasury && !this.cachedReferenceInputs.treasuryRefInput) {
                this.cachedReferenceInputs.treasuryRefInput = result.treasury;
              }
              if (result.order && !this.cachedReferenceInputs.orderRefInput) {
                this.cachedReferenceInputs.orderRefInput = result.order;
              }
              if (result.stakingVault && !this.cachedReferenceInputs.stakingVaultRefInput) {
                this.cachedReferenceInputs.stakingVaultRefInput = result.stakingVault;
              }
              // V1.0 additional protocol scripts caching
              if (result.protocolMint && !this.cachedReferenceInputs.protocolMintRefInput) {
                this.cachedReferenceInputs.protocolMintRefInput = result.protocolMint;
              }
              if (result.protocolStake && !this.cachedReferenceInputs.protocolStakeRefInput) {
                this.cachedReferenceInputs.protocolStakeRefInput = result.protocolStake;
              }
              if (result.protocolManagement && !this.cachedReferenceInputs.protocolManagementRefInput) {
                this.cachedReferenceInputs.protocolManagementRefInput = result.protocolManagement;
              }
              return _context.a(2, result);
          }
        }, _callee, this);
      }));
      function getScriptReferenceInputs(_x) {
        return _getScriptReferenceInputs.apply(this, arguments);
      }
      return getScriptReferenceInputs;
    }()
    /**
     * Resolve the bootstrap UTXO from the provider.
     * This will fail if the UTXO has already been consumed (i.e., the one-shot token was minted).
     */
    )
  }, {
    key: "resolveBootstrapUtxo",
    value: (function () {
      var _resolveBootstrapUtxo = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2() {
        var utxos, utxo;
        return _regenerator().w(function (_context2) {
          while (1) switch (_context2.n) {
            case 0:
              _context2.n = 1;
              return this.blaze.provider.resolveUnspentOutputs([new _sdk.Core.TransactionInput(this.oneShotTxoRef.transaction_id, this.oneShotTxoRef.output_index)]);
            case 1:
              utxos = _context2.v;
              utxo = utxos[0];
              if (utxo) {
                _context2.n = 2;
                break;
              }
              throw new Error("Bootstrap UTXO not found. It may have already been consumed (one-shot token already minted).");
            case 2:
              return _context2.a(2, utxo);
          }
        }, _callee2, this);
      }));
      function resolveBootstrapUtxo() {
        return _resolveBootstrapUtxo.apply(this, arguments);
      }
      return resolveBootstrapUtxo;
    }() // ─────────────────────────────────────────────────────────────────────────────
    // Common Protocol Operations (shared across all versions)
    // ─────────────────────────────────────────────────────────────────────────────
    /**
     * Deploy the protocol script as a reference script.
     */
    )
  }, {
    key: "deployProtocol",
    value: function () {
      var _deployProtocol = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3() {
        return _regenerator().w(function (_context3) {
          while (1) switch (_context3.n) {
            case 0:
              return _context3.a(2, (0, _utils.deployScript)(this.blaze, this.protocolScript, this.scriptDeploymentAddress));
          }
        }, _callee3, this);
      }));
      function deployProtocol() {
        return _deployProtocol.apply(this, arguments);
      }
      return deployProtocol;
    }()
    /**
     * Deploy the mint proxy script as a reference script.
     */
  }, {
    key: "deployMintProxy",
    value: (function () {
      var _deployMintProxy = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4() {
        return _regenerator().w(function (_context4) {
          while (1) switch (_context4.n) {
            case 0:
              return _context4.a(2, (0, _utils.deployScript)(this.blaze, this.mintProxyScript, this.scriptDeploymentAddress));
          }
        }, _callee4, this);
      }));
      function deployMintProxy() {
        return _deployMintProxy.apply(this, arguments);
      }
      return deployMintProxy;
    }()
    /**
     * Register the protocol stake credential.
     */
    )
  }, {
    key: "registerProtocolStake",
    value: function registerProtocolStake() {
      var stakeCredential = (0, _utils.credentialFromScript)(this.protocolScript);
      var registerTx = this.blaze.newTransaction().addRegisterStake(stakeCredential);
      return registerTx;
    }

    /**
     * Get the protocol reward account.
     */
  }, {
    key: "getProtocolRewardAccount",
    value: function getProtocolRewardAccount() {
      return (0, _utils.rewardAccountFromScript)(this.protocolScript, this.network);
    }

    /**
     * Get version-agnostic proxy settings.
     * Extracts only the common fields shared across V0_2+ protocol versions.
     */
  }, {
    key: "getSettings",
    value: (function () {
      var _getSettings = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee5() {
        var _yield$this$getParsed, parsedProxyDatum, settings;
        return _regenerator().w(function (_context5) {
          while (1) switch (_context5.n) {
            case 0:
              _context5.n = 1;
              return this.getParsedProxyDatum();
            case 1:
              _yield$this$getParsed = _context5.v;
              parsedProxyDatum = _yield$this$getParsed.parsedProxyDatum;
              settings = parsedProxyDatum.settings;
              if (!isFlatProxySettings(settings)) {
                _context5.n = 2;
                break;
              }
              return _context5.a(2, {
                mint_permission: settings.mint_permission,
                burn_permission: settings.burn_permission,
                withdraw_permission: settings.withdraw_permission,
                deposit_permission: settings.deposit_permission,
                stake_permission: settings.stake_permission,
                unstake_permission: settings.unstake_permission,
                reserve_assets: settings.reserve_assets
              });
            case 2:
              if (!isNestedProxySettings(settings)) {
                _context5.n = 3;
                break;
              }
              return _context5.a(2, {
                mint_permission: settings.permissions.mint,
                burn_permission: settings.permissions.burn,
                withdraw_permission: settings.permissions.withdraw,
                deposit_permission: settings.permissions.deposit,
                stake_permission: settings.permissions.stake,
                unstake_permission: settings.permissions.unstake,
                reserve_assets: settings.config.reserve_assets
              });
            case 3:
              throw new Error("getSettings() is not supported for protocol version ".concat(this.version));
            case 4:
              return _context5.a(2);
          }
        }, _callee5, this);
      }));
      function getSettings() {
        return _getSettings.apply(this, arguments);
      }
      return getSettings;
    }() /** The USDr asset ID (stablecoin policy + USDr asset name). */)
  }, {
    key: "getUsdrAssetId",
    value: function getUsdrAssetId() {
      return _sdk.Core.AssetId(this.stablecoinPolicyId + this.assetNameHex);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Timelock Operations (shared across versions with staking support)
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Build a transaction that claims USDr locked in a timelock address after
     * the unstake cooldown has expired.
     *
     * Reconstructs the timelock native script for the owner's key hash and the
     * original unlock slot, then spends the UTxO. `owner` is the timelock owner
     * (defaults to the connected wallet) and is set as the required signer, so a
     * custodian holding the user's key can claim. The released USDr goes to
     * `destination`, or to `owner` when only an owner is given; with neither it
     * returns to the connected wallet.
     *
     * A single owner key has two timelock shapes in the protocol, differing only
     * in element order: `buildUnstakeOrderTx` locks to
     * `AllOf { Signature, After }` and the treasury/multisig unstake path to
     * `AllOf { After, Signature }`. They hash differently, so which one applies
     * is read off the UTxO's own locking address rather than assumed.
     */
  }, {
    key: "buildClaimTimelockTx",
    value: function () {
      var _buildClaimTimelockTx = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee6(params) {
        var _params$owner, _ownerAddress$getProp, _params$destination;
        var ownerAddress, ownerKeyHash, input, _yield$this$blaze$pro, _yield$this$blaze$pro2, utxo, nativeScript, scriptWrapped, tx, recipient, _t;
        return _regenerator().w(function (_context6) {
          while (1) switch (_context6.n) {
            case 0:
              if (!((_params$owner = params.owner) !== null && _params$owner !== void 0)) {
                _context6.n = 1;
                break;
              }
              _t = _params$owner;
              _context6.n = 3;
              break;
            case 1:
              _context6.n = 2;
              return this.blaze.wallet.getChangeAddress();
            case 2:
              _t = _context6.v;
            case 3:
              ownerAddress = _t;
              ownerKeyHash = (_ownerAddress$getProp = ownerAddress.getProps().paymentPart) === null || _ownerAddress$getProp === void 0 ? void 0 : _ownerAddress$getProp.hash;
              if (ownerKeyHash) {
                _context6.n = 4;
                break;
              }
              throw new Error("Timelock owner address has no payment key credential");
            case 4:
              input = new _sdk.Core.TransactionInput(_sdk.Core.TransactionId(params.resultUtxo.txHash), BigInt(params.resultUtxo.index));
              _context6.n = 5;
              return this.blaze.provider.resolveUnspentOutputs([input]);
            case 5:
              _yield$this$blaze$pro = _context6.v;
              _yield$this$blaze$pro2 = _slicedToArray(_yield$this$blaze$pro, 1);
              utxo = _yield$this$blaze$pro2[0];
              if (utxo) {
                _context6.n = 6;
                break;
              }
              throw new Error("Could not resolve UTxO ".concat(params.resultUtxo.txHash, "#").concat(params.resultUtxo.index));
            case 6:
              nativeScript = (0, _timelock.resolveTimelockNativeScript)(utxo.output().address(), ownerKeyHash, params.unlockSlot);
              scriptWrapped = _sdk.Core.Script.newNativeScript(nativeScript);
              tx = this.newOrderTransaction().setValidFrom(_sdk.Core.Slot(Number(params.unlockSlot))).provideScript(scriptWrapped).addRequiredSigner(_sdk.Core.Ed25519KeyHashHex(ownerKeyHash)).addInput(utxo); // Route funds to `destination`, else to an explicit `owner` (so a custodial
              // claim reaches the user); with neither, value returns to the connected
              // wallet as change.
              recipient = (_params$destination = params.destination) !== null && _params$destination !== void 0 ? _params$destination : params.owner;
              if (recipient) {
                (0, _utils.addDirectOutput)(tx, recipient, utxo.output().amount());
              }
              return _context6.a(2, tx);
          }
        }, _callee6, this);
      }));
      function buildClaimTimelockTx(_x2) {
        return _buildClaimTimelockTx.apply(this, arguments);
      }
      return buildClaimTimelockTx;
    }()
    /**
     * Fetch the live proxy UTxO and inline datum without attempting a
     * version-specific parse. Cached after first fetch.
     *
     * `readSingletonDatum` both retries the lookup (a not-found answer is the
     * provider's index lagging the UTxO's latest move, not a missing proxy —
     * Blockfrost returns HTTP 404 in that window, Sentry TREASURY-ADMIN-API-G)
     * and repairs a datum the provider reports as a hash.
     */
  }, {
    key: "getRawProxyDatum",
    value: (function () {
      var _getRawProxyDatum = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee7() {
        var _this$cachedProxyDatu, _proxyUtxo, _proxyDatum, _yield$readSingletonD, proxyUtxo, proxyDatum, result;
        return _regenerator().w(function (_context7) {
          while (1) switch (_context7.n) {
            case 0:
              if (!this.cachedRawProxyDatumResult) {
                _context7.n = 1;
                break;
              }
              return _context7.a(2, this.cachedRawProxyDatumResult);
            case 1:
              if (!this.cachedProxyDatumResult) {
                _context7.n = 2;
                break;
              }
              _this$cachedProxyDatu = this.cachedProxyDatumResult, _proxyUtxo = _this$cachedProxyDatu.proxyUtxo, _proxyDatum = _this$cachedProxyDatu.proxyDatum;
              this.cachedRawProxyDatumResult = {
                proxyUtxo: _proxyUtxo,
                proxyDatum: _proxyDatum
              };
              return _context7.a(2, this.cachedRawProxyDatumResult);
            case 2:
              _context7.n = 3;
              return (0, _utils.readSingletonDatum)(this.blaze.provider, _sdk.Core.AssetId(this.oneShotPolicyId));
            case 3:
              _yield$readSingletonD = _context7.v;
              proxyUtxo = _yield$readSingletonD.utxo;
              proxyDatum = _yield$readSingletonD.datum;
              result = {
                proxyUtxo: proxyUtxo,
                proxyDatum: proxyDatum
              };
              this.cachedRawProxyDatumResult = result;
              return _context7.a(2, result);
          }
        }, _callee7, this);
      }));
      function getRawProxyDatum() {
        return _getRawProxyDatum.apply(this, arguments);
      }
      return getRawProxyDatum;
    }()
    /**
     * @deprecated Use getParsedProxyDatum() or getRawProxyDatum() depending on
     * whether the caller needs a version-specific schema parse.
     */
    )
  }, {
    key: "getProxyDatum",
    value: (function () {
      var _getProxyDatum = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee8() {
        return _regenerator().w(function (_context8) {
          while (1) switch (_context8.n) {
            case 0:
              return _context8.a(2, this.getParsedProxyDatum());
          }
        }, _callee8, this);
      }));
      function getProxyDatum() {
        return _getProxyDatum.apply(this, arguments);
      }
      return getProxyDatum;
    }() // Abstract methods - each version must implement these
    )
  }]);
}();
//# sourceMappingURL=base.js.map