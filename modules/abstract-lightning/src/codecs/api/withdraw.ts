import * as t from 'io-ts';
import { LightningOnchainRequest } from '@bitgo/public-types';
import { PendingApprovalData, TxRequestState } from '@bitgo/sdk-core';

// todo:(current) which to keep here which to take to common types
export const LightningOnchainWithdrawParams = t.intersection([
  LightningOnchainRequest,
  t.type({
    // todo:(current) add passphrase
    // passphrase: t.string,
  }),
]);

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
