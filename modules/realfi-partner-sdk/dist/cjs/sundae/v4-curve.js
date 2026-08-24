"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withV4CurveData = withV4CurveData;
var _core = require("@sundaeswap/core");
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
/**
 * Fills in the two v4 fields Sundae's own pool query does not select.
 *
 * `QueryProviderSundaeSwap.findPoolDataByAssetId` builds its query inside
 * `@sundaeswap/core`, and that query asks for neither `modules` nor `prices`.
 * So every v4 pool it returns arrives with `curve` and `prices` undefined, and
 * anything downstream has to assume the curve rather than check it.
 *
 * This is a stopgap for that gap, deliberately shaped to retire itself: it only
 * queries for pools that are *missing* the fields. The day Sundae selects them
 * upstream, the candidate list is empty, the extra request never fires, and
 * deleting this module is pure cleanup rather than a behaviour change.
 */

var POOL_CURVE_QUERY = "query poolCurves($asset: ID!) {\n  pools { byAsset(asset: $asset) { id modules { identifier } prices } }\n}";
var CURVES = [_core.EPoolCurve.ConstantProduct, _core.EPoolCurve.ConstantSum, _core.EPoolCurve.ConcentratedLiquidity];

/**
 * The invariant module identifiers are exactly the `EPoolCurve` values, so match
 * on those rather than on the `kind` discriminator — one less shape to depend on.
 */
function curveOf(row) {
  return CURVES.find(function (curve) {
    var _row$modules;
    return ((_row$modules = row.modules) !== null && _row$modules !== void 0 ? _row$modules : []).some(function (module) {
      return module.identifier === curve;
    });
  });
}

/**
 * `IPoolData.prices` is a two-tuple aligned to `[assetA, assetB]`, but a v4 pool
 * can hold up to 16 assets and the API returns a weight for each. Two cases are
 * safe to map:
 *
 * - every weight is equal, so whichever two `assetA`/`assetB` project to are
 *   equal as well — this is what RealFi's stablecoin pools look like, including
 *   the three-asset ones;
 * - exactly two weights, which align with the pair directly.
 *
 * Anything else is left undefined rather than guessed at. A consumer that needs
 * the weights then refuses the pool, which is the right answer for a pool we
 * cannot describe.
 */
function pricesOf(row) {
  var _row$prices;
  var raw = (_row$prices = row.prices) !== null && _row$prices !== void 0 ? _row$prices : [];
  if (raw.length === 0) return undefined;
  var weights = raw.map(function (price) {
    return BigInt(price);
  });
  if (new Set(weights).size === 1) {
    return [weights[0], weights[0]];
  }
  return weights.length === 2 ? [weights[0], weights[1]] : undefined;
}
function needsCurveData(pool) {
  return pool.version === _core.EContractVersion.V4 && (pool.curve === undefined || pool.prices === undefined);
}

/**
 * Returns `pools` with `curve`/`prices` filled in for the v4 pools that lacked
 * them. A pool the query cannot describe is returned untouched; a failed request
 * leaves every pool untouched, so discovery degrades to today's behaviour rather
 * than failing outright.
 */
function withV4CurveData(_x, _x2, _x3) {
  return _withV4CurveData.apply(this, arguments);
}
function _withV4CurveData() {
  _withV4CurveData = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(pools, assetId, endpoint) {
    var rows, _payload$data$pools$b, _payload$data, response, payload, byIdent, _t;
    return _regenerator().w(function (_context) {
      while (1) switch (_context.p = _context.n) {
        case 0:
          if (pools.some(needsCurveData)) {
            _context.n = 1;
            break;
          }
          return _context.a(2, _toConsumableArray(pools));
        case 1:
          _context.p = 1;
          _context.n = 2;
          return fetch(endpoint, {
            body: JSON.stringify({
              query: POOL_CURVE_QUERY,
              variables: {
                asset: assetId
              }
            }),
            headers: {
              "Content-Type": "application/json"
            },
            method: "POST"
          });
        case 2:
          response = _context.v;
          _context.n = 3;
          return response.json();
        case 3:
          payload = _context.v;
          rows = (_payload$data$pools$b = (_payload$data = payload.data) === null || _payload$data === void 0 || (_payload$data = _payload$data.pools) === null || _payload$data === void 0 ? void 0 : _payload$data.byAsset) !== null && _payload$data$pools$b !== void 0 ? _payload$data$pools$b : [];
          _context.n = 5;
          break;
        case 4:
          _context.p = 4;
          _t = _context.v;
          return _context.a(2, _toConsumableArray(pools));
        case 5:
          byIdent = new Map(rows.map(function (row) {
            return [row.id, row];
          }));
          return _context.a(2, pools.map(function (pool) {
            var _pool$curve, _pool$prices;
            if (!needsCurveData(pool)) return pool;
            var row = byIdent.get(pool.ident);
            if (!row) return pool;
            var curve = (_pool$curve = pool.curve) !== null && _pool$curve !== void 0 ? _pool$curve : curveOf(row);
            var prices = (_pool$prices = pool.prices) !== null && _pool$prices !== void 0 ? _pool$prices : pricesOf(row);
            return _objectSpread(_objectSpread(_objectSpread({}, pool), curve === undefined ? {} : {
              curve: curve
            }), prices === undefined ? {} : {
              prices: prices
            });
          }));
      }
    }, _callee, null, [[1, 4]]);
  }));
  return _withV4CurveData.apply(this, arguments);
}
//# sourceMappingURL=v4-curve.js.map