import { TransactionType } from '@bitgo/sdk-core';
import should from 'should';

import * as testData from '../../resources/fetchai';
import { getBuilderFactory } from '../getBuilderFactory';

describe('Fetch.ai Transaction Builder', async () => {
  const testCoinString = 'tfetchai';
  const factory = getBuilderFactory(testCoinString);
  const testTxData = testData.TEST_SEND_TX;
  let data;

  beforeEach(() => {
    data = [
      {
        type: TransactionType.Send,
        testTx: testData.TEST_SEND_TX,
        builder: factory.getTransferBuilder(),
      },
    ];
  });

  it('should build a signed tx from signed tx data', async function () {
    const txBuilder = factory.from(testTxData.signedTxBase64);
    const tx = await txBuilder.build();
    should.equal(tx.type, TransactionType.Send);
    // Should recreate the same raw tx data when re-build and turned to broadcast format
    const rawTx = tx.toBroadcastFormat();
    should.equal(rawTx, testTxData.signedTxBase64);
  });

  describe('gasBudget tests', async () => {
    it('should succeed for valid gasBudget', function () {
      for (const { builder } of data) {
        should.doesNotThrow(() => builder.gasBudget(testTxData.gasBudget));
      }
    });

    it('should throw for invalid gasBudget', function () {
      const invalidGasBudget = 0;
      for (const { builder } of data) {
        should(() => builder.gasBudget({ gasLimit: invalidGasBudget })).throw('Invalid gas limit ' + invalidGasBudget);
      }
    });
  });

  it('validateAddress', function () {
    const invalidAddress = { address: 'randomString' };
    for (const { builder } of data) {
      should.doesNotThrow(() => builder.validateAddress({ address: testTxData.sender }));
      should(() => builder.validateAddress(invalidAddress)).throwError(
        'transactionBuilder: address isValidAddress check failed: ' + invalidAddress.address
      );
    }
  });
});
