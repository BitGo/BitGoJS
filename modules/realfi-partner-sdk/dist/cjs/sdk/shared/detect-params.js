"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "NETWORK_REGISTRY", {
  enumerable: true,
  get: function get() {
    return _networkRegistry.NETWORK_REGISTRY;
  }
});
exports.YIELD_ORACLE_BOOTSTRAP_PLACEHOLDER = exports.UnknownProtocolVersionError = void 0;
exports.computeOneShotPolicyId = computeOneShotPolicyId;
exports.detectSDKParams = detectSDKParams;
exports.fetchProxyLogicSnapshot = fetchProxyLogicSnapshot;
exports.matchProtocolVersion = matchProtocolVersion;
exports.resolveBlueprintVersion = resolveBlueprintVersion;
exports.selectBlueprintGeneration = selectBlueprintGeneration;
var _core = require("@blaze-cardano/core");
var _data = require("@blaze-cardano/data");
var _sdk = require("@blaze-cardano/sdk");
var _index = require("../../generated-types/index.js");
var _utils = require("./utils.js");
var _networkRegistry = require("./network-registry.js");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t in e) "default" !== _t && {}.hasOwnProperty.call(e, _t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t)) && (i.get || i.set) ? o(f, _t, i) : f[_t] = e[_t]); return f; })(e, t); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _possibleConstructorReturn(t, e) { if (e && ("object" == _typeof(e) || "function" == typeof e)) return e; if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined"); return _assertThisInitialized(t); }
function _assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
function _inherits(t, e) { if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function"); t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } }), Object.defineProperty(t, "prototype", { writable: !1 }), e && _setPrototypeOf(t, e); }
function _wrapNativeSuper(t) { var r = "function" == typeof Map ? new Map() : void 0; return _wrapNativeSuper = function _wrapNativeSuper(t) { if (null === t || !_isNativeFunction(t)) return t; if ("function" != typeof t) throw new TypeError("Super expression must either be null or a function"); if (void 0 !== r) { if (r.has(t)) return r.get(t); r.set(t, Wrapper); } function Wrapper() { return _construct(t, arguments, _getPrototypeOf(this).constructor); } return Wrapper.prototype = Object.create(t.prototype, { constructor: { value: Wrapper, enumerable: !1, writable: !0, configurable: !0 } }), _setPrototypeOf(Wrapper, t); }, _wrapNativeSuper(t); }
function _construct(t, e, r) { if (_isNativeReflectConstruct()) return Reflect.construct.apply(null, arguments); var o = [null]; o.push.apply(o, e); var p = new (t.bind.apply(t, o))(); return r && _setPrototypeOf(p, r.prototype), p; }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _isNativeFunction(t) { try { return -1 !== Function.toString.call(t).indexOf("[native code]"); } catch (n) { return "function" == typeof t; } }
function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
function _getPrototypeOf(t) { return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) { return t.__proto__ || Object.getPrototypeOf(t); }, _getPrototypeOf(t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
/**
 * Default yield_oracle NFT one-shot seed for a deployment that DEFERS the oracle.
 *
 * The seed only feeds the orchestrator hash at compile time; on-chain it is
 * consumed solely when minting the oracle NFT, which a deferred deployment never
 * does. An all-zeros tx hash is a valid but permanently un-consumable
 * OutputReference, so a deferred deployment can omit the seed entirely and every
 * consumer still reconstructs the same orchestrator hash. Supplying a real seed
 * overrides this (for a deployment that intends to run the oracle).
 */
// Frozen: this is shared by reference across all omitted-seed detection/SDK
// construction in the process — a consumer mutating txHash/outputIndex would
// otherwise poison every later placeholder-seed reconstruction.
var YIELD_ORACLE_BOOTSTRAP_PLACEHOLDER = exports.YIELD_ORACLE_BOOTSTRAP_PLACEHOLDER = Object.freeze({
  txHash: _sdk.Core.TransactionId("0".repeat(64)),
  outputIndex: 0n
});

/**
 * Deployed validator hashes, keyed as in
 * `backend/config/env/<env>.protocol.yaml`.
 *
 * An array carries more than one *generation* of the same deployment — the
 * hashes before and after a script cutover. Detection picks the generation
 * whose orchestrator matches the chain and applies that one whole, so a
 * consumer holding both spans the flip instead of failing closed between the
 * on-chain update and its own config reaching it.
 *
 * Listing both in a single map cannot work and is actively unsafe: the
 * override reads exact keys, so one generation's hashes would be applied
 * regardless of which one matched, and the SDK would build against addresses
 * the chain is not using.
 */

/**
 * The generation whose protocol orchestrator equals the deployed `logic` hash.
 *
 * A single map is returned when it matches, so existing callers are unchanged.
 * Nothing is returned when no generation matches — detection then fails closed
 * rather than guessing, which is what stops a mismatched build from locking
 * orders at an address nothing watches.
 */
function selectBlueprintGeneration(logicHash, validators) {
  if (!validators) return undefined;
  var generations = Array.isArray(validators) ? validators : [validators];
  return generations.find(function (generation) {
    return resolveBlueprintVersion(logicHash, generation) !== undefined;
  });
}

/**
 * Version-discriminating view of the live proxy datum, resolved via the
 * one-shot NFT (the proxy's stable identity — the UTxO ref changes on every
 * settings update, the NFT does not).
 */

/**
 * Version slot each blueprint validator key belongs to. Keys are the ones used
 * in `backend/config/env/<env>.protocol.yaml`, so this map is the single place
 * that translates blueprint naming into SDK version naming.
 */
var BLUEPRINT_ORCHESTRATOR_VERSIONS = [["v1_1_rc1/", "V1_1_Rc1"], ["v1_0_rc1/", "V1_0_Rc1"], ["v1_0/", "V1_0"]];

/**
 * Which version a deployed `logic` hash belongs to according to the blueprint,
 * or undefined when no blueprint was supplied or none of its orchestrators
 * matches.
 *
 * Only orchestrator entries are consulted: the proxy datum's first field is the
 * protocol orchestrator hash, so any other validator matching would mean the
 * blueprint disagrees with the chain about what a proxy points at.
 */
function resolveBlueprintVersion(logicHash, validators) {
  if (!validators) return undefined;
  var _loop = function _loop() {
      var _Object$entries$_i = _slicedToArray(_Object$entries[_i], 2),
        key = _Object$entries$_i[0],
        hash = _Object$entries$_i[1];
      if (hash !== logicHash) return 0; // continue
      if (!key.includes("protocol_orchestrator")) return 0; // continue
      var match = BLUEPRINT_ORCHESTRATOR_VERSIONS.find(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 1),
          prefix = _ref2[0];
        return key.startsWith(prefix);
      });
      if (match) return {
        v: match[1]
      };
    },
    _ret;
  for (var _i = 0, _Object$entries = Object.entries(validators); _i < _Object$entries.length; _i++) {
    _ret = _loop();
    if (_ret === 0) continue;
    if (_ret) return _ret.v;
  }
  return undefined;
}

/**
 * Compute the one-shot policy id from the proxy bootstrap reference.
 * Deterministic and local — no provider access.
 */
function computeOneShotPolicyId(proxyBootstrap, enableTrace) {
  return new _index.BaseTypes.BaseOneshotOneshotMint({
    transaction_id: proxyBootstrap.txHash,
    output_index: proxyBootstrap.outputIndex
  }, enableTrace).Script.hash();
}

/**
 * Fetch the live proxy datum and extract the `logic` script hash.
 * Costs exactly one provider lookup.
 */
function fetchProxyLogicSnapshot(_x, _x2) {
  return _fetchProxyLogicSnapshot.apply(this, arguments);
}
/**
 * Detect the active SDK version by reading the proxy datum on-chain.
 *
 * Phase 1: Extract the `logic` script hash from the proxy datum using raw CBOR
 * access, avoiding the chicken-and-egg problem where the datum schema differs
 * per version.
 *
 * Phase 2: Compare the extracted hash against expected protocol hashes computed
 * deterministically from `proxyBootstrap`. Each version's generated-types
 * module is dynamic-imported only when its turn comes — so on a V1_0_Rc1
 * deployment the V1_0 types chunk (~52 KB gzip / ~214 KB raw) is never
 * fetched. Vite's chunk splitter creates one chunk per `await import()` site,
 * so the chunk topology mirrors the version branches without needing
 * a separate matcher file per version.
 *
 * Priority order: V1_0_Rc1 → V1_0 → V0_4. Latest-deployed-version-first so
 * that on the current production environments (which are on V1_0_Rc1), the
 * very first matcher succeeds and no additional version chunks are fetched
 * to fail a mismatch check first. Rc1 stays ahead of V1_0 so that during the
 * transitional period where both SDK slots resolve to byte-identical scripts
 * (Rc1 is a module-path-only duplicate of V1_0), we prefer the Rc1 path —
 * once V1_0 evolves on-chain, the two hashes diverge and each branch catches
 * its own deployment automatically. V0_4 stays as the legacy fallback.
 *
 * **Re-evaluate this order if V0_4 ever becomes a primary production
 * deployment again** — every session on a V0_4-only environment would pay
 * two failed-hash-check fetches (V1_0_Rc1 + V1_0) before reaching V0_4.
 *
 * Throws `UnknownProtocolVersionError` if the `logic` hash does not match any
 * known version.
 *
 * `config` also accepts a network preset name (`"mainnet"`, `"preprod"`,
 * `"preview"`) in place of an explicit {@link IDetectInput} — resolved via
 * {@link NETWORK_REGISTRY}. Custom deployments still pass an explicit config.
 */
function _fetchProxyLogicSnapshot() {
  _fetchProxyLogicSnapshot = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(provider, oneShotPolicyId) {
    var _yield$readSingletonD, rawDatum, constr, fields, logicBytes;
    return _regenerator().w(function (_context) {
      while (1) switch (_context.n) {
        case 0:
          _context.n = 1;
          return (0, _utils.readSingletonDatum)(provider, _sdk.Core.AssetId(oneShotPolicyId));
        case 1:
          _yield$readSingletonD = _context.v;
          rawDatum = _yield$readSingletonD.datum;
          // All ProxyDatum variants encode as Constr(0, [ByteArray(28 bytes), <opaque Data>]).
          // The first field is always the `logic` ScriptHash, regardless of version.
          constr = rawDatum.asConstrPlutusData();
          if (constr) {
            _context.n = 2;
            break;
          }
          throw new Error("Proxy datum is not a constructor PlutusData");
        case 2:
          fields = constr.getData();
          logicBytes = fields.get(0).asBoundedBytes();
          if (logicBytes) {
            _context.n = 3;
            break;
          }
          throw new Error("First constructor field is not bytes (expected ScriptHash)");
        case 3:
          return _context.a(2, {
            logicHash: (0, _core.toHex)(logicBytes),
            datumFields: fields
          });
      }
    }, _callee);
  }));
  return _fetchProxyLogicSnapshot.apply(this, arguments);
}
function detectSDKParams(_x3, _x4) {
  return _detectSDKParams.apply(this, arguments);
}
/**
 * Phase 2 of detection: match an already-fetched `logic` hash against each
 * known version's expected hash. Local-only — dynamic imports and hash
 * computation, no provider access — so a caller holding a fresh
 * `IProxyLogicSnapshot` can re-resolve the version without another lookup.
 */
