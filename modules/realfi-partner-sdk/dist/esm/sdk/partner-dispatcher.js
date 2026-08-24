// Per-build protocol-version dispatch for the partner facade ("." entry).
// First-party consumers ("./internal") keep frozen version instances.

import { RealfiSDK } from "./index.js";
import { fetchProxyLogicSnapshot, matchProtocolVersion, UnknownProtocolVersionError } from "./shared/detect-params.js";

// Identity fields the dispatcher reads off a live version instance; every
// other member is reached by property delegation.

// Caller-supplied build options carried into a recreated instance. Cached
// referenceInputs stay behind — they belong to the previous version's scripts.

const isOrderBuilder = prop => typeof prop === "string" && prop.startsWith("build");
const requiresFreshVersion = prop => prop === "buildStakeContinuation";

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
export async function createPartnerCardanoSDK(blaze, params, clientSource, options) {
  const createInstance = p => RealfiSDK.create(blaze, {
    ...p,
    clientSource
  });
  const initial = await createInstance(params);
  if ((options?.versionDetection ?? "per-build") === "at-init") {
    // Frozen instance — never re-detects.
    return initial;
  }
  const detectInput = {
    proxyBootstrap: params.proxyBootstrap,
    treasuryBootstrap: params.treasuryBootstrap,
    stakingVaultBootstrap: params.stakingVaultBootstrap,
    yieldOracleBootstrap: "yieldOracleBootstrap" in params ? params.yieldOracleBootstrap : undefined,
    assetNameHex: params.assetNameHex,
    sUSDrAssetNameHex: params.sUSDrAssetNameHex,
    enableTrace: params.enableTrace
  };
  const carriedExtras = params;
  const state = {
    instance: initial,
    // Every detectable version's proxy datum `logic` hash is that version
    // class's protocolScriptHash.
    lastLogicHash: initial.protocolScriptHash
  };
  const doRefresh = async () => {
    const oneShotPolicyId = state.instance.oneShotPolicyId;
    const snapshot = await fetchProxyLogicSnapshot(blaze.provider, oneShotPolicyId);
    if (snapshot.logicHash === state.lastLogicHash) return;
    const detected = await matchProtocolVersion(snapshot, oneShotPolicyId, detectInput);
    const previous = state.instance.version;
    const next = await createInstance({
      ...detected,
      scriptDeploymentAddress: carriedExtras.scriptDeploymentAddress,
      defaultSlippageToleranceBps: carriedExtras.defaultSlippageToleranceBps
    });
    state.instance = next;
    state.lastLogicHash = snapshot.logicHash;
    if (next.version !== previous) {
      console.warn(`[realfi-sdk] Protocol version changed: ${previous} -> ${next.version}. Order builders now target ${next.version}.`, {
        previous,
        next: next.version
      });
      // A throwing partner callback must not break the build.
      try {
        options?.onVersionChange?.(previous, next.version);
      } catch (callbackError) {
        console.warn("[realfi-sdk] onVersionChange threw", callbackError);
      }
    }
  };

  // Concurrent builds share one in-flight refresh.
  const refresh = () => {
    if (!state.inflightRefresh) {
      state.inflightRefresh = doRefresh().finally(() => {
        state.inflightRefresh = undefined;
      });
    }
    return state.inflightRefresh;
  };

  // Delegating proxy: members always resolve against the live instance, so a
  // version switch also switches the available surface (e.g. V1-line-only
  // builders). Order builds refresh first; everything else passes through.
  return new Proxy(Object.create(null), {
    get(_target, prop) {
      const live = state.instance;
      const value = live[prop];
      if (typeof value !== "function") return value;
      if (isOrderBuilder(prop)) {
        return async (...args) => {
          try {
            await refresh();
          } catch (refreshError) {
            // Unknown on-chain version: this SDK cannot build a valid order.
            if (refreshError instanceof UnknownProtocolVersionError || requiresFreshVersion(prop)) {
              throw refreshError;
            }
            // Transient failure (e.g. provider blip): build on the last known
            // version — no worse than an "at-init" instance.
            console.warn(`[realfi-sdk] Protocol-version refresh failed; ${prop} builds against last known version ${state.instance.version}.`, refreshError);
          }
          const current = state.instance;
          const builder = current[prop];
          if (typeof builder !== "function") {
            throw new Error(`[realfi-sdk] ${prop} is not available on protocol version ${state.instance.version}; the live protocol version changed since this SDK was created.`);
          }
          return builder.apply(state.instance, args);
        };
      }
      return value.bind(state.instance);
    },
    has(_target, prop) {
      return prop in state.instance;
    },
    set(_target, prop, value) {
      state.instance[prop] = value;
      return true;
    },
    getPrototypeOf() {
      return Object.getPrototypeOf(state.instance);
    },
    ownKeys() {
      return Reflect.ownKeys(state.instance);
    },
    getOwnPropertyDescriptor(_target, prop) {
      const descriptor = Reflect.getOwnPropertyDescriptor(state.instance, prop);
      // The proxy target is an empty object; reported descriptors must be
      // configurable to satisfy proxy invariants.
      return descriptor ? {
        ...descriptor,
        configurable: true
      } : undefined;
    }
  });
}
//# sourceMappingURL=partner-dispatcher.js.map