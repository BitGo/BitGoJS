"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "AssetAmount", {
  enumerable: true,
  get: function get() {
    return _asset.AssetAmount;
  }
});
Object.defineProperty(exports, "EContractVersion", {
  enumerable: true,
  get: function get() {
    return _core.EContractVersion;
  }
});
Object.defineProperty(exports, "EDatumType", {
  enumerable: true,
  get: function get() {
    return _core.EDatumType;
  }
});
Object.defineProperty(exports, "EPoolCurve", {
  enumerable: true,
  get: function get() {
    return _core.EPoolCurve;
  }
});
Object.defineProperty(exports, "ESwapType", {
  enumerable: true,
  get: function get() {
    return _core.ESwapType;
  }
});
Object.defineProperty(exports, "SUPPORTED_SUNDAE_SWAP_VERSIONS", {
  enumerable: true,
  get: function get() {
    return _support.SUPPORTED_SUNDAE_SWAP_VERSIONS;
  }
});
Object.defineProperty(exports, "SWAPPABLE_SUNDAE_SWAP_VERSIONS", {
  enumerable: true,
  get: function get() {
    return _support.SWAPPABLE_SUNDAE_SWAP_VERSIONS;
  }
});
Object.defineProperty(exports, "assertSupportedSundaeSwapPool", {
  enumerable: true,
  get: function get() {
    return _support.assertSupportedSundaeSwapPool;
  }
});
Object.defineProperty(exports, "assertSwappableSundaeSwapPool", {
  enumerable: true,
  get: function get() {
    return _support.assertSwappableSundaeSwapPool;
  }
});
exports.buildSwapIntentTx = _buildSwapIntentTx2;
exports.buildSwapOrderTx = _buildSwapOrderTx2;
exports.buildSwapToStakeOrderTx = _buildSwapToStakeOrderTx2;
exports.create = create;
exports.forNetwork = forNetwork;
Object.defineProperty(exports, "isSupportedSundaeSwapVersion", {
  enumerable: true,
  get: function get() {
    return _support.isSupportedSundaeSwapVersion;
  }
});
Object.defineProperty(exports, "isSwappableSundaeSwapVersion", {
  enumerable: true,
  get: function get() {
    return _support.isSwappableSundaeSwapVersion;
  }
});
exports.quoteSwap = quoteSwap;
exports.quoteSwapInput = quoteSwapInput;
exports.selectV4QuotePool = selectV4QuotePool;
var _sdk = require("@blaze-cardano/sdk");
var _asset = require("@sundaeswap/asset");
var _core = require("@sundaeswap/core");
var _destination = require("../tx-builder/destination.js");
var _discovery = require("./discovery.js");
var _support = require("./support.js");
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); } // Keep the partner construction surface self-contained. Consumers can build
// swap inputs through `SundaeSwap` without importing our implementation
// dependencies directly.
/**
 * A V4 swap intent: an offer and a floor, naming no pool.
 *
 * `referralFee` is deliberately not surfaced — no RealFi path takes one.
 */

