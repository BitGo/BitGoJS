/* eslint-disable @typescript-eslint/naming-convention */

import { Core } from "@blaze-cardano/sdk";
import type { TSupportedNetworks } from "@sundaeswap/core";

import type {
  IBuildStakeContinuationParams,
  IStakeContinuation,
} from "../sdk/v1/family.js";
import {
  buildRealFiStakeAction,
  buildSundaeV3TxFlowStep,
  buildTxFlow,
  txBuilderFlowResultToCoreOutput,
  type RealFiTxFlowStep,
  type RealFiStakeActionInput,
  type SundaeV3TxFlowStep,
  type TxBuilderFinalStep,
  type TxBuilderFlowResult,
  type TxFlowStep,
} from "./flow.js";
import {
  realfiOwnerFromSundaeV3OwnerAddress,
  realfiDestinationFromStepResult,
} from "./destination.js";

type TxFlowStepInput<TStep> = TStep extends unknown
  ? Omit<TStep, "address" | "kind" | "network">
  : never;

export type TxBuilderNetwork = TSupportedNetworks;

export interface TxBuilderProtocolRegistry {
  requestAddress?: string;
}

export interface TxBuilderNetworkRegistry {
  realfi: TxBuilderProtocolRegistry;
  sundaeV3: TxBuilderProtocolRegistry;
}

export type TxBuilderRegistry = Record<
  TxBuilderNetwork,
  TxBuilderNetworkRegistry
>;

/** @deprecated V1_0 only. Prefer `SundaeV3SwapToStakeInput`. */
export type RealFiTxFlowStepInput = TxFlowStepInput<RealFiTxFlowStep>;

/** @deprecated V1_0 only. Prefer `SundaeV3SwapToStakeInput`. */
export type RealFiStakeTxFlowStepInput = Omit<RealFiTxFlowStepInput, "action"> &
  RealFiStakeActionInput;

export type SundaeV3TxFlowStepInput = TxFlowStepInput<SundaeV3TxFlowStep>;

export type SundaeV3SwapTxFlowStepInput = Extract<
  SundaeV3TxFlowStepInput,
  { orderKind: "swap" }
>;

/** A swap leg with explicit cancellation authority for the routed order. */
export type SundaeV3OwnedSwapTxFlowStepInput = Omit<
  SundaeV3SwapTxFlowStepInput,
  "ownerAddress"
> & {
  ownerAddress: string;
};

/**
 * Any SDK instance exposing `buildStakeContinuation` — the partner facade's
 * per-build dispatcher, an `"at-init"` instance, or a raw version-pinned SDK.
 * Only the per-build dispatcher fails closed on a stale protocol version;
 * the others carry no such guarantee.
 */
export interface StakeContinuationBuilder {
  buildStakeContinuation(
    params: IBuildStakeContinuationParams,
  ): Promise<IStakeContinuation>;
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
  sundaeV3SwapToStake: (
    input: SundaeV3SwapToStakeInput,
  ) => Promise<TxBuilderFlowResult>;
  build: (
    steps: readonly TxFlowStep[],
    finalStep: TxBuilderFinalStep,
  ) => TxBuilderFlowResult;
  toOutput: (result: TxBuilderFlowResult) => Core.TransactionOutput;
}

/**
 * Default request address registry. Sundae V3 entries are enterprise order
 * script addresses. The RealFi entry is a legacy V1_0-only path; preview runs
 * V1_1, so its old V1_0 address is deliberately unset. New stake continuations
 * derive the live address from the version-aware SDK instead.
 */
export const TX_BUILDER_REGISTRY = {
  preview: {
    realfi: {},
    sundaeV3: {
      requestAddress:
        "addr_test1wr866xg5kkvarzll69xjh0tfvqvu9zvuhht2qve9ehmgp0qfgf3wc",
    },
  },
  preprod: {
    realfi: {
      requestAddress:
        "addr_test1wrkgqyfrz7qhlhu737nf4v5dllypylasaqruphlul5jhpeczfzjzl",
    },
    sundaeV3: {
      requestAddress:
        "addr_test1wz5cn230um3cve5gvvgk9kxveqcd888r3vl3rtxn3qxpvhcv0tzpr",
    },
  },
  mainnet: {
    realfi: {},
    sundaeV3: {
      requestAddress:
        "addr1w8ax5k9mutg07p2ngscu3chsauktmstq92z9de938j8nqacprc9mw",
    },
  },
} satisfies TxBuilderRegistry;

