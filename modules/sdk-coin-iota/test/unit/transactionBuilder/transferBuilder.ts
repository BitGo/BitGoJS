import should from 'should';
import { coins } from '@bitgo/statics';
import { TransactionBuilderFactory, TransferTransaction } from '../../../src';
import * as testData from '../../resources/iota';
import { TransactionType } from '@bitgo/sdk-core';
import utils from '../../../src/lib/utils';
import { MAX_GAS_PAYMENT_OBJECTS, MAX_RECIPIENTS } from '../../../src/lib/constants';
import { TransactionObjectInput } from '../../../src/lib/iface';

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

    it('should fail to build without payment objects when using gas sponsor', async function () {
      const builder = factory.getTransferBuilder();
      builder.sender(testData.sender.address);
      builder.recipients(testData.recipients);
      builder.gasData(testData.gasData);
      builder.gasSponsor(testData.gasSponsor.address); // Gas sponsor requires payment objects

      await builder.build().should.be.rejected();
    });

    it('should build transfer using gas objects when no payment objects and sender pays own gas', async function () {
      const builder = factory.getTransferBuilder();
      builder.sender(testData.sender.address);
      builder.recipients(testData.recipients);
      builder.gasData(testData.gasData);
      // No payment objects, no gas sponsor - should use gas objects for payment

      const tx = (await builder.build()) as TransferTransaction;
      should.equal(tx.type, TransactionType.Send);
      should.equal(tx.sender, testData.sender.address);
      should.equal(tx.isSimulateTx, false);
      should.equal(tx.gasBudget, testData.GAS_BUDGET);
      should.equal(tx.gasPrice, testData.GAS_PRICE);

      const rawTx = await tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);
    });

    it('should build transfer using many gas objects requiring merge', async function () {
      const builder = factory.getTransferBuilder();
      builder.sender(testData.sender.address);
      builder.recipients(testData.recipients);

      // Create more than MAX_GAS_PAYMENT_OBJECTS (256) to test merge logic
      // Use duplicate of valid gas payment objects to have valid digests
      const manyGasObjects: TransactionObjectInput[] = [];
      for (let i = 0; i < MAX_GAS_PAYMENT_OBJECTS + 10; i++) {
        manyGasObjects.push({
          ...testData.gasPaymentObjects[i % testData.gasPaymentObjects.length],
          objectId: `0x${i.toString(16).padStart(64, '0')}`, // Unique object IDs
        });
      }

      builder.gasData({
        gasBudget: testData.GAS_BUDGET,
        gasPrice: testData.GAS_PRICE,
        gasPaymentObjects: manyGasObjects,
      });

      const tx = (await builder.build()) as TransferTransaction;
      should.equal(tx.type, TransactionType.Send);
      should.equal(tx.sender, testData.sender.address);
      should.equal(tx.isSimulateTx, false);

      const rawTx = await tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);
    });

    it('should fail when no payment objects and no gas payment objects', async function () {
      const builder = factory.getTransferBuilder();
      builder.sender(testData.sender.address);
      builder.recipients(testData.recipients);

      // Should fail during gasData() call due to validation
      should(() =>
        builder.gasData({
          gasBudget: testData.GAS_BUDGET,
          gasPrice: testData.GAS_PRICE,
          gasPaymentObjects: [], // Empty gas payment objects
        })
      ).throwError(/Gas input objects list is empty/);
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

  describe('Round-trip with Gas Objects', () => {
    it('should correctly parse and rebuild transaction using gas objects', async function () {
      const builder = factory.getTransferBuilder();
      builder.sender(testData.sender.address);
      builder.recipients(testData.recipients);
      builder.gasData(testData.gasData);
      // No payment objects - using gas objects for payment

      const tx = (await builder.build()) as TransferTransaction;
      const rawTx = await tx.toBroadcastFormat();
      const txHex = Buffer.from(rawTx, 'base64').toString('hex');

      // Parse and rebuild
      const rebuiltBuilder = factory.from(txHex);
      const rebuiltTx = (await rebuiltBuilder.build()) as TransferTransaction;

      // Verify properties match
      should.equal(rebuiltTx.sender, tx.sender);
      should.deepEqual(rebuiltTx.recipients, tx.recipients);
      should.equal(rebuiltTx.gasBudget, tx.gasBudget);
      should.equal(rebuiltTx.gasPrice, tx.gasPrice);

      // Verify it was correctly identified as gas object transaction
      should.equal(rebuiltTx.paymentObjects, undefined);
      should.exist(rebuiltTx.gasPaymentObjects);
    });

    it('should correctly parse and rebuild gas object transaction via JSON', async function () {
      const builder = factory.getTransferBuilder();
      builder.sender(testData.sender.address);
      builder.recipients(testData.recipients);
      builder.gasData(testData.gasData);
      // No payment objects - using gas objects for payment

      const tx = (await builder.build()) as TransferTransaction;
      const txJson = tx.toJson();

      // Parse from JSON and rebuild
      const rebuiltBuilder = factory.getTransferBuilder();
      (rebuiltBuilder.transaction as TransferTransaction).parseFromJSON(txJson);
      const rebuiltTx = (await rebuiltBuilder.build()) as TransferTransaction;

      // Verify properties match
      should.equal(rebuiltTx.sender, tx.sender);
      should.deepEqual(rebuiltTx.recipients, tx.recipients);
      should.equal(rebuiltTx.gasBudget, tx.gasBudget);
      should.equal(rebuiltTx.gasPrice, tx.gasPrice);

      // Verify it was correctly identified as gas object transaction
      should.equal(rebuiltTx.paymentObjects, undefined);
      should.exist(rebuiltTx.gasPaymentObjects);
    });

    it('should correctly parse transaction with payment objects', async function () {
      const builder = factory.getTransferBuilder();
      builder.sender(testData.sender.address);
      builder.recipients(testData.recipients);
      builder.paymentObjects(testData.paymentObjects);
      builder.gasData(testData.gasData);

      const tx = (await builder.build()) as TransferTransaction;
      const rawTx = await tx.toBroadcastFormat();
      const txHex = Buffer.from(rawTx, 'base64').toString('hex');

      // Parse and rebuild
      const rebuiltBuilder = factory.from(txHex);
      const rebuiltTx = (await rebuiltBuilder.build()) as TransferTransaction;

      // Verify it has payment objects
      should.exist(rebuiltTx.paymentObjects);
      should.equal(rebuiltTx.paymentObjects?.length, testData.paymentObjects.length);
    });

    it('should handle round-trip with gas sponsor and payment objects', async function () {
      const builder = factory.getTransferBuilder();
      builder.sender(testData.sender.address);
      builder.recipients(testData.recipients);
      builder.paymentObjects(testData.paymentObjects);
      builder.gasData(testData.gasData);
      builder.gasSponsor(testData.gasSponsor.address);

      const tx = (await builder.build()) as TransferTransaction;
      const rawTx = await tx.toBroadcastFormat();
      const txHex = Buffer.from(rawTx, 'base64').toString('hex');

      // Parse and rebuild
      const rebuiltBuilder = factory.from(txHex);
      const rebuiltTx = (await rebuiltBuilder.build()) as TransferTransaction;

      // Verify gas sponsor is preserved
      should.equal(rebuiltTx.gasSponsor, testData.gasSponsor.address);
      should.exist(rebuiltTx.paymentObjects);
    });
  });

  describe('Boundary Tests', () => {
    it('should build with exactly MAX_GAS_PAYMENT_OBJECTS gas objects', async function () {
      const builder = factory.getTransferBuilder();
      builder.sender(testData.sender.address);
      builder.recipients(testData.recipients);

      // Create exactly MAX_GAS_PAYMENT_OBJECTS (256)
      const exactlyMaxGasObjects: TransactionObjectInput[] = [];
      for (let i = 0; i < MAX_GAS_PAYMENT_OBJECTS; i++) {
        exactlyMaxGasObjects.push({
          ...testData.gasPaymentObjects[i % testData.gasPaymentObjects.length],
          objectId: `0x${i.toString(16).padStart(64, '0')}`,
        });
      }

      builder.gasData({
        gasBudget: testData.GAS_BUDGET,
        gasPrice: testData.GAS_PRICE,
        gasPaymentObjects: exactlyMaxGasObjects,
      });

      const tx = (await builder.build()) as TransferTransaction;
      should.equal(tx.type, TransactionType.Send);
      should.equal(tx.sender, testData.sender.address);

      const rawTx = await tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);
    });

    it('should build with single payment object (no merge needed)', async function () {
      const builder = factory.getTransferBuilder();
      builder.sender(testData.sender.address);
      builder.recipients(testData.recipients);
      builder.paymentObjects([testData.paymentObjects[0]]); // Only one
      builder.gasData(testData.gasData);

      const tx = (await builder.build()) as TransferTransaction;
      should.equal(tx.type, TransactionType.Send);
      tx.paymentObjects?.length.should.equal(1);

      const rawTx = await tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);
    });

    it('should build with two payment objects (simple merge)', async function () {
      const builder = factory.getTransferBuilder();
      builder.sender(testData.sender.address);
      builder.recipients(testData.recipients);
      builder.paymentObjects(testData.paymentObjects); // Two objects
      builder.gasData(testData.gasData);

      const tx = (await builder.build()) as TransferTransaction;
      should.equal(tx.type, TransactionType.Send);
      tx.paymentObjects?.length.should.equal(2);

      const rawTx = await tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);
    });
  });

  describe('Transaction Signing', () => {
    it('should build transaction with sender signature', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.sender.address);
      txBuilder.recipients(testData.recipients);
      txBuilder.paymentObjects(testData.paymentObjects);
      txBuilder.gasData(testData.gasData);

      const tx = (await txBuilder.build()) as TransferTransaction;

      // Add signature
      tx.addSignature(testData.testSignature.publicKey, testData.testSignature.signature);

      // Rebuild to trigger serialization
      await tx.build();

      should.exist(tx.serializedSignature);
      should.equal(tx.serializedSignature!.length > 0, true);
    });

    it('should build transaction with gas sponsor signature', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.sender.address);
      txBuilder.recipients(testData.recipients);
      txBuilder.paymentObjects(testData.paymentObjects);
      txBuilder.gasData(testData.gasData);
      txBuilder.gasSponsor(testData.gasSponsor.address);

      const tx = (await txBuilder.build()) as TransferTransaction;

      // Add gas sponsor signature
      tx.addGasSponsorSignature(testData.testGasSponsorSignature.publicKey, testData.testGasSponsorSignature.signature);

      // Rebuild to trigger serialization
      await tx.build();

      should.exist(tx.serializedGasSponsorSignature);
      should.equal(tx.serializedGasSponsorSignature!.length > 0, true);
    });

    it('should build transaction with both sender and gas sponsor signatures', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.sender.address);
      txBuilder.recipients(testData.recipients);
      txBuilder.paymentObjects(testData.paymentObjects);
      txBuilder.gasData(testData.gasData);
      txBuilder.gasSponsor(testData.gasSponsor.address);

      const tx = (await txBuilder.build()) as TransferTransaction;

      // Add both signatures
      tx.addSignature(testData.testSignature.publicKey, testData.testSignature.signature);
      tx.addGasSponsorSignature(testData.testGasSponsorSignature.publicKey, testData.testGasSponsorSignature.signature);

      // Rebuild to trigger serialization
      await tx.build();

      should.exist(tx.serializedSignature);
      should.exist(tx.serializedGasSponsorSignature);
      tx.signature.length.should.equal(2);
    });

    it('should add signature through builder and serialize correctly', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.sender.address);
      txBuilder.recipients(testData.recipients);
      txBuilder.paymentObjects(testData.paymentObjects);
      txBuilder.gasData(testData.gasData);

      // Add signature through builder
      txBuilder.addSignature(testData.testSignature.publicKey, testData.testSignature.signature);

      const tx = (await txBuilder.build()) as TransferTransaction;

      should.exist(tx.serializedSignature);
      should.equal(typeof tx.serializedSignature, 'string');
      // Verify signature array is populated
      tx.signature.length.should.equal(1);
    });

    it('should add gas sponsor signature through builder and serialize correctly', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.sender.address);
      txBuilder.recipients(testData.recipients);
      txBuilder.paymentObjects(testData.paymentObjects);
      txBuilder.gasData(testData.gasData);
      txBuilder.gasSponsor(testData.gasSponsor.address);

      // Add gas sponsor signature through builder
      txBuilder.addGasSponsorSignature(
        testData.testGasSponsorSignature.publicKey,
        testData.testGasSponsorSignature.signature
      );

      const tx = (await txBuilder.build()) as TransferTransaction;

      should.exist(tx.serializedGasSponsorSignature);
      should.equal(typeof tx.serializedGasSponsorSignature, 'string');
      // Verify signature array is populated
      tx.signature.length.should.equal(1);
    });

    it('should serialize signatures in correct order', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.sender.address);
      txBuilder.recipients(testData.recipients);
      txBuilder.paymentObjects(testData.paymentObjects);
      txBuilder.gasData(testData.gasData);
      txBuilder.gasSponsor(testData.gasSponsor.address);

      // Add signatures through builder
      txBuilder.addSignature(testData.testSignature.publicKey, testData.testSignature.signature);
      txBuilder.addGasSponsorSignature(
        testData.testGasSponsorSignature.publicKey,
        testData.testGasSponsorSignature.signature
      );

      const tx = (await txBuilder.build()) as TransferTransaction;

      // Verify signatures are in correct order: sender first, gas sponsor second
      tx.signature.length.should.equal(2);
      tx.signature[0].should.equal(tx.serializedSignature);
      tx.signature[1].should.equal(tx.serializedGasSponsorSignature);
    });

    it('should fail to add invalid sender signature via builder', function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.sender.address);
      txBuilder.recipients(testData.recipients);
      txBuilder.paymentObjects(testData.paymentObjects);
      txBuilder.gasData(testData.gasData);

      // Builder should validate and throw when adding invalid signature
      should(() => txBuilder.addSignature({ pub: 'tooshort' }, testData.testSignature.signature)).throwError(
        'Invalid transaction signature'
      );
    });

    it('should fail to add invalid gas sponsor signature via builder', function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.sender.address);
      txBuilder.recipients(testData.recipients);
      txBuilder.paymentObjects(testData.paymentObjects);
      txBuilder.gasData(testData.gasData);
      txBuilder.gasSponsor(testData.gasSponsor.address);

      // Builder should validate and throw when adding invalid signature
      should(() =>
        txBuilder.addGasSponsorSignature(testData.testGasSponsorSignature.publicKey, Buffer.from('invalid'))
      ).throwError('Invalid transaction signature');
    });
  });

  describe('Gas Object Edge Cases', () => {
    it('should build with single gas object', async function () {
      const builder = factory.getTransferBuilder();
      builder.sender(testData.sender.address);
      builder.recipients(testData.recipients);
      builder.gasData({
        gasBudget: testData.GAS_BUDGET,
        gasPrice: testData.GAS_PRICE,
        gasPaymentObjects: [testData.gasPaymentObjects[0]],
      });

      const tx = (await builder.build()) as TransferTransaction;
      should.equal(tx.type, TransactionType.Send);
      should.exist(tx.gasPaymentObjects);
      tx.gasPaymentObjects?.length.should.equal(1);

      const rawTx = await tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);
    });

    it('should build with multiple gas objects', async function () {
      const builder = factory.getTransferBuilder();
      builder.sender(testData.sender.address);
      builder.recipients(testData.recipients);
      builder.gasData(testData.gasData);

      const tx = (await builder.build()) as TransferTransaction;
      should.equal(tx.type, TransactionType.Send);
      should.exist(tx.gasPaymentObjects);
      tx.gasPaymentObjects?.length.should.equal(testData.gasPaymentObjects.length);
    });

    it('should successfully build with gas objects and single recipient', async function () {
      const builder = factory.getTransferBuilder();
      builder.sender(testData.sender.address);
      builder.recipients([testData.recipients[0]]);
      builder.gasData(testData.gasData);

      const tx = (await builder.build()) as TransferTransaction;
      should.equal(tx.type, TransactionType.Send);
      tx.outputs.length.should.equal(1);
      tx.outputs[0].should.deepEqual({
        address: testData.recipients[0].address,
        value: testData.recipients[0].amount,
        coin: 'tiota',
      });
    });

    it('should use gas objects when payment objects are undefined', async function () {
      const builder = factory.getTransferBuilder();
      builder.sender(testData.sender.address);
      builder.recipients(testData.recipients);
      builder.gasData(testData.gasData);
      // Explicitly not setting payment objects

      const tx = (await builder.build()) as TransferTransaction;
      should.equal(tx.paymentObjects, undefined);
      should.exist(tx.gasPaymentObjects);
      should.equal(tx.type, TransactionType.Send);
    });

    it('should validate gas budget is set when using gas objects', async function () {
      const builder = factory.getTransferBuilder();
      builder.sender(testData.sender.address);
      builder.recipients(testData.recipients);
      builder.gasData(testData.gasData);

      const tx = (await builder.build()) as TransferTransaction;
      should.exist(tx.gasBudget);
      should.equal(tx.gasBudget, testData.GAS_BUDGET);
    });

    it('should validate gas price is set when using gas objects', async function () {
      const builder = factory.getTransferBuilder();
      builder.sender(testData.sender.address);
      builder.recipients(testData.recipients);
      builder.gasData(testData.gasData);

      const tx = (await builder.build()) as TransferTransaction;
      should.exist(tx.gasPrice);
      should.equal(tx.gasPrice, testData.GAS_PRICE);
    });
  });

  describe('Recipient Validation Tests', () => {
    it('should build with single recipient', async function () {
      const builder = factory.getTransferBuilder();
      builder.sender(testData.sender.address);
      builder.recipients([
        {
          address: testData.addresses.validAddresses[0],
          amount: '5000',
        },
      ]);
      builder.paymentObjects(testData.paymentObjects);
      builder.gasData(testData.gasData);

      const tx = (await builder.build()) as TransferTransaction;
      should.equal(tx.type, TransactionType.Send);
      tx.outputs.length.should.equal(1);
      tx.outputs[0].value.should.equal('5000');
    });

    it('should fail with more than MAX_RECIPIENTS', async function () {
      const builder = factory.getTransferBuilder();
      builder.sender(testData.sender.address);

      const tooManyRecipients = new Array(MAX_RECIPIENTS + 1).fill({
        address: testData.addresses.validAddresses[0],
        amount: '100',
      });

      builder.recipients(tooManyRecipients);
      builder.paymentObjects(testData.paymentObjects);
      builder.gasData(testData.gasData);

      await builder.build().should.be.rejected();
    });

    it('should build with MAX_RECIPIENTS exactly', async function () {
      const builder = factory.getTransferBuilder();
      builder.sender(testData.sender.address);

      const maxRecipients = new Array(MAX_RECIPIENTS).fill({
        address: testData.addresses.validAddresses[0],
        amount: '100',
      });

      builder.recipients(maxRecipients);
      builder.paymentObjects(testData.paymentObjects);
      builder.gasData(testData.gasData);

      const tx = (await builder.build()) as TransferTransaction;
      should.equal(tx.type, TransactionType.Send);
      tx.outputs.length.should.equal(MAX_RECIPIENTS);
    });

    it('should fail when recipient address is same as sender', async function () {
      const builder = factory.getTransferBuilder();
      builder.sender(testData.sender.address);
      // Using sender address as recipient - should still work as it's technically valid
      builder.recipients([
        {
          address: testData.sender.address,
          amount: '1000',
        },
      ]);
      builder.paymentObjects(testData.paymentObjects);
      builder.gasData(testData.gasData);

      const tx = (await builder.build()) as TransferTransaction;
      should.equal(tx.type, TransactionType.Send);
    });

    it('should handle duplicate recipient addresses', async function () {
      const builder = factory.getTransferBuilder();
      builder.sender(testData.sender.address);
      builder.recipients([
        {
          address: testData.addresses.validAddresses[0],
          amount: '1000',
        },
        {
          address: testData.addresses.validAddresses[0],
          amount: '2000',
        },
      ]);
      builder.paymentObjects(testData.paymentObjects);
      builder.gasData(testData.gasData);

      const tx = (await builder.build()) as TransferTransaction;
      should.equal(tx.type, TransactionType.Send);
      tx.outputs.length.should.equal(2);
    });
  });

  describe('Amount Validation Tests', () => {
    it('should fail with negative amount', function () {
      const builder = factory.getTransferBuilder();
      builder.sender(testData.sender.address);
      should(() =>
        builder.recipients([
          {
            address: testData.addresses.validAddresses[0],
            amount: '-100',
          },
        ])
      ).throwError('Value cannot be less than zero');
    });

    it('should build with zero amount', async function () {
      const builder = factory.getTransferBuilder();
      builder.sender(testData.sender.address);
      builder.recipients([
        {
          address: testData.addresses.validAddresses[0],
          amount: '0',
        },
      ]);
      builder.paymentObjects(testData.paymentObjects);
      builder.gasData(testData.gasData);

      const tx = (await builder.build()) as TransferTransaction;
      should.equal(tx.type, TransactionType.Send);
      tx.outputs[0].value.should.equal('0');
    });

    it('should build with very large amount', async function () {
      const builder = factory.getTransferBuilder();
      builder.sender(testData.sender.address);
      const largeAmount = '999999999999999999';
      builder.recipients([
        {
          address: testData.addresses.validAddresses[0],
          amount: largeAmount,
        },
      ]);
      builder.paymentObjects(testData.paymentObjects);
      builder.gasData(testData.gasData);

      const tx = (await builder.build()) as TransferTransaction;
      should.equal(tx.type, TransactionType.Send);
      tx.outputs[0].value.should.equal(largeAmount);
    });

    it('should calculate total input amount correctly for multiple recipients', async function () {
      const builder = factory.getTransferBuilder();
      builder.sender(testData.sender.address);
      const amount1 = '1000';
      const amount2 = '2000';
      const amount3 = '3000';
      builder.recipients([
        {
          address: testData.addresses.validAddresses[0],
          amount: amount1,
        },
        {
          address: testData.addresses.validAddresses[1],
          amount: amount2,
        },
        {
          address: testData.addresses.validAddresses[2],
          amount: amount3,
        },
      ]);
      builder.paymentObjects(testData.paymentObjects);
      builder.gasData(testData.gasData);

      const tx = (await builder.build()) as TransferTransaction;
      const expectedTotal = (Number(amount1) + Number(amount2) + Number(amount3)).toString();
      tx.inputs[0].value.should.equal(expectedTotal);
    });

    it('should fail with invalid amount format', function () {
      const builder = factory.getTransferBuilder();
      builder.sender(testData.sender.address);
      should(() =>
        builder.recipients([
          {
            address: testData.addresses.validAddresses[0],
            amount: 'invalid',
          },
        ])
      ).throwError();
    });
  });

  describe('Payment and Gas Object Interaction Tests', () => {
    it('should keep payment and gas objects separate', async function () {
      const builder = factory.getTransferBuilder();
      builder.sender(testData.sender.address);
      builder.recipients(testData.recipients);
      builder.paymentObjects(testData.paymentObjects);
      builder.gasData(testData.gasData);

      const tx = (await builder.build()) as TransferTransaction;
      should.exist(tx.paymentObjects);
      should.exist(tx.gasPaymentObjects);
      // Verify they are different
      tx.paymentObjects?.length.should.equal(testData.paymentObjects.length);
      tx.gasPaymentObjects?.length.should.equal(testData.gasPaymentObjects.length);
    });

    it('should handle payment objects with different versions', async function () {
      const builder = factory.getTransferBuilder();
      builder.sender(testData.sender.address);
      builder.recipients(testData.recipients);
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
      builder.paymentObjects(mixedVersionObjects);
      builder.gasData(testData.gasData);

      const tx = (await builder.build()) as TransferTransaction;
      should.equal(tx.type, TransactionType.Send);
      tx.paymentObjects?.length.should.equal(2);
    });

    it('should serialize and parse transaction with both payment and gas objects', async function () {
      const builder = factory.getTransferBuilder();
      builder.sender(testData.sender.address);
      builder.recipients(testData.recipients);
      builder.paymentObjects(testData.paymentObjects);
      builder.gasData(testData.gasData);

      const tx = (await builder.build()) as TransferTransaction;
      const rawTx = await tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);

      // Parse it back
      const rebuiltBuilder = factory.from(Buffer.from(rawTx, 'base64').toString('hex'));
      const rebuiltTx = (await rebuiltBuilder.build()) as TransferTransaction;

      should.exist(rebuiltTx.paymentObjects);
      should.exist(rebuiltTx.gasPaymentObjects);
    });

    it('should fail when using same object ID in payment and gas', async function () {
      const builder = factory.getTransferBuilder();
      builder.sender(testData.sender.address);
      builder.recipients(testData.recipients);
      // Use same object IDs for payment and gas
      builder.paymentObjects(testData.gasPaymentObjects);
      builder.gasData(testData.gasData);

      await builder.build().should.be.rejected();
    });

    it('should handle gas sponsor with payment objects correctly', async function () {
      const builder = factory.getTransferBuilder();
      builder.sender(testData.sender.address);
      builder.recipients(testData.recipients);
      builder.paymentObjects(testData.paymentObjects);
      builder.gasData(testData.gasData);
      builder.gasSponsor(testData.gasSponsor.address);

      const tx = (await builder.build()) as TransferTransaction;
      should.equal(tx.gasSponsor, testData.gasSponsor.address);
      should.exist(tx.paymentObjects);
      should.exist(tx.gasPaymentObjects);
      should.equal(tx.sender, testData.sender.address);
      should.notEqual(tx.sender, tx.gasSponsor);
    });
  });
});
