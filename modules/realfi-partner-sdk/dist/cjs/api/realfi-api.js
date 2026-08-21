"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RealfiApi = void 0;
var _clientId = require("../sdk/shared/client-id.js");
var _client = require("./client.js");
var _partnerConfig = require("./partner-config.js");
var _queries = require("./queries.js");
var _registry = require("./registry.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
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
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var DEFAULT_ORDER_STATUSES = ["Open", "Validating", "Canceled", "Executed", "Invalidated", "InvalidMinReceived"];

/** Off-chain RealFi data: order status, stake times, yield, fees, points, referrals. */

function mapOrder(status, order) {
  var _order$ClaimTxHash;
  return {
    owner: order.Owner,
    action: order.Action,
    status: status,
    amount: BigInt(order.Amount),
    slot: BigInt(order.Slot),
    forfeit: BigInt(order.Forfeit),
    version: order.Version,
    utxo: {
      txHash: order.utxo.txHash,
      outputIndex: order.utxo.index
    },
    resultUtxo: order.resultUtxo ? {
      txHash: order.resultUtxo.txHash,
      outputIndex: order.resultUtxo.index
    } : undefined,
    unlockSlot: order.UnlockSlot == null ? undefined : BigInt(order.UnlockSlot),
    matureSlot: order.MatureSlot == null ? undefined : BigInt(order.MatureSlot),
    principal: order.Principal == null ? undefined : BigInt(order.Principal),
    "yield": order.Yield == null ? undefined : BigInt(order.Yield),
    claimTxHash: (_order$ClaimTxHash = order.ClaimTxHash) !== null && _order$ClaimTxHash !== void 0 ? _order$ClaimTxHash : undefined
  };
}

/**
 * Off-chain GraphQL reads. Construct with {@link RealfiApi.forNetwork} or
 * {@link RealfiApi.create}; no Blaze instance required.
 */
var RealfiApi = exports.RealfiApi = /*#__PURE__*/function () {
  function RealfiApi(endpoints) {
    var clientId = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "".concat(_clientId.DEFAULT_CLIENT_SOURCE, "/").concat(_clientId.SDK_VERSION);
    _classCallCheck(this, RealfiApi);
    this.endpoints = endpoints;
    this.clientId = clientId;
  }
  return _createClass(RealfiApi, [{
    key: "request",
    value: function request(url, query, variables) {
      return (0, _client.gqlRequest)(url, query, variables, this.clientId);
    }
  }, {
    key: "getPartnerConfig",
    value: function () {
      var _getPartnerConfig = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
        var url, response, body, _t;
        return _regenerator().w(function (_context) {
          while (1) switch (_context.p = _context.n) {
            case 0:
              url = this.endpoints.partnerConfigUrl;
              if (url) {
                _context.n = 1;
                break;
              }
              throw new Error("partnerConfigUrl is required to read partner runtime configuration");
            case 1:
              _context.n = 2;
              return fetch(url, {
                method: "GET",
                headers: {
                  Accept: "application/json"
                },
                cache: "no-store"
              });
            case 2:
              response = _context.v;
              if (response.ok) {
                _context.n = 3;
                break;
              }
              throw new Error("Partner configuration request failed: ".concat(response.status, " ").concat(response.statusText));
            case 3:
              _context.p = 3;
              _context.n = 4;
              return response.json();
            case 4:
              body = _context.v;
              _context.n = 6;
              break;
            case 5:
              _context.p = 5;
              _t = _context.v;
              throw new Error("invalid partner configuration: response is not JSON", {
                cause: _t
              });
            case 6:
              return _context.a(2, (0, _partnerConfig.parsePartnerConfig)(body));
          }
        }, _callee, this, [[3, 5]]);
      }));
      function getPartnerConfig() {
        return _getPartnerConfig.apply(this, arguments);
      }
      return getPartnerConfig;
    }()
  }, {
    key: "getStakeTimes",
    value: function () {
      var _getStakeTimes = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2() {
        var data;
        return _regenerator().w(function (_context2) {
          while (1) switch (_context2.n) {
            case 0:
              _context2.n = 1;
              return this.request(this.endpoints.realfiUrl, _queries.STAKE_TIMES_QUERY);
            case 1:
              data = _context2.v;
              return _context2.a(2, {
                currentCooldownSlot: BigInt(data.stakeTimes.CurrentCooldownPeriodEnd.slot),
                nextCooldownSlot: BigInt(data.stakeTimes.NextCooldownPeriodEnd.slot)
              });
          }
        }, _callee2, this);
      }));
      function getStakeTimes() {
        return _getStakeTimes.apply(this, arguments);
      }
      return getStakeTimes;
    }()
  }, {
    key: "getCooldownUnlockSlot",
    value: function () {
      var _getCooldownUnlockSlot = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3() {
        return _regenerator().w(function (_context3) {
          while (1) switch (_context3.n) {
            case 0:
              _context3.n = 1;
              return this.getStakeTimes();
            case 1:
              return _context3.a(2, _context3.v.nextCooldownSlot);
          }
        }, _callee3, this);
      }));
      function getCooldownUnlockSlot() {
        return _getCooldownUnlockSlot.apply(this, arguments);
      }
      return getCooldownUnlockSlot;
    }()
  }, {
    key: "getOrdersByOwner",
    value: function () {
      var _getOrdersByOwner = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4(address) {
        var _this = this;
        var statuses,
          owners,
          batches,
          seen,
          _args4 = arguments;
        return _regenerator().w(function (_context4) {
          while (1) switch (_context4.n) {
            case 0:
              statuses = _args4.length > 1 && _args4[1] !== undefined ? _args4[1] : DEFAULT_ORDER_STATUSES;
              owners = (0, _client.ownerKeyHashes)(address);
              _context4.n = 1;
              return Promise.all(owners.flatMap(function (owner) {
                return statuses.map(function (status) {
                  return _this.request(_this.endpoints.realfiUrl, _queries.ORDERS_BY_OWNER_QUERY, {
                    owner: owner,
                    status: status
                  }).then(function (data) {
                    return data.ordersByOwner;
                  });
                });
              }));
            case 1:
              batches = _context4.v;
              seen = new Set();
              return _context4.a(2, batches.flat().map(function (result) {
                return mapOrder(result.status, result.order);
              }).filter(function (order) {
                var key = "".concat(order.utxo.txHash, "#").concat(order.utxo.outputIndex);
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
              }).sort(function (a, b) {
                return Number(b.slot - a.slot);
              }));
          }
        }, _callee4);
      }));
      function getOrdersByOwner(_x) {
        return _getOrdersByOwner.apply(this, arguments);
      }
      return getOrdersByOwner;
    }()
  }, {
    key: "getOrderFees",
    value: function () {
      var _getOrderFees = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee5() {
        var data;
        return _regenerator().w(function (_context5) {
          while (1) switch (_context5.n) {
            case 0:
              _context5.n = 1;
              return this.request(this.endpoints.realfiUrl, _queries.ORDER_FEES_QUERY);
            case 1:
              data = _context5.v;
              return _context5.a(2, data.orderFees);
          }
        }, _callee5, this);
      }));
      function getOrderFees() {
        return _getOrderFees.apply(this, arguments);
      }
      return getOrderFees;
    }()
  }, {
    key: "getSusdrExchangeRateInputs",
    value: function () {
      var _getSusdrExchangeRateInputs = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee6() {
        var data, inputs;
        return _regenerator().w(function (_context6) {
          while (1) switch (_context6.n) {
            case 0:
              _context6.n = 1;
              return this.request(this.endpoints.realfiUrl, _queries.SUSDR_EXCHANGE_RATE_INPUTS_QUERY);
            case 1:
              data = _context6.v;
              inputs = data.susdrExchangeRateInputs;
              return _context6.a(2, {
                circulatingSusdr: BigInt(inputs.circulatingSusdr),
                vaultUsdr: BigInt(inputs.vaultUsdr),
                pendingYield: BigInt(inputs.pendingYield),
                diffusionStartUnixMilli: BigInt(inputs.diffusionStartUnixMilli),
                diffusionEndUnixMilli: BigInt(inputs.diffusionEndUnixMilli)
              });
          }
        }, _callee6, this);
      }));
      function getSusdrExchangeRateInputs() {
        return _getSusdrExchangeRateInputs.apply(this, arguments);
      }
      return getSusdrExchangeRateInputs;
    }()
  }, {
    key: "getYieldBreakdown",
    value: function () {
      var _getYieldBreakdown = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee7(address) {
        var _ownerKeyHashes, _ownerKeyHashes2, owner, data, breakdown;
        return _regenerator().w(function (_context7) {
          while (1) switch (_context7.n) {
            case 0:
              _ownerKeyHashes = (0, _client.ownerKeyHashes)(address), _ownerKeyHashes2 = _slicedToArray(_ownerKeyHashes, 1), owner = _ownerKeyHashes2[0];
              if (owner) {
                _context7.n = 1;
                break;
              }
              throw new Error("address has no payment credential");
            case 1:
              _context7.n = 2;
              return this.request(this.endpoints.realfiUrl, _queries.YIELD_BREAKDOWN_QUERY, {
                owner: owner
              });
            case 2:
              data = _context7.v;
              breakdown = data.susdrYieldBreakdown;
              return _context7.a(2, {
                totalSUSDr: BigInt(breakdown.totalSUSDr),
                totalUSDrValue: BigInt(breakdown.totalUSDrValue),
                principal: BigInt(breakdown.principal),
                "yield": BigInt(breakdown["yield"]),
                yieldPercent: breakdown.yieldPercent
              });
          }
        }, _callee7, this);
      }));
      function getYieldBreakdown(_x2) {
        return _getYieldBreakdown.apply(this, arguments);
      }
      return getYieldBreakdown;
    }()
  }, {
    key: "getPointsBalance",
    value: function () {
      var _getPointsBalance = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee8(address) {
        var _data$V_WALLET_POINTS, _parsed$current_balan, _parsed$potential_poi, _parsed$day_multiplie;
        var value, data, raw, parsed;
        return _regenerator().w(function (_context8) {
          while (1) switch (_context8.n) {
            case 0:
              value = (0, _client.ownerKeyHashes)(address).join(",");
              _context8.n = 1;
              return this.request(this.endpoints.assetTransparencyUrl, _queries.POINTS_BALANCE_QUERY, {
                value: value
              });
            case 1:
              data = _context8.v;
              raw = (_data$V_WALLET_POINTS = data.V_WALLET_POINTS_BALANCE.nodes[0]) === null || _data$V_WALLET_POINTS === void 0 ? void 0 : _data$V_WALLET_POINTS.WALLET_POINTS_BALANCE;
              if (raw) {
                _context8.n = 2;
                break;
              }
              return _context8.a(2, {
                pointsBalance: null,
                potentialPoints: null,
                multiplier: null
              });
            case 2:
              parsed = JSON.parse(raw);
              return _context8.a(2, {
                pointsBalance: (_parsed$current_balan = parsed.current_balance) !== null && _parsed$current_balan !== void 0 ? _parsed$current_balan : null,
                potentialPoints: (_parsed$potential_poi = parsed.potential_points) !== null && _parsed$potential_poi !== void 0 ? _parsed$potential_poi : null,
                multiplier: (_parsed$day_multiplie = parsed.day_multiplier) !== null && _parsed$day_multiplie !== void 0 ? _parsed$day_multiplie : null
              });
          }
        }, _callee8, this);
      }));
      function getPointsBalance(_x3) {
        return _getPointsBalance.apply(this, arguments);
      }
      return getPointsBalance;
    }()
  }, {
    key: "getReferrerCode",
    value: function () {
      var _getReferrerCode = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee9(address) {
        var data;
        return _regenerator().w(function (_context9) {
          while (1) switch (_context9.n) {
            case 0:
              _context9.n = 1;
              return this.request(this.endpoints.assetTransparencyUrl, _queries.REFERRER_CODE_QUERY, {
                walletAddress: (0, _client.ownerKeyHashes)(address).join(",")
              });
            case 1:
              data = _context9.v;
              return _context9.a(2, data.referrerCode);
          }
        }, _callee9, this);
      }));
      function getReferrerCode(_x4) {
        return _getReferrerCode.apply(this, arguments);
      }
      return getReferrerCode;
    }()
  }, {
    key: "getReferralRewards",
    value: function () {
      var _getReferralRewards = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee0(address) {
        var data;
        return _regenerator().w(function (_context0) {
          while (1) switch (_context0.n) {
            case 0:
              _context0.n = 1;
              return this.request(this.endpoints.assetTransparencyUrl, _queries.REFERRAL_REWARDS_QUERY, {
                walletAddress: (0, _client.ownerKeyHashes)(address).join(",")
              });
            case 1:
              data = _context0.v;
              return _context0.a(2, data.referralRewards);
          }
        }, _callee0, this);
      }));
      function getReferralRewards(_x5) {
        return _getReferralRewards.apply(this, arguments);
      }
      return getReferralRewards;
    }()
  }, {
    key: "getInvitedCount",
    value: function () {
      var _getInvitedCount = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee1(address) {
        var data;
        return _regenerator().w(function (_context1) {
          while (1) switch (_context1.n) {
            case 0:
              _context1.n = 1;
              return this.request(this.endpoints.assetTransparencyUrl, _queries.INVITED_COUNT_QUERY, {
                walletAddress: (0, _client.ownerKeyHashes)(address).join(",")
              });
            case 1:
              data = _context1.v;
              return _context1.a(2, data.invitedCount);
          }
        }, _callee1, this);
      }));
      function getInvitedCount(_x6) {
        return _getInvitedCount.apply(this, arguments);
      }
      return getInvitedCount;
    }()
  }], [{
    key: "forNetwork",
    value: function forNetwork(network, clientId) {
      return new RealfiApi(_registry.API_REGISTRY[network], clientId);
    }
  }, {
    key: "create",
    value: function create(endpoints, clientId) {
      return new RealfiApi(endpoints, clientId);
    }
  }]);
}();
//# sourceMappingURL=realfi-api.js.map