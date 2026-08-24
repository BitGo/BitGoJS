"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addDestinationOutput = addDestinationOutput;
exports.addDirectOutput = addDirectOutput;
exports.addressToDestination = addressToDestination;
exports.createSignedRedeemer = exports.buildOriginFromUtxo = exports.buildNonceFromUtxo = void 0;
exports.credentialFromScript = credentialFromScript;
exports.credentialFromScriptHash = credentialFromScriptHash;
exports.deployScript = deployScript;
exports.destinationToAddress = destinationToAddress;
exports.getAllKeyHashesFromMultisigScript = exports.destructureCip30Signature = void 0;
exports.getDatumFromNFT = getDatumFromNFT;
exports.getInlineDatumFromUtxo = void 0;
exports.getReferenceInputs = getReferenceInputs;
exports.getSignedPayloadForWithdraw = exports.getSignedPayloadForDeposit = exports.getSignatureKeyHashesFromMultisigScript = exports.getScriptKeyHashesFromMultisigScript = exports.getScriptHashFromOrderUtxo = void 0;
exports.getUnspentOutputByNftWithRetry = getUnspentOutputByNftWithRetry;
exports.lockOrPayAssets = lockOrPayAssets;
exports.readCoseSign1Parts = exports.parseOrderOwnerGenericFromDatum = exports.parseOrderOwnerGeneric = exports.normalizeProtocolVersion = exports.normalizeOrderVersion = void 0;
exports.readSingletonDatum = readSingletonDatum;
exports.resolveOrderReferenceInputs = resolveOrderReferenceInputs;
exports.resolveReferenceInputsByScriptHash = resolveReferenceInputsByScriptHash;
exports.rewardAccountFromScript = rewardAccountFromScript;
exports.sortOrderInputs = exports.signPayloadHashWithWallet = void 0;
var _core = require("@blaze-cardano/core");
var _data = _interopRequireWildcard(require("@blaze-cardano/data"));
var Data = _data;
var _sdk = require("@blaze-cardano/sdk");
var _errors = require("./errors.js");
var _index = require("../../generated-types/index.js");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t9 in e) "default" !== _t9 && {}.hasOwnProperty.call(e, _t9) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t9)) && (i.get || i.set) ? o(f, _t9, i) : f[_t9] = e[_t9]); return f; })(e, t); }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
/**
 * Create a reward account from a script
 */
function rewardAccountFromScript(script, network) {
  var credential = credentialFromScript(script);
  return _sdk.Core.RewardAccount.fromCredential(credential.toCore(), network);
}

/**
 * Create a credential from a script
 */
function credentialFromScript(script) {
  return credentialFromScriptHash(script.hash());
}

/**
 * Create a credential from a script hash
 */
function credentialFromScriptHash(scriptHash) {
  return _sdk.Core.Credential.fromCore({
    type: _sdk.Core.CredentialType.ScriptHash,
    hash: scriptHash
  });
}

/**
 * Send a value (with an attached datum) to either a key-credentialled or
 * script-credentialled address. This helper emits an explicit output for
 * the destination address so callers (mintOneShot / updateOneShotDatum /
 * etc.) work transparently in both single-signer and multisig deployments.
 *
 * Mutates `tx` (matching Blaze's builder pattern) and returns it for chaining.
 */
function lockOrPayAssets(tx, address, value, datum) {
  return addDirectOutput(tx, address, value, datum);
}

/**
 * Add an explicit transaction output for the target address and value.
 *
 * Mutates `tx` and returns it for call sites that want to keep builder-style
 * chaining.
 */
function addDirectOutput(tx, address, value, datum) {
  var output = new _sdk.Core.TransactionOutput(address, value);
  if (datum) {
    output.setDatum(_sdk.Core.Datum.newInlineData(datum));
  }
  tx.addOutput(output);
  return tx;
}

/**
 * Blockfrost responds to `getUnspentOutputs` on an unused address with HTTP
 * 404 ("requested component has not been found"), which the provider surfaces
 * as a generic Error. Treat only that exact failure as "not found at this
 * address" so outages and malformed responses still propagate.
 *
 * The query path is matched with an optional leading slash: @blaze-cardano/query
 * builds `/addresses/...`, while a caller paging the same endpoint itself builds
 * `addresses/...` (Blockfrost's base url already ends in `/`). The cron carries
 * a matcher for the same message
 * (`cli/src/scripts/lib/order-utxo-fetch.ts`); keep the two in step.
 */
var BLOCKFROST_ADDRESS_NOT_FOUND = /^getUnspentOutputs: Blockfrost threw "The requested component has not been found\." for query: \/?addresses\//;
function isBlockfrostAddressNotFoundError(error) {
  return error instanceof Error && BLOCKFROST_ADDRESS_NOT_FOUND.test(error.message);
}

/**
 * Fully resolve the address's current unspent outputs.
 *
 * Blockfrost can expose a reference script through the transaction-output
 * endpoint before (or without) hydrating `reference_script_hash` on the address
 * UTxO endpoint. Re-resolving the inputs returned by the address query
 * preserves the unspent-only constraint while recovering the full output
 * metadata from the exact transactions.
 */
function hydrateUnspentOutputs(_x, _x2) {
  return _hydrateUnspentOutputs.apply(this, arguments);
}
/**
 * A `hydrateUnspentOutputs` call shared by every hash resolved against the same
 * address in one pass. Hydration costs one provider request per UTxO at the
 * address, so a caller resolving eight script hashes against a provider that
 * omits script metadata would otherwise pay the whole sweep eight times, and
 * the dapp runs this against a rate-limited Blockfrost proxy. Scoped to a
 * single call rather than cached on the SDK so a later pass still sees a script
 * deployed in the meantime.
 */
function _hydrateUnspentOutputs() {
  _hydrateUnspentOutputs = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3(blaze, address) {
    var unspent;
    return _regenerator().w(function (_context3) {
      while (1) switch (_context3.n) {
        case 0:
          _context3.n = 1;
          return blaze.provider.getUnspentOutputs(address);
        case 1:
          unspent = _context3.v;
          if (!(unspent.length === 0)) {
            _context3.n = 2;
            break;
          }
          return _context3.a(2, []);
        case 2:
          return _context3.a(2, blaze.provider.resolveUnspentOutputs(unspent.map(function (utxo) {
            return utxo.input();
          })));
      }
    }, _callee3);
  }));
  return _hydrateUnspentOutputs.apply(this, arguments);
}
function shareHydration(blaze, address) {
  var pending;
  return function () {
    return pending !== null && pending !== void 0 ? pending : pending = hydrateUnspentOutputs(blaze, address);
  };
}

