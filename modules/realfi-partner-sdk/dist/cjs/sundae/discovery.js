"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createPoolDiscovery = createPoolDiscovery;
exports.createRuntimeCuratedPoolAssetsLoader = createRuntimeCuratedPoolAssetsLoader;
var _core = require("@sundaeswap/core");
var _realfiApi = require("../api/realfi-api.js");
var _registry = require("../api/registry.js");
var _support = require("./support.js");
var _v4Curve = require("./v4-curve.js");
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
/**
 * Which pools discovery returns, narrowing left to right:
 * `curated ⊆ buildable ⊆ all`.
 *
 * - `all` — every pool the Sundae API returns for the asset, any version.
 * - `buildable` — those the SDK can build an order *for*. Note "for", not
 *   "against": a V4 pool is included because the SDK places a pool-less intent
 *   for it, even though no order names the pool.
 * - `curated` — the buildable pools whose pair RealFi has approved.
 */

/** Internal seam for RealFi's authoritative runtime pair configuration. */

var SUNDAE_POOL_QUERY_RESULT_LIMIT = 50;
var SUNDAE_POOL_DISCOVERY_SCOPES = ["curated", "buildable", "all"];
function isPoolAsset(assetId, candidate) {
  return _core.SundaeUtils.isAssetIdsEqual(assetId, candidate);
}
function poolContainsAsset(pool, assetId) {
  return isPoolAsset(pool.assetA.assetId, assetId) || isPoolAsset(pool.assetB.assetId, assetId);
}
function deterministicUniquePools(pools) {
  var unique = new Map();
  var _iterator = _createForOfIteratorHelper(pools),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var pool = _step.value;
      var key = "".concat(pool.version, "\0").concat(pool.ident);
      if (!unique.has(key)) {
        unique.set(key, pool);
      }
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  return _toConsumableArray(unique.values()).sort(function (left, right) {
    if (left.ident !== right.ident) {
      return left.ident < right.ident ? -1 : 1;
    }
    if (left.version === right.version) {
      return 0;
    }
    return left.version < right.version ? -1 : 1;
  });
}
function isCuratedPool(pool, _ref) {
  var baseAssetId = _ref.baseAssetId,
    counterpartAssetIds = _ref.counterpartAssetIds;
  var aIsBase = isPoolAsset(pool.assetA.assetId, baseAssetId);
  var bIsBase = isPoolAsset(pool.assetB.assetId, baseAssetId);
  var counterpartId = aIsBase ? pool.assetB.assetId : bIsBase ? pool.assetA.assetId : undefined;
  return counterpartId !== undefined && counterpartAssetIds.some(function (assetId) {
    return isPoolAsset(counterpartId, assetId);
  });
}

/**
 * Internal constructor. The loader remains behind the package export boundary
 * so RealFi, not partners, owns curated pair selection.
 */
function createPoolDiscovery(network) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var loadCuratedPoolAssets = arguments.length > 2 ? arguments[2] : undefined;
  var queryProvider = new _core.QueryProviderSundaeSwap(network);
  if (options.endpoint !== undefined) {
    queryProvider.baseUrl = options.endpoint;
  }
  return {
    findPoolsByAsset: function findPoolsByAsset(assetId) {
      var _arguments = arguments;
      return _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
        var _ref2, _ref2$scope, scope, curatedAssets, rawPools, all, buildable, _t;
        return _regenerator().w(function (_context) {
          while (1) switch (_context.n) {
            case 0:
              _ref2 = _arguments.length > 1 && _arguments[1] !== undefined ? _arguments[1] : {}, _ref2$scope = _ref2.scope, scope = _ref2$scope === void 0 ? "curated" : _ref2$scope;
              if (!(assetId.trim().length === 0)) {
                _context.n = 1;
                break;
              }
              throw new Error("Sundae pool discovery requires a non-empty asset id");
            case 1:
              if (SUNDAE_POOL_DISCOVERY_SCOPES.includes(scope)) {
                _context.n = 2;
                break;
              }
              throw new Error("Unsupported Sundae pool discovery scope: ".concat(scope));
            case 2:
              if (!(scope === "curated" && !loadCuratedPoolAssets)) {
                _context.n = 3;
                break;
              }
              throw new Error("Curated Sundae pool discovery requires authoritative RealFi asset configuration");
            case 3:
              if (!(scope === "curated")) {
                _context.n = 5;
                break;
              }
              _context.n = 4;
              return loadCuratedPoolAssets(network);
            case 4:
              _t = _context.v;
              _context.n = 6;
              break;
            case 5:
              _t = undefined;
            case 6:
              curatedAssets = _t;
              _context.n = 7;
              return queryProvider.findPoolDataByAssetId(assetId);
            case 7:
              rawPools = _context.v;
              if (!(rawPools.length >= SUNDAE_POOL_QUERY_RESULT_LIMIT)) {
                _context.n = 8;
                break;
              }
              throw new Error("Sundae pool discovery returned ".concat(rawPools.length, " pools for ").concat(assetId, "; results may be truncated"));
            case 8:
              _context.n = 9;
              return (0, _v4Curve.withV4CurveData)(deterministicUniquePools(rawPools), assetId, queryProvider.baseUrl);
            case 9:
              all = _context.v;
              if (!(scope === "all")) {
                _context.n = 10;
                break;
              }
              return _context.a(2, all);
            case 10:
              // `swap`, not `buildAgainstPool` — see TSundaePoolDiscoveryScope. The
              // narrower capability would hide V4 from `curated` too, since that is
              // derived from this.
              buildable = all.filter(function (pool) {
                return (0, _support.isSwappableSundaeSwapVersion)(pool.version) && poolContainsAsset(pool, assetId);
              });
              if (!(scope === "buildable")) {
                _context.n = 11;
                break;
              }
              return _context.a(2, buildable);
            case 11:
              return _context.a(2, buildable.filter(function (pool) {
                return isCuratedPool(pool, curatedAssets);
              }));
          }
        }, _callee);
      }))();
    }
  };
}

/** RealFi-owned runtime curation used by the public network factory. */
function createRuntimeCuratedPoolAssetsLoader(partnerConfigUrl) {
  return /*#__PURE__*/function () {
    var _ref3 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(network) {
      var api, config;
      return _regenerator().w(function (_context2) {
        while (1) switch (_context2.n) {
          case 0:
            api = _realfiApi.RealfiApi.create(_objectSpread(_objectSpread({}, _registry.API_REGISTRY[network]), partnerConfigUrl === undefined ? {} : {
              partnerConfigUrl: partnerConfigUrl
            }));
            _context2.n = 1;
            return api.getPartnerConfig();
          case 1:
            config = _context2.v;
            return _context2.a(2, {
              baseAssetId: config.stablecoinAssetId,
              counterpartAssetIds: config.swapCounterpartAssets
            });
        }
      }, _callee2);
    }));
    return function (_x) {
      return _ref3.apply(this, arguments);
    };
  }();
}
//# sourceMappingURL=discovery.js.map