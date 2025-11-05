import should from 'should';
import { coins } from '@bitgo/statics';
import { TransactionBuilderFactory, TransferTransaction } from '../../../src';
import * as testData from '../../resources/iota';
import { TransactionType } from '@bitgo/sdk-core';
import utils from '../../../src/lib/utils';
import { MAX_GAS_PAYMENT_OBJECTS } from '../../../src/lib/constants';

describe('Iota Transfer Builder', () => {
  const factory = new TransactionBuilderFactory(coins.get('tiota'));

  describe('Succeed', () => {
    it('should build a transfer tx with simulate mode', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.sender.address);
      txBuilder.recipients(testData.recipients);
      txBuilder.paymentObjects(testData.paymentObjects);

      const tx = (await txBuilder.build()) as TransferTransaction;
      should.equal(tx.type, TransactionType.Send);
      should.equal(tx.sender, testData.sender.address);
      should.equal(tx.isSimulateTx, true);
      should.deepEqual(tx.recipients, testData.recipients);
      should.deepEqual(tx.paymentObjects, testData.paymentObjects);

      const rawTx = await tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);
    });

    it('should build a transfer tx with gas data', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.sender.address);
      txBuilder.recipients(testData.recipients);
      txBuilder.paymentObjects(testData.paymentObjects);
      txBuilder.gasData(testData.gasData);

      const tx = (await txBuilder.build()) as TransferTransaction;
      should.equal(tx.type, TransactionType.Send);
      should.equal(tx.sender, testData.sender.address);
      should.equal(tx.isSimulateTx, false);
      should.equal(tx.gasBudget, testData.GAS_BUDGET);
      should.equal(tx.gasPrice, testData.GAS_PRICE);
      should.deepEqual(tx.gasPaymentObjects, testData.gasPaymentObjects);

      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: testData.sender.address,
        value: (testData.AMOUNT + testData.AMOUNT * 2).toString(),
        coin: 'tiota',
      });

      tx.outputs.length.should.equal(2);
      tx.outputs[0].should.deepEqual({
        address: testData.recipients[0].address,
        value: testData.recipients[0].amount,
        coin: 'tiota',
      });
      tx.outputs[1].should.deepEqual({
        address: testData.recipients[1].address,
        value: testData.recipients[1].amount,
        coin: 'tiota',
      });

      const rawTx = await tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);
    });

    it('should build a transfer tx with gas sponsor', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.sender.address);
      txBuilder.recipients(testData.recipients);
      txBuilder.paymentObjects(testData.paymentObjects);
      txBuilder.gasData(testData.gasData);
      txBuilder.gasSponsor(testData.gasSponsor.address);

      const tx = (await txBuilder.build()) as TransferTransaction;
      should.equal(tx.type, TransactionType.Send);
      should.equal(tx.sender, testData.sender.address);
      should.equal(tx.gasSponsor, testData.gasSponsor.address);
      should.equal(tx.isSimulateTx, false);

      const rawTx = await tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);
    });

    it('should build a transfer tx with multiple recipients', async function () {
      const amount = 1000;
      const numberOfRecipients = 10;

      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.sender.address);

      const recipients = new Array(numberOfRecipients).fill({
        address: testData.addresses.validAddresses[0],
        amount: amount.toString(),
      });

      txBuilder.recipients(recipients);
      txBuilder.paymentObjects(testData.paymentObjects);
      txBuilder.gasData(testData.gasData);

      const tx = (await txBuilder.build()) as TransferTransaction;
      should.equal(tx.type, TransactionType.Send);
      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: testData.sender.address,
        value: (amount * numberOfRecipients).toString(),
        coin: 'tiota',
      });

      tx.outputs.length.should.equal(numberOfRecipients);
      tx.outputs.forEach((output) =>
        output.should.deepEqual({
          address: testData.addresses.validAddresses[0],
          value: amount.toString(),
          coin: 'tiota',
        })
      );
    });

    it('should parse from JSON and rebuild transaction', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.sender.address);
      txBuilder.recipients(testData.recipients);
      txBuilder.paymentObjects(testData.paymentObjects);
      txBuilder.gasData(testData.gasData);

      const tx = (await txBuilder.build()) as TransferTransaction;
      const txJson = tx.toJson();

      const rebuiltTxBuilder = factory.getTransferBuilder();
      (rebuiltTxBuilder.transaction as TransferTransaction).parseFromJSON(txJson);
      const rebuiltTx = (await rebuiltTxBuilder.build()) as TransferTransaction;

      should.equal(rebuiltTx.sender, tx.sender);
      should.deepEqual(rebuiltTx.recipients, tx.recipients);
      should.equal(rebuiltTx.gasBudget, tx.gasBudget);
      should.equal(rebuiltTx.gasPrice, tx.gasPrice);
    });

    it('should serialize to broadcast format consistently', async function () {
      const txBuilder1 = factory.getTransferBuilder();
      txBuilder1.sender(testData.sender.address);
      txBuilder1.recipients(testData.recipients);
      txBuilder1.paymentObjects(testData.paymentObjects);
      txBuilder1.gasData(testData.gasData);

      const tx1 = (await txBuilder1.build()) as TransferTransaction;
      const rawTx1 = await tx1.toBroadcastFormat();

      const txBuilder2 = factory.getTransferBuilder();
      txBuilder2.sender(testData.sender.address);
      txBuilder2.recipients(testData.recipients);
      txBuilder2.paymentObjects(testData.paymentObjects);
      txBuilder2.gasData(testData.gasData);

      const tx2 = (await txBuilder2.build()) as TransferTransaction;
      const rawTx2 = await tx2.toBroadcastFormat();

      should.equal(rawTx1, rawTx2);
      should.equal(tx1.type, TransactionType.Send);
    });

    it('should build tx with signable payload', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.sender.address);
      txBuilder.recipients(testData.recipients);
      txBuilder.paymentObjects(testData.paymentObjects);
      txBuilder.gasData(testData.gasData);

      const tx = (await txBuilder.build()) as TransferTransaction;
      should.equal(tx.isSimulateTx, false);

      const signablePayload = tx.signablePayload;
      should.exist(signablePayload);
      should.equal(Buffer.isBuffer(signablePayload), true);
      should.equal(signablePayload.length, 32); // Blake2b hash is 32 bytes
    });

    it('should validate toJSON output', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.sender.address);
      txBuilder.recipients(testData.recipients);
      txBuilder.paymentObjects(testData.paymentObjects);
      txBuilder.gasData(testData.gasData);

      const tx = (await txBuilder.build()) as TransferTransaction;
      const txJson = tx.toJson();

      should.equal(txJson.sender, testData.sender.address);
      should.deepEqual(txJson.recipients, testData.recipients);
      should.deepEqual(txJson.paymentObjects, testData.paymentObjects);
      should.equal(txJson.gasBudget, testData.GAS_BUDGET);
      should.equal(txJson.gasPrice, testData.GAS_PRICE);
      should.deepEqual(txJson.gasPaymentObjects, testData.gasPaymentObjects);
      should.equal(txJson.type, TransactionType.Send);
    });
  });

  describe('Fail', () => {
    it('should fail for invalid sender', function () {
      const builder = factory.getTransferBuilder();
      should(() => builder.sender('randomString')).throwError('Invalid address randomString');
    });

    it('should fail for invalid recipient address', function () {
      const builder = factory.getTransferBuilder();
      builder.sender(testData.sender.address);
      should(() => builder.recipients([{ address: 'invalidAddress', amount: '1000' }])).throwError(
        'Invalid address invalidAddress'
      );
    });

    it('should fail for invalid recipient amount', function () {
      const builder = factory.getTransferBuilder();
      builder.sender(testData.sender.address);
      should(() => builder.recipients([{ address: testData.addresses.validAddresses[0], amount: '-1000' }])).throwError(
        'Value cannot be less than zero'
      );
    });

    it('should fail for empty recipients during build', async function () {
      const builder = factory.getTransferBuilder();
      builder.sender(testData.sender.address);
      builder.recipients([]);
      builder.paymentObjects(testData.paymentObjects);
      builder.gasData(testData.gasData);

      await builder.build().should.be.rejected();
    });

    it('should fail for empty payment objects', function () {
      const builder = factory.getTransferBuilder();
      builder.sender(testData.sender.address);
      builder.recipients(testData.recipients);
      should(() => builder.paymentObjects([])).throwError('No Objects provided for payment');
    });

    it('should fail when gas payment objects exceed maximum', async function () {
      const builder = factory.getTransferBuilder();
      builder.sender(testData.sender.address);
      builder.recipients(testData.recipients);
      builder.paymentObjects(testData.paymentObjects);

      const tooManyGasObjects = testData.generateObjects(MAX_GAS_PAYMENT_OBJECTS + 1);
      builder.gasData({
        gasBudget: testData.GAS_BUDGET,
        gasPrice: testData.GAS_PRICE,
        gasPaymentObjects: tooManyGasObjects,
      });

      await builder.build().should.be.rejected();
    });

    it('should fail to build without sender', async function () {
      const builder = factory.getTransferBuilder();
      builder.recipients(testData.recipients);
      builder.paymentObjects(testData.paymentObjects);
      builder.gasData(testData.gasData);

      await builder.build().should.be.rejected();
    });

    it('should fail to build without recipients', async function () {
      const builder = factory.getTransferBuilder();
      builder.sender(testData.sender.address);
      builder.paymentObjects(testData.paymentObjects);
      builder.gasData(testData.gasData);

      await builder.build().should.be.rejected();
    });

    it('should fail to build without payment objects', async function () {
      const builder = factory.getTransferBuilder();
      builder.sender(testData.sender.address);
      builder.recipients(testData.recipients);
      builder.gasData(testData.gasData);

      await builder.build().should.be.rejected();
    });

    it('should fail to get signable payload for simulate tx', async function () {
      const builder = factory.getTransferBuilder();
      builder.sender(testData.sender.address);
      builder.recipients(testData.recipients);
      builder.paymentObjects(testData.paymentObjects);

      const tx = (await builder.build()) as TransferTransaction;
      should.equal(tx.isSimulateTx, true);

      should(() => tx.signablePayload).throwError('Cannot sign a simulate tx');
    });

    it('should fail when payment and gas payment objects overlap', async function () {
      const builder = factory.getTransferBuilder();
      builder.sender(testData.sender.address);
      builder.recipients(testData.recipients);
      // Use same objects for payment and gas
      builder.paymentObjects(testData.gasPaymentObjects);
      builder.gasData(testData.gasData);

      await builder.build().should.be.rejected();
    });

    it('should fail to parse invalid raw transaction', function () {
      should(() => factory.from('invalidRawTransaction')).throwError();
    });
  });
});
