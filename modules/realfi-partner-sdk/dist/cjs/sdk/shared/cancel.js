"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parseCancelOwner = parseCancelOwner;
exports.parseOrderOwnerWithHint = void 0;
var _data = require("@blaze-cardano/data");
var _utils = require("./utils.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t3 in e) "default" !== _t3 && {}.hasOwnProperty.call(e, _t3) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t3)) && (i.get || i.set) ? o(f, _t3, i) : f[_t3] = e[_t3]); return f; })(e, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
var parseOwnerField = function parseOwnerField(schema, datum) {
  return (0, _data.parse)(schema, datum).owner;
};

/**
 * Parse an order owner for cancel flows.
 *
 * Behavior:
 * - no version hint: use strict generic owner parsing immediately
 * - with version hint: try the hinted schema first
 * - hinted parse failure: fall back to strict generic owner parsing
 */
function parseCancelOwner(_x, _x2) {
  return _parseCancelOwner.apply(this, arguments);
}
function _parseCancelOwner() {
  _parseCancelOwner = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(utxo, versionHint) {
    var datum, _yield$import, OrderDatumV1, _yield$import2, _OrderDatumV, _yield$import3, _OrderDatumV2, _yield$import4, OrderDatum, _yield$import5, _OrderDatum, _t, _t2;
    return _regenerator().w(function (_context) {
      while (1) switch (_context.p = _context.n) {
        case 0:
          datum = (0, _utils.getInlineDatumFromUtxo)(utxo);
          if (versionHint) {
            _context.n = 1;
            break;
          }
          return _context.a(2, (0, _utils.parseOrderOwnerGenericFromDatum)(datum));
        case 1:
          _context.p = 1;
          _t = versionHint;
          _context.n = _t === "V1_0" ? 2 : _t === "V1_0_Rc1" ? 4 : _t === "V1_1_Rc1" ? 6 : _t === "V0_4" ? 8 : _t === "V0_3" ? 10 : 12;
          break;
        case 2:
          _context.n = 3;
          return Promise.resolve().then(function () {
            return _interopRequireWildcard(require("../../generated-types/v1_0/index.js"));
          });
        case 3:
          _yield$import = _context.v;
          OrderDatumV1 = _yield$import.OrderDatumV1;
          return _context.a(2, parseOwnerField(OrderDatumV1, datum));
        case 4:
          _context.n = 5;
          return Promise.resolve().then(function () {
            return _interopRequireWildcard(require("../../generated-types/v1_0_rc1/index.js"));
          });
        case 5:
          _yield$import2 = _context.v;
          _OrderDatumV = _yield$import2.OrderDatumV1;
          return _context.a(2, parseOwnerField(_OrderDatumV, datum));
        case 6:
          _context.n = 7;
          return Promise.resolve().then(function () {
            return _interopRequireWildcard(require("../../generated-types/v1_1_rc1/index.js"));
          });
        case 7:
          _yield$import3 = _context.v;
          _OrderDatumV2 = _yield$import3.OrderDatumV1;
          return _context.a(2, parseOwnerField(_OrderDatumV2, datum));
        case 8:
          _context.n = 9;
          return Promise.resolve().then(function () {
            return _interopRequireWildcard(require("../../generated-types/v0_4/index.js"));
          });
        case 9:
          _yield$import4 = _context.v;
          OrderDatum = _yield$import4.OrderDatum;
          return _context.a(2, parseOwnerField(OrderDatum, datum));
        case 10:
          _context.n = 11;
          return Promise.resolve().then(function () {
            return _interopRequireWildcard(require("../../generated-types/v0_3/index.js"));
          });
        case 11:
          _yield$import5 = _context.v;
          _OrderDatum = _yield$import5.OrderDatum;
          return _context.a(2, parseOwnerField(_OrderDatum, datum));
        case 12:
          return _context.a(2, (0, _utils.parseOrderOwnerGenericFromDatum)(datum));
        case 13:
          _context.n = 15;
          break;
        case 14:
          _context.p = 14;
          _t2 = _context.v;
          return _context.a(2, (0, _utils.parseOrderOwnerGenericFromDatum)(datum));
        case 15:
          return _context.a(2);
      }
    }, _callee, null, [[1, 14]]);
  }));
  return _parseCancelOwner.apply(this, arguments);
}
var parseOrderOwnerWithHint = exports.parseOrderOwnerWithHint = parseCancelOwner;
//# sourceMappingURL=cancel.js.map