/** Creates a network-scoped, Blaze-free Sundae pool discovery adapter. */
function forNetwork(network) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  return (0, _discovery.createPoolDiscovery)(network, options, (0, _discovery.createRuntimeCuratedPoolAssetsLoader)(options.partnerConfigUrl));
}
function canonicalizePoolAsset(pool, asset) {
  var metadata = [pool.assetA, pool.assetB].find(function (poolAsset) {
    return _core.SundaeUtils.isAssetIdsEqual(poolAsset.assetId, asset.metadata.assetId);
  });
  if (!metadata) {
    throw new Error("Asset is not part of the Sundae swap pool: ".concat(asset.metadata.assetId));
  }
  return new _asset.AssetAmount(asset.amount, metadata);
}
function oppositePoolAsset(pool, suppliedAsset) {
  return suppliedAsset.metadata.assetId === pool.assetA.assetId ? pool.assetB : pool.assetA;
}
function canonicalizeSwapType(pool, suppliedAsset, swapType) {
  if (swapType.type === _core.ESwapType.MARKET) {
    return swapType;
  }
  var minReceivable = canonicalizePoolAsset(pool, swapType.minReceivable);
  var expectedAsset = oppositePoolAsset(pool, suppliedAsset);
  if (minReceivable.metadata.assetId !== expectedAsset.assetId) {
    throw new Error("Sundae LIMIT minimum must use the pool asset opposite the supplied asset: ".concat(expectedAsset.assetId));
  }
  return _objectSpread(_objectSpread({}, swapType), {}, {
    minReceivable: minReceivable
  });
}
function assertValidSlippage(slippage) {
  if (!Number.isFinite(slippage) || slippage < 0 || slippage > 1) {
    throw new Error("Sundae swap slippage must be a finite number between 0 and 1 inclusive");
  }
}
function decimalFraction(value) {
  var _value$toString$toLow = value.toString().toLowerCase().split("e"),
    _value$toString$toLow2 = _slicedToArray(_value$toString$toLow, 2),
    _value$toString$toLow3 = _value$toString$toLow2[0],
    coefficient = _value$toString$toLow3 === void 0 ? "0" : _value$toString$toLow3,
    exponentText = _value$toString$toLow2[1];
  var exponent = Number(exponentText !== null && exponentText !== void 0 ? exponentText : 0);
  var _coefficient$split = coefficient.split("."),
    _coefficient$split2 = _slicedToArray(_coefficient$split, 2),
    whole = _coefficient$split2[0],
    _coefficient$split2$ = _coefficient$split2[1],
    fraction = _coefficient$split2$ === void 0 ? "" : _coefficient$split2$;
  var digits = BigInt("".concat(whole).concat(fraction));
  var scale = fraction.length - exponent;
  return scale > 0 ? {
    numerator: digits,
    denominator: Math.pow(10n, BigInt(scale))
  } : {
    numerator: digits * Math.pow(10n, BigInt(-scale)),
    denominator: 1n
  };
}
function ceilDiv(numerator, denominator) {
  return numerator === 0n ? 0n : (numerator + denominator - 1n) / denominator;
}

/**
 * Applies the caller's decimal slippage to an integer quote without coercing
 * the quote to a JavaScript number. Sundae's helper performs that coercion,
 * which can weaken large minimums after `Number.MAX_SAFE_INTEGER`.
 */
function minReceivableFromSlippage(output, receivedAsset, slippage) {
  var _decimalFraction = decimalFraction(slippage),
    numerator = _decimalFraction.numerator,
    denominator = _decimalFraction.denominator;
  var remaining = denominator - numerator;
  var amount = ceilDiv(output * remaining, denominator);
  return new _asset.AssetAmount(amount, receivedAsset);
}

/**
 * Why this fee cannot quote a constant-sum swap, or undefined if it can.
 *
 * At a fee of 1 the forward quote settles to nothing and the inverse divides by
 * zero; above 1 the forward quote goes negative. The bound matches
 * `ConstantSumPool.getSwapInput`'s own `[0, 1)` — the forward direction
 * tolerates exactly 1, but a pool taking the whole trade is not one we should be
 * quoting either way.
 */
function feeRefusal(currentFee) {
  if (!Number.isFinite(currentFee) || currentFee < 0 || currentFee >= 1) {
    return "Sundae constant-sum swap requires a fee in [0, 1); got ".concat(currentFee);
  }
  return undefined;
}

/**
 * The positive-amount rule matches what V3 and Stableswaps already enforce
 * through Sundae's "Input and reserves must be positive"; V4 was the only
 * version that quietly returned zero instead.
 */
function assertQuotableConstantSum(amount, currentFee) {
  if (amount <= 0n) {
    throw new Error("Sundae constant-sum swap requires a positive amount");
  }
  var refusal = feeRefusal(currentFee);
  if (refusal) {
    throw new Error(refusal);
  }
}

