"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  RealfiSDK: true,
  RealfiSDKV0: true,
  RealfiSDKV0_1: true,
  RealfiSDKV0_2: true,
  RealfiSDKV0_3: true,
  RealfiSDKV0_4: true,
  RealfiSDKV1_0: true,
  RealfiSDKV1_0Rc1: true,
  RealfiSDKV1_1Rc1: true
};
exports.RealfiSDK = void 0;
Object.defineProperty(exports, "RealfiSDKV0", {
  enumerable: true,
  get: function get() {
    return _index2.RealfiSDKV0;
  }
});
Object.defineProperty(exports, "RealfiSDKV0_1", {
  enumerable: true,
  get: function get() {
    return _index3.RealfiSDKV0_1;
  }
});
Object.defineProperty(exports, "RealfiSDKV0_2", {
  enumerable: true,
  get: function get() {
    return _index4.RealfiSDKV0_2;
  }
});
Object.defineProperty(exports, "RealfiSDKV0_3", {
  enumerable: true,
  get: function get() {
    return _index5.RealfiSDKV0_3;
  }
});
Object.defineProperty(exports, "RealfiSDKV0_4", {
  enumerable: true,
  get: function get() {
    return _index6.RealfiSDKV0_4;
  }
});
Object.defineProperty(exports, "RealfiSDKV1_0", {
  enumerable: true,
  get: function get() {
    return _index7.RealfiSDKV1_0;
  }
});
Object.defineProperty(exports, "RealfiSDKV1_0Rc1", {
  enumerable: true,
  get: function get() {
    return _index8.RealfiSDKV1_0Rc1;
  }
});
Object.defineProperty(exports, "RealfiSDKV1_1Rc1", {
  enumerable: true,
  get: function get() {
    return _index9.RealfiSDKV1_1Rc1;
  }
});
var _index = require("./shared/index.js");
Object.keys(_index).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _index[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _index[key];
    }
  });
});
var _index2 = require("./v0/index.js");
var _index3 = require("./v0_1/index.js");
var _index4 = require("./v0_2/index.js");
var _index5 = require("./v0_3/index.js");
var _index6 = require("./v0_4/index.js");
var _index7 = require("./v1_0/index.js");
var _index8 = require("./v1_0_rc1/index.js");
var _index9 = require("./v1_1_rc1/index.js");
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t2 in e) "default" !== _t2 && {}.hasOwnProperty.call(e, _t2) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t2)) && (i.get || i.set) ? o(f, _t2, i) : f[_t2] = e[_t2]); return f; })(e, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; } // Re-export param types for convenience
// Re-export shared types and utilities
// Re-export version classes. These are tree-shaken out of consumer bundles
// that never reference them by name, thanks to `"sideEffects": false` in
// package.json. The facade below dispatches via dynamic `import()`, so the
// app's entry chunk only includes the version it actually selects at runtime.
/**
 * Union type of all SDK parameter types
 */
/**
 * Union type of all SDK versions
 */
