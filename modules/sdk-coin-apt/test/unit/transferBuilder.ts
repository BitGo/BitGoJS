import { coins } from '@bitgo/statics';
import { TransactionBuilderFactory, TransferTransaction } from '../../src';
import * as testData from '../resources/apt';
import utils from '../../src/lib/utils';
import { TransactionType } from '@bitgo/sdk-core';
import should from 'should';

describe('Apt Transfer Transaction', () => {
  const factory = new TransactionBuilderFactory(coins.get('tapt'));

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
      should.equal(utils.isValidRawTransaction(rawTx), true);
      rawTx.should.equal(
        '0xc8f02d25aa698b3e9fbd8a08e8da4c8ee261832a25a4cde8731b5ec356537d090e0000000000000002000000000000000000000000000000000000000000000000000000000000000104636f696e087472616e73666572010700000000000000000000000000000000000000000000000000000000000000010a6170746f735f636f696e094170746f73436f696e000220f7405c28a02cf5bab4ea4498240bb3579db45951794eb1c843bef0534c093ad908e803000000000000400d03000000000064000000000000008b037d670000000002002000000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
      );
    });

    it('should build and send a signed tx', async function () {
      const txBuilder = factory.from(testData.TRANSFER);
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
      should.equal(tx.id, '0x43ea7697550d5effb68c47488fd32a7756ee418e8d2be7d6b7f634f3ac0d7766');
      should.equal(tx.maxGasAmount, 200000);
      should.equal(tx.gasUnitPrice, 100);
      should.equal(tx.sequenceNumber, 23);
      should.equal(tx.expirationTime, 1735818272);
      should.equal(tx.type, TransactionType.Send);
      const rawTx = tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.TRANSFER);
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
      const tx = (await txBuilder.build()) as TransferTransaction;
      const signablePayload = tx.signablePayload;
      should.equal(
        signablePayload.toString('hex'),
        'b5e97db07fa0bd0e5598aa3643a9bc6f6693bddc1a9fec9e674a461eaa00b193c8f02d25aa698b3e9fbd8a08e8da4c8ee261832a25a4cde8731b5ec356537d090e0000000000000002000000000000000000000000000000000000000000000000000000000000000104636f696e087472616e73666572010700000000000000000000000000000000000000000000000000000000000000010a6170746f735f636f696e094170746f73436f696e000220f7405c28a02cf5bab4ea4498240bb3579db45951794eb1c843bef0534c093ad908e803000000000000400d03000000000064000000000000008b037d670000000002'
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
      const tx = (await txBuilder.build()) as TransferTransaction;
      const toJson = tx.toJson();
      should.equal(toJson.id, 'UNAVAILABLE');
      should.equal(toJson.sender, testData.sender2.address);
      should.deepEqual(toJson.recipient, {
        address: testData.recipients[0].address,
        amount: testData.recipients[0].amount,
      });
      should.equal(toJson.sequenceNumber, 14);
      should.equal(toJson.maxGasAmount, 200000);
      should.equal(toJson.gasUnitPrice, 100);
      should.equal(toJson.expirationTime, 1736246155);
    });

    it('should build a signed tx and validate its toJson', async function () {
      const txBuilder = factory.from(testData.TRANSFER);
      const tx = (await txBuilder.build()) as TransferTransaction;
      const toJson = tx.toJson();
      should.equal(toJson.id, '0x43ea7697550d5effb68c47488fd32a7756ee418e8d2be7d6b7f634f3ac0d7766');
      should.equal(toJson.sender, '0xc8f02d25aa698b3e9fbd8a08e8da4c8ee261832a25a4cde8731b5ec356537d09');
      should.deepEqual(toJson.recipient, {
        address: '0xf7405c28a02cf5bab4ea4498240bb3579db45951794eb1c843bef0534c093ad9',
        amount: '1000',
      });
      should.equal(toJson.sequenceNumber, 23);
      should.equal(toJson.maxGasAmount, 200000);
      should.equal(toJson.gasUnitPrice, 100);
      should.equal(toJson.expirationTime, 1735818272);
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
