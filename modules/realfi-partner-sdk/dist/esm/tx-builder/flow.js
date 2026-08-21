/* eslint-disable @typescript-eslint/naming-convention */

import * as Data from "@blaze-cardano/data";
import { Core } from "@blaze-cardano/sdk";
import { DatumBuilderV3 } from "@sundaeswap/core";
import { V1_0Types } from "../generated-types/index.js";
import { plutusDataFromCbor, realfiDestinationFromStepResult, sundaeV3DestinationAddressFromStepResult } from "./destination.js";

/**
 * Output produced by one flow step. The previous step consumes only this
 * result's address and datum as its continuation destination. The value is the
 * Cardano assets locked at this step's output; after the right fold, only the
 * outermost folded result is converted into the transaction output.
 */

export const STAKE_VAULT_RATIO_SCALE = 1_000_000n;
export const DEFAULT_STAKE_SLIPPAGE_TOLERANCE_BPS = 50n;
const BPS_DENOMINATOR = 10_000n;

/**
 * @deprecated V1_0 only. Prefer the SDK-backed stake continuation helper.
 */

/** @deprecated V1_0 only. Prefer the SDK-backed stake continuation helper. */

/**
 * Computes stake order `min_received` from the current vault exchange rate.
 *
 * `vaultRatio` is USDr per sUSDr scaled by 1e6, so the natural sUSDr output is
 * `amount * 1e6 / vaultRatio`. The tolerance is applied to that output floor.
 *
 * @deprecated V1_0 only. Prefer the SDK-backed stake continuation helper.
 */
export function computeStakeMinReceivedFromVaultRatio(amount, vaultRatio, slippageToleranceBps = DEFAULT_STAKE_SLIPPAGE_TOLERANCE_BPS) {
  if (amount <= 0n) {
    throw new Error("Stake amount must be positive");
  }
  if (vaultRatio <= 0n) {
    throw new Error("Vault ratio must be positive");
  }
  if (slippageToleranceBps < 0n || slippageToleranceBps > BPS_DENOMINATOR) {
    throw new Error("Slippage tolerance must be between 0 and 10000 bps");
  }
  const expected = amount * STAKE_VAULT_RATIO_SCALE / vaultRatio;
  const minReceived = expected * (BPS_DENOMINATOR - slippageToleranceBps) / BPS_DENOMINATOR;
  // WTB-1764: stake.ak requires min_received > 0 and crashes the entire
  // execution transaction (not just this request) when it is not, so a floor
  // that rounds or tolerances down to zero must not become an order.
  if (minReceived <= 0n) {
    throw new Error(`Quoted min_received must be positive (got ${minReceived}); the stake amount ` + "is too small for this vault ratio and tolerance to quote a non-zero floor");
  }
  return minReceived;
}

/** @deprecated V1_0 only. Prefer the SDK-backed stake continuation helper. */
export function buildRealFiStakeAction({
  amount,
  vaultRatio,
  slippageToleranceBps
}) {
  return {
    OStake: {
      amount,
      min_received: computeStakeMinReceivedFromVaultRatio(amount, vaultRatio, slippageToleranceBps)
    }
  };
}

/**
 * Builds the final flow result by folding from the final step backward through
 * each requested flow step.
 */
export function buildTxFlow(steps, finalStep) {
  return steps.reduceRight((nextStep, step) => buildTxFlowStep(step, nextStep), finalStep);
}

/**
 * Builds one flow step using the already-built next step as its continuation.
 */
export function buildTxFlowStep(step, nextStep) {
  switch (step.kind) {
    case "realfi":
      return buildRealFiTxFlowStep(step, nextStep);
    case "sundae-v3":
      return buildSundaeV3TxFlowStep(step, nextStep);
    default:
      {
        const unreachable = step;
        return unreachable;
      }
  }
}

/**
 * Builds a RealFi order flow result whose destination points to the next step.
 *
 * @deprecated V1_0 only. Prefer the SDK-backed stake continuation helper.
 */
export function buildRealFiTxFlowStep(step, nextStep) {
  const orderDatum = {
    owner: step.owner,
    destination: realfiDestinationFromStepResult(nextStep),
    action: step.action,
    data: step.data ?? Data.Void()
  };
  return {
    address: step.address,
    datum: Data.serialize(V1_0Types.OrderDatumV1, orderDatum),
    value: step.value
  };
}

/**
 * Builds a Sundae V3 flow result by injecting the next step as the order
 * destination and serializing the selected order datum.
 */
export function buildSundaeV3TxFlowStep(step, nextStep) {
  const builder = new DatumBuilderV3(step.network);
  const destinationAddress = sundaeV3DestinationAddressFromStepResult(nextStep);
  let inlineDatum;
  switch (step.orderKind) {
    case "swap":
      inlineDatum = builder.buildSwapDatum({
        destinationAddress,
        ident: step.ident,
        order: step.order,
        ownerAddress: step.ownerAddress,
        scooperFee: step.scooperFee
      }).inline;
      break;
    case "deposit":
      inlineDatum = builder.buildDepositDatum({
        destinationAddress,
        ident: step.ident,
        order: step.order,
        ownerAddress: step.ownerAddress,
        scooperFee: step.scooperFee
      }).inline;
      break;
    case "withdraw":
      inlineDatum = builder.buildWithdrawDatum({
        destinationAddress,
        ident: step.ident,
        order: step.order,
        ownerAddress: step.ownerAddress,
        scooperFee: step.scooperFee
      }).inline;
      break;
    default:
      {
        const unreachable = step;
        return unreachable;
      }
  }
  return {
    address: step.address,
    datum: plutusDataFromCbor(inlineDatum),
    value: step.value
  };
}

/**
 * Converts the folded flow result into a transaction output with an inline
 * datum when the result includes one.
 */
export function txBuilderFlowResultToCoreOutput(result) {
  const output = new Core.TransactionOutput(result.address, result.value);
  if (result.datum) {
    output.setDatum(Core.Datum.newInlineData(result.datum));
  }
  return output;
}
//# sourceMappingURL=flow.js.map