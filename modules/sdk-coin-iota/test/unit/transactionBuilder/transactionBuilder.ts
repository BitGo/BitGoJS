import should from 'should';
import { TransferTransaction } from '../../../src';
import BigNumber from 'bignumber.js';
import { createBasicTransferBuilder, createTransferBuilderWithGas, getFactory, testData } from '../helpers/testHelpers';

describe('Iota Transaction Builder', () => {
  const factory = getFactory();

  describe('Address Validation', () => {
    it('should validate correct addresses', function () {
      const builder = factory.getTransferBuilder();
      testData.addresses.validAddresses.forEach((address) => {
        should.doesNotThrow(() => builder.validateAddress({ address }));
      });
    });

    it('should reject invalid addresses', function () {
      const builder = factory.getTransferBuilder();
      testData.addresses.invalidAddresses.forEach((address) => {
        should(() => builder.validateAddress({ address })).throwError();
      });
    });

    it('should throw error for empty address', function () {
      const builder = factory.getTransferBuilder();
      should(() => builder.validateAddress({ address: '' })).throwError(/Invalid address/);
    });
  });

  describe('Value Validation', () => {
    const validCases = [
      { value: new BigNumber(0), description: 'zero value' },
      { value: new BigNumber(1000), description: 'positive values' },
      { value: new BigNumber('1000000000000000000'), description: 'large values' },
      { value: new BigNumber(100.5), description: 'decimal values' },
    ];

    validCases.forEach(({ value, description }) => {
      it(`should validate ${description}`, function () {
        const builder = factory.getTransferBuilder();
        should.doesNotThrow(() => builder.validateValue(value));
      });
    });

    const invalidCases = [
      { value: new BigNumber(-1), error: 'Value cannot be less than zero', description: 'negative values' },
      { value: new BigNumber(NaN), error: 'Invalid amount format', description: 'NaN values' },
    ];

    invalidCases.forEach(({ value, error, description }) => {
      it(`should reject ${description}`, function () {
        const builder = factory.getTransferBuilder();
        should(() => builder.validateValue(value)).throwError(error);
      });
    });
  });

  describe('Raw Transaction Validation', () => {
    it('should validate proper raw transaction', async function () {
      const tx = await createTransferBuilderWithGas().build();
      const rawTx = await tx.toBroadcastFormat();

      const newBuilder = factory.getTransferBuilder();
      should.doesNotThrow(() => newBuilder.validateRawTransaction(rawTx));
    });

    const invalidRawTxCases = [
      { value: 'invalidRawTx', error: 'Invalid raw transaction', description: 'invalid string' },
      { value: '', error: 'Invalid raw transaction: Undefined', description: 'empty string' },
      { value: undefined as any, error: 'Invalid raw transaction: Undefined', description: 'undefined' },
    ];

    invalidRawTxCases.forEach(({ value, error, description }) => {
      it(`should reject ${description}`, function () {
        const builder = factory.getTransferBuilder();
        should(() => builder.validateRawTransaction(value)).throwError(error);
      });
    });
  });

  describe('Transaction Validation', () => {
    it('should validate complete transaction', async function () {
      const tx = (await createTransferBuilderWithGas().build()) as TransferTransaction;
      const newBuilder = factory.getTransferBuilder();
      should.doesNotThrow(() => newBuilder.validateTransaction(tx));
    });

    it('should throw error for undefined transaction', function () {
      const builder = factory.getTransferBuilder();
      should(() => builder.validateTransaction(undefined)).throwError(/Transaction is required for validation/);
    });

    it('should throw error for transaction with invalid sender', async function () {
      const tx = (await createTransferBuilderWithGas().build()) as TransferTransaction;
      tx.sender = 'invalidAddress';

      const newBuilder = factory.getTransferBuilder();
      should(() => newBuilder.validateTransaction(tx)).throwError();
    });
  });

  describe('Builder Setter Methods', () => {
    it('should set and change sender correctly', function () {
      const builder = factory.getTransferBuilder();
      builder.sender(testData.sender.address);
      should.equal(builder.transaction.sender, testData.sender.address);

      builder.sender(testData.gasSponsor.address);
      should.equal(builder.transaction.sender, testData.gasSponsor.address);
    });

    it('should validate sender address when setting', function () {
      const builder = factory.getTransferBuilder();
      should(() => builder.sender('invalidAddress')).throwError('Invalid address invalidAddress');
    });

    it('should set all gas parameters', function () {
      const builder = factory.getTransferBuilder();
      builder.gasData(testData.gasData);

      should.equal(builder.transaction.gasBudget, testData.GAS_BUDGET);
      should.equal(builder.transaction.gasPrice, testData.GAS_PRICE);
      should.deepEqual(builder.transaction.gasPaymentObjects, testData.gasPaymentObjects);
    });

    const invalidGasDataCases = [
      { gasBudget: -1000, description: 'negative gas budget' },
      { gasPrice: -100, description: 'negative gas price' },
    ];

    invalidGasDataCases.forEach(({ gasBudget, gasPrice, description }) => {
      it(`should reject ${description}`, function () {
        const builder = factory.getTransferBuilder();
        should(() =>
          builder.gasData({
            gasBudget: gasBudget ?? testData.GAS_BUDGET,
            gasPrice: gasPrice ?? testData.GAS_PRICE,
            gasPaymentObjects: testData.gasPaymentObjects,
          })
        ).throwError();
      });
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

  describe('Builder Initialization', () => {
    it('should initialize builder from existing transaction', async function () {
      const originalTx = (await createTransferBuilderWithGas().build()) as TransferTransaction;
      const newBuilder = factory.getTransferBuilder(originalTx);

      should.equal((newBuilder.transaction as TransferTransaction).sender, originalTx.sender);
      should.equal((newBuilder.transaction as TransferTransaction).gasBudget, originalTx.gasBudget);
    });
  });

  describe('Transaction Building', () => {
    it('should build transaction with all required fields', async function () {
      const tx = (await createTransferBuilderWithGas().build()) as TransferTransaction;

      should.exist(tx);
      should.equal(tx.sender, testData.sender.address);
      should.equal(tx.isSimulateTx, false);
    });

    it('should build simulation transaction without gas data', async function () {
      const tx = (await createBasicTransferBuilder().build()) as TransferTransaction;

      should.exist(tx);
      should.equal(tx.isSimulateTx, true);
    });

    it('should support method chaining', async function () {
      const tx = (await factory
        .getTransferBuilder()
        .sender(testData.sender.address)
        .recipients(testData.recipients)
        .paymentObjects(testData.paymentObjects)
        .gasData(testData.gasData)
        .gasSponsor(testData.gasSponsor.address)
        .build()) as TransferTransaction;

      should.exist(tx);
      should.equal(tx.sender, testData.sender.address);
      should.equal(tx.gasSponsor, testData.gasSponsor.address);
    });
  });

  describe('Transaction Type', () => {
    it('should return correct transaction type', async function () {
      const builder = createTransferBuilderWithGas();
      const tx = await builder.build();
      should.equal(builder.transactionType, tx.type);
    });
  });
});
