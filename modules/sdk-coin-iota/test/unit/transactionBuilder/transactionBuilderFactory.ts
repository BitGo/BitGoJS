import should from 'should';
import { coins } from '@bitgo/statics';
import { TransactionBuilderFactory, TransferBuilder, TransferTransaction } from '../../../src';
import * as testData from '../../resources/iota';

describe('Iota Transaction Builder Factory', () => {
  const factory = new TransactionBuilderFactory(coins.get('tiota'));

  describe('getTransferBuilder', () => {
    it('should create a transfer builder', function () {
      const builder = factory.getTransferBuilder();
      should.exist(builder);
      should(builder instanceof TransferBuilder).be.true();
    });

    it('should create a transfer builder with existing transaction', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.sender.address);
      txBuilder.recipients(testData.recipients);
      txBuilder.paymentObjects(testData.paymentObjects);
      txBuilder.gasData(testData.gasData);

      const tx = (await txBuilder.build()) as TransferTransaction;

      const newBuilder = factory.getTransferBuilder(tx);
      should.exist(newBuilder);
      should(newBuilder instanceof TransferBuilder).be.true();

      const rebuiltTx = (await newBuilder.build()) as TransferTransaction;
      should.equal(rebuiltTx.sender, tx.sender);
      should.deepEqual(rebuiltTx.recipients, tx.recipients);
    });
  });

  describe('from', () => {
    it('should create builder from raw transaction data', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.sender.address);
      txBuilder.recipients(testData.recipients);
      txBuilder.paymentObjects(testData.paymentObjects);
      txBuilder.gasData(testData.gasData);

      const tx = (await txBuilder.build()) as TransferTransaction;
      const rawTx = await tx.toBroadcastFormat();
      const txHex = Buffer.from(rawTx, 'base64').toString('hex');

      const rebuiltBuilder = factory.from(txHex);
      should.exist(rebuiltBuilder);
      should(rebuiltBuilder instanceof TransferBuilder).be.true();
      const rebuiltTx = (await rebuiltBuilder.build()) as TransferTransaction;
      rebuiltTx.sender.should.equal(testData.sender.address);
      rebuiltTx.recipients.length.should.equal(testData.recipients.length);
      rebuiltTx.recipients[0].address.should.equal(testData.recipients[0].address);
      rebuiltTx.recipients[0].amount.should.equal(testData.recipients[0].amount);
      should.exist(rebuiltTx.paymentObjects);
      rebuiltTx.paymentObjects?.length.should.equal(testData.paymentObjects.length);
    });

    it('should handle Uint8Array format', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.sender.address);
      txBuilder.recipients(testData.recipients);
      txBuilder.paymentObjects(testData.paymentObjects);
      txBuilder.gasData(testData.gasData);

      const tx = (await txBuilder.build()) as TransferTransaction;
      const rawTx = await tx.toBroadcastFormat();
      const rawTxBytes = Buffer.from(rawTx, 'base64');

      const rebuiltBuilder = factory.from(rawTxBytes);
      should.exist(rebuiltBuilder);
      should(rebuiltBuilder instanceof TransferBuilder).be.true();
      const rebuiltTx = (await rebuiltBuilder.build()) as TransferTransaction;
      rebuiltTx.sender.should.equal(testData.sender.address);
      rebuiltTx.recipients.length.should.equal(testData.recipients.length);
      rebuiltTx.recipients[0].address.should.equal(testData.recipients[0].address);
      rebuiltTx.recipients[0].amount.should.equal(testData.recipients[0].amount);
      should.exist(rebuiltTx.paymentObjects);
      rebuiltTx.paymentObjects?.length.should.equal(testData.paymentObjects.length);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for invalid raw transaction', function () {
      should(() => factory.from('invalid-raw-transaction')).throwError();
    });

    it('should throw error for empty raw transaction', function () {
      should(() => factory.from('')).throwError();
    });

    it('should throw error for unsupported transaction type', async function () {
      // This would require creating a transaction with unsupported commands
      // For now, we test that invalid data throws an error
      const invalidData = Buffer.from('not-a-valid-transaction').toString('base64');
      should(() => factory.from(invalidData)).throwError();
    });

    it('should throw error when getWalletInitializationBuilder is called', function () {
      should(() => factory.getWalletInitializationBuilder()).throwError('Method not implemented.');
    });
  });

  describe('Transaction Rebuilding and Modification', () => {
    it('should allow creating transactions with modifications', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.sender.address);
      txBuilder.recipients(testData.recipients);
      txBuilder.paymentObjects(testData.paymentObjects);
      txBuilder.gasData(testData.gasData);

      const tx = (await txBuilder.build()) as TransferTransaction;
      should.equal(tx.gasBudget, testData.GAS_BUDGET);

      // Create a new builder with modified gas budget
      const modifiedBuilder = factory.getTransferBuilder();
      modifiedBuilder.sender(testData.sender.address);
      modifiedBuilder.recipients(testData.recipients);
      modifiedBuilder.paymentObjects(testData.paymentObjects);
      modifiedBuilder.gasData({
        gasBudget: testData.GAS_BUDGET * 2,
        gasPrice: testData.GAS_PRICE,
        gasPaymentObjects: testData.gasPaymentObjects,
      });

      const modifiedTx = (await modifiedBuilder.build()) as TransferTransaction;
      should.equal(modifiedTx.gasBudget, testData.GAS_BUDGET * 2);
    });

    it('should allow adding gas sponsor to transaction', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.sender.address);
      txBuilder.recipients(testData.recipients);
      txBuilder.paymentObjects(testData.paymentObjects);
      txBuilder.gasData(testData.gasData);
      txBuilder.gasSponsor(testData.gasSponsor.address);

      const tx = (await txBuilder.build()) as TransferTransaction;
      should.equal(tx.gasSponsor, testData.gasSponsor.address);
    });

    it('should maintain transaction ID for identical transactions', async function () {
      const txBuilder1 = factory.getTransferBuilder();
      txBuilder1.sender(testData.sender.address);
      txBuilder1.recipients(testData.recipients);
      txBuilder1.paymentObjects(testData.paymentObjects);
      txBuilder1.gasData(testData.gasData);

      const tx1 = (await txBuilder1.build()) as TransferTransaction;
      const id1 = tx1.id;

      const txBuilder2 = factory.getTransferBuilder();
      txBuilder2.sender(testData.sender.address);
      txBuilder2.recipients(testData.recipients);
      txBuilder2.paymentObjects(testData.paymentObjects);
      txBuilder2.gasData(testData.gasData);

      const tx2 = (await txBuilder2.build()) as TransferTransaction;
      const id2 = tx2.id;

      should.equal(id1, id2);
    });

    it('should correctly build transaction with gas sponsor', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.sender.address);
      txBuilder.recipients(testData.recipients);
      txBuilder.paymentObjects(testData.paymentObjects);
      txBuilder.gasData(testData.gasData);
      txBuilder.gasSponsor(testData.gasSponsor.address);

      const tx = (await txBuilder.build()) as TransferTransaction;

      should.equal(tx.sender, testData.sender.address);
      should.equal(tx.gasSponsor, testData.gasSponsor.address);
      should.notEqual(tx.sender, tx.gasSponsor);
    });
  });

  describe('Builder Initialization', () => {
    it('should initialize builder with transaction correctly', async function () {
      const originalBuilder = factory.getTransferBuilder();
      originalBuilder.sender(testData.sender.address);
      originalBuilder.recipients(testData.recipients);
      originalBuilder.paymentObjects(testData.paymentObjects);
      originalBuilder.gasData(testData.gasData);

      const originalTx = (await originalBuilder.build()) as TransferTransaction;

      const newBuilder = factory.getTransferBuilder(originalTx);
      const newTx = (await newBuilder.build()) as TransferTransaction;

      should.equal(newTx.sender, originalTx.sender);
      should.deepEqual(newTx.recipients, originalTx.recipients);
      should.equal(newTx.gasBudget, originalTx.gasBudget);
      should.equal(newTx.gasPrice, originalTx.gasPrice);
    });

    it('should allow creating builder without initial transaction', function () {
      const builder = factory.getTransferBuilder();
      should.exist(builder);
      should(builder instanceof TransferBuilder).be.true();
    });
  });

  describe('Round Trip Conversion', () => {
    it('should handle JSON round trip', async function () {
      const originalBuilder = factory.getTransferBuilder();
      originalBuilder.sender(testData.sender.address);
      originalBuilder.recipients(testData.recipients);
      originalBuilder.paymentObjects(testData.paymentObjects);
      originalBuilder.gasData(testData.gasData);

      const originalTx = (await originalBuilder.build()) as TransferTransaction;
      const json = originalTx.toJson();

      const newTx = new TransferTransaction(coins.get('tiota'));
      newTx.parseFromJSON(json);
      const newBuilder = factory.getTransferBuilder(newTx);
      const rebuiltTx = (await newBuilder.build()) as TransferTransaction;

      should.equal(rebuiltTx.sender, originalTx.sender);
      should.deepEqual(rebuiltTx.recipients, originalTx.recipients);
    });

    it('should serialize to consistent format', async function () {
      const builder1 = factory.getTransferBuilder();
      builder1.sender(testData.sender.address);
      builder1.recipients(testData.recipients);
      builder1.paymentObjects(testData.paymentObjects);
      builder1.gasData(testData.gasData);

      const tx1 = (await builder1.build()) as TransferTransaction;
      const serialized1 = await tx1.toBroadcastFormat();

      const builder2 = factory.getTransferBuilder();
      builder2.sender(testData.sender.address);
      builder2.recipients(testData.recipients);
      builder2.paymentObjects(testData.paymentObjects);
      builder2.gasData(testData.gasData);

      const tx2 = (await builder2.build()) as TransferTransaction;
      const serialized2 = await tx2.toBroadcastFormat();

      should.equal(serialized1, serialized2);
    });
  });
});
