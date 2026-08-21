import type { Core } from "@blaze-cardano/sdk";
/**
 * Thrown by `deployScript` when a reference script with the same hash
 * already exists on-chain. The thrown instance carries the existing
 * reference UTxO so callers that want to reuse the deployment don't
 * need to re-query the provider.
 *
 * Catch this class specifically when a deployment step should be
 * idempotent across reruns (e.g. resuming a partially-failed
 * bootstrap or upgrade flow):
 *
 * ```ts
 * try {
 *   const tx = await sdk.deployProtocol();
 *   // ...submit...
 * } catch (e) {
 *   if (e instanceof ScriptAlreadyDeployedError) {
 *     // Use e.refInput, or just skip this step.
 *     return;
 *   }
 *   throw e;
 * }
 * ```
 */
export declare class ScriptAlreadyDeployedError extends Error {
    readonly name = "ScriptAlreadyDeployedError";
    readonly scriptHash: Core.ScriptHash;
    readonly refInput: Core.TransactionUnspentOutput;
    constructor(scriptHash: Core.ScriptHash, refInput: Core.TransactionUnspentOutput);
}
//# sourceMappingURL=errors.d.ts.map