// Function overloads for create. Returns are promises because the
// implementation lazy-loads the per-version module on demand.
function createRealfiSDK(_x, _x2) {
  return _createRealfiSDK.apply(this, arguments);
}
/** Call signature for {@link RealfiSDK.detectParams}, kept as an interface so it can carry overloads. */
function _createRealfiSDK() {
  _createRealfiSDK = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(blaze, params) {
    var _yield$import2, RealfiSDKV0, _yield$import3, RealfiSDKV0_1, _yield$import4, RealfiSDKV0_2, _yield$import5, RealfiSDKV0_3, _yield$import6, RealfiSDKV0_4, _yield$import7, RealfiSDKV1_0, _yield$import8, RealfiSDKV1_0Rc1, _yield$import9, RealfiSDKV1_1Rc1, _t;
    return _regenerator().w(function (_context2) {
      while (1) switch (_context2.n) {
        case 0:
          _t = params.version;
          _context2.n = _t === "V0" ? 1 : _t === "V0_1" ? 3 : _t === "V0_2" ? 5 : _t === "V0_3" ? 7 : _t === "V0_4" ? 9 : _t === "V1_0" ? 11 : _t === "V1_0_Rc1" ? 13 : _t === "V1_1_Rc1" ? 15 : 17;
          break;
        case 1:
          _context2.n = 2;
          return Promise.resolve().then(function () {
            return _interopRequireWildcard(require("./v0/index.js"));
          });
        case 2:
          _yield$import2 = _context2.v;
          RealfiSDKV0 = _yield$import2.RealfiSDKV0;
          return _context2.a(2, RealfiSDKV0.create(blaze, params));
        case 3:
          _context2.n = 4;
          return Promise.resolve().then(function () {
            return _interopRequireWildcard(require("./v0_1/index.js"));
          });
        case 4:
          _yield$import3 = _context2.v;
          RealfiSDKV0_1 = _yield$import3.RealfiSDKV0_1;
          return _context2.a(2, RealfiSDKV0_1.create(blaze, params));
        case 5:
          _context2.n = 6;
          return Promise.resolve().then(function () {
            return _interopRequireWildcard(require("./v0_2/index.js"));
          });
        case 6:
          _yield$import4 = _context2.v;
          RealfiSDKV0_2 = _yield$import4.RealfiSDKV0_2;
          return _context2.a(2, RealfiSDKV0_2.create(blaze, params));
        case 7:
          _context2.n = 8;
          return Promise.resolve().then(function () {
            return _interopRequireWildcard(require("./v0_3/index.js"));
          });
        case 8:
          _yield$import5 = _context2.v;
          RealfiSDKV0_3 = _yield$import5.RealfiSDKV0_3;
          return _context2.a(2, RealfiSDKV0_3.create(blaze, params));
        case 9:
          _context2.n = 10;
          return Promise.resolve().then(function () {
            return _interopRequireWildcard(require("./v0_4/index.js"));
          });
        case 10:
          _yield$import6 = _context2.v;
          RealfiSDKV0_4 = _yield$import6.RealfiSDKV0_4;
          return _context2.a(2, RealfiSDKV0_4.create(blaze, params));
        case 11:
          _context2.n = 12;
          return Promise.resolve().then(function () {
            return _interopRequireWildcard(require("./v1_0/index.js"));
          });
        case 12:
          _yield$import7 = _context2.v;
          RealfiSDKV1_0 = _yield$import7.RealfiSDKV1_0;
          return _context2.a(2, RealfiSDKV1_0.create(blaze, params));
        case 13:
          _context2.n = 14;
          return Promise.resolve().then(function () {
            return _interopRequireWildcard(require("./v1_0_rc1/index.js"));
          });
        case 14:
          _yield$import8 = _context2.v;
          RealfiSDKV1_0Rc1 = _yield$import8.RealfiSDKV1_0Rc1;
          return _context2.a(2, RealfiSDKV1_0Rc1.create(blaze, params));
        case 15:
          _context2.n = 16;
          return Promise.resolve().then(function () {
            return _interopRequireWildcard(require("./v1_1_rc1/index.js"));
          });
        case 16:
          _yield$import9 = _context2.v;
          RealfiSDKV1_1Rc1 = _yield$import9.RealfiSDKV1_1Rc1;
          return _context2.a(2, RealfiSDKV1_1Rc1.create(blaze, params));
        case 17:
          throw new Error("Unknown SDK version: ".concat(params.version));
        case 18:
          return _context2.a(2);
      }
    }, _callee2);
  }));
  return _createRealfiSDK.apply(this, arguments);
}
/**
 * RealfiSDK namespace for creating SDK instances.
 *
 * The SDK is the single entry point for all protocol operations.
 * Each version class (RealfiSDKV0, RealfiSDKV0_1, RealfiSDKV0_2, etc.) provides
 * version-specific functionality with correct types.
 *
 * The facade lazy-loads each version module via dynamic `import()` so consumer
 * bundles only ship the version they actually select at runtime.
 *
 * @example V0 - Simple minting
 * ```typescript
 * const sdk = await RealfiSDK.create(blaze, {
 *   version: "V0",
 *   proxyBootstrap: { txHash, outputIndex },
 *   assetNameHex: "55534472",
 * });
 * const mintTx = await sdk.buildMintTx(AssetAmount.fromValue(1000n, decimals));
 * ```
 *
 * @example V1_0 - Full protocol with DirectMint/DirectBurn
 * ```typescript
 * const sdk = await RealfiSDK.create(blaze, {
 *   version: "V1_0",
 *   proxyBootstrap: { txHash, outputIndex },
 *   treasuryBootstrap: { txHash: treasuryTxHash, outputIndex: treasuryOutputIndex },
 *   stakingVaultBootstrap: { txHash: vaultTxHash, outputIndex: vaultOutputIndex },
 *   assetNameHex: "55534472",
 *   sUSDrAssetNameHex: "7355534472",
 * });
 * const directMintTx = await sdk.buildDirectMintOrderTx({ amount, destination });
 * ```
 */
var RealfiSDK = exports.RealfiSDK = {
  /**
   * Create a new RealfiSDK instance.
   *
   * Returns the appropriate version-specific SDK based on the params.
   * The returned SDK has full type information for that version.
   */
  create: createRealfiSDK,
  /**
   * Detect the active protocol version from the on-chain proxy datum.
   *
   * Reads the proxy UTxO, extracts the `logic` script hash, and compares it
   * against expected hashes for each known SDK version. Returns fully-typed
   * SDK params (including V1_0 backward-compatibility flags) that can be
   * passed directly to `RealfiSDK.create`.
   *
   * `config` also accepts a network preset name (`"mainnet"`, `"preprod"`,
   * `"preview"`) in place of an explicit config, resolved via the built-in
   * network registry. Custom deployments still pass an explicit config.
   *
   * @throws {UnknownProtocolVersionError} if the on-chain hash matches no known version.
   */
  detectParams: function () {
    var _ref = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(provider, config) {
      var _yield$import, detectSDKParams;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.n) {
          case 0:
            _context.n = 1;
            return Promise.resolve().then(function () {
              return _interopRequireWildcard(require("./shared/detect-params.js"));
            });
          case 1:
            _yield$import = _context.v;
            detectSDKParams = _yield$import.detectSDKParams;
            return _context.a(2, typeof config === "string" ? detectSDKParams(provider, config) : detectSDKParams(provider, config));
        }
      }, _callee);
    }));
    return function detectParams(_x3, _x4) {
      return _ref.apply(this, arguments);
    };
  }()
};
//# sourceMappingURL=index.js.map