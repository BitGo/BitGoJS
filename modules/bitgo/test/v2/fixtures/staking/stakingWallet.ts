import { PrebuildTransactionOptions, StakingRequest, StakingTransaction } from '@bitgo/sdk-core';

export default {
  txRequestId: '55ba0198-0b1f-44f6-94fe-8d782d633dde',
  stakingRequest: function (transactions: StakingTransaction[]): StakingRequest {
    return {
      id: '8638284a-dab2-46b9-b07f-21109a6e7220',
      amount: '1234',
      withdrawalAddress: 'DM24xSVH88kSSKWa6ujYomLVsPwZajhZHzYiQDo7Ntn8',
      clientId: '13f3f4fe-bff2-46df-97e8-53d914dcbbdd',
      requestingUserId: '691823db-c57b-4c7c-a3e8-7e8d7c997e6c',
      type: 'STAKE',
      enterpriseId: '4517abfb-f567-4b7a-9f91-407509d29403',
      walletId: '03564b8e-e8e7-476e-b33c-2b0ffce0b49a',
      walletType: 'hot',
      coin: 'near',
      status: 'NEW',
      statusModifiedDate: '2022-01-03T22:04:29.264Z',
      createdDate: '2019-01-03T22:04:29.264Z',
      transactions: transactions,
    };
  },
  transaction: function (status: string, buildParams?: PrebuildTransactionOptions): StakingTransaction {
    const transaction: StakingTransaction = {
      id: '00566722-daef-40eb-b0ac-fa5402bbfe72',
      stakingRequestId: '8638284a-dab2-46b9-b07f-21109a6e7220',
      delegationId: '505bda16-a000-461a-8421-1cf3f8617883',
      transactionType: 'DELEGATE',
      createdDate: '2022-01-03T22:04:29.264Z',
      status: status,
      statusModifiedDate: '2022-01-03T22:04:29.264Z',
      amount: '1234',
      pendingApprovalId: 'd99e3ae1-d2a6-4f57-87b6-d04c24854739',
      transferId: 'e4b482b0-54d5-474b-bb2b-c56ce8516b5e',
      txRequestId: this.txRequestId,
    };
    if (buildParams) {
      transaction.buildParams = buildParams;
    }
    return transaction;
  },
  buildParams: {
    recipients: [
      {
        amount: '1234',
        address: 'address',
        data: 'data',
      },
    ],
    stakingParams: {
      requestId: '8638284a-dab2-46b9-b07f-21109a6e7220',
      amount: '1234',
      validator: 'validator',
      actionType: 'DELEGATE',
    },
  },
};
