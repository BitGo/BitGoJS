import should from 'should';
import { coins } from '@bitgo/statics';
import { TransactionBuilderFactory, TransferTransaction } from '../../../src';
import * as testData from '../../resources/iota';
import BigNumber from 'bignumber.js';

describe('Iota Transaction Builder', () => {
  const factory = new TransactionBuilderFactory(coins.get('tiota'));

  describe('Validation Methods', () => {
    describe('validateAddress', () => {
      it('should validate correct addresses', function () {
        const builder = factory.getTransferBuilder();
        should.doesNotThrow(() => builder.validateAddress({ address: testData.sender.address }));
        should.doesNotThrow(() => builder.validateAddress({ address: testData.addresses.validAddresses[0] }));
      });

      it('should throw error for invalid address', function () {
        const builder = factory.getTransferBuilder();
        should(() => builder.validateAddress({ address: 'invalidAddress' })).throwError(
          'Invalid address invalidAddress'
        );
      });

      it('should throw error for empty address', function () {
        const builder = factory.getTransferBuilder();
        should(() => builder.validateAddress({ address: '' })).throwError(/Invalid address/);
      });

      it('should validate addresses with 0x prefix', function () {
        const builder = factory.getTransferBuilder();
        testData.addresses.validAddresses.forEach((address) => {
          should.doesNotThrow(() => builder.validateAddress({ address }));
        });
      });

      it('should reject addresses without proper format', function () {
        const builder = factory.getTransferBuilder();
        testData.addresses.invalidAddresses.forEach((address) => {
          should(() => builder.validateAddress({ address })).throwError();
        });
      });
    });

    describe('validateValue', () => {
      it('should validate positive values', function () {
        const builder = factory.getTransferBuilder();
        should.doesNotThrow(() => builder.validateValue(new BigNumber(1000)));
        should.doesNotThrow(() => builder.validateValue(new BigNumber(1)));
        should.doesNotThrow(() => builder.validateValue(new BigNumber(999999999)));
      });

      it('should validate zero value', function () {
        const builder = factory.getTransferBuilder();
        should.doesNotThrow(() => builder.validateValue(new BigNumber(0)));
      });

      it('should throw error for negative values', function () {
        const builder = factory.getTransferBuilder();
        should(() => builder.validateValue(new BigNumber(-1))).throwError('Value cannot be less than zero');
        should(() => builder.validateValue(new BigNumber(-1000))).throwError('Value cannot be less than zero');
      });

      it('should throw error for NaN values', function () {
        const builder = factory.getTransferBuilder();
        should(() => builder.validateValue(new BigNumber(NaN))).throwError('Invalid amount format');
      });

      it('should validate large values', function () {
        const builder = factory.getTransferBuilder();
        should.doesNotThrow(() => builder.validateValue(new BigNumber('1000000000000000000')));
      });

      it('should validate decimal values', function () {
        const builder = factory.getTransferBuilder();
        should.doesNotThrow(() => builder.validateValue(new BigNumber(100.5)));
        should.doesNotThrow(() => builder.validateValue(new BigNumber(0.001)));
      });
    });

    describe('validateRawTransaction', () => {
      it('should validate proper raw transaction', async function () {
        const txBuilder = factory.getTransferBuilder();
        txBuilder.sender(testData.sender.address);
        txBuilder.recipients(testData.recipients);
        txBuilder.paymentObjects(testData.paymentObjects);
        txBuilder.gasData(testData.gasData);

        const tx = await txBuilder.build();
        const rawTx = await tx.toBroadcastFormat();

        const newBuilder = factory.getTransferBuilder();
        should.doesNotThrow(() => newBuilder.validateRawTransaction(rawTx));
      });

      it('should throw error for invalid raw transaction', function () {
        const builder = factory.getTransferBuilder();
        should(() => builder.validateRawTransaction('invalidRawTx')).throwError('Invalid raw transaction');
      });

      it('should throw error for empty raw transaction', function () {
        const builder = factory.getTransferBuilder();
        should(() => builder.validateRawTransaction('')).throwError('Invalid raw transaction: Undefined');
      });

      it('should throw error for undefined raw transaction', function () {
        const builder = factory.getTransferBuilder();
        should(() => builder.validateRawTransaction(undefined as any)).throwError('Invalid raw transaction: Undefined');
      });
    });

    describe('validateTransaction', () => {
      it('should validate complete transaction', async function () {
        const txBuilder = factory.getTransferBuilder();
        txBuilder.sender(testData.sender.address);
        txBuilder.recipients(testData.recipients);
        txBuilder.paymentObjects(testData.paymentObjects);
        txBuilder.gasData(testData.gasData);

        const tx = (await txBuilder.build()) as TransferTransaction;

        const newBuilder = factory.getTransferBuilder();
        should.doesNotThrow(() => newBuilder.validateTransaction(tx));
      });

      it('should throw error for undefined transaction', function () {
        const builder = factory.getTransferBuilder();
        should(() => builder.validateTransaction(undefined)).throwError(/Transaction is required for validation/);
      });

      it('should throw error for transaction with invalid sender', async function () {
        const txBuilder = factory.getTransferBuilder();
        txBuilder.sender(testData.sender.address);
        txBuilder.recipients(testData.recipients);
        txBuilder.paymentObjects(testData.paymentObjects);
        txBuilder.gasData(testData.gasData);

        const tx = (await txBuilder.build()) as TransferTransaction;
        tx.sender = 'invalidAddress';

        const newBuilder = factory.getTransferBuilder();
        should(() => newBuilder.validateTransaction(tx)).throwError();
      });
    });
  });

  describe('Builder Methods', () => {
    describe('sender', () => {
      it('should set sender correctly', function () {
        const builder = factory.getTransferBuilder();
        builder.sender(testData.sender.address);
        should.equal(builder.transaction.sender, testData.sender.address);
      });

      it('should allow changing sender', function () {
        const builder = factory.getTransferBuilder();
        builder.sender(testData.sender.address);
        builder.sender(testData.gasSponsor.address);
        should.equal(builder.transaction.sender, testData.gasSponsor.address);
      });

      it('should validate sender address', function () {
        const builder = factory.getTransferBuilder();
        should(() => builder.sender('invalidAddress')).throwError('Invalid address invalidAddress');
      });
    });

    describe('gasData', () => {
      it('should set all gas parameters', function () {
        const builder = factory.getTransferBuilder();
        builder.gasData(testData.gasData);

        should.equal(builder.transaction.gasBudget, testData.GAS_BUDGET);
        should.equal(builder.transaction.gasPrice, testData.GAS_PRICE);
        should.deepEqual(builder.transaction.gasPaymentObjects, testData.gasPaymentObjects);
      });

      it('should validate gas budget', function () {
        const builder = factory.getTransferBuilder();
        should(() =>
          builder.gasData({
            gasBudget: -1000,
            gasPrice: testData.GAS_PRICE,
            gasPaymentObjects: testData.gasPaymentObjects,
          })
        ).throwError();
      });

      it('should validate gas price', function () {
        const builder = factory.getTransferBuilder();
        should(() =>
          builder.gasData({
            gasBudget: testData.GAS_BUDGET,
            gasPrice: -100,
            gasPaymentObjects: testData.gasPaymentObjects,
          })
        ).throwError();
      });

      it('should throw error for empty gas payment objects', function () {
        const builder = factory.getTransferBuilder();
        should(() =>
          builder.gasData({
            gasBudget: testData.GAS_BUDGET,
            gasPrice: testData.GAS_PRICE,
            gasPaymentObjects: [],
          })
        ).throwError('Gas input objects list is empty');
      });
    });

    describe('gasSponsor', () => {
      it('should set gas sponsor correctly', function () {
        const builder = factory.getTransferBuilder();
        builder.gasSponsor(testData.gasSponsor.address);
        should.equal(builder.transaction.gasSponsor, testData.gasSponsor.address);
      });

      it('should validate gas sponsor address', function () {
        const builder = factory.getTransferBuilder();
        should(() => builder.gasSponsor('invalidAddress')).throwError('Invalid address invalidAddress');
      });

      it('should allow sender to be gas sponsor', function () {
        const builder = factory.getTransferBuilder();
        builder.sender(testData.sender.address);
        builder.gasSponsor(testData.sender.address);
        should.equal(builder.transaction.gasSponsor, testData.sender.address);
      });
    });

    describe('initBuilder', () => {
      it('should initialize builder from existing transaction', async function () {
        const originalBuilder = factory.getTransferBuilder();
        originalBuilder.sender(testData.sender.address);
        originalBuilder.recipients(testData.recipients);
        originalBuilder.paymentObjects(testData.paymentObjects);
        originalBuilder.gasData(testData.gasData);

        const originalTx = (await originalBuilder.build()) as TransferTransaction;

        const newBuilder = factory.getTransferBuilder(originalTx);
        should.equal((newBuilder.transaction as TransferTransaction).sender, originalTx.sender);
        should.equal((newBuilder.transaction as TransferTransaction).gasBudget, originalTx.gasBudget);
      });
    });
  });

  describe('Transaction Building', () => {
    it('should build transaction with all required fields', async function () {
      const builder = factory.getTransferBuilder();
      builder.sender(testData.sender.address);
      builder.recipients(testData.recipients);
      builder.paymentObjects(testData.paymentObjects);
      builder.gasData(testData.gasData);

      const tx = (await builder.build()) as TransferTransaction;
      should.exist(tx);
      should.equal(tx.sender, testData.sender.address);
    });

    it('should build simulation transaction without gas data', async function () {
      const builder = factory.getTransferBuilder();
      builder.sender(testData.sender.address);
      builder.recipients(testData.recipients);
      builder.paymentObjects(testData.paymentObjects);

      const tx = (await builder.build()) as TransferTransaction;
      should.exist(tx);
      should.equal(tx.isSimulateTx, true);
    });

    it('should set isSimulateTx to false when gas data provided', async function () {
      const builder = factory.getTransferBuilder();
      builder.sender(testData.sender.address);
      builder.recipients(testData.recipients);
      builder.paymentObjects(testData.paymentObjects);
      builder.gasData(testData.gasData);

      const tx = (await builder.build()) as TransferTransaction;
      should.equal(tx.isSimulateTx, false);
    });
  });

  describe('Builder Chaining', () => {
    it('should support method chaining', async function () {
      const tx = (await factory
        .getTransferBuilder()
        .sender(testData.sender.address)
        .recipients(testData.recipients)
        .paymentObjects(testData.paymentObjects)
        .gasData(testData.gasData)
        .build()) as TransferTransaction;

      should.exist(tx);
      should.equal(tx.sender, testData.sender.address);
    });

    it('should support chaining with gas sponsor', async function () {
      const tx = (await factory
        .getTransferBuilder()
        .sender(testData.sender.address)
        .recipients(testData.recipients)
        .paymentObjects(testData.paymentObjects)
        .gasData(testData.gasData)
        .gasSponsor(testData.gasSponsor.address)
        .build()) as TransferTransaction;

      should.exist(tx);
      should.equal(tx.gasSponsor, testData.gasSponsor.address);
    });
  });

  describe('Transaction Type', () => {
    it('should return correct transaction type', async function () {
      const builder = factory.getTransferBuilder();
      builder.sender(testData.sender.address);
      builder.recipients(testData.recipients);
      builder.paymentObjects(testData.paymentObjects);
      builder.gasData(testData.gasData);

      const tx = await builder.build();
      should.equal(builder.transactionType, tx.type);
    });
  });
});