/**
 * Returns the registry entry for the selected network.
 */
export function getTxBuilderNetworkRegistry(
  network: TxBuilderNetwork,
  registry: TxBuilderRegistry = TX_BUILDER_REGISTRY,
): TxBuilderNetworkRegistry {
  return registry[network];
}

/**
 * Returns the RealFi request script address for the selected network.
 *
 * @deprecated V1_0 only. Prefer the version-aware SDK continuation builder.
 */
export function getRealFiRequestAddress(
  network: TxBuilderNetwork,
  registry: TxBuilderRegistry = TX_BUILDER_REGISTRY,
): Core.Address {
  return requestAddressFromRegistry(
    getTxBuilderNetworkRegistry(network, registry).realfi.requestAddress,
    network,
    "RealFi",
  );
}

/**
 * Returns the Sundae V3 request script address for the selected network.
 */
export function getSundaeV3RequestAddress(
  network: TxBuilderNetwork,
  registry: TxBuilderRegistry = TX_BUILDER_REGISTRY,
): Core.Address {
  return requestAddressFromRegistry(
    getTxBuilderNetworkRegistry(network, registry).sundaeV3.requestAddress,
    network,
    "Sundae V3",
  );
}

/**
 * Creates a network-scoped flow builder that fills request script addresses from
 * the registry before building the right-folded transaction flow.
 */
export function createTxFlowBuilder({
  network,
  registry = TX_BUILDER_REGISTRY,
}: CreateTxFlowBuilderOptions): TxFlowBuilder {
  const sundaeV3 = (step: SundaeV3TxFlowStepInput): SundaeV3TxFlowStep =>
    ({
      ...step,
      kind: "sundae-v3",
      network,
      address: getSundaeV3RequestAddress(network, registry),
    }) as SundaeV3TxFlowStep;

  return {
    network,
    realfi: (step) => ({
      ...step,
      kind: "realfi",
      address: getRealFiRequestAddress(network, registry),
    }),
    realfiStake: ({ amount, vaultRatio, slippageToleranceBps, ...step }) => ({
      ...step,
      kind: "realfi",
      address: getRealFiRequestAddress(network, registry),
      action: buildRealFiStakeAction({
        amount,
        vaultRatio,
        slippageToleranceBps,
      }),
    }),
    sundaeV3,
    sundaeV3SwapToStake: async ({ sdk, swap, finalStep, stake }) => {
      if (!swap.ownerAddress) {
        throw new Error(
          "Sundae V3 swap-to-stake requires ownerAddress so the swap remains cancellable",
        );
      }
      // Default the inner RealFi order's owner to the Sundae leg's owner, so
      // one address retains cancellation authority over both legs unless the
      // caller deliberately splits it via `stake.owner`.
      const continuation = await sdk.buildStakeContinuation({
        owner: realfiOwnerFromSundaeV3OwnerAddress(network, swap.ownerAddress),
        ...stake,
        swap: swap.order,
        destination: realfiDestinationFromStepResult(finalStep),
      });
      return buildSundaeV3TxFlowStep(sundaeV3(swap), continuation);
    },
    build: buildTxFlow,
    toOutput: txBuilderFlowResultToCoreOutput,
  };
}

function requestAddressFromRegistry(
  requestAddress: string | undefined,
  network: TxBuilderNetwork,
  protocol: string,
): Core.Address {
  if (!requestAddress) {
    throw new Error(
      `No ${protocol} request address configured for ${network}. Add it to the tx-builder registry before building this step.`,
    );
  }

  return Core.Address.fromBech32(requestAddress);
}