/**
 * Resolve a script reference at a specific address, tolerating Blockfrost's
 * throw for an address with no history instead of an empty result, and its
 * missing script metadata on the address UTxO endpoint.
 */
function resolveScriptRefAtAddress(_x3, _x4, _x5) {
  return _resolveScriptRefAtAddress.apply(this, arguments);
}
/**
 * Deploy a script as a reference script.
 *
 * When `address` is provided, the reference UTxO is locked at that address
 * (instead of Blaze's default burn address), which lets resolution query a
 * small, dedicated UTxO set rather than the shared burn address.
 *
 * Throws `ScriptAlreadyDeployedError` (carrying the existing reference
 * UTxO) if the script is already deployed *at the target location* — the
 * specified `address` when given, otherwise the burn-address default. The
 * guard is intentionally scoped to the deploy target only: a copy that
 * exists elsewhere (e.g. a legacy copy at the burn address) does NOT block
 * deploying to a newly specified address, which is exactly what a migration
 * needs. Callers that want idempotent reruns should catch that specific class.
 */
function _resolveScriptRefAtAddress() {
  _resolveScriptRefAtAddress = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4(blaze, hash, address) {
    var hydrate,
      resolved,
      hydrated,
      _args4 = arguments,
      _t;
    return _regenerator().w(function (_context4) {
      while (1) switch (_context4.p = _context4.n) {
        case 0:
          hydrate = _args4.length > 3 && _args4[3] !== undefined ? _args4[3] : function () {
            return hydrateUnspentOutputs(blaze, address);
          };
          _context4.p = 1;
          _context4.n = 2;
          return blaze.provider.resolveScriptRef(hash, address);
        case 2:
          resolved = _context4.v;
          if (!resolved) {
            _context4.n = 3;
            break;
          }
          return _context4.a(2, resolved);
        case 3:
          _context4.n = 6;
          break;
        case 4:
          _context4.p = 4;
          _t = _context4.v;
          if (isBlockfrostAddressNotFoundError(_t)) {
            _context4.n = 5;
            break;
          }
          throw _t;
        case 5:
          return _context4.a(2, undefined);
        case 6:
          _context4.n = 7;
          return hydrate();
        case 7:
          hydrated = _context4.v;
          return _context4.a(2, hydrated.find(function (utxo) {
            var _utxo$output$scriptRe;
            return ((_utxo$output$scriptRe = utxo.output().scriptRef()) === null || _utxo$output$scriptRe === void 0 ? void 0 : _utxo$output$scriptRe.hash()) === hash;
          }));
      }
    }, _callee4, null, [[1, 4]]);
  }));
  return _resolveScriptRefAtAddress.apply(this, arguments);
}
function deployScript(_x6, _x7, _x8) {
  return _deployScript.apply(this, arguments);
}
function _deployScript() {
  _deployScript = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee5(blaze, script, address) {
    var refInput, deployTx, _t2;
    return _regenerator().w(function (_context5) {
      while (1) switch (_context5.n) {
        case 0:
          if (!address) {
            _context5.n = 2;
            break;
          }
          _context5.n = 1;
          return resolveScriptRefAtAddress(blaze, script.hash(), address);
        case 1:
          _t2 = _context5.v;
          _context5.n = 4;
          break;
        case 2:
          _context5.n = 3;
          return blaze.provider.resolveScriptRef(script.hash());
        case 3:
          _t2 = _context5.v;
        case 4:
          refInput = _t2;
          if (!refInput) {
            _context5.n = 5;
            break;
          }
          throw new _errors.ScriptAlreadyDeployedError(script.hash(), refInput);
        case 5:
          // `address === undefined` -> Blaze locks the script at the burn address.
          deployTx = blaze.newTransaction().deployScript(script, address);
          return _context5.a(2, deployTx);
      }
    }, _callee5);
  }));
  return _deployScript.apply(this, arguments);
}
var NFT_LOOKUP_ATTEMPTS = 3;
var NFT_LOOKUP_BACKOFF_MS = 250;
var sleep = function sleep(ms) {
  return new Promise(function (resolve) {
    return setTimeout(resolve, ms);
  });
};

/**
 * Look up an NFT UTxO, retrying indexer lag after the output moves.
 * Treats both a thrown 404 and an empty result as lag. Re-throws the last
 * provider error when the budget is exhausted.
 */
function getUnspentOutputByNftWithRetry(_x9, _x0) {
  return _getUnspentOutputByNftWithRetry.apply(this, arguments);
}
/**
 * Rebuild `utxo` with `datum` attached inline, preserving its input ref,
 * address, value and reference script.
 */
function _getUnspentOutputByNftWithRetry() {
  _getUnspentOutputByNftWithRetry = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee6(provider, assetId) {
    var lastError, attempt, utxo, _t3;
    return _regenerator().w(function (_context6) {
      while (1) switch (_context6.p = _context6.n) {
        case 0:
          attempt = 1;
        case 1:
          if (!(attempt <= NFT_LOOKUP_ATTEMPTS)) {
            _context6.n = 8;
            break;
          }
          _context6.p = 2;
          _context6.n = 3;
          return provider.getUnspentOutputByNFT(assetId);
        case 3:
          utxo = _context6.v;
          if (!utxo) {
            _context6.n = 4;
            break;
          }
          return _context6.a(2, utxo);
        case 4:
          lastError = undefined;
          _context6.n = 6;
          break;
        case 5:
          _context6.p = 5;
          _t3 = _context6.v;
          lastError = _t3;
        case 6:
          if (!(attempt < NFT_LOOKUP_ATTEMPTS)) {
            _context6.n = 7;
            break;
          }
          _context6.n = 7;
          return sleep(NFT_LOOKUP_BACKOFF_MS * attempt);
        case 7:
          attempt++;
          _context6.n = 1;
          break;
        case 8:
          if (!lastError) {
            _context6.n = 9;
            break;
          }
          throw lastError;
        case 9:
          return _context6.a(2, undefined);
      }
    }, _callee6, null, [[2, 5]]);
  }));
  return _getUnspentOutputByNftWithRetry.apply(this, arguments);
}
function withInlineDatum(utxo, datum) {
  var output = utxo.output();
  var promoted = new _sdk.Core.TransactionOutput(output.address(), output.amount());
  promoted.setDatum(_sdk.Core.Datum.newInlineData(datum));
  var scriptRef = output.scriptRef();
  if (scriptRef) {
    promoted.setScriptRef(scriptRef);
  }
  return new _sdk.Core.TransactionUnspentOutput(utxo.input(), promoted);
}

