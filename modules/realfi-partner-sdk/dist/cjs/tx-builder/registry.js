"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TX_BUILDER_REGISTRY = void 0;
exports.createTxFlowBuilder = createTxFlowBuilder;
exports.getRealFiRequestAddress = getRealFiRequestAddress;
exports.getSundaeV3RequestAddress = getSundaeV3RequestAddress;
exports.getTxBuilderNetworkRegistry = getTxBuilderNetworkRegistry;
var _sdk = require("@blaze-cardano/sdk");
var _flow = require("./flow.js");
var _destination = require("./destination.js");
var _excluded = ["amount", "vaultRatio", "slippageToleranceBps"];
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _objectWithoutProperties(e, t) { if (null == e) return {}; var o, r, i = _objectWithoutPropertiesLoose(e, t); if (Object.getOwnPropertySymbols) { var n = Object.getOwnPropertySymbols(e); for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]); } return i; }
function _objectWithoutPropertiesLoose(r, e) { if (null == r) return {}; var t = {}; for (var n in r) if ({}.hasOwnProperty.call(r, n)) { if (-1 !== e.indexOf(n)) continue; t[n] = r[n]; } return t; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); } /* eslint-disable @typescript-eslint/naming-convention */
/** @deprecated V1_0 only. Prefer `SundaeV3SwapToStakeInput`. */

/** @deprecated V1_0 only. Prefer `SundaeV3SwapToStakeInput`. */

/** A swap leg with explicit cancellation authority for the routed order. */

/**
 * Any SDK instance exposing `buildStakeContinuation` — the partner facade's
 * per-build dispatcher, an `"at-init"` instance, or a raw version-pinned SDK.
 * Only the per-build dispatcher fails closed on a stale protocol version;
 * the others carry no such guarantee.
 */

/**
 * @deprecated Prefer `RealfiSDK.sundae.create(blaze).buildSwapToStakeOrderTx`.
 * This input belongs to the lower-level, V3-only flow composer.
 */

/**
 * Default request address registry. Sundae V3 entries are enterprise order
 * script addresses. The RealFi entry is a legacy V1_0-only path; preview runs
 * V1_1, so its old V1_0 address is deliberately unset. New stake continuations
 * derive the live address from the version-aware SDK instead.
 */
var TX_BUILDER_REGISTRY = exports.TX_BUILDER_REGISTRY = {
  preview: {
    realfi: {},
    sundaeV3: {
      requestAddress: "addr_test1wr866xg5kkvarzll69xjh0tfvqvu9zvuhht2qve9ehmgp0qfgf3wc"
    }
  },
  preprod: {
    realfi: {
      requestAddress: "addr_test1wrkgqyfrz7qhlhu737nf4v5dllypylasaqruphlul5jhpeczfzjzl"
    },
    sundaeV3: {
      requestAddress: "addr_test1wz5cn230um3cve5gvvgk9kxveqcd888r3vl3rtxn3qxpvhcv0tzpr"
    }
  },
  mainnet: {
    realfi: {},
    sundaeV3: {
      requestAddress: "addr1w8ax5k9mutg07p2ngscu3chsauktmstq92z9de938j8nqacprc9mw"
    }
  }
};

/**
 * Returns the registry entry for the selected network.
 */
function getTxBuilderNetworkRegistry(network) {
  var registry = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : TX_BUILDER_REGISTRY;
  return registry[network];
}

/**
 * Returns the RealFi request script address for the selected network.
 *
 * @deprecated V1_0 only. Prefer the version-aware SDK continuation builder.
 */
function getRealFiRequestAddress(network) {
  var registry = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : TX_BUILDER_REGISTRY;
  return requestAddressFromRegistry(getTxBuilderNetworkRegistry(network, registry).realfi.requestAddress, network, "RealFi");
}

/**
 * Returns the Sundae V3 request script address for the selected network.
 */
function getSundaeV3RequestAddress(network) {
  var registry = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : TX_BUILDER_REGISTRY;
  return requestAddressFromRegistry(getTxBuilderNetworkRegistry(network, registry).sundaeV3.requestAddress, network, "Sundae V3");
}

/**
 * Creates a network-scoped flow builder that fills request script addresses from
 * the registry before building the right-folded transaction flow.
 */
function createTxFlowBuilder(_ref) {
  var network = _ref.network,
    _ref$registry = _ref.registry,
    registry = _ref$registry === void 0 ? TX_BUILDER_REGISTRY : _ref$registry;
  var sundaeV3 = function sundaeV3(step) {
    return _objectSpread(_objectSpread({}, step), {}, {
      kind: "sundae-v3",
      network: network,
      address: getSundaeV3RequestAddress(network, registry)
    });
  };
  return {
    network: network,
    realfi: function realfi(step) {
      return _objectSpread(_objectSpread({}, step), {}, {
        kind: "realfi",
        address: getRealFiRequestAddress(network, registry)
      });
    },
    realfiStake: function realfiStake(_ref2) {
      var amount = _ref2.amount,
        vaultRatio = _ref2.vaultRatio,
        slippageToleranceBps = _ref2.slippageToleranceBps,
        step = _objectWithoutProperties(_ref2, _excluded);
      return _objectSpread(_objectSpread({}, step), {}, {
        kind: "realfi",
        address: getRealFiRequestAddress(network, registry),
        action: (0, _flow.buildRealFiStakeAction)({
          amount: amount,
          vaultRatio: vaultRatio,
          slippageToleranceBps: slippageToleranceBps
        })
      });
    },
    sundaeV3: sundaeV3,
    sundaeV3SwapToStake: function () {
      var _sundaeV3SwapToStake = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(_ref3) {
        var sdk, swap, finalStep, stake, continuation;
        return _regenerator().w(function (_context) {
          while (1) switch (_context.n) {
            case 0:
              sdk = _ref3.sdk, swap = _ref3.swap, finalStep = _ref3.finalStep, stake = _ref3.stake;
              if (swap.ownerAddress) {
                _context.n = 1;
                break;
              }
              throw new Error("Sundae V3 swap-to-stake requires ownerAddress so the swap remains cancellable");
            case 1:
              _context.n = 2;
              return sdk.buildStakeContinuation(_objectSpread(_objectSpread({
                owner: (0, _destination.realfiOwnerFromSundaeV3OwnerAddress)(network, swap.ownerAddress)
              }, stake), {}, {
                swap: swap.order,
                destination: (0, _destination.realfiDestinationFromStepResult)(finalStep)
              }));
            case 2:
              continuation = _context.v;
              return _context.a(2, (0, _flow.buildSundaeV3TxFlowStep)(sundaeV3(swap), continuation));
          }
        }, _callee);
      }));
      function sundaeV3SwapToStake(_x) {
        return _sundaeV3SwapToStake.apply(this, arguments);
      }
      return sundaeV3SwapToStake;
    }(),
    build: _flow.buildTxFlow,
    toOutput: _flow.txBuilderFlowResultToCoreOutput
  };
}
function requestAddressFromRegistry(requestAddress, network, protocol) {
  if (!requestAddress) {
    throw new Error("No ".concat(protocol, " request address configured for ").concat(network, ". Add it to the tx-builder registry before building this step."));
  }
  return _sdk.Core.Address.fromBech32(requestAddress);
}
//# sourceMappingURL=registry.js.map