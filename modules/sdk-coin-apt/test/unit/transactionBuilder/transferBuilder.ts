import { coins } from '@bitgo/statics';
import { TransactionBuilderFactory, TransferTransaction } from '../../../src';
import * as testData from '../../resources/apt';
import { TransactionType } from '@bitgo/sdk-core';
import should from 'should';

describe('Apt Transfer Transaction', () => {
  const factory = new TransactionBuilderFactory(coins.get('tapt'));

  describe('Aptos Coin Transfer Transaction', () => {
    describe('Succeed', () => {
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
        txBuilder.addFeePayerAddress(testData.feePayer.address);
        txBuilder.setIsSimulateTxn(true);
        const tx = (await txBuilder.build()) as TransferTransaction;
        should.equal(tx.sender, testData.sender2.address);
        should.equal(tx.recipient.address, testData.recipients[0].address);
        should.equal(tx.recipient.amount, testData.recipients[0].amount);
        should.equal(tx.maxGasAmount, 200000);
        should.equal(tx.gasUnitPrice, 100);
        should.equal(tx.sequenceNumber, 14);
        should.equal(tx.expirationTime, 1736246155);
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
        should.equal(txBuilder.isValidRawTransaction(rawTx), true);
        rawTx.should.equal(
          '0x1aed808916ab9b1b30b07abb53561afd46847285ce28651221d406173a3724490e000000000000000200000000000000000000000000000000000000000000000000000000000000010d6170746f735f6163636f756e740e7472616e736665725f636f696e73010700000000000000000000000000000000000000000000000000000000000000010a6170746f735f636f696e094170746f73436f696e000220f7405c28a02cf5bab4ea4498240bb3579db45951794eb1c843bef0534c093ad908e803000000000000400d03000000000064000000000000008b037d67000000000203040000dbc87a1c816d9bcd06b683c37e80c7162e4d48da7812198b830e4d5d8e0629f204'
        );
      });

      it('should build and send a signed tx', async function () {
        const txBuilder = factory.from(testData.TRANSACTION_USING_TRANSFER_COINS);
        txBuilder.getSequenceNumber().should.equal(146);

        const tx = (await txBuilder.build()) as TransferTransaction;
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
        should.equal(tx.id, '0x249289a8178e4b9cdb89fad6e8e436ccc435753e4ea3c9d50e0c8b525582e90d');
        should.equal(tx.maxGasAmount, 200000);
        should.equal(tx.gasUnitPrice, 100);
        should.equal(tx.sequenceNumber, 146);
        should.equal(tx.expirationTime, 1737528215);
        should.equal(tx.type, TransactionType.Send);
        const rawTx = tx.toBroadcastFormat();
        should.equal(txBuilder.isValidRawTransaction(rawTx), true);
        should.equal(rawTx, testData.TRANSACTION_USING_TRANSFER_COINS);
      });

      it('should succeed to validate a valid signablePayload', async function () {
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
        txBuilder.addFeePayerAddress(testData.feePayer.address);
        const tx = (await txBuilder.build()) as TransferTransaction;
        const signablePayload = tx.signablePayload;
        should.equal(
          signablePayload.toString('hex'),
          '5efa3c4f02f83a0f4b2d69fc95c607cc02825cc4e7be536ef0992df050d9e67c011aed808916ab9b1b30b07abb53561afd46847285ce28651221d406173a3724490e000000000000000200000000000000000000000000000000000000000000000000000000000000010d6170746f735f6163636f756e740e7472616e736665725f636f696e73010700000000000000000000000000000000000000000000000000000000000000010a6170746f735f636f696e094170746f73436f696e000220f7405c28a02cf5bab4ea4498240bb3579db45951794eb1c843bef0534c093ad908e803000000000000400d03000000000064000000000000008b037d67000000000200dbc87a1c816d9bcd06b683c37e80c7162e4d48da7812198b830e4d5d8e0629f2'
        );
      });

      it('should build a unsigned tx and validate its toJson', async function () {
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
        txBuilder.addFeePayerAddress(testData.feePayer.address);
        const tx = (await txBuilder.build()) as TransferTransaction;
        const toJson = tx.toJson();
        should.equal(toJson.sender, testData.sender2.address);
        should.deepEqual(toJson.recipient, {
          address: testData.recipients[0].address,
          amount: testData.recipients[0].amount,
        });
        should.equal(toJson.sequenceNumber, 14);
        should.equal(toJson.maxGasAmount, 200000);
        should.equal(toJson.gasUnitPrice, 100);
        should.equal(toJson.expirationTime, 1736246155);
        should.equal(toJson.feePayer, testData.feePayer.address);
      });

      it('should build a signed tx and validate its toJson', async function () {
        const txBuilder = factory.from(testData.TRANSACTION_USING_TRANSFER_COINS);
        const tx = (await txBuilder.build()) as TransferTransaction;
        const toJson = tx.toJson();
        should.equal(toJson.id, '0x249289a8178e4b9cdb89fad6e8e436ccc435753e4ea3c9d50e0c8b525582e90d');
        should.equal(toJson.sender, '0x1aed808916ab9b1b30b07abb53561afd46847285ce28651221d406173a372449');
        should.deepEqual(toJson.recipient, {
          address: '0xf7405c28a02cf5bab4ea4498240bb3579db45951794eb1c843bef0534c093ad9',
          amount: '1000',
        });
        should.equal(toJson.sequenceNumber, 146);
        should.equal(toJson.maxGasAmount, 200000);
        should.equal(toJson.gasUnitPrice, 100);
        should.equal(toJson.expirationTime, 1737528215);
      });
    });

    describe('Fail', () => {
      it('should fail for invalid sender', async function () {
        const transaction = new TransferTransaction(coins.get('tapt'));
        const builder = factory.getTransferBuilder(transaction);
        should(() => builder.sender('randomString')).throwError('Invalid address randomString');
      });

      it('should fail for invalid recipient', async function () {
        const builder = factory.getTransferBuilder();
        should(() => builder.recipient(testData.invalidRecipients[0])).throwError('Invalid address randomString');
        should(() => builder.recipient(testData.invalidRecipients[1])).throwError('Value cannot be less than zero');
        should(() => builder.recipient(testData.invalidRecipients[2])).throwError('Invalid amount format');
      });
      it('should fail for invalid gas amount', async function () {
        const builder = factory.getTransferBuilder();
        should(() => builder.gasData({ maxGasAmount: -1, gasUnitPrice: 100 })).throwError(
          'Value cannot be less than zero'
        );
        should(() => builder.gasData({ maxGasAmount: 200000, gasUnitPrice: -1 })).throwError(
          'Value cannot be less than zero'
        );
      });
    });
  });

  describe('Legacy Coin Transfer Transaction', () => {
    it('should build a coinz (legacy coin) transfer tx', async function () {
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
      txBuilder.assetId(testData.LEGACY_COIN);
      txBuilder.addFeePayerAddress(testData.feePayer.address);
      txBuilder.setIsSimulateTxn(true);
      const tx = (await txBuilder.build()) as TransferTransaction;
      should.equal(tx.sender, testData.sender2.address);
      should.equal(tx.recipient.address, testData.recipients[0].address);
      should.equal(tx.recipient.amount, testData.recipients[0].amount);
      should.equal(tx.maxGasAmount, 200000);
      should.equal(tx.gasUnitPrice, 100);
      should.equal(tx.sequenceNumber, 14);
      should.equal(tx.expirationTime, 1736246155);
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
      should.equal(txBuilder.isValidRawTransaction(rawTx), true);
      rawTx.should.equal(
        '0x1aed808916ab9b1b30b07abb53561afd46847285ce28651221d406173a3724490e000000000000000200000000000000000000000000000000000000000000000000000000000000010d6170746f735f6163636f756e740e7472616e736665725f636f696e7301074fb379c10c763a13e724064ecfb7d946690bea519ba982c81b518d1c11dd23fe0766615f7465737405436f696e7a000220f7405c28a02cf5bab4ea4498240bb3579db45951794eb1c843bef0534c093ad908e803000000000000400d03000000000064000000000000008b037d67000000000203040000dbc87a1c816d9bcd06b683c37e80c7162e4d48da7812198b830e4d5d8e0629f204'
      );
    });

    it('should succeed to validate a valid signablePayload for coinz (legacy coin)', async function () {
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
      txBuilder.assetId(testData.LEGACY_COIN);
      txBuilder.addFeePayerAddress(testData.feePayer.address);
      const tx = (await txBuilder.build()) as TransferTransaction;
      const signablePayload = tx.signablePayload;
      should.equal(
        signablePayload.toString('hex'),
        '5efa3c4f02f83a0f4b2d69fc95c607cc02825cc4e7be536ef0992df050d9e67c011aed808916ab9b1b30b07abb53561afd46847285ce28651221d406173a3724490e000000000000000200000000000000000000000000000000000000000000000000000000000000010d6170746f735f6163636f756e740e7472616e736665725f636f696e7301074fb379c10c763a13e724064ecfb7d946690bea519ba982c81b518d1c11dd23fe0766615f7465737405436f696e7a000220f7405c28a02cf5bab4ea4498240bb3579db45951794eb1c843bef0534c093ad908e803000000000000400d03000000000064000000000000008b037d67000000000200dbc87a1c816d9bcd06b683c37e80c7162e4d48da7812198b830e4d5d8e0629f2'
      );
    });

    it('should build a coinz (legacy coin) unsigned tx and validate its toJson', async function () {
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
      txBuilder.assetId(testData.LEGACY_COIN);
      txBuilder.addFeePayerAddress(testData.feePayer.address);
      const tx = (await txBuilder.build()) as TransferTransaction;
      const toJson = tx.toJson();
      should.equal(toJson.sender, testData.sender2.address);
      should.deepEqual(toJson.recipient, {
        address: testData.recipients[0].address,
        amount: testData.recipients[0].amount,
      });
      should.equal(toJson.sequenceNumber, 14);
      should.equal(toJson.maxGasAmount, 200000);
      should.equal(toJson.gasUnitPrice, 100);
      should.equal(toJson.expirationTime, 1736246155);
      should.equal(toJson.feePayer, testData.feePayer.address);
    });
  });
});
