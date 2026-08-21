"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.computeReserveDeltas = computeReserveDeltas;
exports.findReserveAsset = findReserveAsset;
exports.usdrToReserve = usdrToReserve;
exports.usdrToReserveCeil = usdrToReserveCeil;
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
/**
 * Find a reserve asset config by policy+name from settings.
 */
function findReserveAsset(settings, asset) {
  var found = settings.reserve_assets.find(function (ra) {
    return ra.asset[0] === asset[0] && ra.asset[1] === asset[1];
  });
  if (!found) {
    throw new Error("Reserve asset not found in settings: ".concat(asset[0]).concat(asset[1]));
  }
  if (found.numerator === 0n) {
    throw new Error("Reserve asset numerator must be non-zero");
  }
  if (found.denominator === 0n) {
    throw new Error("Reserve asset denominator must be non-zero");
  }
  return found;
}

/**
 * Convert USDr amount to reserve amount (floor division, protocol-protective for burns).
 * Matches on-chain: usdr_to_reserve(amount, ra) = amount * denominator / numerator
 */
function usdrToReserve(usdrAmount, ra) {
  return usdrAmount * ra.denominator / ra.numerator;
}

/**
 * Convert USDr amount to reserve amount (ceiling division, protocol-protective for mints).
 * Matches on-chain: usdr_to_reserve_ceil(amount, ra) = (amount * denominator + numerator - 1) / numerator
 */
function usdrToReserveCeil(usdrAmount, ra) {
  return (usdrAmount * ra.denominator + ra.numerator - 1n) / ra.numerator;
}

/**
 * Compute per-reserve-asset deltas from order infos.
 * Groups orders by reserve asset and converts USDr amounts to reserve amounts.
 * @param negate If true, negate the delta (used for withdraw where amounts are positive but treasury outflow is negative)
 */
function computeReserveDeltas(orderInfos, settings) {
  var negate = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
  var deltas = new Map();
  var amountsByAsset = new Map();
  var _iterator = _createForOfIteratorHelper(orderInfos),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var _amountsByAsset$get;
      var orderInfo = _step.value;
      var assetKey = orderInfo.reserveAsset[0] + orderInfo.reserveAsset[1];
      amountsByAsset.set(assetKey, ((_amountsByAsset$get = amountsByAsset.get(assetKey)) !== null && _amountsByAsset$get !== void 0 ? _amountsByAsset$get : 0n) + orderInfo.amount);
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  var _iterator2 = _createForOfIteratorHelper(amountsByAsset.entries()),
    _step2;
  try {
    var _loop = function _loop() {
      var _step2$value = _slicedToArray(_step2.value, 2),
        assetKey = _step2$value[0],
        totalUsdr = _step2$value[1];
      var orderWithAsset = orderInfos.find(function (o) {
        return o.reserveAsset[0] + o.reserveAsset[1] === assetKey;
      });
      var ra = findReserveAsset(settings, orderWithAsset.reserveAsset);
      var reserveAmount = usdrToReserve(negate ? -totalUsdr : totalUsdr, ra);
      deltas.set(assetKey, reserveAmount);
    };
    for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
      _loop();
    }
  } catch (err) {
    _iterator2.e(err);
  } finally {
    _iterator2.f();
  }
  return deltas;
}
//# sourceMappingURL=reserve-assets.js.map