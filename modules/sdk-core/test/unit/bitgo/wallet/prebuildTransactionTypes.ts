import assert from 'assert';

import type { PrebuildTransactionFeeInfo, PrebuildTransactionResult } from '../../../../src/bitgo/wallet/iWallet';

describe('PrebuildTransactionFeeInfo', () => {
  it('assigns feeInfo on PrebuildTransactionResult', () => {
    const feeInfo: PrebuildTransactionFeeInfo = {
      fee: 1000,
      feeString: '1000',
    };

    const prebuild: Pick<PrebuildTransactionResult, 'walletId' | 'feeInfo'> = {
      walletId: 'wallet-id',
      feeInfo,
    };

    assert.strictEqual(prebuild.feeInfo?.feeString, '1000');
  });
});
