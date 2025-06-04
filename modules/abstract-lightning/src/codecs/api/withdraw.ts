import * as t from 'io-ts';
import { LightningOnchainRecipient } from '@bitgo/public-types';
import { PendingApprovalData, TxRequestState } from '@bitgo/sdk-core';
import { BigIntFromString } from 'io-ts-types';

// todo:(current) which to keep here which to take to common types
export const LightningOnchainWithdrawParams = t.type({
  recipients: t.array(LightningOnchainRecipient),
  satsPerVbyte: BigIntFromString,
  // todo:(current) add passphrase
  // passphrase: t.string,
});

export type LightningOnchainWithdrawParams = t.TypeOf<typeof LightningOnchainWithdrawParams>;

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
  },
  'SendPsbtRequest'
);
export type SendPsbtRequest = t.TypeOf<typeof SendPsbtRequest>;

export const SendPsbtResponse = t.type(
  {
    label: t.string,
  },
  'SendPsbtResponse'
);
export type SendPsbtResponse = t.TypeOf<typeof SendPsbtResponse>;
