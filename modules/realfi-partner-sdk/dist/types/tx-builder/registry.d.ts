import { Core } from "@blaze-cardano/sdk";
import type { TSupportedNetworks } from "@sundaeswap/core";
import type { IBuildStakeContinuationParams, IStakeContinuation } from "../sdk/v1/family.js";
import { type RealFiTxFlowStep, type RealFiStakeActionInput, type SundaeV3TxFlowStep, type TxBuilderFinalStep, type TxBuilderFlowResult, type TxFlowStep } from "./flow.js";
type TxFlowStepInput<TStep> = TStep extends unknown ? Omit<TStep, "address" | "kind" | "network"> : never;
export type TxBuilderNetwork = TSupportedNetworks;
export interface TxBuilderProtocolRegistry {
    requestAddress?: string;
}
export interface TxBuilderNetworkRegistry {
    realfi: TxBuilderProtocolRegistry;
    sundaeV3: TxBuilderProtocolRegistry;
}
export type TxBuilderRegistry = Record<TxBuilderNetwork, TxBuilderNetworkRegistry>;
/** @deprecated V1_0 only. Prefer `SundaeV3SwapToStakeInput`. */
export type RealFiTxFlowStepInput = TxFlowStepInput<RealFiTxFlowStep>;
/** @deprecated V1_0 only. Prefer `SundaeV3SwapToStakeInput`. */
export type RealFiStakeTxFlowStepInput = Omit<RealFiTxFlowStepInput, "action"> & RealFiStakeActionInput;
export type SundaeV3TxFlowStepInput = TxFlowStepInput<SundaeV3TxFlowStep>;
export type SundaeV3SwapTxFlowStepInput = Extract<SundaeV3TxFlowStepInput, {
    orderKind: "swap";
}>;
/** A swap leg with explicit cancellation authority for the routed order. */
export type SundaeV3OwnedSwapTxFlowStepInput = Omit<SundaeV3SwapTxFlowStepInput, "ownerAddress"> & {
    ownerAddress: string;
};
/**
 * Any SDK instance exposing `buildStakeContinuation` — the partner facade's
 * per-build dispatcher, an `"at-init"` instance, or a raw version-pinned SDK.
 * Only the per-build dispatcher fails closed on a stale protocol version;
 * the others carry no such guarantee.
 */
export interface StakeContinuationBuilder {
    buildStakeContinuation(params: IBuildStakeContinuationParams): Promise<IStakeContinuation>;
}
/**
 * @deprecated Prefer `RealfiSDK.sundae.create(blaze).buildSwapToStakeOrderTx`.
 * This input belongs to the lower-level, V3-only flow composer.
 */
export interface SundaeV3SwapToStakeInput {
    sdk: StakeContinuationBuilder;
    swap: SundaeV3OwnedSwapTxFlowStepInput;
    finalStep: TxBuilderFinalStep;
    stake?: Omit<IBuildStakeContinuationParams, "swap" | "destination">;
}
export interface CreateTxFlowBuilderOptions {
    network: TxBuilderNetwork;
    registry?: TxBuilderRegistry;
}
export interface TxFlowBuilder {
    network: TxBuilderNetwork;
    /** @deprecated V1_0 only. Prefer `sundaeV3SwapToStake`. */
    realfi: (step: RealFiTxFlowStepInput) => RealFiTxFlowStep;
    /** @deprecated V1_0 only. Prefer `sundaeV3SwapToStake`. */
    realfiStake: (step: RealFiStakeTxFlowStepInput) => RealFiTxFlowStep;
    sundaeV3: (step: SundaeV3TxFlowStepInput) => SundaeV3TxFlowStep;
    /**
     * @deprecated Prefer `RealfiSDK.sundae.create(blaze).buildSwapToStakeOrderTx`,
     * which builds the complete V3 or Stableswaps order transaction.
     */
    sundaeV3SwapToStake: (input: SundaeV3SwapToStakeInput) => Promise<TxBuilderFlowResult>;
    build: (steps: readonly TxFlowStep[], finalStep: TxBuilderFinalStep) => TxBuilderFlowResult;
    toOutput: (result: TxBuilderFlowResult) => Core.TransactionOutput;
}
/**
 * Default request address registry. Sundae V3 entries are enterprise order
 * script addresses. The RealFi entry is a legacy V1_0-only path; preview runs
 * V1_1, so its old V1_0 address is deliberately unset. New stake continuations
 * derive the live address from the version-aware SDK instead.
 */
export declare const TX_BUILDER_REGISTRY: {
    preview: {
        realfi: {};
        sundaeV3: {
            requestAddress: string;
        };
    };
    preprod: {
        realfi: {
            requestAddress: string;
        };
        sundaeV3: {
            requestAddress: string;
        };
    };
    mainnet: {
        realfi: {};
        sundaeV3: {
            requestAddress: string;
        };
    };
};
/**
 * Returns the registry entry for the selected network.
 */
export declare function getTxBuilderNetworkRegistry(network: TxBuilderNetwork, registry?: TxBuilderRegistry): TxBuilderNetworkRegistry;
/**
 * Returns the RealFi request script address for the selected network.
 *
 * @deprecated V1_0 only. Prefer the version-aware SDK continuation builder.
 */
export declare function getRealFiRequestAddress(network: TxBuilderNetwork, registry?: TxBuilderRegistry): Core.Address;
/**
 * Returns the Sundae V3 request script address for the selected network.
 */
export declare function getSundaeV3RequestAddress(network: TxBuilderNetwork, registry?: TxBuilderRegistry): Core.Address;
/**
 * Creates a network-scoped flow builder that fills request script addresses from
 * the registry before building the right-folded transaction flow.
 */
export declare function createTxFlowBuilder({ network, registry, }: CreateTxFlowBuilderOptions): TxFlowBuilder;
export {};
//# sourceMappingURL=registry.d.ts.map