/**
 * Settles a V4 (constant-sum) swap the way Sundae's own engine does:
 *
 *     output = offered − floor(offered × fee)
 *
 * That is `ConstantSumPool.getSwapOutput` from `@sundaeswap/math` specialised to
 * equal per-asset prices, not an approximation of it. We cannot call
 * `SundaeUtils.getSwapOutput` for V4 because it dispatches on `pool.curve`, and
 * the Sundae API populates neither `curve` nor `prices` — it would fall through
 * to `Unsupported v4 pool curve: undefined`.
 *
 * The rate comes from `currentFee`'s exact decimal expansion rather than a float
 * product: past `Number.MAX_SAFE_INTEGER` a float drops the low digits and
 * shifts the result, the same hazard {@link minReceivableFromSlippage} avoids.
 *
 * `priceWeight` is the pool's per-asset constant-sum price, which both assets of
 * a supported pool share. It cannot be divided out: the fee is floored at the
 * *scaled* value and the quotient is floored again, so the two roundings only
 * collapse into one at a weight of `1`. At a weight of `2`, offering `1999` at a
 * fee of `0.001` settles to `1997`, where dividing out would say `1998` — and
 * since this figure also becomes `minReceived`, the higher answer would leave a
 * floor the fill can never clear.
 *
 * Deliberately does NOT cap the output at the pool's reserve. `ConstantSumPool`
 * caps, because it prices one specific pool; a V4 order names no pool, so
 * capping here would silently lower `minReceived` — the owner's only guarantee —
 * whenever a large order is quoted against a shallow pool.
 */
function constantSumSwapOutput(offered, currentFee, priceWeight) {
  assertQuotableConstantSum(offered, currentFee);
  var _decimalFraction2 = decimalFraction(currentFee),
    numerator = _decimalFraction2.numerator,
    denominator = _decimalFraction2.denominator;
  var offeredValue = offered * priceWeight;
  var feeValue = offeredValue * numerator / denominator;
  return (offeredValue - feeValue) / priceWeight;
}

/**
 * Quotes a V4 swap. `slippage` is validated by {@link quoteSwap} and then
 * ignored: a constant-sum pool has no price movement to buffer against, and —
 * decisively — the surplus above `min_received` is unbound on-chain, so slack in
 * the floor is not a safety margin, it is directly skimmable by the scooper.
 * `estimatedReceived` and `minReceived` are therefore the same figure.
 *
 * Assumes the pool weights its two assets equally. That precondition is
 * unverifiable from the API, which never serves `prices`; the matching-decimals
 * half of it is checked here, and the pools RealFi trades satisfy both.
 */
/**
 * Why this pool cannot be priced as an equal-weight constant-sum pool, or
 * undefined if it can. {@link constantSumPriceWeight} throws it and
 * {@link selectV4QuotePool} filters on it, so the two cannot drift apart.
 */
function constantSumRefusal(pool) {
  // A V4 pool's swap math follows its invariant module, not its contract
  // version, so "V4" alone does not mean constant-sum. Nor does an absent
  // `curve`: that means whoever fetched the pool did not ask for it, which is
  // not evidence of anything. Pool discovery asks; Sundae's own query provider
  // does not.
  if (pool.curve !== _core.EPoolCurve.ConstantSum) {
    var _pool$curve;
    return "Sundae V4 pool ".concat(pool.ident, " is not known to be ").concat(_core.EPoolCurve.ConstantSum, " ") + "(curve: ".concat((_pool$curve = pool.curve) !== null && _pool$curve !== void 0 ? _pool$curve : "unknown", "). Resolve pools through pool ") + "discovery, which supplies the curve.";
  }
  // Same story for `prices`: absent means unasked, not 1:1. Unequal weights need
  // the two-price form of the constant-sum formula and a reserve orientation
  // this quote does not model; equal weights of any magnitude are handled, and
  // carried into the arithmetic rather than divided out.
  if (pool.prices === undefined) {
    return "Sundae V4 pool ".concat(pool.ident, " declares no price weights. Resolve pools ") + "through pool discovery, which supplies them.";
  }
  var _pool$prices = _slicedToArray(pool.prices, 2),
    priceIn = _pool$prices[0],
    priceOut = _pool$prices[1];
  if (priceIn !== priceOut) {
    return "Sundae V4 pool ".concat(pool.ident, " weights its assets ") + "".concat(priceIn, ":").concat(priceOut, "; only equal weights are priced here");
  }
  if (priceIn <= 0n) {
    return "Sundae V4 pool ".concat(pool.ident, " declares a non-positive price weight");
  }
  // Decimals stand in for the price weights we usually cannot see: a 1:1
  // constant-sum pair settles raw amounts one-for-one only at equal scale.
  if (pool.assetA.decimals !== pool.assetB.decimals) {
    return "Sundae V4 pool ".concat(pool.ident, " pairs assets of differing decimals ") + "(".concat(pool.assetA.decimals, " and ").concat(pool.assetB.decimals, "); the 1:1 ") + "constant-sum assumption does not hold";
  }
  return undefined;
}
function constantSumPriceWeight(pool) {
  var refusal = constantSumRefusal(pool);
  if (refusal) {
    throw new Error(refusal);
  }
  return pool.prices[0];
}

