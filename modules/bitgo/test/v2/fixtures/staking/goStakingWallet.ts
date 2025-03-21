import { GoStakingRequest, UnsignedGoStakingRequest } from '@bitgo/sdk-core';

export default {
  previewGoStakingRequest: function (coin: string): UnsignedGoStakingRequest {
    return {
      payload:
        '{"coin":"ofctsol","recipients":[{"address":"ANTqf3wcfUqdPWcn1YsYF5X4BBsC1E4gVKKJW7QaRYGh","amount":"1000000"}],"fromAccount":"6733daae98a5c3f5a565a719e328c2a7","nonce":"2cc231b3-693c-497d-a2fa-8d43f3c9f219","timestamp":"2025-03-04T14:41:46.671Z","feeString":"0","shortCircuitBlockchainTransfer":false,"isIntraJXTransfer":false}',
      feeInfo: {
        feeString: '0',
      },
      coin: 'ofc',
      token: coin,
    };
  },
  finalizeGoStakingRequest: function (coin: string, type: 'STAKE' | 'UNSTAKE'): GoStakingRequest {
    return {
      id: 'string',
      amount: '1',
      type: type,
      coin: coin,
      status: 'NEW',
      goSpecificStatus: 'NEW',
      statusModifiedDate: '2025-01-03T22:04:29.264Z',
      createdDate: '2025-01-03T22:04:29.264Z',
    };
  },
};
