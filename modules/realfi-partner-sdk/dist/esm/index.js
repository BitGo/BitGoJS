// Partner-facing entry point. First-party consumers use "./internal".

import { RealfiApi as RealfiApiInternal } from "./api/index.js";
import { SDK_VERSION } from "./sdk/shared/client-id.js";
import { RealfiSDK as RealfiSDKFull } from "./sdk/index.js";
import { createPartnerCardanoSDK } from "./sdk/partner-dispatcher.js";
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
const cardano = {
  create: (blaze, params, options) => createPartnerCardanoSDK(blaze, params, "partner-sdk", options),
  detectParams: RealfiSDKFull.detectParams.bind(RealfiSDKFull)
};
/* eslint-enable @typescript-eslint/no-explicit-any */

// Off-chain API — wrap factory methods to inject the partner client-id so
// every request body carries extensions.clientId = "partner-sdk/<version>".
const PartnerRealfiApi = {
  forNetwork(network) {
    return RealfiApiInternal.forNetwork(network, PARTNER_CLIENT_ID);
  },
  create(endpoints) {
    return RealfiApiInternal.create(endpoints, PARTNER_CLIENT_ID);
  }
};

// Partner SDK, namespaced by part.
export const RealfiSDK = {
  cardano,
  api: PartnerRealfiApi,
  sundae: SundaeSwapSDK
};

// Partner-facing Cardano SDK instance types + create options

// Params + detection result

// Protocol-version detection
export { detectSDKParams, NETWORK_REGISTRY, UnknownProtocolVersionError, YIELD_ORACLE_BOOTSTRAP_PLACEHOLDER } from "./sdk/shared/detect-params.js";

// Partner-facing shared types

// Current-line generated type namespaces
export { V0_4Types, V1_0Types, V1_0Rc1Types, V1_1Rc1Types } from "./generated-types/index.js";

// Curated helpers + transaction builder
export { calculateSusdrExchangeRate, SUSDR_EXCHANGE_RATE_PRECISION } from "./sdk/v1_1_rc1/diffusion.js";
export * as Utils from "./sdk/shared/public.js";
export * as TxBuilder from "./tx-builder/index.js";
export * as SundaeSwap from "./sundae/index.js";

// Off-chain API part. `RealfiApi` here is the partner-tagged factory, not the
// raw class — direct imports get the same partner client-id as RealfiSDK.api.
export { PartnerRealfiApi as RealfiApi };
//# sourceMappingURL=index.js.map