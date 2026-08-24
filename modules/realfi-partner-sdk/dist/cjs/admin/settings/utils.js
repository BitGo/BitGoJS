"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SETTINGS_FROZEN_CONSTR = void 0;
exports.buildRawProxyDatum = buildRawProxyDatum;
exports.buildSettingsAuthPayload = buildSettingsAuthPayload;
exports.createSettingsValidatorAddress = createSettingsValidatorAddress;
exports.createSettingsValidatorScript = createSettingsValidatorScript;
exports.freezeSettingsData = freezeSettingsData;
exports.getSettingsAlternative = getSettingsAlternative;
exports.hashSettingsAuthPayload = hashSettingsAuthPayload;
exports.isFrozenSettingsData = isFrozenSettingsData;
exports.parseLiveSettings = parseLiveSettings;
exports.parseProxyDatumRaw = parseProxyDatumRaw;
exports.serializeSettings = serializeSettings;
exports.serializeSettingsRedeemer = serializeSettingsRedeemer;
exports.serializeSettingsSignedRedeemer = serializeSettingsSignedRedeemer;
exports.unwrapFrozenSettingsData = unwrapFrozenSettingsData;
var _core = require("@blaze-cardano/core");
var _data = _interopRequireWildcard(require("@blaze-cardano/data"));
var Data = _data;
var _sdk = require("@blaze-cardano/sdk");
var V1_1Rc1Types = _interopRequireWildcard(require("../../generated-types/v1_1_rc1/index.js"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t in e) "default" !== _t && {}.hasOwnProperty.call(e, _t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t)) && (i.get || i.set) ? o(f, _t, i) : f[_t] = e[_t]); return f; })(e, t); }
var SETTINGS_FROZEN_CONSTR = exports.SETTINGS_FROZEN_CONSTR = 1n;
function createSettingsValidatorScript(proxyPolicyId, governanceConfig) {
  var enableTrace = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
  return new V1_1Rc1Types.SettingsProtocolSettingsProtocolSettingsWithdraw(proxyPolicyId, governanceConfig, enableTrace).Script;
}
function createSettingsValidatorAddress(network, proxyPolicyId, governanceConfig) {
  var enableTrace = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
  var script = createSettingsValidatorScript(proxyPolicyId, governanceConfig, enableTrace);
  return (0, _core.addressFromValidator)(network, script);
}
function parseProxyDatumRaw(datum) {
  var constr = datum.asConstrPlutusData();
  if (!constr) {
    throw new Error("Proxy datum is not constructor PlutusData");
  }
  var fields = constr.getData();
  var logicBytes = fields.get(0).asBoundedBytes();
  if (!logicBytes) {
    throw new Error("Proxy datum logic field is not bytes");
  }
  return {
    logicHash: Buffer.from(logicBytes).toString("hex"),
    settingsData: fields.get(1)
  };
}
function buildRawProxyDatum(logicHash, settingsData) {
  var fields = new _sdk.Core.PlutusList();
  fields.add(_sdk.Core.PlutusData.newBytes(Buffer.from(logicHash, "hex")));
  fields.add(settingsData);
  return _sdk.Core.PlutusData.newConstrPlutusData(new _sdk.Core.ConstrPlutusData(0n, fields));
}
function getSettingsAlternative(settingsData) {
  var constr = settingsData.asConstrPlutusData();
  if (!constr) {
    throw new Error("Settings data is not constructor PlutusData");
  }
  return constr.getAlternative();
}
function isFrozenSettingsData(settingsData) {
  return getSettingsAlternative(settingsData) === SETTINGS_FROZEN_CONSTR;
}
function freezeSettingsData(settingsData) {
  var fields = new _sdk.Core.PlutusList();
  fields.add(settingsData);
  return _sdk.Core.PlutusData.newConstrPlutusData(new _sdk.Core.ConstrPlutusData(SETTINGS_FROZEN_CONSTR, fields));
}
function unwrapFrozenSettingsData(settingsData) {
  var constr = settingsData.asConstrPlutusData();
  if (!constr || constr.getAlternative() !== SETTINGS_FROZEN_CONSTR) {
    throw new Error("Settings data is not frozen");
  }
  return constr.getData().get(0);
}
function parseLiveSettings(settingsData) {
  if (isFrozenSettingsData(settingsData)) {
    return undefined;
  }
  return (0, _data.parse)(V1_1Rc1Types.SettingsV1, settingsData);
}
function serializeSettings(settings) {
  return Data.serialize(V1_1Rc1Types.SettingsV1, settings);
}
function serializeSettingsRedeemer(redeemer) {
  return Data.serialize(V1_1Rc1Types.SettingsRedeemer, redeemer);
}

/**
 * Serialize the `SettingsAuthPayload` the on-chain validator reconstructs from
 * the proxy in/out and hashes. `datum` is the resulting proxy output datum
 * (`{ logic, settings }`); `nonce` is the proxy input's `OutputReference`.
 *
 * The `SettingsAuthPayload` schema is emitted into the blueprint via the
 * `documentation` validator (see `validators/v1_1_rc1/documentation.ak`), so we
 * serialize against the generated type rather than hand-building PlutusData.
 */
function buildSettingsAuthPayload(change, destinationScriptHash, nextLogicHash, nextSettingsData, nonce) {
  var payload = {
    change: change,
    destination: destinationScriptHash,
    datum: {
      logic: nextLogicHash,
      settings: nextSettingsData
    },
    nonce: {
      transaction_id: nonce.transactionId().toString(),
      output_index: nonce.index()
    }
  };
  return Data.serialize(V1_1Rc1Types.SettingsAuthPayload, payload);
}

/**
 * blake2b-256 of the auth payload's CBOR — the 32-byte message each governance
 * signer COSE-signs (CIP-8). Mirrors the on-chain
 * `blake2b_256(cbor.serialise(payload))` and the orchestrator's payload hashing.
 */
function hashSettingsAuthPayload(payload) {
  return (0, _core.blake2b_256)((0, _core.HexBlob)(payload.toCbor()));
}

/**
 * The withdraw-handler redeemer: the change-class selector plus the COSE
 * signatures authorizing it (the payload itself is reconstructed on-chain).
 */
function serializeSettingsSignedRedeemer(change, signatures) {
  return Data.serialize(V1_1Rc1Types.SettingsSignedRedeemer, {
    change: change,
    signatures: signatures
  });
}
//# sourceMappingURL=utils.js.map