import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import { MAX_GAS_PAYMENT_OBJECTS, MAX_RECIPIENTS } from '../../../src/lib/constants';
import { TransactionObjectInput } from '../../../src/lib/iface';
import {
  createBasicTransferBuilder,
  createTransferBuilderWithGas,
  createTransferBuilderWithSponsor,
  createBuilderWithRecipients,
  createBuilderWithGasObjectsOnly,
  createBuilderWithGasObjects,
  assertBasicTransactionProperties,
  assertGasData,
  assertInputsAndOutputs,
  assertValidRawTransaction,
  createRecipients,
  getFactory,
  testData,
} from '../helpers/testHelpers';
import { TransferTransaction } from '../../../src';

describe('Iota Transfer Builder', () => {
  const factory = getFactory();

  describe('Basic Transaction Building', () => {
    it('should build a transfer transaction in simulate mode', async function () {
      const txBuilder = createBasicTransferBuilder();
      const tx = (await txBuilder.build()) as TransferTransaction;

      should.equal(tx.type, TransactionType.Send);
      should.equal(tx.isSimulateTx, true);
      assertBasicTransactionProperties(tx);
      await assertValidRawTransaction(tx);
    });

    it('should build a transfer transaction with gas data', async function () {
      const txBuilder = createTransferBuilderWithGas();
      const tx = (await txBuilder.build()) as TransferTransaction;

      should.equal(tx.type, TransactionType.Send);
      should.equal(tx.isSimulateTx, false);
      assertBasicTransactionProperties(tx);
      assertGasData(tx);
      assertInputsAndOutputs(tx, testData.recipients);
      await assertValidRawTransaction(tx);
    });

    it('should build a transfer transaction with gas sponsor', async function () {
      const txBuilder = createTransferBuilderWithSponsor();
      const tx = (await txBuilder.build()) as TransferTransaction;

      should.equal(tx.type, TransactionType.Send);
      should.equal(tx.sender, testData.sender.address);
      should.equal(tx.gasSponsor, testData.gasSponsor.address);
      should.equal(tx.isSimulateTx, false);
      await assertValidRawTransaction(tx);
    });

    it('should build transaction using gas objects when no payment objects', async function () {
      const txBuilder = createBuilderWithGasObjectsOnly();
      const tx = (await txBuilder.build()) as TransferTransaction;

      should.equal(tx.type, TransactionType.Send);
      should.equal(tx.isSimulateTx, false);
      should.equal(tx.paymentObjects, undefined);
      should.exist(tx.gasPaymentObjects);
      await assertValidRawTransaction(tx);
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

  describe('Serialization and Deserialization', () => {
    it('should serialize to JSON and rebuild transaction', async function () {
      const txBuilder = createTransferBuilderWithGas();
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
      const tx1 = (await createTransferBuilderWithGas().build()) as TransferTransaction;
      const rawTx1 = await tx1.toBroadcastFormat();

      const tx2 = (await createTransferBuilderWithGas().build()) as TransferTransaction;
      const rawTx2 = await tx2.toBroadcastFormat();

      should.equal(rawTx1, rawTx2);
    });

    it('should validate toJSON output', async function () {
      const tx = (await createTransferBuilderWithGas().build()) as TransferTransaction;
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

  describe('Round-trip Parsing', () => {
    it('should correctly parse and rebuild transaction using gas objects', async function () {
      const tx = (await createBuilderWithGasObjectsOnly().build()) as TransferTransaction;
      const rawTx = await tx.toBroadcastFormat();
      const txHex = Buffer.from(rawTx, 'base64').toString('hex');

      const rebuiltBuilder = factory.from(txHex);
      const rebuiltTx = (await rebuiltBuilder.build()) as TransferTransaction;

      should.equal(rebuiltTx.sender, tx.sender);
      should.deepEqual(rebuiltTx.recipients, tx.recipients);
      should.equal(rebuiltTx.gasBudget, tx.gasBudget);
      should.equal(rebuiltTx.gasPrice, tx.gasPrice);
      should.equal(rebuiltTx.paymentObjects, undefined);
      should.exist(rebuiltTx.gasPaymentObjects);
    });

    it('should correctly parse transaction with payment objects', async function () {
      const tx = (await createTransferBuilderWithGas().build()) as TransferTransaction;
      const rawTx = await tx.toBroadcastFormat();
      const txHex = Buffer.from(rawTx, 'base64').toString('hex');

      const rebuiltBuilder = factory.from(txHex);
      const rebuiltTx = (await rebuiltBuilder.build()) as TransferTransaction;

      should.exist(rebuiltTx.paymentObjects);
      should.equal(rebuiltTx.paymentObjects?.length, testData.paymentObjects.length);
    });

    it('should handle round-trip with gas sponsor and payment objects', async function () {
      const tx = (await createTransferBuilderWithSponsor().build()) as TransferTransaction;
      const rawTx = await tx.toBroadcastFormat();
      const txHex = Buffer.from(rawTx, 'base64').toString('hex');

      const rebuiltBuilder = factory.from(txHex);
      const rebuiltTx = (await rebuiltBuilder.build()) as TransferTransaction;

      should.equal(rebuiltTx.gasSponsor, testData.gasSponsor.address);
      should.exist(rebuiltTx.paymentObjects);
    });
  });

  describe('Recipient Handling', () => {
    const testCases = [
      { count: 1, description: 'single recipient' },
      { count: 10, description: 'multiple recipients' },
      { count: MAX_RECIPIENTS, description: 'maximum recipients' },
    ];

    testCases.forEach(({ count, description }) => {
      it(`should build transaction with ${description}`, async function () {
        const recipients = createRecipients(count, '1000');
        const tx = (await createBuilderWithRecipients(recipients).build()) as TransferTransaction;

        should.equal(tx.type, TransactionType.Send);
        tx.outputs.length.should.equal(count);
        tx.outputs.forEach((output) => {
          output.value.should.equal('1000');
          output.coin?.should.equal('tiota');
        });
      });
    });

    it('should fail with more than MAX_RECIPIENTS', async function () {
      const recipients = createRecipients(MAX_RECIPIENTS + 1);
      const builder = createBuilderWithRecipients(recipients);
      await builder.build().should.be.rejected();
    });

    it('should handle duplicate recipient addresses', async function () {
      const duplicateRecipients = [
        { address: testData.addresses.validAddresses[0], amount: '1000' },
        { address: testData.addresses.validAddresses[0], amount: '2000' },
      ];
      const tx = (await createBuilderWithRecipients(duplicateRecipients).build()) as TransferTransaction;

      should.equal(tx.type, TransactionType.Send);
      tx.outputs.length.should.equal(2);
    });
  });

  describe('Gas Object Handling', () => {
    it('should build with single gas object', async function () {
      const tx = (await createBuilderWithGasObjects([testData.gasPaymentObjects[0]]).build()) as TransferTransaction;

      should.equal(tx.type, TransactionType.Send);
      should.exist(tx.gasPaymentObjects);
      tx.gasPaymentObjects?.length.should.equal(1);
      await assertValidRawTransaction(tx);
    });

    it('should build with exactly MAX_GAS_PAYMENT_OBJECTS gas objects', async function () {
      // Create exactly MAX_GAS_PAYMENT_OBJECTS (256) with valid digests
      const exactlyMaxGasObjects: TransactionObjectInput[] = [];
      for (let i = 0; i < MAX_GAS_PAYMENT_OBJECTS; i++) {
        exactlyMaxGasObjects.push({
          ...testData.gasPaymentObjects[i % testData.gasPaymentObjects.length],
          objectId: `0x${i.toString(16).padStart(64, '0')}`,
        });
      }

      const tx = (await createBuilderWithGasObjects(exactlyMaxGasObjects).build()) as TransferTransaction;

      should.equal(tx.type, TransactionType.Send);
      should.equal(tx.sender, testData.sender.address);
      await assertValidRawTransaction(tx);
    });

    it('should build with more than MAX_GAS_PAYMENT_OBJECTS requiring merge', async function () {
      // Create more than MAX_GAS_PAYMENT_OBJECTS (256) to test merge logic
      const manyGasObjects: TransactionObjectInput[] = [];
      for (let i = 0; i < MAX_GAS_PAYMENT_OBJECTS + 10; i++) {
        manyGasObjects.push({
          ...testData.gasPaymentObjects[i % testData.gasPaymentObjects.length],
          objectId: `0x${i.toString(16).padStart(64, '0')}`,
        });
      }

      const tx = (await createBuilderWithGasObjects(manyGasObjects).build()) as TransferTransaction;

      should.equal(tx.type, TransactionType.Send);
      should.equal(tx.isSimulateTx, false);
      await assertValidRawTransaction(tx);
    });
  });

  describe('Payment Object Handling', () => {
    it('should build with single payment object', async function () {
      const builder = factory
        .getTransferBuilder()
        .sender(testData.sender.address)
        .recipients(testData.recipients)
        .paymentObjects([testData.paymentObjects[0]])
        .gasData(testData.gasData);

      const tx = (await builder.build()) as TransferTransaction;
      should.equal(tx.type, TransactionType.Send);
      tx.paymentObjects?.length.should.equal(1);
      await assertValidRawTransaction(tx);
    });

    it('should keep payment and gas objects separate', async function () {
      const tx = (await createTransferBuilderWithGas().build()) as TransferTransaction;

      should.exist(tx.paymentObjects);
      should.exist(tx.gasPaymentObjects);
      tx.paymentObjects?.length.should.equal(testData.paymentObjects.length);
      tx.gasPaymentObjects?.length.should.equal(testData.gasPaymentObjects.length);
    });

    it('should handle payment objects with different versions', async function () {
      const mixedVersionObjects: TransactionObjectInput[] = [
        {
          objectId: '0x1111111111111111111111111111111111111111111111111111111111111111',
          version: '1',
          digest: 'DGVhYjk6YHwdPdZBgBN8czavy8LvbrshkbxF963EW7mB',
        },
        {
          objectId: '0x2222222222222222222222222222222222222222222222222222222222222222',
          version: '999999',
          digest: 'DoJwXuz9oU5Y5v5vBRiTgisVTQuZQLmHZWeqJzzD5QUE',
        },
      ];

      const builder = factory
        .getTransferBuilder()
        .sender(testData.sender.address)
        .recipients(testData.recipients)
        .paymentObjects(mixedVersionObjects)
        .gasData(testData.gasData);

      const tx = (await builder.build()) as TransferTransaction;
      should.equal(tx.type, TransactionType.Send);
      tx.paymentObjects?.length.should.equal(2);
    });
  });

  describe('Validation Errors', () => {
    describe('Address Validation', () => {
      it('should fail for invalid sender', function () {
        const builder = factory.getTransferBuilder();
        should(() => builder.sender('randomString')).throwError('Invalid address randomString');
      });

      it('should fail for invalid recipient address', function () {
        const builder = createBasicTransferBuilder();
        should(() => builder.recipients([{ address: 'invalidAddress', amount: '1000' }])).throwError(
          'Invalid address invalidAddress'
        );
      });
    });

    describe('Amount Validation', () => {
      it('should fail for negative amount', function () {
        const builder = createBasicTransferBuilder();
        should(() =>
          builder.recipients([{ address: testData.addresses.validAddresses[0], amount: '-1000' }])
        ).throwError('Value cannot be less than zero');
      });

      it('should fail for invalid format', function () {
        const builder = createBasicTransferBuilder();
        should(() =>
          builder.recipients([{ address: testData.addresses.validAddresses[0], amount: 'invalid' }])
        ).throw();
      });

      it('should accept zero amount', async function () {
        const recipients = [{ address: testData.addresses.validAddresses[0], amount: '0' }];
        const tx = (await createBuilderWithRecipients(recipients).build()) as TransferTransaction;

        should.equal(tx.type, TransactionType.Send);
        tx.outputs[0].value.should.equal('0');
      });

      it('should accept very large amount', async function () {
        const largeAmount = '999999999999999999';
        const recipients = [{ address: testData.addresses.validAddresses[0], amount: largeAmount }];
        const tx = (await createBuilderWithRecipients(recipients).build()) as TransferTransaction;

        should.equal(tx.type, TransactionType.Send);
        tx.outputs[0].value.should.equal(largeAmount);
      });
    });

    describe('Required Field Validation', () => {
      it('should fail when missing sender', async function () {
        const builder = factory
          .getTransferBuilder()
          .recipients(testData.recipients)
          .paymentObjects(testData.paymentObjects)
          .gasData(testData.gasData);

        await builder.build().should.be.rejected();
      });

      it('should fail when missing recipients', async function () {
        const builder = factory
          .getTransferBuilder()
          .sender(testData.sender.address)
          .paymentObjects(testData.paymentObjects)
          .gasData(testData.gasData);

        await builder.build().should.be.rejected();
      });

      it('should fail for empty recipients', async function () {
        const builder = factory
          .getTransferBuilder()
          .sender(testData.sender.address)
          .recipients([])
          .paymentObjects(testData.paymentObjects)
          .gasData(testData.gasData);

        await builder.build().should.be.rejected();
      });

      it('should fail for empty payment objects', function () {
        const builder = createBasicTransferBuilder();
        should(() => builder.paymentObjects([])).throwError('No Objects provided for payment');
      });

      it('should fail without payment objects when using gas sponsor', async function () {
        const builder = factory
          .getTransferBuilder()
          .sender(testData.sender.address)
          .recipients(testData.recipients)
          .gasData(testData.gasData)
          .gasSponsor(testData.gasSponsor.address);

        await builder.build().should.be.rejected();
      });
    });

    describe('Gas Data Validation', () => {
      it('should fail for empty gas payment objects', function () {
        const builder = createBasicTransferBuilder();
        should(() =>
          builder.gasData({
            gasBudget: testData.GAS_BUDGET,
            gasPrice: testData.GAS_PRICE,
            gasPaymentObjects: [],
          })
        ).throwError(/Gas input objects list is empty/);
      });
    });

    describe('Object Duplication Validation', () => {
      it('should fail when payment and gas payment objects overlap', async function () {
        const builder = factory
          .getTransferBuilder()
          .sender(testData.sender.address)
          .recipients(testData.recipients)
          .paymentObjects(testData.gasPaymentObjects)
          .gasData(testData.gasData);

        await builder.build().should.be.rejected();
      });
    });

    describe('Transaction Parsing Validation', () => {
      it('should fail to parse invalid raw transaction', function () {
        should(() => factory.from('invalidRawTransaction')).throwError();
      });
    });
  });

  describe('Transaction Signing', () => {
    it('should build transaction with sender signature', async function () {
      const tx = (await createTransferBuilderWithGas().build()) as TransferTransaction;
      tx.addSignature(testData.testSignature.publicKey, testData.testSignature.signature);

      await tx.build();
      should.exist(tx.serializedSignature);
      should.equal(tx.serializedSignature!.length > 0, true);
    });

    it('should build transaction with gas sponsor signature', async function () {
      const tx = (await createTransferBuilderWithSponsor().build()) as TransferTransaction;
      tx.addGasSponsorSignature(testData.testGasSponsorSignature.publicKey, testData.testGasSponsorSignature.signature);

      await tx.build();
      should.exist(tx.serializedGasSponsorSignature);
      should.equal(tx.serializedGasSponsorSignature!.length > 0, true);
    });

    it('should build transaction with both sender and gas sponsor signatures', async function () {
      const tx = (await createTransferBuilderWithSponsor().build()) as TransferTransaction;

      tx.addSignature(testData.testSignature.publicKey, testData.testSignature.signature);
      tx.addGasSponsorSignature(testData.testGasSponsorSignature.publicKey, testData.testGasSponsorSignature.signature);

      await tx.build();
      should.exist(tx.serializedSignature);
      should.exist(tx.serializedGasSponsorSignature);
      tx.signature.length.should.equal(2);
      tx.signature[0].should.equal(tx.serializedSignature);
      tx.signature[1].should.equal(tx.serializedGasSponsorSignature);
    });

    it('should add signature through builder and serialize correctly', async function () {
      const txBuilder = createTransferBuilderWithGas();
      txBuilder.addSignature(testData.testSignature.publicKey, testData.testSignature.signature);

      const tx = (await txBuilder.build()) as TransferTransaction;
      should.exist(tx.serializedSignature);
      should.equal(typeof tx.serializedSignature, 'string');
      tx.signature.length.should.equal(1);
    });

    it('should fail to add invalid sender signature via builder', function () {
      const txBuilder = createTransferBuilderWithGas();
      should(() => txBuilder.addSignature({ pub: 'tooshort' }, testData.testSignature.signature)).throwError(
        'Invalid transaction signature'
      );
    });

    it('should fail to add invalid gas sponsor signature via builder', function () {
      const txBuilder = createTransferBuilderWithSponsor();
      should(() =>
        txBuilder.addGasSponsorSignature(testData.testGasSponsorSignature.publicKey, Buffer.from('invalid'))
      ).throwError('Invalid transaction signature');
    });
  });

  describe('Signable Payload', () => {
    it('should generate signable payload for non-simulate transaction', async function () {
      const tx = (await createTransferBuilderWithGas().build()) as TransferTransaction;

      should.equal(tx.isSimulateTx, false);
      const signablePayload = tx.signablePayload;
      should.exist(signablePayload);
      should.equal(Buffer.isBuffer(signablePayload), true);
      should.equal(signablePayload.length, 32); // Blake2b hash is 32 bytes
    });

    it('should fail to get signable payload for simulate transaction', async function () {
      const tx = (await createBasicTransferBuilder().build()) as TransferTransaction;

      should.equal(tx.isSimulateTx, true);
      should(() => tx.signablePayload).throwError('Cannot sign a simulate tx');
    });
  });

  describe('Input and Output Calculation', () => {
    it('should calculate total input amount correctly for multiple recipients', async function () {
      const recipients = [
        { address: testData.addresses.validAddresses[0], amount: '1000' },
        { address: testData.addresses.validAddresses[1], amount: '2000' },
        { address: testData.addresses.validAddresses[2], amount: '3000' },
      ];
      const tx = (await createBuilderWithRecipients(recipients).build()) as TransferTransaction;

      const expectedTotal = '6000';
      tx.inputs[0].value.should.equal(expectedTotal);
      tx.outputs.length.should.equal(3);
    });
  });
});
