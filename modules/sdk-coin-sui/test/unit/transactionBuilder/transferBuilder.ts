import { getBuilderFactory } from '../getBuilderFactory';
import * as testData from '../../resources/sui';
import { GAS_BUDGET } from '../../resources/sui';
import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import utils from '../../../src/lib/utils';

describe('Sui Transfer Builder', () => {
  const factory = getBuilderFactory('tsui');

  describe('Succeed', () => {
    it('should build a transfer tx', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.sender.address);
      txBuilder.payTx({
        coins: testData.inputCoins,
        recipients: [testData.recipients.recipient1],
        amounts: [testData.AMOUNT],
      });
      txBuilder.gasBudget(GAS_BUDGET);
      txBuilder.gasPayment(testData.gasPayment);
      const tx = await txBuilder.build();
      should.equal(tx.type, TransactionType.Send);

      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: testData.sender.address,
        value: testData.AMOUNT.toString(),
        coin: 'tsui',
      });
      tx.outputs.length.should.equal(1);
      tx.outputs[0].should.deepEqual({
        address: testData.recipients.recipient1,
        value: testData.AMOUNT.toString(),
        coin: 'tsui',
      });
      const rawTx = tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.TRANSFER_TX);
    });
  });
});