/**
 * Read an NFT singleton (proxy, treasury, vault) and its datum.
 *
 * Protocol singletons are locked inline. A hash-form read is a provider
 * artifact (Blockfrost omitting `inline_datum`). Validators require
 * `InlineDatum` on the singleton input; passing the preimage as `addInput`'s
 * 3rd arg is a supplemental witness datum that local eval and phase-1 reject.
 * Resolve the hash, verify the preimage, and reattach it inline.
 *
 * The lookup is retried: a singleton always exists, so a not-found answer is
 * the provider's index lagging the UTxO's latest move, not a missing singleton.
 */
function readSingletonDatum(_x1, _x10) {
  return _readSingletonDatum.apply(this, arguments);
}
/**
 * Get datum from a UTxO containing a specific NFT, optionally parsed under
 * `datumSchema`. Datum-hash reads are repaired by {@link readSingletonDatum}.
 */
function _readSingletonDatum() {
  _readSingletonDatum = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee7(provider, nftAssetId) {
    var _read$output$datum, _read$output$datum2;
    var read, inline, datumHash, resolved, preimageHash, input;
    return _regenerator().w(function (_context7) {
      while (1) switch (_context7.n) {
        case 0:
          _context7.n = 1;
          return getUnspentOutputByNftWithRetry(provider, nftAssetId);
        case 1:
          read = _context7.v;
          if (read) {
            _context7.n = 2;
            break;
          }
          throw new Error("No UTXO found with NFT: ".concat(nftAssetId));
        case 2:
          inline = (_read$output$datum = read.output().datum()) === null || _read$output$datum === void 0 ? void 0 : _read$output$datum.asInlineData();
          if (!inline) {
            _context7.n = 3;
            break;
          }
          return _context7.a(2, {
            utxo: read,
            datum: inline
          });
        case 3:
          datumHash = (_read$output$datum2 = read.output().datum()) === null || _read$output$datum2 === void 0 ? void 0 : _read$output$datum2.asDataHash();
          if (datumHash) {
            _context7.n = 4;
            break;
          }
          throw new Error("No datum found in UTXO with NFT: ".concat(nftAssetId));
        case 4:
          _context7.n = 5;
          return provider.resolveDatum(datumHash);
        case 5:
          resolved = _context7.v;
          preimageHash = _sdk.Core.blake2b_256(resolved.toCbor());
          if (!(preimageHash !== datumHash)) {
            _context7.n = 6;
            break;
          }
          throw new Error("Datum resolved for UTXO with NFT ".concat(nftAssetId, " does not match its datum hash: ") + "resolved preimage hashes to ".concat(preimageHash, ", UTXO reports ").concat(datumHash));
        case 6:
          input = read.input();
          console.warn("[realfi-sdk] singleton ".concat(nftAssetId, " read at ").concat(input.transactionId(), "#").concat(input.index(), " ") + "reported datum hash ".concat(datumHash, " instead of its inline datum; reattaching the resolved preimage inline"));
          return _context7.a(2, {
            utxo: withInlineDatum(read, resolved),
            datum: resolved
          });
      }
    }, _callee7);
  }));
  return _readSingletonDatum.apply(this, arguments);
}
function getDatumFromNFT(_x11, _x12, _x13) {
  return _getDatumFromNFT.apply(this, arguments);
}
/**
 * Get script reference inputs, using cached values when available.
 *
 * When `address` is provided, each script is resolved at that address first
 * (a fast, dedicated query) and only falls back to Blaze's burn-address
 * default if it isn't found there. This keeps previously burn-address-deployed
 * scripts resolvable while migrating to a specified deployment address.
 */
function _getDatumFromNFT() {
  _getDatumFromNFT = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee8(blaze, nftAssetId, datumSchema) {
    var _yield$readSingletonD, utxo, datum, parsedDatum;
    return _regenerator().w(function (_context8) {
      while (1) switch (_context8.n) {
        case 0:
          _context8.n = 1;
          return readSingletonDatum(blaze.provider, nftAssetId);
        case 1:
          _yield$readSingletonD = _context8.v;
          utxo = _yield$readSingletonD.utxo;
          datum = _yield$readSingletonD.datum;
          if (!datumSchema) {
            _context8.n = 2;
            break;
          }
          parsedDatum = (0, _data.parse)(datumSchema, datum);
          return _context8.a(2, {
            utxo: utxo,
            datum: datum,
            parsedDatum: parsedDatum
          });
        case 2:
          return _context8.a(2, {
            utxo: utxo,
            datum: datum,
            parsedDatum: undefined
          });
      }
    }, _callee8);
  }));
  return _getDatumFromNFT.apply(this, arguments);
}
function getReferenceInputs(_x14, _x15, _x16, _x17) {
  return _getReferenceInputs.apply(this, arguments);
}
/**
 * Extract signature key hashes from a multisig script
 */
function _getReferenceInputs() {
  _getReferenceInputs = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee9(blaze, scriptHashes, cachedInputs, address) {
    var referenceInputs, hydrate, _i2, _Object$entries, _Object$entries$_i, name, hash, refInput, _t4, _t5;
    return _regenerator().w(function (_context9) {
      while (1) switch (_context9.n) {
        case 0:
          referenceInputs = {};
          hydrate = address ? shareHydration(blaze, address) : undefined;
          _i2 = 0, _Object$entries = Object.entries(scriptHashes);
        case 1:
          if (!(_i2 < _Object$entries.length)) {
            _context9.n = 9;
            break;
          }
          _Object$entries$_i = _slicedToArray(_Object$entries[_i2], 2), name = _Object$entries$_i[0], hash = _Object$entries$_i[1];
          if (!(cachedInputs !== null && cachedInputs !== void 0 && cachedInputs[name])) {
            _context9.n = 2;
            break;
          }
          referenceInputs[name] = cachedInputs[name];
          return _context9.a(3, 8);
        case 2:
          _t5 = address;
          if (!_t5) {
            _context9.n = 4;
            break;
          }
          _context9.n = 3;
          return resolveScriptRefAtAddress(blaze, hash, address, hydrate);
        case 3:
          _t5 = _context9.v;
        case 4:
          _t4 = _t5;
          if (_t4) {
            _context9.n = 6;
            break;
          }
          _context9.n = 5;
          return blaze.provider.resolveScriptRef(hash);
        case 5:
          _t4 = _context9.v;
        case 6:
          refInput = _t4;
          if (refInput) {
            _context9.n = 7;
            break;
          }
          throw new Error("No reference input found for ".concat(name, " script (").concat(hash, "). Make sure it is deployed."));
        case 7:
          referenceInputs[name] = refInput;
        case 8:
          _i2++;
          _context9.n = 1;
          break;
        case 9:
          return _context9.a(2, referenceInputs);
      }
    }, _callee9);
  }));
  return _getReferenceInputs.apply(this, arguments);
}
var _getSignatureKeyHashesFromMultisigScript = exports.getSignatureKeyHashesFromMultisigScript = function getSignatureKeyHashesFromMultisigScript(multisig) {
  var result = [];
  if ("Signature" in multisig) {
    result.push(multisig.Signature.key_hash);
  } else if ("AtLeast" in multisig) {
    multisig.AtLeast.scripts.map(function (s) {
      return _getSignatureKeyHashesFromMultisigScript(s);
    }).flat().forEach(function (s) {
      result.push(s);
    });
  } else if ("AllOf" in multisig) {
    multisig.AllOf.scripts.map(function (s) {
      return _getSignatureKeyHashesFromMultisigScript(s);
    }).flat().forEach(function (s) {
      result.push(s);
    });
  } else if ("AnyOf" in multisig) {
    multisig.AnyOf.scripts.map(function (s) {
      return _getSignatureKeyHashesFromMultisigScript(s);
    }).flat().forEach(function (s) {
      result.push(s);
    });
  }
  return _toConsumableArray(new Set(result).values());
};

