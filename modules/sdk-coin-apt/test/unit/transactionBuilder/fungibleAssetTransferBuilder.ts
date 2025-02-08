import { getBuilderFactory } from '../getBuilderFactory';
import { coins } from '@bitgo/statics';
import { TransferTransaction } from '../../../src';
import * as testData from '../../resources/apt';
import { TransactionType } from '@bitgo/sdk-core';
import should from 'should';
import { FungibleAssetTransfer } from '../../../src/lib/transaction/fungibleAssetTransfer';

describe('Apt Token Transfer Builder', () => {
  const factory = getBuilderFactory('tapt:usdt');

  describe('Succeed', () => {
    it('should build a token transfer', async function () {
      const fungibleTokenTransfer = new FungibleAssetTransfer(coins.get('tapt:usdt'));
      const txBuilder = factory.getFungibleAssetTransactionBuilder(fungibleTokenTransfer);
      txBuilder.sender(testData.sender2.address);
      txBuilder.recipient(testData.fungibleTokenRecipients[0]);
      txBuilder.gasData({
        maxGasAmount: 200000,
        gasUnitPrice: 100,
      });
      txBuilder.assetId(testData.fungibleTokenAddress.usdt);
      txBuilder.sequenceNumber(14);
      txBuilder.expirationTime(1736246155);
      txBuilder.addFeePayerAddress(testData.feePayer.address);
      const tx = (await txBuilder.build()) as FungibleAssetTransfer;
      should.equal(tx.sender, testData.sender2.address);
      should.equal(tx.recipient.address, testData.fungibleTokenRecipients[0].address);
      should.equal(tx.recipient.amount, testData.fungibleTokenRecipients[0].amount);
      should.equal(tx.assetId, testData.fungibleTokenAddress.usdt);
      should.equal(tx.maxGasAmount, 200000);
      should.equal(tx.gasUnitPrice, 100);
      should.equal(tx.sequenceNumber, 14);
      should.equal(tx.expirationTime, 1736246155);
      should.equal(tx.type, TransactionType.SendToken);
      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: testData.sender2.address,
        value: testData.fungibleTokenRecipients[0].amount,
        coin: 'tapt:usdt',
      });
      tx.outputs.length.should.equal(1);
      tx.outputs[0].should.deepEqual({
        address: testData.fungibleTokenRecipients[0].address,
        value: testData.fungibleTokenRecipients[0].amount,
        coin: 'tapt:usdt',
      });
      const rawTx = tx.toBroadcastFormat();
      should.equal(txBuilder.isValidRawTransaction(rawTx), true);
      rawTx.should.equal(
        '0x1aed808916ab9b1b30b07abb53561afd46847285ce28651221d406173a3724490e00000000000000020000000000000000000000000000000000000000000000000000000000000001167072696d6172795f66756e6769626c655f73746f7265087472616e73666572010700000000000000000000000000000000000000000000000000000000000000010e66756e6769626c655f6173736574084d65746164617461000320d5d0d561493ea2b9410f67da804653ae44e793c2423707d4f11edb2e3819205020f7405c28a02cf5bab4ea4498240bb3579db45951794eb1c843bef0534c093ad9080100000000000000400d03000000000064000000000000008b037d670000000002030020000000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000dbc87a1c816d9bcd06b683c37e80c7162e4d48da7812198b830e4d5d8e0629f2002000000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
      );
    });

    it('should build and send a signed tx', async function () {
      const txBuilder = factory.from(testData.FUNGIBLE_TOKEN_TRANSFER);
      const tx = (await txBuilder.build()) as FungibleAssetTransfer;
      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: testData.sender2.address,
        value: testData.fungibleTokenRecipients[0].amount,
        coin: 'tapt:usdt',
      });
      tx.outputs.length.should.equal(1);
      tx.outputs[0].should.deepEqual({
        address: testData.fungibleTokenRecipients[0].address,
        value: testData.fungibleTokenRecipients[0].amount,
        coin: 'tapt:usdt',
      });
      should.equal(tx.id, '0x271da92f3dcd673a0bd28d26f8b49c1f0c6ead0f5be0fbab3e9412972e96d80b');
      should.equal(tx.maxGasAmount, 200000);
      should.equal(tx.gasUnitPrice, 100);
      should.equal(tx.sequenceNumber, 167);
      should.equal(tx.expirationTime, 1737893604);
      should.equal(tx.type, TransactionType.SendToken);
      const rawTx = tx.toBroadcastFormat();
      should.equal(txBuilder.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.FUNGIBLE_TOKEN_TRANSFER);
    });

    it('should succeed to validate a valid signablePayload', async function () {
      const transaction = new FungibleAssetTransfer(coins.get('tapt'));
      const txBuilder = factory.getFungibleAssetTransactionBuilder(transaction);
      txBuilder.sender(testData.sender2.address);
      txBuilder.recipient(testData.fungibleTokenRecipients[0]);
      txBuilder.gasData({
        maxGasAmount: 200000,
        gasUnitPrice: 100,
      });
      txBuilder.sequenceNumber(14);
      txBuilder.expirationTime(1736246155);
      txBuilder.assetId(testData.fungibleTokenAddress.usdt);
      txBuilder.addFeePayerAddress(testData.feePayer.address);
      const tx = (await txBuilder.build()) as FungibleAssetTransfer;
      const signablePayload = tx.signablePayload;
      should.equal(
        signablePayload.toString('hex'),
        '5efa3c4f02f83a0f4b2d69fc95c607cc02825cc4e7be536ef0992df050d9e67c011aed808916ab9b1b30b07abb53561afd46847285ce28651221d406173a3724490e00000000000000020000000000000000000000000000000000000000000000000000000000000001167072696d6172795f66756e6769626c655f73746f7265087472616e73666572010700000000000000000000000000000000000000000000000000000000000000010e66756e6769626c655f6173736574084d65746164617461000320d5d0d561493ea2b9410f67da804653ae44e793c2423707d4f11edb2e3819205020f7405c28a02cf5bab4ea4498240bb3579db45951794eb1c843bef0534c093ad9080100000000000000400d03000000000064000000000000008b037d67000000000200dbc87a1c816d9bcd06b683c37e80c7162e4d48da7812198b830e4d5d8e0629f2'
      );
    });

    it('should build a unsigned tx and validate its toJson', async function () {
      const transaction = new FungibleAssetTransfer(coins.get('tapt'));
      const txBuilder = factory.getFungibleAssetTransactionBuilder(transaction);
      txBuilder.sender(testData.sender2.address);
      txBuilder.recipient(testData.fungibleTokenRecipients[0]);
      txBuilder.gasData({
        maxGasAmount: 200000,
        gasUnitPrice: 100,
      });
      txBuilder.sequenceNumber(14);
      txBuilder.expirationTime(1736246155);
      txBuilder.assetId(testData.fungibleTokenAddress.usdt);
      txBuilder.addFeePayerAddress(testData.feePayer.address);
      const tx = (await txBuilder.build()) as FungibleAssetTransfer;
      const toJson = tx.toJson();
      should.equal(toJson.sender, testData.sender2.address);
      should.deepEqual(toJson.recipient, {
        address: testData.fungibleTokenRecipients[0].address,
        amount: testData.fungibleTokenRecipients[0].amount,
      });
      should.equal(toJson.sequenceNumber, 14);
      should.equal(tx.assetId, testData.fungibleTokenAddress.usdt);
      should.equal(toJson.maxGasAmount, 200000);
      should.equal(toJson.gasUnitPrice, 100);
      should.equal(toJson.expirationTime, 1736246155);
      should.equal(toJson.feePayer, testData.feePayer.address);
    });

    it('should build a signed tx and validate its toJson', async function () {
      const txBuilder = factory.from(testData.FUNGIBLE_TOKEN_TRANSFER);
      const tx = (await txBuilder.build()) as FungibleAssetTransfer;
      const toJson = tx.toJson();
      should.equal(toJson.id, '0x271da92f3dcd673a0bd28d26f8b49c1f0c6ead0f5be0fbab3e9412972e96d80b');
      should.equal(toJson.sender, testData.sender2.address);
      should.deepEqual(toJson.recipient, {
        address: testData.fungibleTokenRecipients[0].address,
        amount: testData.fungibleTokenRecipients[0].amount.toString(),
      });
      should.equal(tx.assetId, testData.fungibleTokenAddress.usdt);
      should.equal(toJson.sequenceNumber, 167);
      should.equal(toJson.maxGasAmount, 200000);
      should.equal(toJson.gasUnitPrice, 100);
      should.equal(toJson.expirationTime, 1737893604);
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
    it('should fail for invalid fungible token address', async function () {
      const transaction = new FungibleAssetTransfer(coins.get('tapt'));
      const txBuilder = factory.getFungibleAssetTransactionBuilder(transaction);
      should(() => txBuilder.assetId('randomString')).throwError('Invalid address randomString');
    });
  });
});
