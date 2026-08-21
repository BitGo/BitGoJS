// Re-export param types for convenience

// Re-export shared types and utilities
export * from "./shared/index.js";

// Re-export version classes. These are tree-shaken out of consumer bundles
// that never reference them by name, thanks to `"sideEffects": false` in
// package.json. The facade below dispatches via dynamic `import()`, so the
// app's entry chunk only includes the version it actually selects at runtime.
export { RealfiSDKV0 } from "./v0/index.js";
export { RealfiSDKV0_1 } from "./v0_1/index.js";
export { RealfiSDKV0_2 } from "./v0_2/index.js";
export { RealfiSDKV0_3 } from "./v0_3/index.js";
export { RealfiSDKV0_4 } from "./v0_4/index.js";
export { RealfiSDKV1_0 } from "./v1_0/index.js";
export { RealfiSDKV1_0Rc1 } from "./v1_0_rc1/index.js";
export { RealfiSDKV1_1Rc1 } from "./v1_1_rc1/index.js";

/**
 * Union type of all SDK parameter types
 */

/**
 * Union type of all SDK versions
 */

// Function overloads for create. Returns are promises because the
// implementation lazy-loads the per-version module on demand.

async function createRealfiSDK(blaze, params) {
  switch (params.version) {
    case "V0":
      {
        const {
          RealfiSDKV0
        } = await import("./v0/index.js");
        return RealfiSDKV0.create(blaze, params);
      }
    case "V0_1":
      {
        const {
          RealfiSDKV0_1
        } = await import("./v0_1/index.js");
        return RealfiSDKV0_1.create(blaze, params);
      }
    case "V0_2":
      {
        const {
          RealfiSDKV0_2
        } = await import("./v0_2/index.js");
        return RealfiSDKV0_2.create(blaze, params);
      }
    case "V0_3":
      {
        const {
          RealfiSDKV0_3
        } = await import("./v0_3/index.js");
        return RealfiSDKV0_3.create(blaze, params);
      }
    case "V0_4":
      {
        const {
          RealfiSDKV0_4
        } = await import("./v0_4/index.js");
        return RealfiSDKV0_4.create(blaze, params);
      }
    case "V1_0":
      {
        const {
          RealfiSDKV1_0
        } = await import("./v1_0/index.js");
        return RealfiSDKV1_0.create(blaze, params);
      }
    case "V1_0_Rc1":
      {
        const {
          RealfiSDKV1_0Rc1
        } = await import("./v1_0_rc1/index.js");
        return RealfiSDKV1_0Rc1.create(blaze, params);
      }
    case "V1_1_Rc1":
      {
        const {
          RealfiSDKV1_1Rc1
        } = await import("./v1_1_rc1/index.js");
        return RealfiSDKV1_1Rc1.create(blaze, params);
      }
    default:
      throw new Error(`Unknown SDK version: ${params.version}`);
  }
}

/** Call signature for {@link RealfiSDK.detectParams}, kept as an interface so it can carry overloads. */

/**
 * RealfiSDK namespace for creating SDK instances.
 *
 * The SDK is the single entry point for all protocol operations.
 * Each version class (RealfiSDKV0, RealfiSDKV0_1, RealfiSDKV0_2, etc.) provides
 * version-specific functionality with correct types.
 *
 * The facade lazy-loads each version module via dynamic `import()` so consumer
 * bundles only ship the version they actually select at runtime.
 *
 * @example V0 - Simple minting
 * ```typescript
 * const sdk = await RealfiSDK.create(blaze, {
 *   version: "V0",
 *   proxyBootstrap: { txHash, outputIndex },
 *   assetNameHex: "55534472",
 * });
 * const mintTx = await sdk.buildMintTx(AssetAmount.fromValue(1000n, decimals));
 * ```
 *
 * @example V1_0 - Full protocol with DirectMint/DirectBurn
 * ```typescript
 * const sdk = await RealfiSDK.create(blaze, {
 *   version: "V1_0",
 *   proxyBootstrap: { txHash, outputIndex },
 *   treasuryBootstrap: { txHash: treasuryTxHash, outputIndex: treasuryOutputIndex },
 *   stakingVaultBootstrap: { txHash: vaultTxHash, outputIndex: vaultOutputIndex },
 *   assetNameHex: "55534472",
 *   sUSDrAssetNameHex: "7355534472",
 * });
 * const directMintTx = await sdk.buildDirectMintOrderTx({ amount, destination });
 * ```
 */
export const RealfiSDK = {
  /**
   * Create a new RealfiSDK instance.
   *
   * Returns the appropriate version-specific SDK based on the params.
   * The returned SDK has full type information for that version.
   */
  create: createRealfiSDK,
  /**
   * Detect the active protocol version from the on-chain proxy datum.
   *
   * Reads the proxy UTxO, extracts the `logic` script hash, and compares it
   * against expected hashes for each known SDK version. Returns fully-typed
   * SDK params (including V1_0 backward-compatibility flags) that can be
   * passed directly to `RealfiSDK.create`.
   *
   * `config` also accepts a network preset name (`"mainnet"`, `"preprod"`,
   * `"preview"`) in place of an explicit config, resolved via the built-in
   * network registry. Custom deployments still pass an explicit config.
   *
   * @throws {UnknownProtocolVersionError} if the on-chain hash matches no known version.
   */
  detectParams: async (provider, config) => {
    const {
      detectSDKParams
    } = await import("./shared/detect-params.js");
    // Both arms call the same function; the ternary narrows the string|object union so it matches an overload — required to satisfy TS2769, not a no-op.
    return typeof config === "string" ? detectSDKParams(provider, config) : detectSDKParams(provider, config);
  }
};
//# sourceMappingURL=index.js.map