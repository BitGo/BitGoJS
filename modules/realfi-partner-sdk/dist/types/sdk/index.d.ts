import type { Provider } from "@blaze-cardano/query";
import { type Blaze, type Wallet } from "@blaze-cardano/sdk";
import type { IDetectInput, TDetectedSDKParams, TNetworkPreset } from "./shared/detect-params.js";
export type { TDetectedSDKParams } from "./shared/detect-params.js";
export type { TNetworkPreset } from "./shared/detect-params.js";
import type { IRealfiSDKParamsV0, RealfiSDKV0 } from "./v0/index.js";
import type { IRealfiSDKParamsV0_1, RealfiSDKV0_1 } from "./v0_1/index.js";
import type { IRealfiSDKParamsV0_2, RealfiSDKV0_2 } from "./v0_2/index.js";
import type { IRealfiSDKParamsV0_3, RealfiSDKV0_3 } from "./v0_3/index.js";
import type { IRealfiSDKParamsV0_4, RealfiSDKV0_4 } from "./v0_4/index.js";
import type { IRealfiSDKParamsV1_0, RealfiSDKV1_0 } from "./v1_0/index.js";
import type { IRealfiSDKParamsV1_0Rc1, RealfiSDKV1_0Rc1 } from "./v1_0_rc1/index.js";
import type { IRealfiSDKParamsV1_1Rc1, RealfiSDKV1_1Rc1 } from "./v1_1_rc1/index.js";
export type { IRealfiSDKParamsV0 } from "./v0/index.js";
export type { IRealfiSDKParamsV0_1 } from "./v0_1/index.js";
export type { IRealfiSDKParamsV0_2 } from "./v0_2/index.js";
export type { IRealfiSDKParamsV0_3 } from "./v0_3/index.js";
export type { IRealfiSDKParamsV0_4 } from "./v0_4/index.js";
export type { IRealfiSDKParamsV1_0 } from "./v1_0/index.js";
export type { IRealfiSDKParamsV1_0Rc1 } from "./v1_0_rc1/index.js";
export type { IRealfiSDKParamsV1_1Rc1 } from "./v1_1_rc1/index.js";
export * from "./shared/index.js";
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
export type TRealfiSDKParams = IRealfiSDKParamsV0 | IRealfiSDKParamsV0_1 | IRealfiSDKParamsV0_2 | IRealfiSDKParamsV0_3 | IRealfiSDKParamsV0_4 | IRealfiSDKParamsV1_0 | IRealfiSDKParamsV1_0Rc1 | IRealfiSDKParamsV1_1Rc1;
/**
 * Union type of all SDK versions
 */
export type TRealfiSDK<P extends Provider, W extends Wallet> = RealfiSDKV0<P, W> | RealfiSDKV0_1<P, W> | RealfiSDKV0_2<P, W> | RealfiSDKV0_3<P, W> | RealfiSDKV0_4<P, W> | RealfiSDKV1_0<P, W> | RealfiSDKV1_0Rc1<P, W> | RealfiSDKV1_1Rc1<P, W>;
declare function createRealfiSDK<P extends Provider, W extends Wallet>(blaze: Blaze<P, W>, params: IRealfiSDKParamsV0): Promise<RealfiSDKV0<P, W>>;
declare function createRealfiSDK<P extends Provider, W extends Wallet>(blaze: Blaze<P, W>, params: IRealfiSDKParamsV0_1): Promise<RealfiSDKV0_1<P, W>>;
declare function createRealfiSDK<P extends Provider, W extends Wallet>(blaze: Blaze<P, W>, params: IRealfiSDKParamsV0_2): Promise<RealfiSDKV0_2<P, W>>;
declare function createRealfiSDK<P extends Provider, W extends Wallet>(blaze: Blaze<P, W>, params: IRealfiSDKParamsV0_3): Promise<RealfiSDKV0_3<P, W>>;
declare function createRealfiSDK<P extends Provider, W extends Wallet>(blaze: Blaze<P, W>, params: IRealfiSDKParamsV0_4): Promise<RealfiSDKV0_4<P, W>>;
declare function createRealfiSDK<P extends Provider, W extends Wallet>(blaze: Blaze<P, W>, params: IRealfiSDKParamsV1_0): Promise<RealfiSDKV1_0<P, W>>;
declare function createRealfiSDK<P extends Provider, W extends Wallet>(blaze: Blaze<P, W>, params: IRealfiSDKParamsV1_0Rc1): Promise<RealfiSDKV1_0Rc1<P, W>>;
declare function createRealfiSDK<P extends Provider, W extends Wallet>(blaze: Blaze<P, W>, params: IRealfiSDKParamsV1_1Rc1): Promise<RealfiSDKV1_1Rc1<P, W>>;
declare function createRealfiSDK<P extends Provider, W extends Wallet>(blaze: Blaze<P, W>, params: TDetectedSDKParams): Promise<RealfiSDKV0_4<P, W> | RealfiSDKV1_0<P, W> | RealfiSDKV1_0Rc1<P, W> | RealfiSDKV1_1Rc1<P, W>>;
declare function createRealfiSDK<P extends Provider, W extends Wallet>(blaze: Blaze<P, W>, params: TRealfiSDKParams): Promise<TRealfiSDK<P, W>>;
/** Call signature for {@link RealfiSDK.detectParams}, kept as an interface so it can carry overloads. */
interface IDetectParams {
    (provider: Provider, config: IDetectInput): Promise<TDetectedSDKParams>;
    (provider: Provider, network: TNetworkPreset): Promise<TDetectedSDKParams>;
}
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
export declare const RealfiSDK: {
    /**
     * Create a new RealfiSDK instance.
     *
     * Returns the appropriate version-specific SDK based on the params.
     * The returned SDK has full type information for that version.
     */
    create: typeof createRealfiSDK;
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
    detectParams: IDetectParams;
};
//# sourceMappingURL=index.d.ts.map