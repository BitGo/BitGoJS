// Partner-facing entry point. First-party consumers use "./internal".

import { RealfiApi as RealfiApiInternal } from "./api/index.js";
import type { IApiEndpoints, IRealfiApiSDK, TApiNetwork } from "./api/index.js";
import { SDK_VERSION } from "./sdk/shared/client-id.js";
import { RealfiSDK as RealfiSDKFull } from "./sdk/index.js";
import { createPartnerCardanoSDK } from "./sdk/partner-dispatcher.js";
import type { IRealfiCardanoFactory } from "./sdk/partner.js";
import * as SundaeSwapSDK from "./sundae/index.js";

const PARTNER_CLIENT_ID = `partner-sdk/${SDK_VERSION}`;

// On-chain Cardano part — the facade narrowed to the partner surface (order
// builders + read helpers). Deploy/operator methods and concrete version
// classes are reachable only via "./internal".
//
// `create` returns a version dispatcher: by default it re-resolves the live
// protocol version before each order build (one provider lookup) and swaps to
// the matching version instance; read helpers never re-detect. All built
// orders are tagged with source="partner-sdk", surviving version switches.
// The `detectParams` method is forwarded unchanged.
/* eslint-disable @typescript-eslint/no-explicit-any */
const cardano: IRealfiCardanoFactory = {
  create: (blaze: any, params: any, options?: any) =>
    createPartnerCardanoSDK(blaze, params, "partner-sdk", options) as any,
  detectParams: RealfiSDKFull.detectParams.bind(RealfiSDKFull),
};
/* eslint-enable @typescript-eslint/no-explicit-any */

// Off-chain API — wrap factory methods to inject the partner client-id so
// every request body carries extensions.clientId = "partner-sdk/<version>".
const PartnerRealfiApi = {
  forNetwork(network: TApiNetwork): IRealfiApiSDK {
    return RealfiApiInternal.forNetwork(network, PARTNER_CLIENT_ID);
  },
  create(endpoints: IApiEndpoints): IRealfiApiSDK {
    return RealfiApiInternal.create(endpoints, PARTNER_CLIENT_ID);
  },
};

// Partner SDK, namespaced by part.
export const RealfiSDK = {
  cardano,
  api: PartnerRealfiApi,
  sundae: SundaeSwapSDK,
};

// Partner-facing Cardano SDK instance types + create options
export type {
  IRealfiCardanoCreateOptions,
  IBuildStakeContinuationParams,
  IStakeContinuation,
  IStakeContinuationSwap,
  IRealfiCardanoSDKV0_4,
  IRealfiCardanoSDKV1_0,
  IRealfiCardanoSDKV1_0Rc1,
  IRealfiCardanoSDKV1_1Rc1,
  TDetectedVersion,
  TRealfiCardanoSDK,
  TVersionDetectionMode,
} from "./sdk/partner.js";

// Params + detection result
export type {
  TDetectedSDKParams,
  IRealfiSDKParamsV0_4,
  IRealfiSDKParamsV1_0,
  IRealfiSDKParamsV1_0Rc1,
  IRealfiSDKParamsV1_1Rc1,
} from "./sdk/index.js";

// Protocol-version detection
export {
  detectSDKParams,
  NETWORK_REGISTRY,
  UnknownProtocolVersionError,
  YIELD_ORACLE_BOOTSTRAP_PLACEHOLDER,
} from "./sdk/shared/detect-params.js";
export type {
  IDetectInput,
  TNetworkPreset,
} from "./sdk/shared/detect-params.js";

// Partner-facing shared types
export type {
  TProtocolVersion,
  IProxyBootstrap,
  IBaseSDKParams,
  IRawProxyDatumResult,
  IProxyDatumResult,
  ITreasuryDatumResult,
  IVaultDatumResult,
  IProxySettings,
  IReserveAsset,
  TMultisigScript,
  IOutputReference,
  TPermissionKey,
} from "./sdk/shared/types.js";

// Current-line generated type namespaces
export {
  V0_4Types,
  V1_0Types,
  V1_0Rc1Types,
  V1_1Rc1Types,
} from "./generated-types/index.js";

// Curated helpers + transaction builder
export {
  calculateSusdrExchangeRate,
  SUSDR_EXCHANGE_RATE_PRECISION,
  type ISusdrExchangeRateInputs,
} from "./sdk/v1_1_rc1/diffusion.js";
export * as Utils from "./sdk/shared/public.js";
export * as TxBuilder from "./tx-builder/index.js";
export * as SundaeSwap from "./sundae/index.js";

// Off-chain API part. `RealfiApi` here is the partner-tagged factory, not the
// raw class — direct imports get the same partner client-id as RealfiSDK.api.
export { PartnerRealfiApi as RealfiApi };
export type {
  IRealfiApiSDK,
  IApiEndpoints,
  TApiNetwork,
  IOrderInfo,
  IPartnerConfig,
  IPartnerLimits,
  IApiOrderUtxo,
  IStakeTimes,
  IOrderFees,
  IYieldBreakdown,
  IPointsBalance,
  IReferrerCode,
  TOrderStatus,
  TOrderAction,
} from "./api/index.js";