function _detectSDKParams() {
  _detectSDKParams = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(provider, config) {
    var _resolved$enableTrace;
    var resolved, enableTrace, oneShotPolicyId, snapshot;
    return _regenerator().w(function (_context2) {
      while (1) switch (_context2.n) {
        case 0:
          if (!(typeof config === "string" && !Object.hasOwn(_networkRegistry.NETWORK_REGISTRY, config))) {
            _context2.n = 1;
            break;
          }
          throw new Error("Unknown network preset \"".concat(config, "\" \u2014 expected one of: ").concat(Object.keys(_networkRegistry.NETWORK_REGISTRY).join(", ")));
        case 1:
          resolved = typeof config === "string" ? _networkRegistry.NETWORK_REGISTRY[config] : config;
          enableTrace = (_resolved$enableTrace = resolved.enableTrace) !== null && _resolved$enableTrace !== void 0 ? _resolved$enableTrace : false; // ── Phase 1: Compute oneshot policy and fetch proxy datum ─────────────────
          oneShotPolicyId = computeOneShotPolicyId(resolved.proxyBootstrap, enableTrace);
          _context2.n = 2;
          return fetchProxyLogicSnapshot(provider, oneShotPolicyId);
        case 2:
          snapshot = _context2.v;
          return _context2.a(2, matchProtocolVersion(snapshot, oneShotPolicyId, resolved));
      }
    }, _callee2);
  }));
  return _detectSDKParams.apply(this, arguments);
}
function matchProtocolVersion(_x5, _x6, _x7) {
  return _matchProtocolVersion.apply(this, arguments);
}
function _matchProtocolVersion() {
  _matchProtocolVersion = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3(snapshot, oneShotPolicyId, config) {
    var _config$enableTrace;
    var enableTrace, logicHash, fields, deployedGeneration, blueprintVersion, suppliedGenerations, hasAuthoritativeBlueprint, matchesV1Version, _config$yieldOracleBo, _yield$import, V1_1Rc1ProtocolMintProtocolMintWithdraw, V1_1Rc1ProtocolStakeProtocolStakeWithdraw, V1_1Rc1ProtocolManagementProtocolManagementWithdraw, V1_1Rc1ProtocolOrchestratorProtocolOrchestratorWithdraw, V1_1Rc1YieldOracleYieldOracleMint, SettingsV1_1Rc1Schema, protocolMintHashV1_1Rc1, protocolStakeHashV1_1Rc1, protocolManagementHashV1_1Rc1, yieldOracleBootstrap, oracleNftPolicyIdV1_1Rc1, orchestratorHashV1_1Rc1, settingsData, settings, registry, _yield$import2, V0_1TreasuryTreasurySpend, _yield$import3, V0_4StakingVaultStakingVaultSpend, v01TreasuryHash, useV0_1Treasury, v04StakingVaultHash, useV0_4StakingVault, _yield$import4, V1_0Rc1ProtocolMintProtocolMintWithdraw, V1_0Rc1ProtocolStakeProtocolStakeWithdraw, V1_0Rc1ProtocolManagementProtocolManagementWithdraw, V1_0Rc1ProtocolOrchestratorProtocolOrchestratorWithdraw, SettingsV1Rc1Schema, protocolMintHashRc1, protocolStakeHashRc1, protocolManagementHashRc1, orchestratorHashRc1, _settingsData, _settings, _registry, _yield$import5, _V0_1TreasuryTreasurySpend, _yield$import6, _V0_4StakingVaultStakingVaultSpend, _v01TreasuryHash, _useV0_1Treasury, _v04StakingVaultHash, _useV0_4StakingVault, _yield$import7, V1_0ProtocolMintProtocolMintWithdraw, V1_0ProtocolStakeProtocolStakeWithdraw, V1_0ProtocolManagementProtocolManagementWithdraw, V1_0ProtocolOrchestratorProtocolOrchestratorWithdraw, SettingsV1Schema, protocolMintHash, protocolStakeHash, protocolManagementHash, orchestratorHash, _settingsData2, _settings2, _registry2, _yield$import8, _V0_1TreasuryTreasurySpend2, _yield$import9, _V0_4StakingVaultStakingVaultSpend2, _v01TreasuryHash2, _useV0_1Treasury2, _v04StakingVaultHash2, _useV0_4StakingVault2, _yield$import0, V0_4ProtocolProtocolWithdraw, v04ProtocolHash;
    return _regenerator().w(function (_context3) {
      while (1) switch (_context3.n) {
        case 0:
          enableTrace = (_config$enableTrace = config.enableTrace) !== null && _config$enableTrace !== void 0 ? _config$enableTrace : false;
          logicHash = snapshot.logicHash, fields = snapshot.datumFields; // Which version the supplied blueprint says this `logic` hash belongs to, if
          // any. Matching on the deployed hash rather than a derived one is what keeps
          // a regenerated artifact from stranding a live deployment: the blueprint
          // records what the chain runs, this build only records what it ships.
          //
          // Deliberately exact-match and fail-closed — a blueprint authorises the one
          // deployment it names, never anything that merely looks the same shape.
          // Pick the generation the chain is actually on before reading anything from
          // it, so version and script hashes always come from the same generation. A
          // cutover otherwise has a window where the datum names new scripts and the
          // config still names old ones (or the reverse), and every consumer in it
          // fails closed until its config catches up.
          deployedGeneration = selectBlueprintGeneration(logicHash, config.protocolValidators);
          blueprintVersion = resolveBlueprintVersion(logicHash, deployedGeneration); // A non-empty supplied generation makes the blueprint authoritative. A miss
          // does not consult derivation: blueprintVersion stays undefined, every
          // matchesV1Version check fails, and detection throws
          // UnknownProtocolVersionError.
          suppliedGenerations = Array.isArray(config.protocolValidators) ? config.protocolValidators : config.protocolValidators ? [config.protocolValidators] : [];
          hasAuthoritativeBlueprint = suppliedGenerations.some(function (generation) {
            return Object.keys(generation).length > 0;
          });
          matchesV1Version = function matchesV1Version(derivedHash, version) {
            return hasAuthoritativeBlueprint ? blueprintVersion === version : logicHash === derivedHash;
          }; // ── Try each version's hash candidate ─────────────────────────────────────
          //
          // Each version dynamic-imports its types from its own subpath module, and
          // **destructures named exports at the await site** so Vite can statically
          // see which specific classes are used and tree-shake the rest of the
          // generated-types module (each version's index.ts has ~70 top-level
          // exports; each branch needs only 1-5).
          // V1_1_Rc1 — orchestrator hash + backward-compat flag detection.
          // Checked first: latest-deployed-version-first, so environments on
          // V1_1_Rc1 match on the first attempt with no failed-mismatch chunk fetches.
          _context3.n = 1;
          return Promise.resolve().then(function () {
            return _interopRequireWildcard(require("../../generated-types/v1_1_rc1/index.js"));
          });
        case 1:
          _yield$import = _context3.v;
          V1_1Rc1ProtocolMintProtocolMintWithdraw = _yield$import.V1_1Rc1ProtocolMintProtocolMintWithdraw;
          V1_1Rc1ProtocolStakeProtocolStakeWithdraw = _yield$import.V1_1Rc1ProtocolStakeProtocolStakeWithdraw;
          V1_1Rc1ProtocolManagementProtocolManagementWithdraw = _yield$import.V1_1Rc1ProtocolManagementProtocolManagementWithdraw;
          V1_1Rc1ProtocolOrchestratorProtocolOrchestratorWithdraw = _yield$import.V1_1Rc1ProtocolOrchestratorProtocolOrchestratorWithdraw;
          V1_1Rc1YieldOracleYieldOracleMint = _yield$import.V1_1Rc1YieldOracleYieldOracleMint;
          SettingsV1_1Rc1Schema = _yield$import.SettingsV1;
          protocolMintHashV1_1Rc1 = new V1_1Rc1ProtocolMintProtocolMintWithdraw(oneShotPolicyId, enableTrace).Script.hash();
          protocolStakeHashV1_1Rc1 = new V1_1Rc1ProtocolStakeProtocolStakeWithdraw(oneShotPolicyId, enableTrace).Script.hash();
          protocolManagementHashV1_1Rc1 = new V1_1Rc1ProtocolManagementProtocolManagementWithdraw(oneShotPolicyId, enableTrace).Script.hash(); // A deferred oracle omits the seed; default to the placeholder so a
          // V1_1_Rc1 deployment is still recognized without any seed config. A real
          // seed (for a deployment that runs the oracle) overrides it. Either way the
          // block below always runs — the exact hash comparison alone decides whether
          // this is actually a V1_1_Rc1 proxy, so a V1_0/older proxy simply won't
          // match and falls through.
          yieldOracleBootstrap = (_config$yieldOracleBo = config.yieldOracleBootstrap) !== null && _config$yieldOracleBo !== void 0 ? _config$yieldOracleBo : YIELD_ORACLE_BOOTSTRAP_PLACEHOLDER;
          // The orchestrator's 5th param is the `yield_oracle` *validator* hash — the
          // mint+spend validator that holds the oracle UTxO (guarded by ExecuteOrders'
          // `no_script_input`), NOT the distribution_oracle logic validator. Because
          // yield_oracle is a mint+spend validator, that hash equals the oracle-NFT
          // policy id. Derive it the same way RealfiSDKV1_1Rc1.create does so the
          // recomputed orchestrator hash matches the deployed logic hash.
          oracleNftPolicyIdV1_1Rc1 = new V1_1Rc1YieldOracleYieldOracleMint({
            transaction_id: yieldOracleBootstrap.txHash,
            output_index: yieldOracleBootstrap.outputIndex
          }, oneShotPolicyId, enableTrace).Script.hash();
          orchestratorHashV1_1Rc1 = new V1_1Rc1ProtocolOrchestratorProtocolOrchestratorWithdraw(oneShotPolicyId, protocolMintHashV1_1Rc1, protocolStakeHashV1_1Rc1, protocolManagementHashV1_1Rc1, oracleNftPolicyIdV1_1Rc1, enableTrace).Script.hash();
          if (!matchesV1Version(orchestratorHashV1_1Rc1, "V1_1_Rc1")) {
            _context3.n = 4;
            break;
          }
          settingsData = fields.get(1);
          settings = (0, _data.parse)(SettingsV1_1Rc1Schema, settingsData);
          registry = settings.registry;
          _context3.n = 2;
          return Promise.resolve().then(function () {
            return _interopRequireWildcard(require("../../generated-types/v0_1/index.js"));
          });
        case 2:
          _yield$import2 = _context3.v;
          V0_1TreasuryTreasurySpend = _yield$import2.V0_1TreasuryTreasurySpend;
          _context3.n = 3;
          return Promise.resolve().then(function () {
            return _interopRequireWildcard(require("../../generated-types/v0_4/index.js"));
          });
        case 3:
          _yield$import3 = _context3.v;
          V0_4StakingVaultStakingVaultSpend = _yield$import3.V0_4StakingVaultStakingVaultSpend;
          v01TreasuryHash = new V0_1TreasuryTreasurySpend({
            transaction_id: config.treasuryBootstrap.txHash,
            output_index: config.treasuryBootstrap.outputIndex
          }, oneShotPolicyId, enableTrace).Script.hash();
          useV0_1Treasury = registry.treasury === v01TreasuryHash;
          v04StakingVaultHash = new V0_4StakingVaultStakingVaultSpend({
            transaction_id: config.stakingVaultBootstrap.txHash,
            output_index: config.stakingVaultBootstrap.outputIndex
          }, oneShotPolicyId, enableTrace).Script.hash();
          useV0_4StakingVault = registry.staking_vault === v04StakingVaultHash;
          return _context3.a(2, {
            version: "V1_1_Rc1",
            proxyBootstrap: config.proxyBootstrap,
            treasuryBootstrap: config.treasuryBootstrap,
            stakingVaultBootstrap: config.stakingVaultBootstrap,
            yieldOracleBootstrap: yieldOracleBootstrap,
            assetNameHex: config.assetNameHex,
            sUSDrAssetNameHex: config.sUSDrAssetNameHex,
            enableTrace: config.enableTrace,
            useV0_1Treasury: useV0_1Treasury || undefined,
            useV0_4StakingVault: useV0_4StakingVault || undefined,
            // Identity, not just version: script hashes and the order address are
            // otherwise derived from this package's artifacts, which is wrong for a
            // chain running different bytes.
            deployedValidators: deployedGeneration
          });
        case 4:
          _context3.n = 5;
          return Promise.resolve().then(function () {
            return _interopRequireWildcard(require("../../generated-types/v1_0_rc1/index.js"));
          });
        case 5:
          _yield$import4 = _context3.v;
          V1_0Rc1ProtocolMintProtocolMintWithdraw = _yield$import4.V1_0Rc1ProtocolMintProtocolMintWithdraw;
          V1_0Rc1ProtocolStakeProtocolStakeWithdraw = _yield$import4.V1_0Rc1ProtocolStakeProtocolStakeWithdraw;
          V1_0Rc1ProtocolManagementProtocolManagementWithdraw = _yield$import4.V1_0Rc1ProtocolManagementProtocolManagementWithdraw;
          V1_0Rc1ProtocolOrchestratorProtocolOrchestratorWithdraw = _yield$import4.V1_0Rc1ProtocolOrchestratorProtocolOrchestratorWithdraw;
          SettingsV1Rc1Schema = _yield$import4.SettingsV1;
          protocolMintHashRc1 = new V1_0Rc1ProtocolMintProtocolMintWithdraw(oneShotPolicyId, enableTrace).Script.hash();
          protocolStakeHashRc1 = new V1_0Rc1ProtocolStakeProtocolStakeWithdraw(oneShotPolicyId, enableTrace).Script.hash();
          protocolManagementHashRc1 = new V1_0Rc1ProtocolManagementProtocolManagementWithdraw(oneShotPolicyId, enableTrace).Script.hash();
          orchestratorHashRc1 = new V1_0Rc1ProtocolOrchestratorProtocolOrchestratorWithdraw(oneShotPolicyId, protocolMintHashRc1, protocolStakeHashRc1, protocolManagementHashRc1, enableTrace).Script.hash();
          if (!matchesV1Version(orchestratorHashRc1, "V1_0_Rc1")) {
            _context3.n = 8;
            break;
          }
          _settingsData = fields.get(1);
          _settings = (0, _data.parse)(SettingsV1Rc1Schema, _settingsData);
          _registry = _settings.registry; // Backward-compat checks: load V0_1 + V0_4 types only after the
          // orchestrator hash matches. Same named-export destructuring pattern.
          _context3.n = 6;
          return Promise.resolve().then(function () {
            return _interopRequireWildcard(require("../../generated-types/v0_1/index.js"));
          });
        case 6:
          _yield$import5 = _context3.v;
          _V0_1TreasuryTreasurySpend = _yield$import5.V0_1TreasuryTreasurySpend;
          _context3.n = 7;
          return Promise.resolve().then(function () {
            return _interopRequireWildcard(require("../../generated-types/v0_4/index.js"));
          });
        case 7:
          _yield$import6 = _context3.v;
          _V0_4StakingVaultStakingVaultSpend = _yield$import6.V0_4StakingVaultStakingVaultSpend;
          _v01TreasuryHash = new _V0_1TreasuryTreasurySpend({
            transaction_id: config.treasuryBootstrap.txHash,
            output_index: config.treasuryBootstrap.outputIndex
          }, oneShotPolicyId, enableTrace).Script.hash();
          _useV0_1Treasury = _registry.treasury === _v01TreasuryHash;
          _v04StakingVaultHash = new _V0_4StakingVaultStakingVaultSpend({
            transaction_id: config.stakingVaultBootstrap.txHash,
            output_index: config.stakingVaultBootstrap.outputIndex
          }, oneShotPolicyId, enableTrace).Script.hash();
          _useV0_4StakingVault = _registry.staking_vault === _v04StakingVaultHash;
          return _context3.a(2, {
            version: "V1_0_Rc1",
            proxyBootstrap: config.proxyBootstrap,
            treasuryBootstrap: config.treasuryBootstrap,
            stakingVaultBootstrap: config.stakingVaultBootstrap,
            assetNameHex: config.assetNameHex,
            sUSDrAssetNameHex: config.sUSDrAssetNameHex,
            enableTrace: config.enableTrace,
            useV0_1Treasury: _useV0_1Treasury || undefined,
            useV0_4StakingVault: _useV0_4StakingVault || undefined,
            // Identity, not just version: script hashes and the order address are
            // otherwise derived from this package's artifacts, which is wrong for a
            // chain running different bytes.
            deployedValidators: deployedGeneration
          });
        case 8:
          _context3.n = 9;
          return Promise.resolve().then(function () {
            return _interopRequireWildcard(require("../../generated-types/v1_0/index.js"));
          });
        case 9:
          _yield$import7 = _context3.v;
          V1_0ProtocolMintProtocolMintWithdraw = _yield$import7.V1_0ProtocolMintProtocolMintWithdraw;
          V1_0ProtocolStakeProtocolStakeWithdraw = _yield$import7.V1_0ProtocolStakeProtocolStakeWithdraw;
          V1_0ProtocolManagementProtocolManagementWithdraw = _yield$import7.V1_0ProtocolManagementProtocolManagementWithdraw;
          V1_0ProtocolOrchestratorProtocolOrchestratorWithdraw = _yield$import7.V1_0ProtocolOrchestratorProtocolOrchestratorWithdraw;
          SettingsV1Schema = _yield$import7.SettingsV1;
          protocolMintHash = new V1_0ProtocolMintProtocolMintWithdraw(oneShotPolicyId, enableTrace).Script.hash();
          protocolStakeHash = new V1_0ProtocolStakeProtocolStakeWithdraw(oneShotPolicyId, enableTrace).Script.hash();
          protocolManagementHash = new V1_0ProtocolManagementProtocolManagementWithdraw(oneShotPolicyId, enableTrace).Script.hash();
          orchestratorHash = new V1_0ProtocolOrchestratorProtocolOrchestratorWithdraw(oneShotPolicyId, protocolMintHash, protocolStakeHash, protocolManagementHash, enableTrace).Script.hash();
          if (!matchesV1Version(orchestratorHash, "V1_0")) {
            _context3.n = 12;
            break;
          }
          _settingsData2 = fields.get(1);
          _settings2 = (0, _data.parse)(SettingsV1Schema, _settingsData2);
          _registry2 = _settings2.registry;
          _context3.n = 10;
          return Promise.resolve().then(function () {
            return _interopRequireWildcard(require("../../generated-types/v0_1/index.js"));
          });
        case 10:
          _yield$import8 = _context3.v;
          _V0_1TreasuryTreasurySpend2 = _yield$import8.V0_1TreasuryTreasurySpend;
          _context3.n = 11;
          return Promise.resolve().then(function () {
            return _interopRequireWildcard(require("../../generated-types/v0_4/index.js"));
          });
        case 11:
          _yield$import9 = _context3.v;
          _V0_4StakingVaultStakingVaultSpend2 = _yield$import9.V0_4StakingVaultStakingVaultSpend;
          _v01TreasuryHash2 = new _V0_1TreasuryTreasurySpend2({
            transaction_id: config.treasuryBootstrap.txHash,
            output_index: config.treasuryBootstrap.outputIndex
          }, oneShotPolicyId, enableTrace).Script.hash();
          _useV0_1Treasury2 = _registry2.treasury === _v01TreasuryHash2;
          _v04StakingVaultHash2 = new _V0_4StakingVaultStakingVaultSpend2({
            transaction_id: config.stakingVaultBootstrap.txHash,
            output_index: config.stakingVaultBootstrap.outputIndex
          }, oneShotPolicyId, enableTrace).Script.hash();
          _useV0_4StakingVault2 = _registry2.staking_vault === _v04StakingVaultHash2;
          return _context3.a(2, {
            version: "V1_0",
            proxyBootstrap: config.proxyBootstrap,
            treasuryBootstrap: config.treasuryBootstrap,
            stakingVaultBootstrap: config.stakingVaultBootstrap,
            assetNameHex: config.assetNameHex,
            sUSDrAssetNameHex: config.sUSDrAssetNameHex,
            enableTrace: config.enableTrace,
            useV0_1Treasury: _useV0_1Treasury2 || undefined,
            useV0_4StakingVault: _useV0_4StakingVault2 || undefined,
            // Identity, not just version: script hashes and the order address are
            // otherwise derived from this package's artifacts, which is wrong for a
            // chain running different bytes.
            deployedValidators: deployedGeneration
          });
        case 12:
          _context3.n = 13;
          return Promise.resolve().then(function () {
            return _interopRequireWildcard(require("../../generated-types/v0_4/index.js"));
          });
        case 13:
          _yield$import0 = _context3.v;
          V0_4ProtocolProtocolWithdraw = _yield$import0.V0_4ProtocolProtocolWithdraw;
          v04ProtocolHash = new V0_4ProtocolProtocolWithdraw(oneShotPolicyId, enableTrace).Script.hash();
          if (!(logicHash === v04ProtocolHash)) {
            _context3.n = 14;
            break;
          }
          return _context3.a(2, {
            version: "V0_4",
            proxyBootstrap: config.proxyBootstrap,
            treasuryBootstrap: config.treasuryBootstrap,
            stakingVaultBootstrap: config.stakingVaultBootstrap,
            assetNameHex: config.assetNameHex,
            sUSDrAssetNameHex: config.sUSDrAssetNameHex,
            enableTrace: config.enableTrace
          });
        case 14:
          throw new UnknownProtocolVersionError(logicHash);
        case 15:
          return _context3.a(2);
      }
    }, _callee3);
  }));
  return _matchProtocolVersion.apply(this, arguments);
}
var UnknownProtocolVersionError = exports.UnknownProtocolVersionError = /*#__PURE__*/function (_Error) {
  function UnknownProtocolVersionError(logicHash) {
    var _this;
    _classCallCheck(this, UnknownProtocolVersionError);
    _this = _callSuper(this, UnknownProtocolVersionError, ["Unrecognized protocol logic hash \"".concat(logicHash, "\". ") + "The on-chain proxy datum references a script that does not match any known SDK version. " + "Update the SDK or check that you are connected to the correct network."]);
    _this.logicHash = logicHash;
    _this.name = "UnknownProtocolVersionError";
    return _this;
  }
  _inherits(UnknownProtocolVersionError, _Error);
  return _createClass(UnknownProtocolVersionError);
}(/*#__PURE__*/_wrapNativeSuper(Error));
//# sourceMappingURL=detect-params.js.map