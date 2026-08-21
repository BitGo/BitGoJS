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
export class ScriptAlreadyDeployedError extends Error {
  override readonly name = "ScriptAlreadyDeployedError";
  readonly scriptHash: Core.ScriptHash;
  readonly refInput: Core.TransactionUnspentOutput;

  constructor(
    scriptHash: Core.ScriptHash,
    refInput: Core.TransactionUnspentOutput,
  ) {
    super(
      `Script ${scriptHash} is already deployed as a reference script at ` +
        `${refInput.input().transactionId()}#${refInput.input().index()}`,
    );
    this.scriptHash = scriptHash;
    this.refInput = refInput;
  }
}
