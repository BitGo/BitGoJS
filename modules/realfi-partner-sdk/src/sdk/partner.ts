import type { Provider } from "@blaze-cardano/query";
import type { Blaze, Wallet } from "@blaze-cardano/sdk";

import type {
  IDetectInput,
  TDetectedSDKParams,
  TNetworkPreset,
} from "./shared/detect-params.js";
import type { IRealfiSDKParamsV0_4, RealfiSDKV0_4 } from "./v0_4/index.js";
import type { IRealfiSDKParamsV1_0, RealfiSDKV1_0 } from "./v1_0/index.js";
import type {
  IRealfiSDKParamsV1_0Rc1,
  RealfiSDKV1_0Rc1,
} from "./v1_0_rc1/index.js";
import type {
  IRealfiSDKParamsV1_1Rc1,
  RealfiSDKV1_1Rc1,
} from "./v1_1_rc1/index.js";
export type {
  IBuildStakeContinuationParams,
  IStakeContinuation,
  IStakeContinuationSwap,
} from "./v1/family.js";

// Version discriminant: a readonly literal on every current-line SDK class,
// so TRealfiCardanoSDK narrows as a tagged union.
type TCardanoVersionProp = "version";

// Read helpers available on every current-line SDK.
type TCardanoReadMethods =
  | "getRawProxyDatum"
  | "getParsedProxyDatum"
  | "getSettings"
  | "getTreasuryDatum"
  | "getVaultDatum"
  | "getUsdrAssetId"
  | "getSusdrAssetId";

// Order builders common to V0_4 and the V1 line.
type TCardanoOrderMethods =
  | "buildMintOrderTx"
  | "buildRedeemOrderTx"
  | "buildStakeOrderTx"
  | "buildUnstakeOrderTx"
  | "buildDepositOrderTx"
  | "buildWithdrawOrderTx"
  | "buildCancelOrdersTx"
  | "buildClaimTimelockTx";

// V1-line order builder on the partner surface; direct mint/burn stay internal-only.
type TCardanoOrderMethodsV1 =
  | "buildInvalidatedOrdersTx"
  | "buildStakeContinuation";

/** Partner-facing surface of the V0_4 SDK: order builders + read helpers only. */
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface IRealfiCardanoSDKV0_4<
  P extends Provider,
  W extends Wallet,
> extends Pick<
  RealfiSDKV0_4<P, W>,
  TCardanoVersionProp | TCardanoReadMethods | TCardanoOrderMethods
> {}

/** Partner-facing surface of the V1_0 SDK. */
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface IRealfiCardanoSDKV1_0<
  P extends Provider,
  W extends Wallet,
> extends Pick<
  RealfiSDKV1_0<P, W>,
  | TCardanoVersionProp
  | TCardanoReadMethods
  | TCardanoOrderMethods
  | TCardanoOrderMethodsV1
> {}

/** Partner-facing surface of the V1_0_Rc1 SDK. */
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface IRealfiCardanoSDKV1_0Rc1<
  P extends Provider,
  W extends Wallet,
> extends Pick<
  RealfiSDKV1_0Rc1<P, W>,
  | TCardanoVersionProp
  | TCardanoReadMethods
  | TCardanoOrderMethods
  | TCardanoOrderMethodsV1
> {}

/** Partner-facing surface of the V1_1_Rc1 SDK. */
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface IRealfiCardanoSDKV1_1Rc1<
  P extends Provider,
  W extends Wallet,
> extends Pick<
  RealfiSDKV1_1Rc1<P, W>,
  | TCardanoVersionProp
  | TCardanoReadMethods
  | TCardanoOrderMethods
  | TCardanoOrderMethodsV1
> {}

/** Any partner-facing SDK the facade can return after version detection. */
export type TRealfiCardanoSDK<P extends Provider, W extends Wallet> =
  | IRealfiCardanoSDKV0_4<P, W>
  | IRealfiCardanoSDKV1_0<P, W>
  | IRealfiCardanoSDKV1_0Rc1<P, W>
  | IRealfiCardanoSDKV1_1Rc1<P, W>;

