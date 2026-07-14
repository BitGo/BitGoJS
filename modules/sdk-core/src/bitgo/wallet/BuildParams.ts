/* eslint no-redeclare: off */

import * as t from 'io-ts';
import { getCodecProperties } from '../utils/codecProps';

export const Bip322Message = t.type({
  message: t.string,
  address: t.string,
});

export const BuildParamsUTXO = t.partial({
  /* deprecated. the change address type */
  addressType: t.unknown,
  /* the change address type */
  changeAddressType: t.unknown,
  /* a fixed change address */
  changeAddress: t.unknown,
  allowExternalChangeAddress: t.boolean,
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
  /* restrict which input script types WP may select (e.g. for legacy format compatibility) */
  allowedInputScriptTypes: t.unknown,
  maxChangeOutputs: t.unknown,
  /* rbf */
  rbfTxIds: t.array(t.string),
  isReplaceableByFee: t.boolean,
  messages: t.array(Bip322Message),
  qr: t.boolean,
});

export const BuildParamsStacks = t.partial({
  contractName: t.unknown,
  functionName: t.unknown,
  functionArgs: t.unknown,
});

export const SbtcWithdrawParams = t.partial({
  amount: t.string,
  btcAddress: t.string,
  maxFee: t.string,
});

export const BuildParamsSbtc = t.partial({
  sbtcWithdrawParams: SbtcWithdrawParams,
  sbtcDepositParams: t.unknown,
});

export const BuildParamsOffchain = t.partial({
  idfSignedTimestamp: t.unknown,
  idfVersion: t.unknown,
  idfUserId: t.unknown,
});

/**
 * WebAuthn attestation proving a passkey user signed off on this withdrawal intent.
 * Pure pass-through — the SDK does not validate or interpret this payload.
 *
 * @bitgo/public-types' TxSendBody now declares this field natively (WCN-539), so /tx/send and
 * /tx/initiate no longer need a local copy. This one remains for BuildParams (custodial
 * /tx/build), which has no upstream equivalent yet.
 *
 * TODO(WCN-541): add attestation pass-through for MPC (/txrequests, /signatureshares) and
 * /pendingapprovals — see the TODO(WCN-541) markers in baseTSSUtils.ts, common.ts, and
 * pendingApproval.ts.
 */
export const AttestationPayload = t.type({
  signature: t.string,
  credentialId: t.string,
  clientDataJSON: t.string,
  authenticatorData: t.string,
});

export type AttestationPayload = t.TypeOf<typeof AttestationPayload>;

export const BuildParams = t.exact(
  t.intersection([
    BuildParamsUTXO,
    BuildParamsStacks,
    BuildParamsSbtc,
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
      flags: t.unknown,
      clearFlags: t.unknown,
      trustlineAuths: t.unknown,
      clawbacks: t.unknown,
      type: t.unknown,
      limit: t.unknown,
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
      // Solana custom instructions for transaction building
      solInstructions: t.unknown,
      // Solana versioned transaction data for transaction building
      solVersionedTransactionData: t.unknown,
      // Aptos custom transaction parameters for smart contract calls
      aptosCustomTransactionParams: t.unknown,
      isTestTransaction: t.unknown,
      feeToken: t.unknown,
      // Bridging parameters for cross-chain operations (e.g., BTC to sBTC)
      bridgingParams: t.unknown,
      defiParams: t.unknown,
      // WebAuthn attestation for the withdrawal intent (WCN-539) — pass-through only.
      attestation: AttestationPayload,
    }),
  ])
);

export type BuildParams = t.TypeOf<typeof BuildParams>;
export const buildParamKeys = getCodecProperties(BuildParams);
