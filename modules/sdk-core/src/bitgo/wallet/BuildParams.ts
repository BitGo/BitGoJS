/* eslint no-redeclare: off */

import * as t from 'io-ts';
import { getCodecProperties } from '../utils/codecProps';

export const BuildParamsUTXO = t.partial({
  /* the change address type */
  addressType: t.unknown,
  /* a fixed change address */
  changeAddress: t.unknown,
  cpfpFeeRate: t.unknown,
  cpfpTxIds: t.unknown,
  unspents: t.unknown,
  minValue: t.unknown,
  maxValue: t.unknown,
  targetWalletUnspents: t.unknown,
  /* unspent selection strategy */
  strategy: t.unknown,
  noSplitChange: t.unknown,
  enforceMinConfirmsForChange: t.unknown,
  /* legacy or psbt */
  txFormat: t.unknown,
});

export const BuildParams = t.intersection([
  BuildParamsUTXO,
  t.partial({
    apiVersion: t.unknown,
    consolidateAddresses: t.unknown,
    feeRate: t.unknown,
    gasLimit: t.unknown,
    gasPrice: t.unknown,
    hopParams: t.unknown,
    idfSignedTimestamp: t.unknown,
    idfUserId: t.unknown,
    idfVersion: t.unknown,
    instant: t.unknown,
    lastLedgerSequence: t.unknown,
    ledgerSequenceDelta: t.unknown,
    maxFee: t.unknown,
    maxFeeRate: t.unknown,
    memo: t.unknown,
    transferId: t.unknown,
    message: t.unknown,
    minConfirms: t.unknown,
    numBlocks: t.unknown,
    nonce: t.unknown,
    pendingApprovalId: t.unknown,
    preview: t.unknown,
    previewPendingTxs: t.unknown,
    receiveAddress: t.unknown,
    recipients: t.unknown,
    reservation: t.unknown,
    sequenceId: t.unknown,
    sourceChain: t.unknown,
    destinationChain: t.unknown,
    trustlines: t.unknown,
    type: t.unknown,
    nonParticipation: t.unknown,
    validFromBlock: t.unknown,
    validToBlock: t.unknown,
    messageKey: t.unknown,
    stakingOptions: t.unknown,
    eip1559: t.unknown,
    keyregTxBase64: t.unknown,
    closeRemainderTo: t.unknown,
    tokenName: t.unknown,
    enableTokens: t.unknown,
    // param to set emergency flag on a custodial transaction.
    // This transaction should be performed in less than 1 hour or it will fail.
    emergency: t.unknown,
  }),
]);

export type BuildParams = t.TypeOf<typeof BuildParams>;

export const buildParamKeys = getCodecProperties(BuildParams);