/**
 * Stricter than the quote, deliberately: a swap form trades both ways against
 * the one pool it selected, so both reserves must be usable, where a single
 * quote only checks the side it pays out.
 */
function isSelectableV4Pool(pool) {
  return constantSumRefusal(pool) === undefined && feeRefusal(pool.currentFee) === undefined && pool.liquidity.aReserve > 0n && pool.liquidity.bReserve > 0n;
}

/**
 * Picks the V4 pool whose fee should quote a swap, ignoring any non-V4 pool in
 * `pools` and any V4 pool {@link quoteSwap} would refuse. Undefined when none
 * qualifies, which means the caller should fall back to another version.
 *
 * A V4 order names no pool, so this routes nothing — it only decides whose fee
 * sets `min_received`. Cheapest is both the best rate and the safer pick: the
 * floor is the owner's only guarantee, and a pool overstating its fee would drag
 * it down into territory a scooper can fill cheaply and pocket the difference.
 * A hostile pool can therefore only win by genuinely being the cheapest.
 *
 * Selection lives here rather than in the caller so that the eligibility rules
 * have one home. `SundaeUtils.getBestPoolBySwapOutcome` is the equivalent for
 * the other versions and cannot be used: it calls `getSwapOutput`, which throws
 * on a V4 pool.
 */
function selectV4QuotePool(pools) {
  return pools.filter(function (pool) {
    return pool.version === _core.EContractVersion.V4 && isSelectableV4Pool(pool);
  }).reduce(function (best, pool) {
    return best === undefined || pool.currentFee < best.currentFee ? pool : best;
  }, undefined);
}
function quoteConstantSumSwap(pool, suppliedAsset, receivedAsset, outputReserve) {
  var priceIn = constantSumPriceWeight(pool);
  if (outputReserve <= 0n) {
    throw new Error("Sundae V4 pool ".concat(pool.ident, " holds no ").concat(receivedAsset.assetId, " to swap into"));
  }
  var output = constantSumSwapOutput(suppliedAsset.amount, pool.currentFee, priceIn);
  return {
    estimatedReceived: new _asset.AssetAmount(output, receivedAsset),
    minReceived: new _asset.AssetAmount(output, receivedAsset),
    priceImpact: 0
  };
}

/**
 * Quotes a market swap for any swappable pool version. Callers do not branch on
 * `pool.version`; this does.
 *
 * V3 / Stableswaps use Sundae's own pool math with the caller's slippage applied
 * at bigint precision. V4 is constant-sum — see {@link quoteConstantSumSwap} for
 * why its quote is exact, why `priceImpact` is `0`, and why `slippage` is
 * ignored there.
 */
function quoteSwap(_ref) {
  var pool = _ref.pool,
    suppliedAsset = _ref.suppliedAsset,
    slippage = _ref.slippage;
  (0, _support.assertSwappableSundaeSwapPool)(pool);
  assertValidSlippage(slippage);
  var canonicalSuppliedAsset = canonicalizePoolAsset(pool, suppliedAsset);
  var receivesAssetA = _core.SundaeUtils.isAssetIdsEqual(pool.assetB.assetId, canonicalSuppliedAsset.metadata.assetId);
  var receivedAsset = receivesAssetA ? pool.assetA : pool.assetB;
  if (pool.version === _core.EContractVersion.V4) {
    return quoteConstantSumSwap(pool, canonicalSuppliedAsset, receivedAsset, receivesAssetA ? pool.liquidity.aReserve : pool.liquidity.bReserve);
  }
  var outcome = _core.SundaeUtils.getSwapOutput(pool, canonicalSuppliedAsset);
  return {
    estimatedReceived: new _asset.AssetAmount(outcome.output, receivedAsset),
    minReceived: minReceivableFromSlippage(outcome.output, receivedAsset, slippage),
    priceImpact: outcome.priceImpact.toNumber()
  };
}

