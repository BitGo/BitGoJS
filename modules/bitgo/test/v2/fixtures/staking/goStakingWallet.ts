import { GoStakingRequest, UnsignedGoStakingRequest } from '@bitgo/sdk-core';

export default {
  previewGoStakingRequest: function (coin: string): UnsignedGoStakingRequest {
    return {
      payload: 'payload',
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
