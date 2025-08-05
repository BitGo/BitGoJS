import * as t from 'io-ts';
import { LightningOnchainRecipient, LightningOnchainRequest } from '@bitgo/public-types';
import { PendingApprovalData, TxRequestState } from '@bitgo/sdk-core';
import { BigIntFromString } from 'io-ts-types';

export const WithdrawStatusDelivered = 'delivered';
export const WithdrawStatusFailed = 'failed';

export const WithdrawStatus = t.union([t.literal(WithdrawStatusDelivered), t.literal(WithdrawStatusFailed)]);

export const LightningOnchainWithdrawParams = t.type({
  recipients: t.array(LightningOnchainRecipient),
  satsPerVbyte: BigIntFromString,
  // todo:(current) add passphrase
  // passphrase: t.string,
});

export type LightningOnchainWithdrawParams = t.TypeOf<typeof LightningOnchainWithdrawParams>;

export const LndCreateWithdrawResponse = t.intersection(
  [
    t.type({
      status: WithdrawStatus,
    }),
    t.partial({
      txid: t.string,
      failureReason: t.string,
    }),
  ],
  'LndCreateWithdrawResponse'
);
export type LndCreateWithdrawResponse = t.TypeOf<typeof LndCreateWithdrawResponse>;

export type LightningOnchainWithdrawResponse = {
  /**
   * Unique identifier for withdraw request submitted to BitGo.
   */
  txRequestId: string;

  /**
   * Status of withdraw request submission to BitGo.
   * - `'delivered'`: Successfully received by BitGo, but may or may not have been sent to the Bitcoin network yet.
   * - For the actual withdraw status, track `transfer`.
   */
  txRequestState: TxRequestState;

  /**
   * Pending approval details, if applicable.
   * - If present, withdraw has not been initiated yet.
   */
  pendingApproval?: PendingApprovalData;

  /**
   * Current snapshot of withdraw status (if available).
   * - **`'delivered'`**: Withdraw request is delivered to the blockchain.
   * - **`'failed'`**: Withdraw failed.
   * This field is absent if approval is required before processing.
   */
  withdrawStatus?: LndCreateWithdrawResponse;

  /**
   * Latest transfer details for this withdraw request (if available).
   * - Provides the current state of the transfer.
   * - To track the latest withdraw status, monitor `transfer` asynchronously.
   * This field is absent if approval is required before processing.
   */
  transfer?: any;
};

export const FundPsbtResponse = t.type(
  {
    fundedPsbt: t.string,
    changeOutputIndex: t.number,
  },
  'FundPsbtResponse'
);
export type FundPsbtResponse = t.TypeOf<typeof FundPsbtResponse>;

export const SignPsbtRequest = t.type(
  {
    fundedPsbt: t.string,
    txRequestId: t.string,
    signedRequest: LightningOnchainRequest,
    signature: t.string,
    userAuthKey: t.string,
  },
  'SendPsbtRequest'
);
export type SignPsbtRequest = t.TypeOf<typeof SignPsbtRequest>;

export const SignPsbtResponse = t.type(
  {
    signedPsbt: t.string,
    signedTxHex: t.string,
  },
  'SendPsbtResponse'
);
export type SignPsbtResponse = t.TypeOf<typeof SignPsbtResponse>;

export const SendPsbtRequest = t.type(
  {
    signedTxHex: t.string,
    txRequestId: t.string,
    signedRequest: LightningOnchainRequest,
    signature: t.string,
    userAuthKey: t.string,
  },
  'SendPsbtRequest'
);
export type SendPsbtRequest = t.TypeOf<typeof SendPsbtRequest>;

export const SendPsbtResponse = t.intersection(
  [
    t.type({
      label: t.string,
    }),
    t.partial({
      status: WithdrawStatus,
      failureReason: t.string,
    }),
  ],
  'SendPsbtResponse'
);
export type SendPsbtResponse = t.TypeOf<typeof SendPsbtResponse>;