/**
 * The smallest constant-sum supply that still yields `output`.
 *
 * Mirrors `ConstantSumPool.getSwapInput`. Not a plain gross-up: the forward
 * settlement is `ceil(input·price·(feeDen−feeNum)/feeDen)`, and that clears
 * `output·price` exactly when the numerator reaches `feeDen·(target−1)+1`, so
 * the `−1n` is what keeps the answer minimal rather than a unit high.
 */
function constantSumSwapInput(output, currentFee, priceWeight) {
  // Reasserted here even though `quoteSwapInput` checks the amount: this is
  // where a fee of 1 would divide by zero, and the raw error would name the
  // division rather than the fee that caused it.
  assertQuotableConstantSum(output, currentFee);
  var _decimalFraction3 = decimalFraction(currentFee),
    feeNum = _decimalFraction3.numerator,
    feeDen = _decimalFraction3.denominator;
  var targetValue = output * priceWeight;
  var numerator = feeDen * (targetValue - 1n) + 1n;
  var denominator = (feeDen - feeNum) * priceWeight;
  return (numerator + denominator - 1n) / denominator;
}

/**
 * Quotes the supply needed to receive `desiredOutput`, for any swappable pool
 * version. The inverse of {@link quoteSwap}, and the direction a swap form needs
 * when the user edits the receive field rather than the pay field.
 */
function quoteSwapInput(_ref2) {
  var pool = _ref2.pool,
    desiredOutput = _ref2.desiredOutput;
  (0, _support.assertSwappableSundaeSwapPool)(pool);
  var canonicalDesiredOutput = canonicalizePoolAsset(pool, desiredOutput);
  var suppliedAsset = oppositePoolAsset(pool, canonicalDesiredOutput);
  if (pool.version === _core.EContractVersion.V4) {
    if (canonicalDesiredOutput.amount <= 0n) {
      throw new Error("Sundae V4 swap requires a positive desired output");
    }
    return {
      requiredInput: new _asset.AssetAmount(constantSumSwapInput(canonicalDesiredOutput.amount, pool.currentFee, constantSumPriceWeight(pool)), suppliedAsset)
    };
  }
  return {
    requiredInput: new _asset.AssetAmount(_core.SundaeUtils.getSwapInput(pool, canonicalDesiredOutput).input, suppliedAsset)
  };
}

/**
 * Builds a standalone Sundae swap order against a specific pool.
 *
 * V4 is quotable but not buildable here: its order carries no pool reference at
 * all, so it cannot share this pool-taking argument shape. Use
 * {@link buildSwapIntentTx}.
 */
function _buildSwapOrderTx2(_x, _x2) {
  return _buildSwapOrderTx.apply(this, arguments);
}
/**
 * Places a Sundae V4 swap.
 *
 * A V4 order is an intent: an offer and a floor, naming no pool. The scooper
 * decides how to fill it — one pool, a split across the pair's pools, or a
 * multi-hop chain — and `minReceived` is what bounds the result.
 *
 * Goes through `swapIntent` rather than `swap`: `TxBuilderV4.swap` throws by
 * design, because a swap order carries the route constraint, which is outside
 * the launch's audited surface.
 */
