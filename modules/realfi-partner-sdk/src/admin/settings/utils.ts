import {
  addressFromValidator,
  blake2b_256,
  HexBlob,
} from "@blaze-cardano/core";
import * as Data from "@blaze-cardano/data";
import { parse } from "@blaze-cardano/data";
import { Core } from "@blaze-cardano/sdk";

import * as V1_1Rc1Types from "../../generated-types/v1_1_rc1/index.js";
import type {
  GovernanceConfig,
  SettingsV1,
  Tuple_VerificationKey_COSESign1,
} from "../../generated-types/v1_1_rc1/index.js";
import type { IParsedProxyDatum } from "./types.js";

export const SETTINGS_FROZEN_CONSTR = 1n;

export function createSettingsValidatorScript(
  proxyPolicyId: Core.PolicyId,
  governanceConfig: GovernanceConfig,
  enableTrace = false,
): Core.Script {
  return new V1_1Rc1Types.SettingsProtocolSettingsProtocolSettingsWithdraw(
    proxyPolicyId,
    governanceConfig,
    enableTrace,
  ).Script;
}

export function createSettingsValidatorAddress(
  network: Core.NetworkId,
  proxyPolicyId: Core.PolicyId,
  governanceConfig: GovernanceConfig,
  enableTrace = false,
): Core.Address {
  const script = createSettingsValidatorScript(
    proxyPolicyId,
    governanceConfig,
    enableTrace,
  );
  return addressFromValidator(network, script);
}

export function parseProxyDatumRaw(datum: Core.PlutusData): IParsedProxyDatum {
  const constr = datum.asConstrPlutusData();
  if (!constr) {
    throw new Error("Proxy datum is not constructor PlutusData");
  }

  const fields = constr.getData();
  const logicBytes = fields.get(0).asBoundedBytes();
  if (!logicBytes) {
    throw new Error("Proxy datum logic field is not bytes");
  }

  return {
    logicHash: Buffer.from(logicBytes).toString("hex") as Core.ScriptHash,
    settingsData: fields.get(1),
  };
}

export function buildRawProxyDatum(
  logicHash: Core.ScriptHash,
  settingsData: Core.PlutusData,
): Core.PlutusData {
  const fields = new Core.PlutusList();
  fields.add(Core.PlutusData.newBytes(Buffer.from(logicHash, "hex")));
  fields.add(settingsData);
  return Core.PlutusData.newConstrPlutusData(
    new Core.ConstrPlutusData(0n, fields),
  );
}

export function getSettingsAlternative(settingsData: Core.PlutusData): bigint {
  const constr = settingsData.asConstrPlutusData();
  if (!constr) {
    throw new Error("Settings data is not constructor PlutusData");
  }
  return constr.getAlternative();
}

export function isFrozenSettingsData(settingsData: Core.PlutusData): boolean {
  return getSettingsAlternative(settingsData) === SETTINGS_FROZEN_CONSTR;
}

export function freezeSettingsData(
  settingsData: Core.PlutusData,
): Core.PlutusData {
  const fields = new Core.PlutusList();
  fields.add(settingsData);
  return Core.PlutusData.newConstrPlutusData(
    new Core.ConstrPlutusData(SETTINGS_FROZEN_CONSTR, fields),
  );
}

export function unwrapFrozenSettingsData(
  settingsData: Core.PlutusData,
): Core.PlutusData {
  const constr = settingsData.asConstrPlutusData();
  if (!constr || constr.getAlternative() !== SETTINGS_FROZEN_CONSTR) {
    throw new Error("Settings data is not frozen");
  }
  return constr.getData().get(0);
}

export function parseLiveSettings(
  settingsData: Core.PlutusData,
): SettingsV1 | undefined {
  if (isFrozenSettingsData(settingsData)) {
    return undefined;
  }
  return parse(V1_1Rc1Types.SettingsV1, settingsData) as SettingsV1;
}

export function serializeSettings(settings: SettingsV1): Core.PlutusData {
  return Data.serialize(V1_1Rc1Types.SettingsV1, settings);
}

export function serializeSettingsRedeemer(
  redeemer: V1_1Rc1Types.SettingsRedeemer,
): Core.PlutusData {
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
export function buildSettingsAuthPayload(
  change: V1_1Rc1Types.SettingsRedeemer,
  destinationScriptHash: Core.ScriptHash,
  nextLogicHash: Core.ScriptHash,
  nextSettingsData: Core.PlutusData,
  nonce: Core.TransactionInput,
): Core.PlutusData {
  const payload: V1_1Rc1Types.SettingsAuthPayload = {
    change,
    destination: destinationScriptHash,
    datum: { logic: nextLogicHash, settings: nextSettingsData },
    nonce: {
      transaction_id: nonce.transactionId().toString(),
      output_index: nonce.index(),
    },
  };
  return Data.serialize(V1_1Rc1Types.SettingsAuthPayload, payload);
}

/**
 * blake2b-256 of the auth payload's CBOR — the 32-byte message each governance
 * signer COSE-signs (CIP-8). Mirrors the on-chain
 * `blake2b_256(cbor.serialise(payload))` and the orchestrator's payload hashing.
 */
export function hashSettingsAuthPayload(payload: Core.PlutusData): string {
  return blake2b_256(HexBlob(payload.toCbor()));
}

/**
 * The withdraw-handler redeemer: the change-class selector plus the COSE
 * signatures authorizing it (the payload itself is reconstructed on-chain).
 */
export function serializeSettingsSignedRedeemer(
  change: V1_1Rc1Types.SettingsRedeemer,
  signatures: Tuple_VerificationKey_COSESign1[],
): Core.PlutusData {
  return Data.serialize(V1_1Rc1Types.SettingsSignedRedeemer, {
    change,
    signatures,
  });
}
