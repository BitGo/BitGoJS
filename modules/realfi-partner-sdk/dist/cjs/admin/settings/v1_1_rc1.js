"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RealfiProtocolSettingsAdmin = void 0;
var _core = require("@blaze-cardano/core");
var Data = _interopRequireWildcard(require("@blaze-cardano/data"));
var _sdk = require("@blaze-cardano/sdk");
var _index = require("../../sdk/shared/index.js");
var _utils = require("./utils.js");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t in e) "default" !== _t && {}.hasOwnProperty.call(e, _t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t)) && (i.get || i.set) ? o(f, _t, i) : f[_t] = e[_t]); return f; })(e, t); }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
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
// Internal implementation for the current v1.1-era settings layout.
// Public consumers should import the version-neutral RealfiProtocolSettingsAdmin
// from admin/settings or the package root.
var RealfiProtocolSettingsAdmin = exports.RealfiProtocolSettingsAdmin = /*#__PURE__*/function () {
  function RealfiProtocolSettingsAdmin(blaze, params) {
    var _params$enableTrace, _params$referenceInpu;
    _classCallCheck(this, RealfiProtocolSettingsAdmin);
    _defineProperty(this, "blaze", void 0);
    _defineProperty(this, "proxyPolicyId", void 0);
    _defineProperty(this, "governanceConfig", void 0);
    _defineProperty(this, "settingsScript", void 0);
    _defineProperty(this, "settingsScriptHash", void 0);
    _defineProperty(this, "settingsValidatorAddress", void 0);
    _defineProperty(this, "settingsRewardAccount", void 0);
    _defineProperty(this, "enableTrace", void 0);
    _defineProperty(this, "settingsRefInput", void 0);
    this.blaze = blaze;
    this.proxyPolicyId = params.proxyPolicyId;
    this.governanceConfig = params.governanceConfig;
    this.enableTrace = (_params$enableTrace = params.enableTrace) !== null && _params$enableTrace !== void 0 ? _params$enableTrace : false;
    this.settingsRefInput = (_params$referenceInpu = params.referenceInputs) === null || _params$referenceInpu === void 0 ? void 0 : _params$referenceInpu.settingsRefInput;
    this.settingsScript = (0, _utils.createSettingsValidatorScript)(this.proxyPolicyId, this.governanceConfig, this.enableTrace);
    this.settingsScriptHash = this.settingsScript.hash();
    this.settingsValidatorAddress = (0, _core.addressFromValidator)(this.blaze.provider.network, this.settingsScript);
    this.settingsRewardAccount = (0, _index.rewardAccountFromScript)(this.settingsScript, this.blaze.provider.network);
  }
  return _createClass(RealfiProtocolSettingsAdmin, [{
    key: "deploySettingsValidator",
    value: function () {
      var _deploySettingsValidator = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
        return _regenerator().w(function (_context) {
          while (1) switch (_context.n) {
            case 0:
              return _context.a(2, (0, _index.deployScript)(this.blaze, this.settingsScript));
          }
        }, _callee, this);
      }));
      function deploySettingsValidator() {
        return _deploySettingsValidator.apply(this, arguments);
      }
      return deploySettingsValidator;
    }()
  }, {
    key: "registerSettingsStake",
    value: function registerSettingsStake() {
      return this.blaze.newTransaction().addRegisterStake((0, _index.credentialFromScript)(this.settingsScript));
    }
  }, {
    key: "getSettingsState",
    value: function () {
      var _getSettingsState = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2() {
        var _proxyAddress$getProp;
        var proxyAssetId, _yield$readSingletonD, proxyUtxo, proxyDatum, _parseProxyDatumRaw, logicHash, settingsData, proxyAddress, paymentCredentialHash, isFrozen;
        return _regenerator().w(function (_context2) {
          while (1) switch (_context2.n) {
            case 0:
              proxyAssetId = _sdk.Core.AssetId(this.proxyPolicyId);
              _context2.n = 1;
              return (0, _index.readSingletonDatum)(this.blaze.provider, proxyAssetId);
            case 1:
              _yield$readSingletonD = _context2.v;
              proxyUtxo = _yield$readSingletonD.utxo;
              proxyDatum = _yield$readSingletonD.datum;
              _parseProxyDatumRaw = (0, _utils.parseProxyDatumRaw)(proxyDatum), logicHash = _parseProxyDatumRaw.logicHash, settingsData = _parseProxyDatumRaw.settingsData;
              proxyAddress = proxyUtxo.output().address();
              paymentCredentialHash = (_proxyAddress$getProp = proxyAddress.getProps().paymentPart) === null || _proxyAddress$getProp === void 0 ? void 0 : _proxyAddress$getProp.hash;
              if (paymentCredentialHash) {
                _context2.n = 2;
                break;
              }
              throw new Error("Proxy UTxO address has no payment credential");
            case 2:
              isFrozen = (0, _utils.isFrozenSettingsData)(settingsData);
              return _context2.a(2, {
                proxyUtxo: proxyUtxo,
                proxyDatum: proxyDatum,
                proxyAddress: proxyAddress,
                logicHash: logicHash,
                settingsData: settingsData,
                liveSettings: isFrozen ? undefined : (0, _utils.parseLiveSettings)(settingsData),
                paymentCredentialHash: paymentCredentialHash,
                isFrozen: isFrozen,
                isGovernedByThisValidator: paymentCredentialHash === this.settingsScriptHash
              });
          }
        }, _callee2, this);
      }));
      function getSettingsState() {
        return _getSettingsState.apply(this, arguments);
      }
      return getSettingsState;
    }()
  }, {
    key: "buildDepositProxyTx",
    value: function () {
      var _buildDepositProxyTx = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3() {
        var _state$proxyAddress$g;
        var state;
        return _regenerator().w(function (_context3) {
          while (1) switch (_context3.n) {
            case 0:
              _context3.n = 1;
              return this.getSettingsState();
            case 1:
              state = _context3.v;
              if (!state.isGovernedByThisValidator) {
                _context3.n = 2;
                break;
              }
              throw new Error("Proxy NFT is already locked at this settings validator");
            case 2:
              if (!(((_state$proxyAddress$g = state.proxyAddress.getProps().paymentPart) === null || _state$proxyAddress$g === void 0 ? void 0 : _state$proxyAddress$g.type) === _sdk.Core.CredentialType.ScriptHash)) {
                _context3.n = 3;
                break;
              }
              throw new Error("Proxy NFT is currently held by another script. Move it with the current controller before depositing into protocol settings.");
            case 3:
              return _context3.a(2, (0, _index.lockOrPayAssets)(this.blaze.newTransaction().addInput(state.proxyUtxo), this.settingsValidatorAddress,
              // Same datum, but a script address is wider than the wallet address the
              // proxy is moving from, so the floor can still rise here.
              this.valueWithDatumMinAda(this.settingsValidatorAddress, state.proxyUtxo.output().amount(), state.proxyDatum), state.proxyDatum));
          }
        }, _callee3, this);
      }));
      function buildDepositProxyTx() {
        return _buildDepositProxyTx.apply(this, arguments);
      }
      return buildDepositProxyTx;
    }()
    /**
     * Compute the 32-byte auth-payload hash the governance keys must COSE-sign for
     * `change`, against the current on-chain proxy state. Two-phase, mirroring the
     * orchestrator's `getSignedPayloadFromOrderInputs`: get this hash, collect the
     * signatures out-of-band, then pass them to the matching build method. The
     * proxy UTxO must be unchanged between the two calls (it is the nonce).
     */
  }, {
    key: "getSettingsAuthPayloadHash",
    value: (function () {
      var _getSettingsAuthPayloadHash = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4(change) {
        var state, resolved;
        return _regenerator().w(function (_context4) {
          while (1) switch (_context4.n) {
            case 0:
              _context4.n = 1;
              return this.requireGovernedState();
            case 1:
              state = _context4.v;
              resolved = this.resolveChange(state, change);
              return _context4.a(2, (0, _utils.hashSettingsAuthPayload)((0, _utils.buildSettingsAuthPayload)(resolved.redeemer, this.scriptHashOfAddress(resolved.receiverAddress), resolved.nextLogicHash, resolved.nextSettingsData, state.proxyUtxo.input())));
          }
        }, _callee4, this);
      }));
      function getSettingsAuthPayloadHash(_x) {
        return _getSettingsAuthPayloadHash.apply(this, arguments);
      }
      return getSettingsAuthPayloadHash;
    }())
  }, {
    key: "buildChangePermissionsTx",
    value: function () {
      var _buildChangePermissionsTx = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee5(params) {
        return _regenerator().w(function (_context5) {
          while (1) switch (_context5.n) {
            case 0:
              return _context5.a(2, this.buildChange({
                type: "ChangePermissions",
                nextPermissions: params.nextPermissions
              }, params.signatures));
          }
        }, _callee5, this);
      }));
      function buildChangePermissionsTx(_x2) {
        return _buildChangePermissionsTx.apply(this, arguments);
      }
      return buildChangePermissionsTx;
    }()
  }, {
    key: "buildChangeConfigTx",
    value: function () {
      var _buildChangeConfigTx = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee6(params) {
        return _regenerator().w(function (_context6) {
          while (1) switch (_context6.n) {
            case 0:
              return _context6.a(2, this.buildChange({
                type: "ChangeConfig",
                nextConfig: params.nextConfig
              }, params.signatures));
          }
        }, _callee6, this);
      }));
      function buildChangeConfigTx(_x3) {
        return _buildChangeConfigTx.apply(this, arguments);
      }
      return buildChangeConfigTx;
    }()
  }, {
    key: "buildChangeLogicTx",
    value: function () {
      var _buildChangeLogicTx = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee7(params) {
        return _regenerator().w(function (_context7) {
          while (1) switch (_context7.n) {
            case 0:
              return _context7.a(2, this.buildChange({
                type: "ChangeLogic",
                nextLogicHash: params.nextLogicHash,
                nextRegistry: params.nextRegistry
              }, params.signatures));
          }
        }, _callee7, this);
      }));
      function buildChangeLogicTx(_x4) {
        return _buildChangeLogicTx.apply(this, arguments);
      }
      return buildChangeLogicTx;
    }()
  }, {
    key: "buildShutdownTx",
    value: function () {
      var _buildShutdownTx = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee8(params) {
        return _regenerator().w(function (_context8) {
          while (1) switch (_context8.n) {
            case 0:
              return _context8.a(2, this.buildChange({
                type: "Shutdown"
              }, params.signatures));
          }
        }, _callee8, this);
      }));
      function buildShutdownTx(_x5) {
        return _buildShutdownTx.apply(this, arguments);
      }
      return buildShutdownTx;
    }()
  }, {
    key: "buildRestoreTx",
    value: function () {
      var _buildRestoreTx = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee9(params) {
        return _regenerator().w(function (_context9) {
          while (1) switch (_context9.n) {
            case 0:
              return _context9.a(2, this.buildChange({
                type: "Restore"
              }, params.signatures));
          }
        }, _callee9, this);
      }));
      function buildRestoreTx(_x6) {
        return _buildRestoreTx.apply(this, arguments);
      }
      return buildRestoreTx;
    }()
  }, {
    key: "buildMigrateTx",
    value: function () {
      var _buildMigrateTx = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee0(params) {
        return _regenerator().w(function (_context0) {
          while (1) switch (_context0.n) {
            case 0:
              return _context0.a(2, this.buildChange({
                type: "Migrate",
                destination: params.destination
              }, params.signatures, params.destinationSignatures));
          }
        }, _callee0, this);
      }));
      function buildMigrateTx(_x7) {
        return _buildMigrateTx.apply(this, arguments);
      }
      return buildMigrateTx;
    }()
    /**
     * Resolve a change against the current state into the concrete redeemer +
     * resulting proxy output (logic, canonical settings, destination). Shared by
     * `getSettingsAuthPayloadHash` and `buildChange` so the signed hash and the
     * submitted tx always describe the same resulting state. Settings read from
     * chain are canonicalized through the typed schema (see `canonicalizeSettings`)
     * so blaze's encoding matches the validator's `cbor.serialise`.
     */
  }, {
    key: "resolveChange",
    value: function resolveChange(state, change) {
      var here = this.settingsValidatorAddress;
      switch (change.type) {
        case "ChangePermissions":
          {
            var current = this.requireLive(state);
            var next = _objectSpread(_objectSpread({}, current), {}, {
              permissions: change.nextPermissions
            });
            return {
              redeemer: "ChangePermissions",
              nextLogicHash: state.logicHash,
              nextSettingsData: (0, _utils.serializeSettings)(next),
              receiverAddress: here
            };
          }
        case "ChangeConfig":
          {
            var _current = this.requireLive(state);
            var _next2 = _objectSpread(_objectSpread({}, _current), {}, {
              config: change.nextConfig
            });
            return {
              redeemer: "ChangeConfig",
              nextLogicHash: state.logicHash,
              nextSettingsData: (0, _utils.serializeSettings)(_next2),
              receiverAddress: here
            };
          }
        case "ChangeLogic":
          {
            var _change$nextLogicHash, _change$nextRegistry;
            var _current2 = this.requireLive(state);
            var nextLogicHash = (_change$nextLogicHash = change.nextLogicHash) !== null && _change$nextLogicHash !== void 0 ? _change$nextLogicHash : state.logicHash;
            var nextRegistry = (_change$nextRegistry = change.nextRegistry) !== null && _change$nextRegistry !== void 0 ? _change$nextRegistry : _current2.registry;
            if (nextLogicHash === state.logicHash && JSON.stringify(nextRegistry) === JSON.stringify(_current2.registry)) {
              throw new Error("ChangeLogic requires a logic or registry change");
            }
            return {
              redeemer: "ChangeLogic",
              nextLogicHash: nextLogicHash,
              nextSettingsData: (0, _utils.serializeSettings)(_objectSpread(_objectSpread({}, _current2), {}, {
                registry: nextRegistry
              })),
              receiverAddress: here
            };
          }
        case "Shutdown":
          {
            if (state.isFrozen) {
              throw new Error("Settings are already frozen");
            }
            return {
              redeemer: "Shutdown",
              nextLogicHash: state.logicHash,
              nextSettingsData: (0, _utils.freezeSettingsData)(state.settingsData),
              receiverAddress: here
            };
          }
        case "Restore":
          {
            if (!state.isFrozen) {
              throw new Error("Settings are not frozen");
            }
            return {
              redeemer: "Restore",
              nextLogicHash: state.logicHash,
              nextSettingsData: this.canonicalizeSettings((0, _utils.unwrapFrozenSettingsData)(state.settingsData)),
              receiverAddress: here
            };
          }
        case "Migrate":
          {
            var destination = change.destination;
            if (destination.settingsScriptHash === this.settingsScriptHash) {
              throw new Error("Migrate requires a different destination settings validator");
            }
            return {
              redeemer: "Migrate",
              nextLogicHash: state.logicHash,
              nextSettingsData: this.canonicalizeSettings(state.settingsData),
              receiverAddress: destination.settingsValidatorAddress,
              coValidateWith: {
                rewardAccount: destination.settingsRewardAccount,
                applyWitness: destination.applySettingsWitness.bind(destination)
              }
            };
          }
      }
    }
  }, {
    key: "requireLive",
    value: function requireLive(state) {
      if (state.isFrozen || !state.liveSettings) {
        throw new Error("Settings are not in a live state");
      }
      return state.liveSettings;
    }

    /**
     * Re-serialize live settings through the typed schema so the CBOR matches the
     * validator's `cbor.serialise` of the parsed output datum. Settings read from
     * chain and re-embedded opaquely (Restore's unwrap, Migrate's passthrough)
     * otherwise don't. Frozen settings aren't a `SettingsV1`, so pass through.
     */
  }, {
    key: "canonicalizeSettings",
    value: function canonicalizeSettings(settingsData) {
      var live = (0, _utils.parseLiveSettings)(settingsData);
      return live ? (0, _utils.serializeSettings)(live) : settingsData;
    }
  }, {
    key: "buildChange",
    value: function () {
      var _buildChange = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee1(change, signatures, destinationSignatures) {
        var state, resolved, tx, nextDatum;
        return _regenerator().w(function (_context1) {
          while (1) switch (_context1.n) {
            case 0:
              _context1.n = 1;
              return this.requireGovernedState();
            case 1:
              state = _context1.v;
              resolved = this.resolveChange(state, change);
              tx = this.blaze.newTransaction();
              tx.addInput(state.proxyUtxo, Data.Void());
              tx.addWithdrawal(this.settingsRewardAccount, 0n, (0, _utils.serializeSettingsSignedRedeemer)(resolved.redeemer, signatures));
              _context1.n = 2;
              return this.applySettingsWitness(tx);
            case 2:
              if (!resolved.coValidateWith) {
                _context1.n = 4;
                break;
              }
              if (destinationSignatures) {
                _context1.n = 3;
                break;
              }
              throw new Error("Migrate requires destinationSignatures for the destination validator");
            case 3:
              // The destination validator independently verifies signatures over the
              // same auth-payload hash against its own governance config.
              tx.addWithdrawal(resolved.coValidateWith.rewardAccount, 0n, (0, _utils.serializeSettingsSignedRedeemer)("Migrate", destinationSignatures));
              _context1.n = 4;
              return resolved.coValidateWith.applyWitness(tx);
            case 4:
              nextDatum = (0, _utils.buildRawProxyDatum)(resolved.nextLogicHash, resolved.nextSettingsData);
              return _context1.a(2, (0, _index.lockOrPayAssets)(tx, resolved.receiverAddress, this.valueWithDatumMinAda(resolved.receiverAddress, state.proxyUtxo.output().amount(), nextDatum), nextDatum));
          }
        }, _callee1, this);
      }));
      function buildChange(_x8, _x9, _x0) {
        return _buildChange.apply(this, arguments);
      }
      return buildChange;
    }()
    /**
     * The value to put on a settings output carrying `datum`, topped up to the
     * min-ADA floor for that datum when the incoming coin no longer covers it.
     *
     * A settings edit can grow the datum (appending a reserve asset, a larger
     * registry), and the coin comes from the UTxO being spent, which was sized
     * for the *previous* datum. `TxBuilder` would raise an under-funded output to
     * the floor on its way out, but that happens after balancing has already
     * decided what to draw from the wallet, so the bump is never funded and the
     * built transaction is short by exactly that amount. Reserving it here means
     * `complete()` treats the growth as an ordinary larger payment from the first
     * iteration.
     *
     * The floor is recomputed after each raise: a larger coin is itself a few
     * bytes wider on the wire, which can lift the floor again.
     */
  }, {
    key: "valueWithDatumMinAda",
    value: function valueWithDatumMinAda(address, value, datum) {
      var result = value;
      // Converges in one or two passes; the bound just refuses to spin.
      for (var i = 0; i < 4; i++) {
        var output = new _sdk.Core.TransactionOutput(address, result);
        output.setDatum(_sdk.Core.Datum.newInlineData(datum));
        var floor = (0, _sdk.calculateMinAda)(output, this.blaze.params.coinsPerUtxoByte);
        if (result.coin() >= floor) return result;
        result = new _sdk.Core.Value(floor, result.multiasset());
      }
      return result;
    }

    /** The payment-credential script hash of a settings validator address. */
  }, {
    key: "scriptHashOfAddress",
    value: function scriptHashOfAddress(address) {
      var paymentPart = address.getProps().paymentPart;
      if (!paymentPart || paymentPart.type !== _sdk.Core.CredentialType.ScriptHash) {
        throw new Error("Governed settings output must be locked at a script (validator) address");
      }
      return paymentPart.hash;
    }
  }, {
    key: "requireGovernedState",
    value: function () {
      var _requireGovernedState = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee10() {
        var state;
        return _regenerator().w(function (_context10) {
          while (1) switch (_context10.n) {
            case 0:
              _context10.n = 1;
              return this.getSettingsState();
            case 1:
              state = _context10.v;
              if (state.isGovernedByThisValidator) {
                _context10.n = 2;
                break;
              }
              throw new Error("Proxy NFT is not currently governed by this settings validator. Deposit it first.");
            case 2:
              return _context10.a(2, state);
          }
        }, _callee10, this);
      }));
      function requireGovernedState() {
        return _requireGovernedState.apply(this, arguments);
      }
      return requireGovernedState;
    }()
  }, {
    key: "applySettingsWitness",
    value: function () {
      var _applySettingsWitness = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee11(tx) {
        var refInput;
        return _regenerator().w(function (_context11) {
          while (1) switch (_context11.n) {
            case 0:
              if (!this.settingsRefInput) {
                _context11.n = 1;
                break;
              }
              tx.addReferenceInput(this.settingsRefInput);
              return _context11.a(2);
            case 1:
              _context11.n = 2;
              return this.blaze.provider.resolveScriptRef(this.settingsScriptHash);
            case 2:
              refInput = _context11.v;
              if (!refInput) {
                _context11.n = 3;
                break;
              }
              this.settingsRefInput = refInput;
              tx.addReferenceInput(refInput);
              return _context11.a(2);
            case 3:
              tx.provideScript(this.settingsScript);
            case 4:
              return _context11.a(2);
          }
        }, _callee11, this);
      }));
      function applySettingsWitness(_x1) {
        return _applySettingsWitness.apply(this, arguments);
      }
      return applySettingsWitness;
    }()
  }], [{
    key: "create",
    value: function create(blaze, params) {
      return new RealfiProtocolSettingsAdmin(blaze, params);
    }
  }, {
    key: "fromProtocolSdk",
    value: function fromProtocolSdk(sdk, params) {
      var _params$enableTrace2;
      return new RealfiProtocolSettingsAdmin(sdk.blaze, {
        proxyPolicyId: sdk.oneShotPolicyId,
        governanceConfig: params.governanceConfig,
        enableTrace: (_params$enableTrace2 = params.enableTrace) !== null && _params$enableTrace2 !== void 0 ? _params$enableTrace2 : sdk.enableTrace,
        referenceInputs: params.referenceInputs
      });
    }
  }]);
}();
//# sourceMappingURL=v1_1_rc1.js.map