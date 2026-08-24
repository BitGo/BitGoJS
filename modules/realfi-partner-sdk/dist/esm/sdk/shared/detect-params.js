import { toHex } from "@blaze-cardano/core";
import { parse } from "@blaze-cardano/data";
import { Core } from "@blaze-cardano/sdk";
import { BaseTypes } from "../../generated-types/index.js";
import { readSingletonDatum } from "./utils.js";
import { NETWORK_REGISTRY } from "./network-registry.js";
export { NETWORK_REGISTRY } from "./network-registry.js";
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
export const YIELD_ORACLE_BOOTSTRAP_PLACEHOLDER = Object.freeze({
  txHash: Core.TransactionId("0".repeat(64)),
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
export function selectBlueprintGeneration(logicHash, validators) {
  if (!validators) return undefined;
  const generations = Array.isArray(validators) ? validators : [validators];
  return generations.find(generation => resolveBlueprintVersion(logicHash, generation) !== undefined);
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
const BLUEPRINT_ORCHESTRATOR_VERSIONS = [["v1_1_rc1/", "V1_1_Rc1"], ["v1_0_rc1/", "V1_0_Rc1"], ["v1_0/", "V1_0"]];

/**
 * Which version a deployed `logic` hash belongs to according to the blueprint,
 * or undefined when no blueprint was supplied or none of its orchestrators
 * matches.
 *
 * Only orchestrator entries are consulted: the proxy datum's first field is the
 * protocol orchestrator hash, so any other validator matching would mean the
 * blueprint disagrees with the chain about what a proxy points at.
 */
export function resolveBlueprintVersion(logicHash, validators) {
  if (!validators) return undefined;
  for (const [key, hash] of Object.entries(validators)) {
    if (hash !== logicHash) continue;
    if (!key.includes("protocol_orchestrator")) continue;
    const match = BLUEPRINT_ORCHESTRATOR_VERSIONS.find(([prefix]) => key.startsWith(prefix));
    if (match) return match[1];
  }
  return undefined;
}

/**
 * Compute the one-shot policy id from the proxy bootstrap reference.
 * Deterministic and local — no provider access.
 */
export function computeOneShotPolicyId(proxyBootstrap, enableTrace) {
  return new BaseTypes.BaseOneshotOneshotMint({
    transaction_id: proxyBootstrap.txHash,
    output_index: proxyBootstrap.outputIndex
  }, enableTrace).Script.hash();
}

/**
 * Fetch the live proxy datum and extract the `logic` script hash.
 * Costs exactly one provider lookup.
 */
export async function fetchProxyLogicSnapshot(provider, oneShotPolicyId) {
  const {
    datum: rawDatum
  } = await readSingletonDatum(provider, Core.AssetId(oneShotPolicyId));

  // All ProxyDatum variants encode as Constr(0, [ByteArray(28 bytes), <opaque Data>]).
  // The first field is always the `logic` ScriptHash, regardless of version.
  const constr = rawDatum.asConstrPlutusData();
  if (!constr) {
    throw new Error("Proxy datum is not a constructor PlutusData");
  }
  const fields = constr.getData();
  const logicBytes = fields.get(0).asBoundedBytes();
  if (!logicBytes) {
    throw new Error("First constructor field is not bytes (expected ScriptHash)");
  }
  return {
    logicHash: toHex(logicBytes),
    datumFields: fields
  };
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

export async function detectSDKParams(provider, config) {
  if (typeof config === "string" && !Object.hasOwn(NETWORK_REGISTRY, config)) {
    throw new Error(`Unknown network preset "${config}" — expected one of: ${Object.keys(NETWORK_REGISTRY).join(", ")}`);
  }
  const resolved = typeof config === "string" ? NETWORK_REGISTRY[config] : config;
  const enableTrace = resolved.enableTrace ?? false;

  // ── Phase 1: Compute oneshot policy and fetch proxy datum ─────────────────

  const oneShotPolicyId = computeOneShotPolicyId(resolved.proxyBootstrap, enableTrace);
  const snapshot = await fetchProxyLogicSnapshot(provider, oneShotPolicyId);
  return matchProtocolVersion(snapshot, oneShotPolicyId, resolved);
}

/**
 * Phase 2 of detection: match an already-fetched `logic` hash against each
 * known version's expected hash. Local-only — dynamic imports and hash
 * computation, no provider access — so a caller holding a fresh
 * `IProxyLogicSnapshot` can re-resolve the version without another lookup.
 */
export async function matchProtocolVersion(snapshot, oneShotPolicyId, config) {
  const enableTrace = config.enableTrace ?? false;
  const {
    logicHash,
    datumFields: fields
  } = snapshot;

  // Which version the supplied blueprint says this `logic` hash belongs to, if
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
  const deployedGeneration = selectBlueprintGeneration(logicHash, config.protocolValidators);
  const blueprintVersion = resolveBlueprintVersion(logicHash, deployedGeneration);
  // A non-empty supplied generation makes the blueprint authoritative. A miss
  // does not consult derivation: blueprintVersion stays undefined, every
  // matchesV1Version check fails, and detection throws
  // UnknownProtocolVersionError.
  const suppliedGenerations = Array.isArray(config.protocolValidators) ? config.protocolValidators : config.protocolValidators ? [config.protocolValidators] : [];
  const hasAuthoritativeBlueprint = suppliedGenerations.some(generation => Object.keys(generation).length > 0);
  const matchesV1Version = (derivedHash, version) => hasAuthoritativeBlueprint ? blueprintVersion === version : logicHash === derivedHash;

  // ── Try each version's hash candidate ─────────────────────────────────────
  //
  // Each version dynamic-imports its types from its own subpath module, and
  // **destructures named exports at the await site** so Vite can statically
  // see which specific classes are used and tree-shake the rest of the
  // generated-types module (each version's index.ts has ~70 top-level
  // exports; each branch needs only 1-5).

  // V1_1_Rc1 — orchestrator hash + backward-compat flag detection.
  // Checked first: latest-deployed-version-first, so environments on
  // V1_1_Rc1 match on the first attempt with no failed-mismatch chunk fetches.
  {
    const {
      V1_1Rc1ProtocolMintProtocolMintWithdraw,
      V1_1Rc1ProtocolStakeProtocolStakeWithdraw,
      V1_1Rc1ProtocolManagementProtocolManagementWithdraw,
      V1_1Rc1ProtocolOrchestratorProtocolOrchestratorWithdraw,
      V1_1Rc1YieldOracleYieldOracleMint,
      SettingsV1: SettingsV1_1Rc1Schema
    } = await import("../../generated-types/v1_1_rc1/index.js");
    // eslint-disable-next-line @typescript-eslint/naming-convention

    const protocolMintHashV1_1Rc1 = new V1_1Rc1ProtocolMintProtocolMintWithdraw(oneShotPolicyId, enableTrace).Script.hash();
    const protocolStakeHashV1_1Rc1 = new V1_1Rc1ProtocolStakeProtocolStakeWithdraw(oneShotPolicyId, enableTrace).Script.hash();
    const protocolManagementHashV1_1Rc1 = new V1_1Rc1ProtocolManagementProtocolManagementWithdraw(oneShotPolicyId, enableTrace).Script.hash();
    // A deferred oracle omits the seed; default to the placeholder so a
    // V1_1_Rc1 deployment is still recognized without any seed config. A real
    // seed (for a deployment that runs the oracle) overrides it. Either way the
    // block below always runs — the exact hash comparison alone decides whether
    // this is actually a V1_1_Rc1 proxy, so a V1_0/older proxy simply won't
    // match and falls through.
    const yieldOracleBootstrap = config.yieldOracleBootstrap ?? YIELD_ORACLE_BOOTSTRAP_PLACEHOLDER;
    {
      // The orchestrator's 5th param is the `yield_oracle` *validator* hash — the
      // mint+spend validator that holds the oracle UTxO (guarded by ExecuteOrders'
      // `no_script_input`), NOT the distribution_oracle logic validator. Because
      // yield_oracle is a mint+spend validator, that hash equals the oracle-NFT
      // policy id. Derive it the same way RealfiSDKV1_1Rc1.create does so the
      // recomputed orchestrator hash matches the deployed logic hash.
      const oracleNftPolicyIdV1_1Rc1 = new V1_1Rc1YieldOracleYieldOracleMint({
        transaction_id: yieldOracleBootstrap.txHash,
        output_index: yieldOracleBootstrap.outputIndex
      }, oneShotPolicyId, enableTrace).Script.hash();
      const orchestratorHashV1_1Rc1 = new V1_1Rc1ProtocolOrchestratorProtocolOrchestratorWithdraw(oneShotPolicyId, protocolMintHashV1_1Rc1, protocolStakeHashV1_1Rc1, protocolManagementHashV1_1Rc1, oracleNftPolicyIdV1_1Rc1, enableTrace).Script.hash();
      if (matchesV1Version(orchestratorHashV1_1Rc1, "V1_1_Rc1")) {
        const settingsData = fields.get(1);
        const settings = parse(SettingsV1_1Rc1Schema, settingsData);
        const registry = settings.registry;
        const {
          V0_1TreasuryTreasurySpend
        } = await import("../../generated-types/v0_1/index.js");
        const {
          V0_4StakingVaultStakingVaultSpend
        } = await import("../../generated-types/v0_4/index.js");
        const v01TreasuryHash = new V0_1TreasuryTreasurySpend({
          transaction_id: config.treasuryBootstrap.txHash,
          output_index: config.treasuryBootstrap.outputIndex
        }, oneShotPolicyId, enableTrace).Script.hash();
        const useV0_1Treasury = registry.treasury === v01TreasuryHash;
        const v04StakingVaultHash = new V0_4StakingVaultStakingVaultSpend({
          transaction_id: config.stakingVaultBootstrap.txHash,
          output_index: config.stakingVaultBootstrap.outputIndex
        }, oneShotPolicyId, enableTrace).Script.hash();
        const useV0_4StakingVault = registry.staking_vault === v04StakingVaultHash;
        return {
          version: "V1_1_Rc1",
          proxyBootstrap: config.proxyBootstrap,
          treasuryBootstrap: config.treasuryBootstrap,
          stakingVaultBootstrap: config.stakingVaultBootstrap,
          yieldOracleBootstrap,
          assetNameHex: config.assetNameHex,
          sUSDrAssetNameHex: config.sUSDrAssetNameHex,
          enableTrace: config.enableTrace,
          useV0_1Treasury: useV0_1Treasury || undefined,
          useV0_4StakingVault: useV0_4StakingVault || undefined,
          // Identity, not just version: script hashes and the order address are
          // otherwise derived from this package's artifacts, which is wrong for a
          // chain running different bytes.
          deployedValidators: deployedGeneration
        };
      }
    }
  }

  // V1_0_Rc1 — orchestrator hash + backward-compat flag detection.
  // Checked before V1_0 because it's the current production deployment;
  // matching early avoids failed-mismatch chunk fetches.
  {
    const {
      V1_0Rc1ProtocolMintProtocolMintWithdraw,
      V1_0Rc1ProtocolStakeProtocolStakeWithdraw,
      V1_0Rc1ProtocolManagementProtocolManagementWithdraw,
      V1_0Rc1ProtocolOrchestratorProtocolOrchestratorWithdraw,
      SettingsV1: SettingsV1Rc1Schema
    } = await import("../../generated-types/v1_0_rc1/index.js");
    const protocolMintHashRc1 = new V1_0Rc1ProtocolMintProtocolMintWithdraw(oneShotPolicyId, enableTrace).Script.hash();
    const protocolStakeHashRc1 = new V1_0Rc1ProtocolStakeProtocolStakeWithdraw(oneShotPolicyId, enableTrace).Script.hash();
    const protocolManagementHashRc1 = new V1_0Rc1ProtocolManagementProtocolManagementWithdraw(oneShotPolicyId, enableTrace).Script.hash();
    const orchestratorHashRc1 = new V1_0Rc1ProtocolOrchestratorProtocolOrchestratorWithdraw(oneShotPolicyId, protocolMintHashRc1, protocolStakeHashRc1, protocolManagementHashRc1, enableTrace).Script.hash();
    if (matchesV1Version(orchestratorHashRc1, "V1_0_Rc1")) {
      const settingsData = fields.get(1);
      const settings = parse(SettingsV1Rc1Schema, settingsData);
      const registry = settings.registry;

      // Backward-compat checks: load V0_1 + V0_4 types only after the
      // orchestrator hash matches. Same named-export destructuring pattern.
      const {
        V0_1TreasuryTreasurySpend
      } = await import("../../generated-types/v0_1/index.js");
      const {
        V0_4StakingVaultStakingVaultSpend
      } = await import("../../generated-types/v0_4/index.js");
      const v01TreasuryHash = new V0_1TreasuryTreasurySpend({
        transaction_id: config.treasuryBootstrap.txHash,
        output_index: config.treasuryBootstrap.outputIndex
      }, oneShotPolicyId, enableTrace).Script.hash();
      const useV0_1Treasury = registry.treasury === v01TreasuryHash;
      const v04StakingVaultHash = new V0_4StakingVaultStakingVaultSpend({
        transaction_id: config.stakingVaultBootstrap.txHash,
        output_index: config.stakingVaultBootstrap.outputIndex
      }, oneShotPolicyId, enableTrace).Script.hash();
      const useV0_4StakingVault = registry.staking_vault === v04StakingVaultHash;
      return {
        version: "V1_0_Rc1",
        proxyBootstrap: config.proxyBootstrap,
        treasuryBootstrap: config.treasuryBootstrap,
        stakingVaultBootstrap: config.stakingVaultBootstrap,
        assetNameHex: config.assetNameHex,
        sUSDrAssetNameHex: config.sUSDrAssetNameHex,
        enableTrace: config.enableTrace,
        useV0_1Treasury: useV0_1Treasury || undefined,
        useV0_4StakingVault: useV0_4StakingVault || undefined,
        // Identity, not just version: script hashes and the order address are
        // otherwise derived from this package's artifacts, which is wrong for a
        // chain running different bytes.
        deployedValidators: deployedGeneration
      };
    }
  }

  // V1_0 — orchestrator hash + backward-compat flag detection
  {
    const {
      V1_0ProtocolMintProtocolMintWithdraw,
      V1_0ProtocolStakeProtocolStakeWithdraw,
      V1_0ProtocolManagementProtocolManagementWithdraw,
      V1_0ProtocolOrchestratorProtocolOrchestratorWithdraw,
      SettingsV1: SettingsV1Schema
    } = await import("../../generated-types/v1_0/index.js");
    const protocolMintHash = new V1_0ProtocolMintProtocolMintWithdraw(oneShotPolicyId, enableTrace).Script.hash();
    const protocolStakeHash = new V1_0ProtocolStakeProtocolStakeWithdraw(oneShotPolicyId, enableTrace).Script.hash();
    const protocolManagementHash = new V1_0ProtocolManagementProtocolManagementWithdraw(oneShotPolicyId, enableTrace).Script.hash();
    const orchestratorHash = new V1_0ProtocolOrchestratorProtocolOrchestratorWithdraw(oneShotPolicyId, protocolMintHash, protocolStakeHash, protocolManagementHash, enableTrace).Script.hash();
    if (matchesV1Version(orchestratorHash, "V1_0")) {
      const settingsData = fields.get(1);
      const settings = parse(SettingsV1Schema, settingsData);
      const registry = settings.registry;
      const {
        V0_1TreasuryTreasurySpend
      } = await import("../../generated-types/v0_1/index.js");
      const {
        V0_4StakingVaultStakingVaultSpend
      } = await import("../../generated-types/v0_4/index.js");
      const v01TreasuryHash = new V0_1TreasuryTreasurySpend({
        transaction_id: config.treasuryBootstrap.txHash,
        output_index: config.treasuryBootstrap.outputIndex
      }, oneShotPolicyId, enableTrace).Script.hash();
      const useV0_1Treasury = registry.treasury === v01TreasuryHash;
      const v04StakingVaultHash = new V0_4StakingVaultStakingVaultSpend({
        transaction_id: config.stakingVaultBootstrap.txHash,
        output_index: config.stakingVaultBootstrap.outputIndex
      }, oneShotPolicyId, enableTrace).Script.hash();
      const useV0_4StakingVault = registry.staking_vault === v04StakingVaultHash;
      return {
        version: "V1_0",
        proxyBootstrap: config.proxyBootstrap,
        treasuryBootstrap: config.treasuryBootstrap,
        stakingVaultBootstrap: config.stakingVaultBootstrap,
        assetNameHex: config.assetNameHex,
        sUSDrAssetNameHex: config.sUSDrAssetNameHex,
        enableTrace: config.enableTrace,
        useV0_1Treasury: useV0_1Treasury || undefined,
        useV0_4StakingVault: useV0_4StakingVault || undefined,
        // Identity, not just version: script hashes and the order address are
        // otherwise derived from this package's artifacts, which is wrong for a
        // chain running different bytes.
        deployedValidators: deployedGeneration
      };
    }
  }

  // V0_4 — protocol withdraw hash only. Legacy fallback; checked last so
  // that current-generation deployments don't pay a failed-hash-check load
  // of V0_4 types every session.
  {
    const {
      V0_4ProtocolProtocolWithdraw
    } = await import("../../generated-types/v0_4/index.js");
    const v04ProtocolHash = new V0_4ProtocolProtocolWithdraw(oneShotPolicyId, enableTrace).Script.hash();
    if (logicHash === v04ProtocolHash) {
      return {
        version: "V0_4",
        proxyBootstrap: config.proxyBootstrap,
        treasuryBootstrap: config.treasuryBootstrap,
        stakingVaultBootstrap: config.stakingVaultBootstrap,
        assetNameHex: config.assetNameHex,
        sUSDrAssetNameHex: config.sUSDrAssetNameHex,
        enableTrace: config.enableTrace
      };
    }
  }
  throw new UnknownProtocolVersionError(logicHash);
}
export class UnknownProtocolVersionError extends Error {
  constructor(logicHash) {
    super(`Unrecognized protocol logic hash "${logicHash}". ` + `The on-chain proxy datum references a script that does not match any known SDK version. ` + `Update the SDK or check that you are connected to the correct network.`);
    this.logicHash = logicHash;
    this.name = "UnknownProtocolVersionError";
  }
}
//# sourceMappingURL=detect-params.js.map