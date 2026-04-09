// https://zips.z.cash/zip-0317

import { Dimensions } from './dimensions';

const marginalFeeZatPerAction = 5000;
const graceActions = 2;
const p2pkhStandardInputSize = 150;
const p2pkhStandardOutputSize = 34;

export function getLogicalActions(params: { txInTotalSize: number; txOutTotalSize: number } | Dimensions): number {
  if (params instanceof Dimensions) {
    return getLogicalActions({ txInTotalSize: params.getInputsVSize(), txOutTotalSize: params.getOutputsVSize() });
  }
  // The ZIP includes nJoinSplits, nSpendsSapling, nOutputsSapling, nActionsOrchard
  // which are not relevant for BitGo transactions.
  return Math.max(
    Math.ceil(params.txInTotalSize / p2pkhStandardInputSize),
    Math.ceil(params.txOutTotalSize / p2pkhStandardOutputSize)
  );
}

export function getConventionalFeeForDimensions(
  dimensions: Dimensions,
  params: {
    marginalFeeZatPerAction?: number;
  } = {}
): number {
  return (
    Math.max(getLogicalActions(dimensions), graceActions) * (params.marginalFeeZatPerAction ?? marginalFeeZatPerAction)
  );
}