function _buildSwapOrderTx() {
  _buildSwapOrderTx = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(blaze, params) {
    var suppliedAsset, swapType, builderSwapType, canonicalParams, builder;
    return _regenerator().w(function (_context) {
      while (1) switch (_context.n) {
        case 0:
          if (!(params.pool.version === _core.EContractVersion.V4)) {
            _context.n = 1;
            break;
          }
          throw new Error("Sundae V4 swaps are placed as pool-less intents; use buildSwapIntentTx");
        case 1:
          (0, _support.assertSupportedSundaeSwapPool)(params.pool);
          if (params.swapType.type === _core.ESwapType.MARKET) {
            assertValidSlippage(params.swapType.slippage);
          }
          suppliedAsset = canonicalizePoolAsset(params.pool, params.suppliedAsset);
          swapType = canonicalizeSwapType(params.pool, suppliedAsset, params.swapType);
          builderSwapType = swapType.type === _core.ESwapType.MARKET ? {
            type: _core.ESwapType.LIMIT,
            minReceivable: minReceivableFromSlippage(_core.SundaeUtils.getSwapOutput(params.pool, suppliedAsset).output, oppositePoolAsset(params.pool, suppliedAsset), swapType.slippage)
          } : swapType;
          canonicalParams = _objectSpread(_objectSpread({}, params), {}, {
            suppliedAsset: suppliedAsset,
            // Convert MARKET inputs to the equivalent LIMIT input ourselves so the
            // Sundae builder cannot repeat its bigint-unsafe slippage calculation.
            swapType: builderSwapType
          });
          builder = _core.SundaeSDK["new"]({
            blazeInstance: blaze
          }).builder(params.pool.version);
          return _context.a(2, builder.swap(canonicalParams));
      }
    }, _callee);
  }));
  return _buildSwapOrderTx.apply(this, arguments);
}
function _buildSwapIntentTx2(_x3, _x4) {
  return _buildSwapIntentTx.apply(this, arguments);
}
/**
 * Builds a Sundae V3 or Stableswaps order whose proceeds continue into a
 * version-aware RealFi stake order. The caller's original Sundae destination
 * becomes the RealFi destination, so both sUSDr and any USDr above Sundae's
 * guaranteed minimum continue to the intended recipient.
 */
