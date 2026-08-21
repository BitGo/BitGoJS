"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createPartnerCardanoSDK = createPartnerCardanoSDK;
var _index = require("./index.js");
var _detectParams = require("./shared/detect-params.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; } // Per-build protocol-version dispatch for the partner facade ("." entry).
// First-party consumers ("./internal") keep frozen version instances.
// Identity fields the dispatcher reads off a live version instance; every
// other member is reached by property delegation.

// Caller-supplied build options carried into a recreated instance. Cached
// referenceInputs stay behind — they belong to the previous version's scripts.

var isOrderBuilder = function isOrderBuilder(prop) {
  return typeof prop === "string" && prop.startsWith("build");
};
var requiresFreshVersion = function requiresFreshVersion(prop) {
  return prop === "buildStakeContinuation";
};

/**
 * Create a partner SDK that re-resolves the live protocol version before each
 * order build and dispatches to the matching version instance.
 *
 * Detection identity: the one-shot NFT policy (deterministic from
 * `proxyBootstrap`). The proxy UTxO ref changes on every settings update, but
 * the NFT lookup follows it, so each refresh is exactly one provider call.
 * The fetched `logic` hash is compared against the current instance's
 * `protocolScriptHash` — equal in every detectable version — and only on a
 * mismatch does the (local, provider-free) version matcher run and the
 * underlying instance get recreated, preserving `clientSource` so partner
 * order metadata survives the switch. Read helpers never trigger a refresh.
 *
 * No result caching beyond the last observed hash: freshness only shrinks the
 * stale window — correctness is enforced on-chain, and a stale-version build
 * is recovered via order invalidation.
 *
 * Refresh failure policy: an {@link UnknownProtocolVersionError} rejects the
 * build — the chain moved to a version this SDK cannot target. Any other
 * refresh error (e.g. a transient provider failure) logs a warning and the
 * build proceeds on the last known version, which is exactly what an
 * `"at-init"` instance would have produced. Stake continuations are stricter
 * under this `"per-build"` dispatcher: their address, schema, and
 * exchange-rate quote must all match the current deployment, so
 * `buildStakeContinuation` fails closed on every refresh error here. An
 * `"at-init"` instance, or a raw version-pinned SDK used outside this
 * dispatcher, never refreshes at all and carries no such guarantee.
 *
 * Method identity is unstable across accesses (`sdk.buildX !== sdk.buildX`):
 * each access returns a fresh wrapper over the live instance, by design.
 */
function createPartnerCardanoSDK(_x, _x2, _x3, _x4) {
  return _createPartnerCardanoSDK.apply(this, arguments);
}
function _createPartnerCardanoSDK() {
  _createPartnerCardanoSDK = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3(blaze, params, clientSource, options) {
    var _options$versionDetec;
    var createInstance, initial, detectInput, carriedExtras, state, doRefresh, refresh;
    return _regenerator().w(function (_context3) {
      while (1) switch (_context3.n) {
        case 0:
          createInstance = function createInstance(p) {
            return _index.RealfiSDK.create(blaze, _objectSpread(_objectSpread({}, p), {}, {
              clientSource: clientSource
            }));
          };
          _context3.n = 1;
          return createInstance(params);
        case 1:
          initial = _context3.v;
          if (!(((_options$versionDetec = options === null || options === void 0 ? void 0 : options.versionDetection) !== null && _options$versionDetec !== void 0 ? _options$versionDetec : "per-build") === "at-init")) {
            _context3.n = 2;
            break;
          }
          return _context3.a(2, initial);
        case 2:
          detectInput = {
            proxyBootstrap: params.proxyBootstrap,
            treasuryBootstrap: params.treasuryBootstrap,
            stakingVaultBootstrap: params.stakingVaultBootstrap,
            yieldOracleBootstrap: "yieldOracleBootstrap" in params ? params.yieldOracleBootstrap : undefined,
            assetNameHex: params.assetNameHex,
            sUSDrAssetNameHex: params.sUSDrAssetNameHex,
            enableTrace: params.enableTrace
          };
          carriedExtras = params;
          state = {
            instance: initial,
            // Every detectable version's proxy datum `logic` hash is that version
            // class's protocolScriptHash.
            lastLogicHash: initial.protocolScriptHash
          };
          doRefresh = /*#__PURE__*/function () {
            var _ref = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
              var oneShotPolicyId, snapshot, detected, previous, next, _options$onVersionCha;
              return _regenerator().w(function (_context) {
                while (1) switch (_context.n) {
                  case 0:
                    oneShotPolicyId = state.instance.oneShotPolicyId;
                    _context.n = 1;
                    return (0, _detectParams.fetchProxyLogicSnapshot)(blaze.provider, oneShotPolicyId);
                  case 1:
                    snapshot = _context.v;
                    if (!(snapshot.logicHash === state.lastLogicHash)) {
                      _context.n = 2;
                      break;
                    }
                    return _context.a(2);
                  case 2:
                    _context.n = 3;
                    return (0, _detectParams.matchProtocolVersion)(snapshot, oneShotPolicyId, detectInput);
                  case 3:
                    detected = _context.v;
                    previous = state.instance.version;
                    _context.n = 4;
                    return createInstance(_objectSpread(_objectSpread({}, detected), {}, {
                      scriptDeploymentAddress: carriedExtras.scriptDeploymentAddress,
                      defaultSlippageToleranceBps: carriedExtras.defaultSlippageToleranceBps
                    }));
                  case 4:
                    next = _context.v;
                    state.instance = next;
                    state.lastLogicHash = snapshot.logicHash;
                    if (next.version !== previous) {
                      console.warn("[realfi-sdk] Protocol version changed: ".concat(previous, " -> ").concat(next.version, ". Order builders now target ").concat(next.version, "."), {
                        previous: previous,
                        next: next.version
                      });
                      // A throwing partner callback must not break the build.
                      try {
                        options === null || options === void 0 || (_options$onVersionCha = options.onVersionChange) === null || _options$onVersionCha === void 0 || _options$onVersionCha.call(options, previous, next.version);
                      } catch (callbackError) {
                        console.warn("[realfi-sdk] onVersionChange threw", callbackError);
                      }
                    }
                  case 5:
                    return _context.a(2);
                }
              }, _callee);
            }));
            return function doRefresh() {
              return _ref.apply(this, arguments);
            };
          }(); // Concurrent builds share one in-flight refresh.
          refresh = function refresh() {
            if (!state.inflightRefresh) {
              state.inflightRefresh = doRefresh()["finally"](function () {
                state.inflightRefresh = undefined;
              });
            }
            return state.inflightRefresh;
          }; // Delegating proxy: members always resolve against the live instance, so a
          // version switch also switches the available surface (e.g. V1-line-only
          // builders). Order builds refresh first; everything else passes through.
          return _context3.a(2, new Proxy(Object.create(null), {
            get: function get(_target, prop) {
              var live = state.instance;
              var value = live[prop];
              if (typeof value !== "function") return value;
              if (isOrderBuilder(prop)) {
                return /*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2() {
                  var current,
                    builder,
                    _len,
                    args,
                    _key,
                    _args2 = arguments,
                    _t;
                  return _regenerator().w(function (_context2) {
                    while (1) switch (_context2.p = _context2.n) {
                      case 0:
                        _context2.p = 0;
                        _context2.n = 1;
                        return refresh();
                      case 1:
                        _context2.n = 4;
                        break;
                      case 2:
                        _context2.p = 2;
                        _t = _context2.v;
                        if (!(_t instanceof _detectParams.UnknownProtocolVersionError || requiresFreshVersion(prop))) {
                          _context2.n = 3;
                          break;
                        }
                        throw _t;
                      case 3:
                        // Transient failure (e.g. provider blip): build on the last known
                        // version — no worse than an "at-init" instance.
                        console.warn("[realfi-sdk] Protocol-version refresh failed; ".concat(prop, " builds against last known version ").concat(state.instance.version, "."), _t);
                      case 4:
                        current = state.instance;
                        builder = current[prop];
                        if (!(typeof builder !== "function")) {
                          _context2.n = 5;
                          break;
                        }
                        throw new Error("[realfi-sdk] ".concat(prop, " is not available on protocol version ").concat(state.instance.version, "; the live protocol version changed since this SDK was created."));
                      case 5:
                        for (_len = _args2.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
                          args[_key] = _args2[_key];
                        }
                        return _context2.a(2, builder.apply(state.instance, args));
                    }
                  }, _callee2, null, [[0, 2]]);
                }));
              }
              return value.bind(state.instance);
            },
            has: function has(_target, prop) {
              return prop in state.instance;
            },
            set: function set(_target, prop, value) {
              state.instance[prop] = value;
              return true;
            },
            getPrototypeOf: function getPrototypeOf() {
              return Object.getPrototypeOf(state.instance);
            },
            ownKeys: function ownKeys() {
              return Reflect.ownKeys(state.instance);
            },
            getOwnPropertyDescriptor: function getOwnPropertyDescriptor(_target, prop) {
              var descriptor = Reflect.getOwnPropertyDescriptor(state.instance, prop);
              // The proxy target is an empty object; reported descriptors must be
              // configurable to satisfy proxy invariants.
              return descriptor ? _objectSpread(_objectSpread({}, descriptor), {}, {
                configurable: true
              }) : undefined;
            }
          }));
      }
    }, _callee3);
  }));
  return _createPartnerCardanoSDK.apply(this, arguments);
}
//# sourceMappingURL=partner-dispatcher.js.map