/**
 * Extract script key hashes from a multisig script
 */
var _getScriptKeyHashesFromMultisigScript = exports.getScriptKeyHashesFromMultisigScript = function getScriptKeyHashesFromMultisigScript(multisig) {
  var result = [];
  if ("Script" in multisig) {
    result.push(multisig.Script.script_hash);
  } else if ("AtLeast" in multisig) {
    multisig.AtLeast.scripts.map(function (s) {
      return _getScriptKeyHashesFromMultisigScript(s);
    }).flat().forEach(function (s) {
      result.push(s);
    });
  } else if ("AllOf" in multisig) {
    multisig.AllOf.scripts.map(function (s) {
      return _getScriptKeyHashesFromMultisigScript(s);
    }).flat().forEach(function (s) {
      result.push(s);
    });
  } else if ("AnyOf" in multisig) {
    multisig.AnyOf.scripts.map(function (s) {
      return _getScriptKeyHashesFromMultisigScript(s);
    }).flat().forEach(function (s) {
      result.push(s);
    });
  }
  return _toConsumableArray(new Set(result).values());
};

/**
 * Extract all key hashes (signature + script) from a multisig script
 */
var getAllKeyHashesFromMultisigScript = exports.getAllKeyHashesFromMultisigScript = function getAllKeyHashesFromMultisigScript(multisig) {
  var keyHashes = _getSignatureKeyHashesFromMultisigScript(multisig);
  var scriptHashes = _getScriptKeyHashesFromMultisigScript(multisig);
  return _toConsumableArray(new Set([].concat(_toConsumableArray(keyHashes), _toConsumableArray(scriptHashes))).values());
};

// ─────────────────────────────────────────────────────────────────────────────
// Order Input Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sort order inputs by txHash and outputIndex for deterministic ordering.
 * This ensures consistent payload generation across all signers.
 */
var sortOrderInputs = exports.sortOrderInputs = function sortOrderInputs(orderInputs) {
  return _toConsumableArray(orderInputs).sort(function (a, b) {
    var txHashA = a.transactionId().toString();
    var txHashB = b.transactionId().toString();
    if (txHashA < txHashB) return -1;
    if (txHashA > txHashB) return 1;
    var indexA = a.index();
    var indexB = b.index();
    return indexA < indexB ? -1 : indexA > indexB ? 1 : 0;
  });
};

/**
 * Build a nonce from the first order UTxO.
 */
var buildNonceFromUtxo = exports.buildNonceFromUtxo = function buildNonceFromUtxo(utxo) {
  return {
    UTxO: [{
      transaction_id: utxo.transactionId().toString(),
      output_index: utxo.index()
    }]
  };
};

/**
 * Build the origin ByteArray (CBOR-serialized OutputReference) from a UTxO.
 * Used by v0_4 SDK and shared helpers.
 */
var buildOriginFromUtxo = exports.buildOriginFromUtxo = function buildOriginFromUtxo(utxo) {
  var input = utxo.input();
  var txId = input.transactionId().toString();
  var outputIndex = input.index();
  var fieldsList = new _sdk.Core.PlutusList();
  fieldsList.add(_sdk.Core.PlutusData.newBytes(Buffer.from(txId, "hex")));
  fieldsList.add(_sdk.Core.PlutusData.newInteger(outputIndex));
  var outputRefData = _sdk.Core.PlutusData.newConstrPlutusData(new _sdk.Core.ConstrPlutusData(0n, fieldsList));
  return outputRefData.toCbor();
};

/**
 * KeySignature type matching the contract's KeySignature tuple.
 * A tuple of [VerificationKey, COSESign1] where:
 * - VerificationKey: 32-byte Ed25519 public key (hex string)
 * - COSESign1: COSE signature with headers (raw CBOR bytes) and detached payload
 */

var destructureCip30Signature = exports.destructureCip30Signature = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(cip30Signature) {
    var _readCoseSign1Parts, protectedCbor, signature, publicKey;
    return _regenerator().w(function (_context) {
      while (1) switch (_context.n) {
        case 0:
          // Read the COSE_Sign1 with CBOR primitives from the dependency tree.
          // Async for callers that await it.
          _readCoseSign1Parts = readCoseSign1Parts(cip30Signature.signature.toString()), protectedCbor = _readCoseSign1Parts["protected"], signature = _readCoseSign1Parts.signature; // Extract public key from COSE_Key (at label -2)
          publicKey = extractPublicKeyFromCoseKey(cip30Signature.key.toString());
          return _context.a(2, {
            publicKey: publicKey,
            coseSign1: {
              headers: {
                "protected": protectedCbor,
                unprotected: "" // Empty ByteArray
              },
              signature: signature
            }
          });
      }
    }, _callee);
  }));
  return function destructureCip30Signature(_x18) {
    return _ref.apply(this, arguments);
  };
}();

/**
 * Produce a COSE (CIP-8) signature tuple over `payloadHash` using the connected
 * wallet's key. The reusable building block for signer callbacks — e.g. the
 * settings-governance `signAuthPayload` or an orchestrator signed redeemer —
 * that wraps `signData` + `destructureCip30Signature` into the on-chain tuple.
 */
var signPayloadHashWithWallet = exports.signPayloadHashWithWallet = /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(blaze, payloadHash) {
    var address, cip30Signature, _yield$destructureCip, publicKey, coseSign1;
    return _regenerator().w(function (_context2) {
      while (1) switch (_context2.n) {
        case 0:
          _context2.n = 1;
          return blaze.wallet.getChangeAddress();
        case 1:
          address = _context2.v;
          _context2.n = 2;
          return blaze.wallet.signData(address, payloadHash);
        case 2:
          cip30Signature = _context2.v;
          _context2.n = 3;
          return destructureCip30Signature(cip30Signature);
        case 3:
          _yield$destructureCip = _context2.v;
          publicKey = _yield$destructureCip.publicKey;
          coseSign1 = _yield$destructureCip.coseSign1;
          return _context2.a(2, [publicKey, coseSign1]);
      }
    }, _callee2);
  }));
  return function signPayloadHashWithWallet(_x19, _x20) {
    return _ref2.apply(this, arguments);
  };
}();

