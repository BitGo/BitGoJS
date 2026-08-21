import type { Provider } from "@blaze-cardano/query";
import type { Blaze, Wallet } from "@blaze-cardano/sdk";
import type { IRealfiCardanoCreateOptions, TRealfiCardanoSDK } from "./partner.js";
import type { TClientSource } from "./shared/client-id.js";
import { type TDetectedSDKParams } from "./shared/detect-params.js";
/**
 * Create a partner SDK that re-resolves the live protocol version before each
 * order build and dispatches to the matching version instance.
 *
 * Detection identity: the one-shot NFT policy (deterministic from
 * `proxyBootstrap`). The proxy UTxO ref changes on every settings update, but
 * the NFT lookup follows it, so each refresh is exactly one provider call.
 * The fetched `logic` hash is compared against the current instance's
 * `protocolScriptHash` — equal in every detectable version — and only on a
 * mismatch does the (local, provider-free) version matcher run and the
 * underlying instance get recreated, preserving `clientSource` so partner
 * order metadata survives the switch. Read helpers never trigger a refresh.
 *
 * No result caching beyond the last observed hash: freshness only shrinks the
 * stale window — correctness is enforced on-chain, and a stale-version build
 * is recovered via order invalidation.
 *
 * Refresh failure policy: an {@link UnknownProtocolVersionError} rejects the
 * build — the chain moved to a version this SDK cannot target. Any other
 * refresh error (e.g. a transient provider failure) logs a warning and the
 * build proceeds on the last known version, which is exactly what an
 * `"at-init"` instance would have produced. Stake continuations are stricter
 * under this `"per-build"` dispatcher: their address, schema, and
 * exchange-rate quote must all match the current deployment, so
 * `buildStakeContinuation` fails closed on every refresh error here. An
 * `"at-init"` instance, or a raw version-pinned SDK used outside this
 * dispatcher, never refreshes at all and carries no such guarantee.
 *
 * Method identity is unstable across accesses (`sdk.buildX !== sdk.buildX`):
 * each access returns a fresh wrapper over the live instance, by design.
 */
export declare function createPartnerCardanoSDK<P extends Provider, W extends Wallet>(blaze: Blaze<P, W>, params: TDetectedSDKParams, clientSource: TClientSource, options?: IRealfiCardanoCreateOptions): Promise<TRealfiCardanoSDK<P, W>>;
//# sourceMappingURL=partner-dispatcher.d.ts.map