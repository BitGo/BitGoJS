import type { PlutusData } from "@blaze-cardano/core";
import { Core } from "@blaze-cardano/sdk";
import { type IDatumBuilderDepositV3Args, type IDatumBuilderSwapV3Args, type IDatumBuilderWithdrawV3Args, type TSupportedNetworks } from "@sundaeswap/core";
import type { MultisigScript, OrderActionV1 } from "../generated-types/v1_0/index.js";
import { type TxBuilderStepResult } from "./destination.js";
/**
 * Output produced by one flow step. The previous step consumes only this
 * result's address and datum as its continuation destination. The value is the
 * Cardano assets locked at this step's output; after the right fold, only the
 * outermost folded result is converted into the transaction output.
 */
export interface TxBuilderFlowResult extends TxBuilderStepResult {
    value: Core.Value;
}
export interface TxBuilderFinalStep extends TxBuilderFlowResult {
}
export declare const STAKE_VAULT_RATIO_SCALE = 1000000n;
export declare const DEFAULT_STAKE_SLIPPAGE_TOLERANCE_BPS = 50n;
/**
 * @deprecated V1_0 only. Prefer the SDK-backed stake continuation helper.
 */
export interface RealFiStakeActionInput {
    amount: bigint;
    /**
     * Current USDr-per-sUSDr vault ratio scaled by 1e6.
     *
     * This is the shape returned by the RealFi API's latestVaultRatio query.
     */
    vaultRatio: bigint;
    slippageToleranceBps?: bigint;
}
/** @deprecated V1_0 only. Prefer the SDK-backed stake continuation helper. */
export interface RealFiTxFlowStep {
    kind: "realfi";
    address: Core.Address;
    value: Core.Value;
    owner: MultisigScript;
    action: OrderActionV1;
    data?: PlutusData;
}
export interface SundaeV3BaseTxFlowStep {
    kind: "sundae-v3";
    network: TSupportedNetworks;
    address: Core.Address;
    value: Core.Value;
}
export interface SundaeV3SwapTxFlowStep extends SundaeV3BaseTxFlowStep, Omit<IDatumBuilderSwapV3Args, "destinationAddress"> {
    orderKind: "swap";
}
export interface SundaeV3DepositTxFlowStep extends SundaeV3BaseTxFlowStep, Omit<IDatumBuilderDepositV3Args, "destinationAddress"> {
    orderKind: "deposit";
}
export interface SundaeV3WithdrawTxFlowStep extends SundaeV3BaseTxFlowStep, Omit<IDatumBuilderWithdrawV3Args, "destinationAddress"> {
    orderKind: "withdraw";
}
export type SundaeV3TxFlowStep = SundaeV3SwapTxFlowStep | SundaeV3DepositTxFlowStep | SundaeV3WithdrawTxFlowStep;
export type SundaeTxFlowStep = SundaeV3TxFlowStep;
export type TxFlowStep = RealFiTxFlowStep | SundaeTxFlowStep;
/**
 * Computes stake order `min_received` from the current vault exchange rate.
 *
 * `vaultRatio` is USDr per sUSDr scaled by 1e6, so the natural sUSDr output is
 * `amount * 1e6 / vaultRatio`. The tolerance is applied to that output floor.
 *
 * @deprecated V1_0 only. Prefer the SDK-backed stake continuation helper.
 */
export declare function computeStakeMinReceivedFromVaultRatio(amount: bigint, vaultRatio: bigint, slippageToleranceBps?: bigint): bigint;
/** @deprecated V1_0 only. Prefer the SDK-backed stake continuation helper. */
export declare function buildRealFiStakeAction({ amount, vaultRatio, slippageToleranceBps, }: RealFiStakeActionInput): OrderActionV1;
/**
 * Builds the final flow result by folding from the final step backward through
 * each requested flow step.
 */
export declare function buildTxFlow(steps: readonly TxFlowStep[], finalStep: TxBuilderFinalStep): TxBuilderFlowResult;
/**
 * Builds one flow step using the already-built next step as its continuation.
 */
export declare function buildTxFlowStep(step: TxFlowStep, nextStep: TxBuilderFlowResult): TxBuilderFlowResult;
/**
 * Builds a RealFi order flow result whose destination points to the next step.
 *
 * @deprecated V1_0 only. Prefer the SDK-backed stake continuation helper.
 */
export declare function buildRealFiTxFlowStep(step: RealFiTxFlowStep, nextStep: TxBuilderStepResult): TxBuilderFlowResult;
/**
 * Builds a Sundae V3 flow result by injecting the next step as the order
 * destination and serializing the selected order datum.
 */
export declare function buildSundaeV3TxFlowStep(step: SundaeV3TxFlowStep, nextStep: TxBuilderStepResult): TxBuilderFlowResult;
/**
 * Converts the folded flow result into a transaction output with an inline
 * datum when the result includes one.
 */
export declare function txBuilderFlowResultToCoreOutput(result: TxBuilderFlowResult): Core.TransactionOutput;
//# sourceMappingURL=flow.d.ts.map