function _buildSwapIntentTx() {
  _buildSwapIntentTx = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(blaze, params) {
    var builder;
    return _regenerator().w(function (_context2) {
      while (1) switch (_context2.n) {
        case 0:
          if (params.ownerAddress) {
            _context2.n = 1;
            break;
          }
          throw new Error("Sundae V4 swap requires ownerAddress so the order remains cancellable");
        case 1:
          if (!(params.offered.amount <= 0n)) {
            _context2.n = 2;
            break;
          }
          throw new Error("Sundae V4 swap requires a positive offered amount");
        case 2:
          if (!(params.minReceived.amount <= 0n)) {
            _context2.n = 3;
            break;
          }
          throw new Error("Sundae V4 swap requires a positive minReceived amount");
        case 3:
          if (!_core.SundaeUtils.isAssetIdsEqual(params.offered.metadata.assetId, params.minReceived.metadata.assetId)) {
            _context2.n = 4;
            break;
          }
          throw new Error("Sundae V4 swap requires the offered and received assets to differ");
        case 4:
          builder = _core.SundaeSDK["new"]({
            blazeInstance: blaze
          }).builder(_core.EContractVersion.V4); // Each optional is forwarded only when supplied, so Sundae's own defaults
          // apply otherwise.
          return _context2.a(2, builder.swapIntent(_objectSpread(_objectSpread(_objectSpread(_objectSpread({
            ownerAddress: params.ownerAddress,
            offered: params.offered,
            minReceived: params.minReceived
          }, params.destination === undefined ? {} : {
            destination: params.destination
          }), params.budget === undefined ? {} : {
            budget: params.budget
          }), params.maxPerExecution === undefined ? {} : {
            maxPerExecution: params.maxPerExecution
          }), params.configToken === undefined ? {} : {
            configToken: params.configToken
          })));
      }
    }, _callee2);
  }));
  return _buildSwapIntentTx.apply(this, arguments);
}
function _buildSwapToStakeOrderTx2(_x5, _x6) {
  return _buildSwapToStakeOrderTx.apply(this, arguments);
}
/** Creates a Blaze-scoped partner swap adapter. */
function _buildSwapToStakeOrderTx() {
  _buildSwapToStakeOrderTx = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3(blaze, _ref3) {
    var _stake$owner;
    var sdk, swap, stake, suppliedAsset, swapType, minReceived, continuation;
    return _regenerator().w(function (_context3) {
      while (1) switch (_context3.n) {
        case 0:
          sdk = _ref3.sdk, swap = _ref3.swap, stake = _ref3.stake;
          (0, _support.assertSupportedSundaeSwapPool)(swap.pool);
          if (swap.ownerAddress) {
            _context3.n = 1;
            break;
          }
          throw new Error("Sundae swap-to-stake requires ownerAddress so the swap remains cancellable");
        case 1:
          // The Sundae builder validates the continuation address that replaces this
          // destination. Validate the caller's original final destination first so a
          // cross-network address or a script address without a datum cannot be hidden
          // by composition and later receive the sUSDr/excess output incorrectly.
          _core.BlazeHelper.validateAddressAndDatumAreValid(_objectSpread(_objectSpread({}, swap.orderAddresses.DestinationAddress), {}, {
            network: _core.SundaeUtils.getNetworkFromProvider(blaze.provider.networkName)
          }));
          suppliedAsset = canonicalizePoolAsset(swap.pool, swap.suppliedAsset);
          swapType = canonicalizeSwapType(swap.pool, suppliedAsset, swap.swapType);
          minReceived = swapType.type === _core.ESwapType.LIMIT ? swapType.minReceivable : quoteSwap({
            pool: swap.pool,
            suppliedAsset: suppliedAsset,
            slippage: swapType.slippage
          }).minReceived;
          _context3.n = 2;
          return sdk.buildStakeContinuation(_objectSpread(_objectSpread({}, stake), {}, {
            owner: (_stake$owner = stake === null || stake === void 0 ? void 0 : stake.owner) !== null && _stake$owner !== void 0 ? _stake$owner : (0, _destination.realfiOwnerFromSundaeV3OwnerAddress)(_sdk.Core.Address.fromBech32(swap.ownerAddress).getNetworkId() === _sdk.Core.NetworkId.Mainnet ? "mainnet" : "preview", swap.ownerAddress),
            swap: {
              minReceived: minReceived
            },
            destination: realfiDestinationFromSundaeDestination(swap.orderAddresses.DestinationAddress)
          }));
        case 2:
          continuation = _context3.v;
          return _context3.a(2, _buildSwapOrderTx2(blaze, _objectSpread(_objectSpread({}, swap), {}, {
            orderAddresses: _objectSpread({
              DestinationAddress: (0, _destination.sundaeV3DestinationAddressFromStepResult)(continuation)
            }, swap.orderAddresses.AlternateAddress ? {
              AlternateAddress: swap.orderAddresses.AlternateAddress
            } : {})
          })));
      }
    }, _callee3);
  }));
  return _buildSwapToStakeOrderTx.apply(this, arguments);
}
function create(blaze) {
  return {
    quoteSwap: quoteSwap,
    quoteSwapInput: quoteSwapInput,
    buildSwapOrderTx: function buildSwapOrderTx(params) {
      return _buildSwapOrderTx2(blaze, params);
    },
    buildSwapIntentTx: function buildSwapIntentTx(params) {
      return _buildSwapIntentTx2(blaze, params);
    },
    buildSwapToStakeOrderTx: function buildSwapToStakeOrderTx(params) {
      return _buildSwapToStakeOrderTx2(blaze, params);
    }
  };
}
function realfiDestinationFromSundaeDestination(_ref4) {
  var address = _ref4.address,
    datum = _ref4.datum;
  var realfiDatum = function () {
    switch (datum.type) {
      case _core.EDatumType.NONE:
        return "NoDatum";
      case _core.EDatumType.HASH:
        return {
          DatumHash: [datum.value]
        };
      case _core.EDatumType.INLINE:
        return {
          InlineDatum: [(0, _destination.plutusDataFromCbor)(datum.value)]
        };
      default:
        {
          var unreachable = datum;
          return unreachable;
        }
    }
  }();
  return (0, _destination.addressToRealFiDestination)(_sdk.Core.Address.fromBech32(address), realfiDatum);
}
//# sourceMappingURL=index.js.map