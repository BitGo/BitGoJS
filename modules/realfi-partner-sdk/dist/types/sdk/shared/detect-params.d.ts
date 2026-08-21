import type { Provider } from "@blaze-cardano/query";
import { Core } from "@blaze-cardano/sdk";
import { type TNetworkPreset } from "./network-registry.js";
import type { IRealfiSDKParamsV0_4 } from "../v0_4/index.js";
import type { IRealfiSDKParamsV1_0 } from "../v1_0/index.js";
import type { IRealfiSDKParamsV1_0Rc1 } from "../v1_0_rc1/index.js";
import type { IRealfiSDKParamsV1_1Rc1 } from "../v1_1_rc1/index.js";
export type { TNetworkPreset } from "./network-registry.js";
export { NETWORK_REGISTRY } from "./network-registry.js";
export type TDetectedSDKParams = IRealfiSDKParamsV0_4 | IRealfiSDKParamsV1_0 | IRealfiSDKParamsV1_0Rc1 | IRealfiSDKParamsV1_1Rc1;
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
export declare const YIELD_ORACLE_BOOTSTRAP_PLACEHOLDER: Readonly<{
    txHash: any;
    outputIndex: 0n;
}>;
export interface IDetectInput {
    proxyBootstrap: {
        txHash: Core.TransactionId;
        outputIndex: bigint;
    };
    treasuryBootstrap: {
        txHash: Core.TransactionId;
        outputIndex: bigint;
    };
    stakingVaultBootstrap: {
        txHash: Core.TransactionId;
        outputIndex: bigint;
    };
    /**
     * Dedicated yield_oracle NFT one-shot seed. Only V1_1_Rc1 deployments use
     * one. When omitted, detection uses the deferred-oracle placeholder; a
     * deployment with a live oracle must supply its real seed.
     */
    yieldOracleBootstrap?: {
        txHash: Core.TransactionId;
        outputIndex: bigint;
    };
    assetNameHex: string;
    sUSDrAssetNameHex: string;
    enableTrace?: boolean;
    /**
     * Deployed validator hashes, keyed exactly as in
     * `backend/config/env/<env>.protocol.yaml` (e.g.
     * `"v1_0/protocol_orchestrator.protocol_orchestrator.withdraw"`).
     *
     * Detection otherwise derives each version's hash from the Plutus artifacts
     * this package bundles, which only identifies a deployment while those
     * artifacts stay byte-identical to the ones actually on chain. Supplying the
     * blueprint identifies the deployment by what it *is* rather than by what
     * this build happens to ship, so regenerating an artifact cannot strand a
     * live deployment.
     *
     * Omitted, derivation is used unchanged.
     */
    protocolValidators?: TBlueprintValidators;
}
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
export type TBlueprintValidators = Readonly<Record<string, string>> | ReadonlyArray<Readonly<Record<string, string>>>;
/**
 * The generation whose protocol orchestrator equals the deployed `logic` hash.
 *
 * A single map is returned when it matches, so existing callers are unchanged.
 * Nothing is returned when no generation matches — detection then fails closed
 * rather than guessing, which is what stops a mismatched build from locking
 * orders at an address nothing watches.
 */
export declare function selectBlueprintGeneration(logicHash: Core.ScriptHash, validators: TBlueprintValidators | undefined): Readonly<Record<string, string>> | undefined;
/**
 * Version-discriminating view of the live proxy datum, resolved via the
 * one-shot NFT (the proxy's stable identity — the UTxO ref changes on every
 * settings update, the NFT does not).
 */
export interface IProxyLogicSnapshot {
    /** The `logic` script hash — first field of every ProxyDatum variant. */
    logicHash: Core.ScriptHash;
    /** All datum constructor fields; index 1 holds the version-specific settings. */
    datumFields: Core.PlutusList;
}
/**
 * Which version a deployed `logic` hash belongs to according to the blueprint,
 * or undefined when no blueprint was supplied or none of its orchestrators
 * matches.
 *
 * Only orchestrator entries are consulted: the proxy datum's first field is the
 * protocol orchestrator hash, so any other validator matching would mean the
 * blueprint disagrees with the chain about what a proxy points at.
 */
export declare function resolveBlueprintVersion(logicHash: Core.ScriptHash, validators: Readonly<Record<string, string>> | undefined): TDetectedSDKParams["version"] | undefined;
/**
 * Compute the one-shot policy id from the proxy bootstrap reference.
 * Deterministic and local — no provider access.
 */
export declare function computeOneShotPolicyId(proxyBootstrap: IDetectInput["proxyBootstrap"], enableTrace: boolean): Core.Hash28ByteBase16;
/**
 * Fetch the live proxy datum and extract the `logic` script hash.
 * Costs exactly one provider lookup.
 */
export declare function fetchProxyLogicSnapshot(provider: Provider, oneShotPolicyId: Core.Hash28ByteBase16): Promise<IProxyLogicSnapshot>;
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
export declare function detectSDKParams(provider: Provider, config: IDetectInput): Promise<TDetectedSDKParams>;
export declare function detectSDKParams(provider: Provider, network: TNetworkPreset): Promise<TDetectedSDKParams>;
/**
 * Phase 2 of detection: match an already-fetched `logic` hash against each
 * known version's expected hash. Local-only — dynamic imports and hash
 * computation, no provider access — so a caller holding a fresh
 * `IProxyLogicSnapshot` can re-resolve the version without another lookup.
 */
export declare function matchProtocolVersion(snapshot: IProxyLogicSnapshot, oneShotPolicyId: Core.Hash28ByteBase16, config: IDetectInput): Promise<TDetectedSDKParams>;
export declare class UnknownProtocolVersionError extends Error {
    readonly logicHash: string;
    constructor(logicHash: string);
}
//# sourceMappingURL=detect-params.d.ts.map