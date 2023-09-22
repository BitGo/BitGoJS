/* eslint no-redeclare: off */

import * as t from 'io-ts';
import { getCodecProperties } from '../utils/codecProps';

export const BuildParamsUTXO = t.partial({
  /* deprecated. the change address type */
  addressType: t.unknown,
  /* the change address type */
  changeAddressType: t.unknown,
  /* a fixed change address */
  changeAddress: t.unknown,
  cpfpFeeRate: t.unknown,
  cpfpTxIds: t.unknown,
  unspents: t.unknown,
  minValue: t.unknown,
  minConfirms: t.unknown,
  maxValue: t.unknown,
  targetWalletUnspents: t.unknown,
  /* unspent selection strategy */
  strategy: t.unknown,
  strategyAllowFallback: t.unknown,
  noSplitChange: t.unknown,
  smallestChangeSplitSize: t.unknown,
  enforceMinConfirmsForChange: t.unknown,
  /* legacy or psbt */
  txFormat: t.unknown,
  maxChangeOutputs: t.unknown,
});

export const BuildParamsStacks = t.partial({
  contractName: t.unknown,
  functionName: t.unknown,
  functionArgs: t.unknown,
});

export const BuildParamsOffchain = t.partial({
  idfSignedTimestamp: t.unknown,
  idfVersion: t.unknown,
  idfUserId: t.unknown,
});

export const BuildParams = t.exact(
  t.intersection([
    BuildParamsUTXO,
    BuildParamsStacks,
    BuildParamsOffchain,
    t.partial({
      apiVersion: t.unknown,
      consolidateAddresses: t.unknown,
      consolidateId: t.unknown,
      comment: t.string,
      delayMs: t.unknown,
      fee: t.unknown,
      feeRate: t.unknown,
      feeMultiplier: t.unknown,
      enableTokens: t.unknown,
      gasLimit: t.unknown,
      gasPrice: t.unknown,
      hopParams: t.unknown,
      instant: t.unknown,
      lastLedgerSequence: t.unknown,
      ledgerSequenceDelta: t.unknown,
      maxFee: t.unknown,
      maxFeeRate: t.unknown,
      memo: t.unknown,
      transferId: t.unknown,
      message: t.unknown,
      numBlocks: t.unknown,
      nonce: t.unknown,
      pendingApprovalId: t.unknown,
      preview: t.unknown,
      previewPendingTxs: t.unknown,
      senderAddress: t.unknown,
      receiveAddress: t.unknown,
      recipients: t.unknown,
      reservation: t.unknown,
      refundOptions: t.unknown,
      sequenceId: t.unknown,
      sourceChain: t.unknown,
      destinationChain: t.unknown,
      trustlines: t.unknown,
      type: t.unknown,
      timeBounds: t.unknown,
      startTime: t.unknown,
      stateProofKey: t.unknown,
      nonParticipation: t.unknown,
      validFromBlock: t.unknown,
      validToBlock: t.unknown,
      messageKey: t.unknown,
      stakingParams: t.unknown,
      stakingOptions: t.unknown,
      unstakingOptions: t.unknown,
      eip1559: t.unknown,
      keyregTxBase64: t.unknown,
      closeRemainderTo: t.unknown,
      tokenName: t.unknown,
      prebuildTx: t.unknown,
      // param to set emergency flag on a custodial transaction.
      // This transaction should be performed in less than 1 hour or it will fail.
      emergency: t.unknown,
    }),
  ])
);

export type BuildParams = t.TypeOf<typeof BuildParams>;
export const buildParamKeys = getCodecProperties(BuildParams);