/**
 * Create a SignedRedeemer_ExtraProtocolRedeemer structure for on-chain verification.
 *
 * @param extra - The extra protocol redeemer data (e.g., request_to_outputs mapping)
 * @param payload - The SignedPayload_ProtocolRedeemer CBOR hex string (action + nonce)
 * @param signatures - Array of KeySignature tuples from each signer
 * @returns A SignedRedeemer_ExtraProtocolRedeemer ready for use in transaction
 */
var createSignedRedeemer = exports.createSignedRedeemer = function createSignedRedeemer(extra, payload, signatures) {
  if (signatures.length === 0) {
    throw new Error("At least one signature is required");
  }
  return {
    extra: extra,
    payload: payload,
    signatures: signatures
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// CBOR Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract the 32-byte Ed25519 public key from a COSE_Key structure.
 * COSE_Key for Ed25519 has the key at label -2.
 * The COSE_Key CBOR structure looks like: a4 01 01 03 27 20 06 21 5820 <32 bytes>
 * Where 21 5820 indicates label -2 followed by a 32-byte bytestring.
 */
var extractPublicKeyFromCoseKey = function extractPublicKeyFromCoseKey(coseKeyHex) {
  // Parse the COSE_Key CBOR manually to find the public key
  // The key at label -2 (encoded as 0x21 in CBOR) contains the 32-byte public key
  // Look for 0x21 0x58 0x20 which indicates: label -2, bytestring, 32 bytes
  var keyBytes = Buffer.from(coseKeyHex, "hex");

  // Find the pattern: 21 58 20 (label -2, bytes, length 32)
  var pubKeyStart = -1;
  for (var i = 0; i < keyBytes.length - 34; i++) {
    if (keyBytes[i] === 0x21 && keyBytes[i + 1] === 0x58 && keyBytes[i + 2] === 0x20) {
      pubKeyStart = i + 3; // Skip the 21 58 20 prefix
      break;
    }
  }
  if (pubKeyStart === -1) {
    throw new Error("Could not find public key in COSE_Key structure");
  }
  var pubKey = keyBytes.slice(pubKeyStart, pubKeyStart + 32);
  if (pubKey.length !== 32) {
    throw new Error("Invalid public key length: ".concat(pubKey.length));
  }
  return pubKey.toString("hex");
};

// ─────────────────────────────────────────────────────────────────────────────
// COSE_Sign1 (CIP-8) reader
// ─────────────────────────────────────────────────────────────────────────────

// CBOR major types used here.
var CBOR_MAJOR_BYTES = 2;
var CBOR_MAJOR_TEXT = 3;
var CBOR_MAJOR_ARRAY = 4;
var CBOR_MAJOR_MAP = 5;
var CBOR_MAJOR_TAG = 6;
var CBOR_MAJOR_SIMPLE = 7; // simple values (false/true/null) and floats

var CBOR_ADDITIONAL_INDEFINITE = 31;
var CBOR_BREAK = 0xff; // terminates an indefinite-length string/array/map
var CBOR_TAG_COSE_SIGN1 = 18; // COSE_Sign1's registered tag (encodes as d2)
var CBOR_SIMPLE_NULL = 22; // `f6`

/**
 * Read a CBOR header at `offset`, returning the major type, the argument
 * (length / value), whether the item is indefinite-length, and the offset of
 * the item's content. Supports the definite forms (0-23 inline and the
 * 1/2/4/8-byte arguments) plus indefinite-length strings, arrays, and maps.
 */
var readCborHeader = function readCborHeader(bytes, offset) {
  var initial = bytes[offset];
  if (initial === undefined) {
    throw new Error("COSE_Sign1 CBOR ended unexpectedly");
  }
  var major = initial >> 5;
  var additional = initial & 0x1f;
  if (additional < 24) {
    return {
      major: major,
      argument: additional,
      indefinite: false,
      contentOffset: offset + 1
    };
  }
  if (additional === CBOR_ADDITIONAL_INDEFINITE) {
    // Only strings, arrays, and maps have an indefinite-length form. A break
    // byte (0xff) parses as major 7 here, so a stray break is rejected too.
    if (major < CBOR_MAJOR_BYTES || major > CBOR_MAJOR_MAP) {
      throw new Error("Unsupported indefinite-length CBOR major type: ".concat(major));
    }
    return {
      major: major,
      argument: 0,
      indefinite: true,
      contentOffset: offset + 1
    };
  }

  // 24/25/26/27 -> 1/2/4/8 following length bytes. 28-30 are reserved.
  if (additional > 27) {
    throw new Error("Unsupported CBOR additional info: ".concat(additional));
  }
  var lengthBytes = 1 << additional - 24;
  var argument = 0;
  for (var i = 0; i < lengthBytes; i++) {
    var b = bytes[offset + 1 + i];
    if (b === undefined) {
      throw new Error("COSE_Sign1 CBOR length ended unexpectedly");
    }
    argument = argument * 256 + b;
  }
  return {
    major: major,
    argument: argument,
    indefinite: false,
    contentOffset: offset + 1 + lengthBytes
  };
};

/**
 * Read the definite-length chunks of an indefinite-length CBOR string whose
 * first chunk header is at `offset`, returning the concatenated content and
 * the offset just past the closing break byte.
 */
var readIndefiniteStringChunks = function readIndefiniteStringChunks(bytes, major, offset) {
  var chunks = [];
  var next = offset;
  while (bytes[next] !== CBOR_BREAK) {
    var chunk = readCborHeader(bytes, next);
    if (chunk.major !== major || chunk.indefinite) {
      throw new Error("Invalid chunk in an indefinite-length CBOR string");
    }
    var end = chunk.contentOffset + chunk.argument;
    if (end > bytes.length) {
      throw new Error("COSE_Sign1 CBOR ended unexpectedly");
    }
    chunks.push(bytes.slice(chunk.contentOffset, end));
    next = end;
  }
  return {
    content: Buffer.concat(chunks),
    nextOffset: next + 1
  };
};

/**
 * Skip over one complete CBOR data item starting at `offset`, returning the
 * offset immediately after it. Handles the item shapes that occur inside a
 * COSE_Sign1 (byte/text strings, integers, arrays, maps, tags — definite or
 * indefinite length) recursively.
 */
var _skipCborItem = function skipCborItem(bytes, offset) {
  var _readCborHeader = readCborHeader(bytes, offset),
    major = _readCborHeader.major,
    argument = _readCborHeader.argument,
    indefinite = _readCborHeader.indefinite,
    contentOffset = _readCborHeader.contentOffset;
  if (indefinite) {
    if (major === CBOR_MAJOR_BYTES || major === CBOR_MAJOR_TEXT) {
      return readIndefiniteStringChunks(bytes, major, contentOffset).nextOffset;
    }
    // Indefinite array or map: items until the break byte.
    var next = contentOffset;
    while (bytes[next] !== CBOR_BREAK) {
      if (bytes[next] === undefined) {
        throw new Error("COSE_Sign1 CBOR ended unexpectedly");
      }
      next = _skipCborItem(bytes, next); // array item / map key
      if (major === CBOR_MAJOR_MAP) {
        next = _skipCborItem(bytes, next); // map value
      }
    }
    return next + 1;
  }
  switch (major) {
    case 0: // unsigned int
    case 1: // negative int
    case CBOR_MAJOR_SIMPLE:
      // simple value (false/true/null) or float
      // readCborHeader already consumed the value/float bytes into `argument`.
      return contentOffset;
    case CBOR_MAJOR_BYTES:
    case CBOR_MAJOR_TEXT:
      {
        var end = contentOffset + argument;
        if (end > bytes.length) {
          throw new Error("COSE_Sign1 CBOR ended unexpectedly");
        }
        return end;
      }
    case CBOR_MAJOR_ARRAY:
      {
        var _next2 = contentOffset;
        for (var i = 0; i < argument; i++) {
          _next2 = _skipCborItem(bytes, _next2);
        }
        return _next2;
      }
    case CBOR_MAJOR_MAP:
      {
        var _next3 = contentOffset;
        for (var _i = 0; _i < argument; _i++) {
          _next3 = _skipCborItem(bytes, _next3); // key
          _next3 = _skipCborItem(bytes, _next3); // value
        }
        return _next3;
      }
    case CBOR_MAJOR_TAG:
      return _skipCborItem(bytes, contentOffset);
    // tagged content
    default:
      throw new Error("Unsupported CBOR major type in COSE_Sign1: ".concat(major));
  }
};

/**
 * Read the byte-string content at `offset`, returning its hex and the offset
 * after it.
 */
var readCborByteString = function readCborByteString(bytes, offset) {
  var _readCborHeader2 = readCborHeader(bytes, offset),
    major = _readCborHeader2.major,
    argument = _readCborHeader2.argument,
    indefinite = _readCborHeader2.indefinite,
    contentOffset = _readCborHeader2.contentOffset;
  if (major !== CBOR_MAJOR_BYTES) {
    throw new Error("Expected a CBOR byte string in COSE_Sign1, got major type ".concat(major));
  }
  if (indefinite) {
    var _readIndefiniteString = readIndefiniteStringChunks(bytes, major, contentOffset),
      content = _readIndefiniteString.content,
      nextOffset = _readIndefiniteString.nextOffset;
    return {
      hex: Buffer.from(content).toString("hex"),
      nextOffset: nextOffset
    };
  }
  var end = contentOffset + argument;
  if (end > bytes.length) {
    throw new Error("COSE_Sign1 CBOR ended unexpectedly");
  }
  return {
    hex: Buffer.from(bytes.slice(contentOffset, end)).toString("hex"),
    nextOffset: end
  };
};

/**
 * Parse a CIP-8 COSE_Sign1 and extract the pieces the on-chain KeySignature
 * tuple needs: the protected header map bytes (byte-string content, wrapper
 * removed) and the raw Ed25519 signature bytes.
 *
 * COSE_Sign1 = [ protected: bstr, unprotected: map, payload: bstr / nil,
 * signature: bstr ], optionally wrapped in CBOR tag 18. The protected element
 * is itself a byte string whose content is the serialized header map; reading
 * the byte-string content yields the raw header-map bytes the tuple stores.
 * Indefinite-length encodings of the array, the maps, and the byte strings
 * are accepted alongside the definite forms.
 */
var readCoseSign1Parts = exports.readCoseSign1Parts = function readCoseSign1Parts(coseSign1Hex) {
  var bytes = Buffer.from(coseSign1Hex, "hex");
  var offset = 0;
  // Optional CBOR tag: only tag 18 (COSE_Sign1's registered tag, the `d2`
  // prefix) is accepted — tagged input is accepted by design, since the
  // Ledger signing path emits d2-tagged COSE_Sign1s, but any other tag means
  // this isn't a COSE_Sign1 and must be rejected rather than silently unwrapped.
  var first = readCborHeader(bytes, offset);
  if (first.major === CBOR_MAJOR_TAG) {
    if (first.argument !== CBOR_TAG_COSE_SIGN1) {
      throw new Error("COSE_Sign1 has unexpected CBOR tag ".concat(first.argument, " (expected 18)"));
    }
    offset = first.contentOffset;
  }
  var array = readCborHeader(bytes, offset);
  if (array.major !== CBOR_MAJOR_ARRAY) {
    throw new Error("COSE_Sign1 is not a CBOR array");
  }
  if (!array.indefinite && array.argument !== 4) {
    throw new Error("COSE_Sign1 is not a 4-element CBOR array");
  }

  // Element 0: protected header byte string (content = serialized header map).
  var protectedRead = readCborByteString(bytes, array.contentOffset);

  // Element 1: unprotected header map — must be a CBOR map (major 5),
  // definite or indefinite. Peek the header before skipCborItem consumes it
  // so we assert on the same read the skip performs, not a second one.
  var unprotectedHeader = readCborHeader(bytes, protectedRead.nextOffset);
  if (unprotectedHeader.major !== CBOR_MAJOR_MAP) {
    throw new Error("COSE_Sign1 unprotected header is not a CBOR map (got major type ".concat(unprotectedHeader.major, ")"));
  }
  var afterUnprotected = _skipCborItem(bytes, protectedRead.nextOffset);

  // Element 2: payload — must be a byte string (major 2) or null (`f6`).
  var payloadHeader = readCborHeader(bytes, afterUnprotected);
  var isNullPayload = payloadHeader.major === CBOR_MAJOR_SIMPLE && !payloadHeader.indefinite && payloadHeader.argument === CBOR_SIMPLE_NULL;
  if (payloadHeader.major !== CBOR_MAJOR_BYTES && !isNullPayload) {
    throw new Error("COSE_Sign1 payload is not a byte string or null (got major type ".concat(payloadHeader.major, ")"));
  }
  var afterPayload = _skipCborItem(bytes, afterUnprotected);

  // Element 3: signature byte string.
  var signatureRead = readCborByteString(bytes, afterPayload);

  // An indefinite-length COSE_Sign1 array must close right after element 3.
  if (array.indefinite && bytes[signatureRead.nextOffset] !== CBOR_BREAK) {
    throw new Error("COSE_Sign1 is not a 4-element CBOR array");
  }
  return {
    "protected": protectedRead.hex,
    signature: signatureRead.hex
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Treasury Operation Payload Helpers (Withdraw/Deposit)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the SignedPayload_ProtocolRedeemer for a withdraw operation.
 * Uses the treasury UTxO as the nonce source.
 *
 * @param requests - Array of withdraw requests with destinations and amounts
 * @param treasuryUtxo - The treasury UTxO (consumed in tx, used as nonce)
 * @returns SignedPayload_ProtocolRedeemer CBOR hex string
 */
var getSignedPayloadForWithdraw = exports.getSignedPayloadForWithdraw = function getSignedPayloadForWithdraw(amount, treasuryUtxo) {
  if (amount <= 0n) {
    throw new Error("Withdraw amount must be positive");
  }

  // Reuse existing nonce builder
  var nonce = buildNonceFromUtxo(treasuryUtxo.input());
  var action = {
    Withdraw: {
      withdraw_amount: amount
    }
  };
  var signedPayload = {
    action: action,
    nonce: nonce
  };
  return Data.serialize(_index.V0_3Types.SignedPayload_ProtocolRedeemer, signedPayload).toCbor().toString();
};

/**
 * Build the SignedPayload_ProtocolRedeemer for a deposit operation.
 * Uses the treasury UTxO as the nonce source.
 *
 * @param amount - The amount of reserve tokens to deposit
 * @param treasuryUtxo - The treasury UTxO (consumed in tx, used as nonce)
 * @returns SignedPayload_ProtocolRedeemer CBOR hex string
 */
var getSignedPayloadForDeposit = exports.getSignedPayloadForDeposit = function getSignedPayloadForDeposit(amount, treasuryUtxo) {
  if (amount <= 0n) {
    throw new Error("Deposit amount must be positive");
  }
  var nonce = buildNonceFromUtxo(treasuryUtxo.input());
  var action = {
    Deposit: {
      deposit_amount: amount
    }
  };
  var signedPayload = {
    action: action,
    nonce: nonce
  };
  return Data.serialize(_index.V0_3Types.SignedPayload_ProtocolRedeemer, signedPayload).toCbor().toString();
};

// ─────────────────────────────────────────────────────────────────────────────
// Address Conversion Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert a Cardano address to a Destination type for order transactions.
 * Extracts payment and stake credentials from the address.
 *
 * @param address - The Cardano address to convert
 * @param datum - Optional datum for the destination (defaults to "NoDatum")
 * @returns A Destination object suitable for order transactions
 */
function addressToDestination(address) {
  var datum = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "NoDatum";
  var props = address.getProps();
  var paymentPart = props.paymentPart;
  if (!paymentPart) {
    throw new Error("Address must have a payment part");
  }
  var paymentCredential = paymentPart.type === _sdk.Core.CredentialType.KeyHash ? {
    VerificationKey: [paymentPart.hash]
  } : {
    Script: [paymentPart.hash]
  };
  var stakeCredential = undefined;
  if (props.delegationPart) {
    var stakeCred = props.delegationPart.type === _sdk.Core.CredentialType.KeyHash ? {
      VerificationKey: [props.delegationPart.hash]
    } : {
      Script: [props.delegationPart.hash]
    };
    stakeCredential = {
      Inline: [stakeCred]
    };
  }
  return {
    address: {
      payment_credential: paymentCredential,
      stake_credential: stakeCredential
    },
    datum: datum
  };
}

/**
 * Convert a Destination-like value into a Cardano address.
 * Supports enterprise and base addresses. Pointer credentials are ignored.
 */
function destinationToAddress(network, destination) {
  var paymentCred = destination.address.payment_credential;
  var stakingCred = destination.address.stake_credential;
  var paymentCredCore;
  var stakingCredCore;
  if (stakingCred && _typeof(stakingCred) === "object" && "Inline" in stakingCred) {
    var inlineCredential = stakingCred.Inline[0];
    if ("VerificationKey" in inlineCredential) {
      stakingCredCore = _sdk.Core.Credential.fromCore({
        type: _sdk.Core.CredentialType.KeyHash,
        hash: inlineCredential.VerificationKey[0]
      });
    } else if ("Script" in inlineCredential) {
      stakingCredCore = _sdk.Core.Credential.fromCore({
        type: _sdk.Core.CredentialType.ScriptHash,
        hash: inlineCredential.Script[0]
      });
    }
  }
  if ("VerificationKey" in paymentCred) {
    paymentCredCore = _sdk.Core.Credential.fromCore({
      type: _sdk.Core.CredentialType.KeyHash,
      hash: paymentCred.VerificationKey[0]
    });
  } else {
    paymentCredCore = _sdk.Core.Credential.fromCore({
      type: _sdk.Core.CredentialType.ScriptHash,
      hash: paymentCred.Script[0]
    });
  }
  return (0, _core.addressFromCredentials)(network, paymentCredCore, stakingCredCore);
}

/**
 * Add an output for a Destination, including script-payment addresses and
 * any datum metadata attached to the destination.
 *
 * Attaches the datum directly to a fresh TransactionOutput rather than
 * routing through Core.TransactionOutput.fromCore, because generated
 * TPlutusData values from @blaze-cardano/data are already Blaze
 * PlutusData instances and PlutusData.fromCore does not know how to
 * decode them (throws NotImplementedError).
 */
function addDestinationOutput(tx, network, destination, value) {
  var output = new _sdk.Core.TransactionOutput(destinationToAddress(network, destination), value);
  var datum = destination.datum;
  if (datum !== "NoDatum") {
    if ("DatumHash" in datum) {
      output.setDatum(_sdk.Core.Datum.newDataHash(datum.DatumHash[0]));
    } else {
      output.setDatum(_sdk.Core.Datum.newInlineData(datum.InlineDatum[0]));
    }
  }
  tx.addOutput(output);
}

// ─────────────────────────────────────────────────────────────────────────────
// Cross-Version Cancel Helpers
// ─────────────────────────────────────────────────────────────────────────────

var NORMALIZED_PROTOCOL_VERSION_MAP = {
  v0: "V0",
  v0_1: "V0_1",
  v0_2: "V0_2",
  v0_3: "V0_3",
  v0_4: "V0_4",
  v1_0: "V1_0",
  v1_0_rc1: "V1_0_Rc1",
  v1_1_rc1: "V1_1_Rc1"
};

/**
 * Normalize externally-sourced protocol/order version strings into the SDK's
 * canonical `TProtocolVersion` values.
 */
var normalizeProtocolVersion = exports.normalizeProtocolVersion = function normalizeProtocolVersion(version) {
  if (!version) {
    return undefined;
  }
  return NORMALIZED_PROTOCOL_VERSION_MAP[version.trim().toLowerCase()];
};

/**
 * Alias for frontend order-version sources (GraphQL/backend strings).
 */
var normalizeOrderVersion = exports.normalizeOrderVersion = normalizeProtocolVersion;

/**
 * Extract the inline datum from a UTxO.
 */
var getInlineDatumFromUtxo = exports.getInlineDatumFromUtxo = function getInlineDatumFromUtxo(utxo) {
  var _utxo$output$datum;
  var label = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "Order UTXO";
  var datum = (_utxo$output$datum = utxo.output().datum()) === null || _utxo$output$datum === void 0 ? void 0 : _utxo$output$datum.asInlineData();
  if (!datum) {
    throw new Error("".concat(label, " has no inline datum"));
  }
  return datum;
};

/**
 * Extract the payment script hash from an order UTxO's output address.
 */
var getScriptHashFromOrderUtxo = exports.getScriptHashFromOrderUtxo = function getScriptHashFromOrderUtxo(utxo) {
  var paymentPart = utxo.output().address().getProps().paymentPart;
  if (!paymentPart) {
    throw new Error("Order UTXO address has no payment credential");
  }
  if (paymentPart.type !== _sdk.Core.CredentialType.ScriptHash) {
    throw new Error("Order UTXO payment credential is not a script hash");
  }
  return paymentPart.hash;
};

/**
 * Resolve one reference input per unique script hash.
 */
function resolveReferenceInputsByScriptHash(_x21, _x22, _x23, _x24) {
  return _resolveReferenceInputsByScriptHash.apply(this, arguments);
}
/**
 * Resolve the order reference inputs needed to spend a batch of order UTxOs.
 */
function _resolveReferenceInputsByScriptHash() {
  _resolveReferenceInputsByScriptHash = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee0(blaze, scriptHashes, cachedInputs, address) {
    var referenceInputs, _iterator, _step, hash, cachedInput, refInput, _t6, _t7, _t8;
    return _regenerator().w(function (_context0) {
      while (1) switch (_context0.p = _context0.n) {
        case 0:
          referenceInputs = new Map();
          _iterator = _createForOfIteratorHelper(new Set(scriptHashes));
          _context0.p = 1;
          _iterator.s();
        case 2:
          if ((_step = _iterator.n()).done) {
            _context0.n = 10;
            break;
          }
          hash = _step.value;
          cachedInput = cachedInputs instanceof Map ? cachedInputs.get(hash) : cachedInputs === null || cachedInputs === void 0 ? void 0 : cachedInputs[hash];
          if (!cachedInput) {
            _context0.n = 3;
            break;
          }
          referenceInputs.set(hash, cachedInput);
          return _context0.a(3, 9);
        case 3:
          _t7 = address;
          if (!_t7) {
            _context0.n = 5;
            break;
          }
          _context0.n = 4;
          return resolveScriptRefAtAddress(blaze, hash, address);
        case 4:
          _t7 = _context0.v;
        case 5:
          _t6 = _t7;
          if (_t6) {
            _context0.n = 7;
            break;
          }
          _context0.n = 6;
          return blaze.provider.resolveScriptRef(hash);
        case 6:
          _t6 = _context0.v;
        case 7:
          refInput = _t6;
          if (refInput) {
            _context0.n = 8;
            break;
          }
          throw new Error("Missing order reference script input for hash ".concat(hash, ". Make sure the order script is deployed."));
        case 8:
          referenceInputs.set(hash, refInput);
        case 9:
          _context0.n = 2;
          break;
        case 10:
          _context0.n = 12;
          break;
        case 11:
          _context0.p = 11;
          _t8 = _context0.v;
          _iterator.e(_t8);
        case 12:
          _context0.p = 12;
          _iterator.f();
          return _context0.f(12);
        case 13:
          return _context0.a(2, referenceInputs);
      }
    }, _callee0, null, [[1, 11, 12, 13]]);
  }));
  return _resolveReferenceInputsByScriptHash.apply(this, arguments);
}
function resolveOrderReferenceInputs(_x25, _x26, _x27, _x28) {
  return _resolveOrderReferenceInputs.apply(this, arguments);
}
/**
 * Strict owner-only parser for order datums used by cross-version cancel.
 *
 * All currently-supported order datum variants encode as:
 * Constr(0, [owner, destination, action, data]).
 */
function _resolveOrderReferenceInputs() {
  _resolveOrderReferenceInputs = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee1(blaze, orderUtxos, cachedInputs, address) {
    var scriptHashes, _iterator2, _step2, utxo;
    return _regenerator().w(function (_context1) {
      while (1) switch (_context1.n) {
        case 0:
          scriptHashes = [];
          _iterator2 = _createForOfIteratorHelper(orderUtxos);
          try {
            for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
              utxo = _step2.value;
              scriptHashes.push(getScriptHashFromOrderUtxo(utxo));
            }
          } catch (err) {
            _iterator2.e(err);
          } finally {
            _iterator2.f();
          }
          return _context1.a(2, resolveReferenceInputsByScriptHash(blaze, scriptHashes, cachedInputs, address));
      }
    }, _callee1);
  }));
  return _resolveOrderReferenceInputs.apply(this, arguments);
}
var parseOrderOwnerGenericFromDatum = exports.parseOrderOwnerGenericFromDatum = function parseOrderOwnerGenericFromDatum(datum) {
  var constr = datum.asConstrPlutusData();
  if (!constr) {
    throw new Error("Order datum is not a constructor PlutusData");
  }
  if (constr.getAlternative() !== 0n) {
    throw new Error("Order datum has unexpected constructor index ".concat(constr.getAlternative().toString(), " (expected 0)"));
  }
  var fields = constr.getData();
  if (fields.getLength() < 4) {
    throw new Error("Order datum has ".concat(fields.getLength().toString(), " fields (expected at least 4)"));
  }
  return (0, _data.parse)(_index.V0_3Types.MultisigScript, fields.get(0));
};

/**
 * Strict owner-only parser for cancel flows.
 */
var parseOrderOwnerGeneric = exports.parseOrderOwnerGeneric = function parseOrderOwnerGeneric(utxo) {
  return parseOrderOwnerGenericFromDatum(getInlineDatumFromUtxo(utxo));
};
//# sourceMappingURL=utils.js.map