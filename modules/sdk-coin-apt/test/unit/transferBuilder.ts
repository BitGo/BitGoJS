import { coins } from '@bitgo/statics';
import { TransactionBuilderFactory } from '../../src/lib/transactionBuilderFactory';
import * as testData from '../resources/apt';
import utils from '../../src/lib/utils';

import { TransactionType } from '@bitgo/sdk-core';
import should from 'should';
import { TransferTransaction } from '../../src';

describe('Apt Transfer Transaction', () => {
  const factory = new TransactionBuilderFactory(coins.get('tapt'));

  it('should build a transfer tx', async function () {
    const transaction = new TransferTransaction(coins.get('tapt'));
    const txBuilder = factory.getTransferBuilder(transaction);
    txBuilder.sender(testData.sender2.address);
    txBuilder.recipient(testData.recipients[0]);
    txBuilder.gasData({
      maxGasAmount: 200000,
      gasUnitPrice: 100,
    });
    txBuilder.sequenceNumber(14);
    txBuilder.expirationTime(1736246155);
    const tx = await txBuilder.build();
    should.equal(tx.type, TransactionType.Send);
    tx.inputs.length.should.equal(1);
    tx.inputs[0].should.deepEqual({
      address: testData.sender2.address,
      value: testData.recipients[0].amount,
      coin: 'tapt',
    });
    tx.outputs.length.should.equal(1);
    tx.outputs[0].should.deepEqual({
      address: testData.recipients[0].address,
      value: testData.recipients[0].amount,
      coin: 'tapt',
    });
    const rawTx = tx.toBroadcastFormat();
    should.equal(utils.isValidRawTransaction(rawTx), true);
    rawTx.should.equal(
      '0xc8f02d25aa698b3e9fbd8a08e8da4c8ee261832a25a4cde8731b5ec356537d090e0000000000000002000000000000000000000000000000000000000000000000000000000000000104636f696e087472616e73666572010700000000000000000000000000000000000000000000000000000000000000010a6170746f735f636f696e094170746f73436f696e000220f7405c28a02cf5bab4ea4498240bb3579db45951794eb1c843bef0534c093ad908e803000000000000400d03000000000064000000000000008b037d670000000002002000000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
    );
  });

  it('should build and send a signed tx', async function () {
    const txHex = testData.TRANSFER;
    const transaction = new TransferTransaction(coins.get('tapt'));
    transaction.fromRawTransaction(txHex);
    // const explainedTx = transaction.explainTransaction(); // can be used for verification
    const txBuilder = factory.getTransferBuilder(transaction);
    const tx = await txBuilder.build();
    should.equal(tx.type, TransactionType.Send);
    tx.inputs.length.should.equal(1);
    tx.inputs[0].should.deepEqual({
      address: testData.sender2.address,
      value: testData.recipients[0].amount,
      coin: 'tapt',
    });
    tx.outputs.length.should.equal(1);
    tx.outputs[0].should.deepEqual({
      address: testData.recipients[0].address,
      value: testData.recipients[0].amount,
      coin: 'tapt',
    });
    const rawTx = tx.toBroadcastFormat();
    should.equal(utils.isValidRawTransaction(rawTx), true);
    should.equal(rawTx, testData.TRANSFER);
  });
  // Invalid or Failing Test Case can be added if needed.
});
