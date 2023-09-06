// https://zips.z.cash/zip-0317

import { Dimensions } from './dimensions';

const marginalFeeZatPerAction = 5000;
const graceActions = 2;
const p2pkhStandardInputSize = 150;
const p2pkhStandardOutputSize = 34;

function getLogicalActions(params: { txInTotalSize: number; txOutTotalSize: number }): number {
  // The ZIP includes nJoinSplits, nSpendsSapling, nOutputsSapling, nActionsOrchard
  // which are not relevant for BitGo transactions.
  return Math.max(
    Math.ceil(params.txInTotalSize / p2pkhStandardInputSize),
    Math.ceil(params.txOutTotalSize / p2pkhStandardOutputSize)
  );
}

export function getConventionalFeeZat(params: {
  txInTotalSize: number;
  txOutTotalSize: number;
  marginalFeeZatPerAction?: number;
}): number {
  return (
    Math.max(getLogicalActions(params), graceActions) * (params.marginalFeeZatPerAction ?? marginalFeeZatPerAction)
  );
}

export function getConventionalFeeForDimensions(
  d: Dimensions,
  params: {
    marginalFeeZatPerAction?: number;
  } = {}
): number {
  const txInTotalSize = d.getInputsVSize();
  const txOutTotalSize = d.getOutputsVSize();
  return getConventionalFeeZat({ txInTotalSize, txOutTotalSize, ...params });
}
