import { TransferRequest, TransferStatus } from '@bitgo/sdk-core';

export default {
  transfer: function(status: TransferStatus): TransferRequest {
    return {
      id: '00566722-daef-40eb-b0ac-fa5402bbfe72',
      status: status,
      coin: 'eth',
      amount: '1',
      receiveAddress: '0x49b8e2c4e67e1cb3bfe415e6c5a868e22c448260',
    };
  },
};