/** Protocol version as reported by on-chain detection. */
export type TDetectedVersion = TDetectedSDKParams["version"];

/** Version-detection behavior of SDK instances returned by `create`. */
export type TVersionDetectionMode = "per-build" | "at-init";

/** Options for the partner facade's `create`. */
export interface IRealfiCardanoCreateOptions {
  /**
   * `"per-build"` (default): before every order build (`build*`), re-resolve
   * the live protocol version — one provider lookup — and dispatch to the
   * matching version instance, so an on-chain protocol upgrade needs no
   * re-init. Read helpers (`get*`) never re-detect; they use the version as of
   * the last check. `"at-init"`: the instance is frozen at the version it was
   * created with and never re-detects.
   *
   * This binding happens at property access, not at call time — a cached
   * reference (`const f = sdk.getUsdrAssetId`) keeps targeting the instance
   * live when it was read, even if a later `build*Tx` call switches versions.
   * Call `sdk.getX()` directly to always read the live version.
   *
   * Refresh failures under `"per-build"`: an `UnknownProtocolVersionError`
   * rejects the build (the chain runs a version this SDK does not know); any
   * other error — e.g. a transient provider failure — logs a warning and the
   * build proceeds on the last known version. `buildStakeContinuation` fails
   * closed on every refresh error under `"per-build"`, because its address,
   * schema, and quote must all come from the currently deployed version.
   * `"at-init"` instances, and raw version-pinned SDKs used outside this
   * factory, never refresh and so carry no such guarantee.
   */
  versionDetection?: TVersionDetectionMode;
  /**
   * Called once per observed protocol-version change, after builders have
   * switched to the new version. Exceptions are logged and swallowed.
   */
  onVersionChange?: (
    previous: TDetectedVersion,
    next: TDetectedVersion,
  ) => void;
}

/**
 * Partner-facing view of the RealfiSDK facade. `create` returns the narrowed
 * `IRealfiCardanoSDK` surface (order builders + read helpers); deploy/operator
 * methods are reachable only through the internal entry point.
 *
 * The static return type reflects the version at creation time. Under
 * `"per-build"` detection the runtime instance may later dispatch to a newer
 * protocol version — the partner surface is call-compatible across versions,
 * so existing call sites keep working; `version` reports the live value.
 */
export interface IRealfiCardanoFactory {
  create<P extends Provider, W extends Wallet>(
    blaze: Blaze<P, W>,
    params: IRealfiSDKParamsV0_4,
    options?: IRealfiCardanoCreateOptions,
  ): Promise<IRealfiCardanoSDKV0_4<P, W>>;
  create<P extends Provider, W extends Wallet>(
    blaze: Blaze<P, W>,
    params: IRealfiSDKParamsV1_0,
    options?: IRealfiCardanoCreateOptions,
  ): Promise<IRealfiCardanoSDKV1_0<P, W>>;
  create<P extends Provider, W extends Wallet>(
    blaze: Blaze<P, W>,
    params: IRealfiSDKParamsV1_0Rc1,
    options?: IRealfiCardanoCreateOptions,
  ): Promise<IRealfiCardanoSDKV1_0Rc1<P, W>>;
  create<P extends Provider, W extends Wallet>(
    blaze: Blaze<P, W>,
    params: IRealfiSDKParamsV1_1Rc1,
    options?: IRealfiCardanoCreateOptions,
  ): Promise<IRealfiCardanoSDKV1_1Rc1<P, W>>;
  create<P extends Provider, W extends Wallet>(
    blaze: Blaze<P, W>,
    params: TDetectedSDKParams,
    options?: IRealfiCardanoCreateOptions,
  ): Promise<TRealfiCardanoSDK<P, W>>;
  detectParams(
    provider: Provider,
    config: IDetectInput,
  ): Promise<TDetectedSDKParams>;
  detectParams(
    provider: Provider,
    network: TNetworkPreset,
  ): Promise<TDetectedSDKParams>;
}
