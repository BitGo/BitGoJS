import { Core } from "@blaze-cardano/sdk";
import * as V1_1Rc1Types from "../../generated-types/v1_1_rc1/index.js";
import type { GovernanceConfig, SettingsV1, Tuple_VerificationKey_COSESign1 } from "../../generated-types/v1_1_rc1/index.js";
import type { IParsedProxyDatum } from "./types.js";
export declare const SETTINGS_FROZEN_CONSTR = 1n;
export declare function createSettingsValidatorScript(proxyPolicyId: Core.PolicyId, governanceConfig: GovernanceConfig, enableTrace?: boolean): Core.Script;
export declare function createSettingsValidatorAddress(network: Core.NetworkId, proxyPolicyId: Core.PolicyId, governanceConfig: GovernanceConfig, enableTrace?: boolean): Core.Address;
export declare function parseProxyDatumRaw(datum: Core.PlutusData): IParsedProxyDatum;
export declare function buildRawProxyDatum(logicHash: Core.ScriptHash, settingsData: Core.PlutusData): Core.PlutusData;
export declare function getSettingsAlternative(settingsData: Core.PlutusData): bigint;
export declare function isFrozenSettingsData(settingsData: Core.PlutusData): boolean;
export declare function freezeSettingsData(settingsData: Core.PlutusData): Core.PlutusData;
export declare function unwrapFrozenSettingsData(settingsData: Core.PlutusData): Core.PlutusData;
export declare function parseLiveSettings(settingsData: Core.PlutusData): SettingsV1 | undefined;
export declare function serializeSettings(settings: SettingsV1): Core.PlutusData;
export declare function serializeSettingsRedeemer(redeemer: V1_1Rc1Types.SettingsRedeemer): Core.PlutusData;
/**
 * Serialize the `SettingsAuthPayload` the on-chain validator reconstructs from
 * the proxy in/out and hashes. `datum` is the resulting proxy output datum
 * (`{ logic, settings }`); `nonce` is the proxy input's `OutputReference`.
 *
 * The `SettingsAuthPayload` schema is emitted into the blueprint via the
 * `documentation` validator (see `validators/v1_1_rc1/documentation.ak`), so we
 * serialize against the generated type rather than hand-building PlutusData.
 */
export declare function buildSettingsAuthPayload(change: V1_1Rc1Types.SettingsRedeemer, destinationScriptHash: Core.ScriptHash, nextLogicHash: Core.ScriptHash, nextSettingsData: Core.PlutusData, nonce: Core.TransactionInput): Core.PlutusData;
/**
 * blake2b-256 of the auth payload's CBOR — the 32-byte message each governance
 * signer COSE-signs (CIP-8). Mirrors the on-chain
 * `blake2b_256(cbor.serialise(payload))` and the orchestrator's payload hashing.
 */
export declare function hashSettingsAuthPayload(payload: Core.PlutusData): string;
/**
 * The withdraw-handler redeemer: the change-class selector plus the COSE
 * signatures authorizing it (the payload itself is reconstructed on-chain).
 */
export declare function serializeSettingsSignedRedeemer(change: V1_1Rc1Types.SettingsRedeemer, signatures: Tuple_VerificationKey_COSESign1[]): Core.PlutusData;
//# sourceMappingURL=utils.d.ts.map