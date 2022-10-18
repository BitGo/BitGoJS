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
      txBuilder.payTx(testData.payTx);
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
        address: testData.recipients[0],
        value: testData.AMOUNT.toString(),
        coin: 'tsui',
      });
      const rawTx = tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.TRANSFER_TX);
    });
  });

  describe('Fail', () => {
    it('should fail for invalid sender', async function () {
      const builder = factory.getTransferBuilder();
      should(() => builder.sender('randomString')).throwError('Invalid or missing sender, got: randomString');
    });

    it('should fail for invalid payTx', async function () {
      const builder = factory.getTransferBuilder();
      should(() => builder.payTx(testData.invalidPayTxs[0])).throwError(
        'Invalid payTx.coin, invalid or missing version'
      );
      should(() => builder.payTx(testData.invalidPayTxs[1])).throwError(
        'Invalid or missing payTx.recipient, got: randomString'
      );
      should(() => builder.payTx(testData.invalidPayTxs[2])).throwError(
        'recipients length 3 must equal to amounts length 1'
      );
      should(() => builder.payTx(testData.invalidPayTxs[3])).throwError('Invalid or missing amounts, got: 0');
    });

    it('should fail for invalid gasBudget', function () {
      const builder = factory.getTransferBuilder();
      should(() => builder.gasBudget(-1)).throwError('Invalid gas budget -1');
    });

    it('should fail for invalid gasPayment', function () {
      const builder = factory.getTransferBuilder();
      should(() =>
        builder.gasPayment({
          objectId: '',
          version: -1,
          digest: '',
        })
      ).throwError('Invalid gasPayment, invalid or missing version');
    });
  });
});
