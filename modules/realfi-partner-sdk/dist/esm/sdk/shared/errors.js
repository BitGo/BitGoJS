function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
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
  constructor(scriptHash, refInput) {
    super(`Script ${scriptHash} is already deployed as a reference script at ` + `${refInput.input().transactionId()}#${refInput.input().index()}`);
    _defineProperty(this, "name", "ScriptAlreadyDeployedError");
    _defineProperty(this, "scriptHash", void 0);
    _defineProperty(this, "refInput", void 0);
    this.scriptHash = scriptHash;
    this.refInput = refInput;
  }
}
//# sourceMappingURL=errors.js.map