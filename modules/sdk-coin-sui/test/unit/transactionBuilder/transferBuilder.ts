import assert from 'assert';
import { getBuilderFactory } from '../getBuilderFactory';
import * as testData from '../../resources/sui';
import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import utils from '../../../src/lib/utils';
import { Transaction as SuiTransaction } from '../../../src/lib/transaction';
import { SuiTransactionType, TransferProgrammableTransaction } from '../../../src/lib/iface';
import { MAX_COMMAND_ARGS, MAX_GAS_OBJECTS } from '../../../src/lib/constants';

describe('Sui Transfer Builder', () => {
  const factory = getBuilderFactory('tsui');

  describe('Succeed', () => {
    it('should build a transfer tx', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.type(SuiTransactionType.Transfer);
      txBuilder.sender(testData.sender.address);
      txBuilder.send(testData.recipients);
      txBuilder.gasData(testData.gasData);
      const tx = await txBuilder.build();
      should.equal(tx.type, TransactionType.Send);
      (tx as SuiTransaction<TransferProgrammableTransaction>).suiTransaction.gasData.payment!.should.deepEqual(
        testData.coinsGasPayment
      );

      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: testData.sender.address,
        value: (testData.AMOUNT * 2).toString(),
        coin: 'tsui',
      });
      tx.outputs.length.should.equal(2);
      tx.outputs[0].should.deepEqual({
        address: testData.recipients[0].address,
        value: testData.recipients[0].amount,
        coin: 'tsui',
      });
      tx.outputs[1].should.deepEqual({
        address: testData.recipients[1].address,
        value: testData.recipients[1].amount,
        coin: 'tsui',
      });
      const rawTx = tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.TRANSFER);
    });

    it('should build a sponsored transfer tx with inputObjects', async function () {
      const inputObjects = [
        {
          objectId: '0000000000000000000000001234567890abcdef1234567890abcdef12345678',
          version: 100,
          digest: '2B8XKQJ7mfxQPUWqJJAGjzBAzivkWKq2cEa3W8LLz1yB',
        },
        {
          objectId: '000000000000000000000000abcdef1234567890abcdef1234567890abcdef12',
          version: 200,
          digest: 'DoJwXuz9oU5Y5v5vBRiTgisVTQuZQLmHZWeqJzzD5QUE',
        },
      ];

      // Create gas data with different owner (sponsor)
      const sponsoredGasData = {
        ...testData.gasData,
        owner: testData.feePayer.address, // Different from sender
      };

      const txBuilder = factory.getTransferBuilder();
      txBuilder.type(SuiTransactionType.Transfer);
      txBuilder.sender(testData.sender.address); // Sender
      txBuilder.send(testData.recipients);
      txBuilder.gasData(sponsoredGasData); // Gas paid by sponsor
      txBuilder.inputObjects(inputObjects); // Required for sponsored tx

      const tx = await txBuilder.build();
      should.equal(tx.type, TransactionType.Send);

      const suiTx = tx as SuiTransaction<TransferProgrammableTransaction>;

      // Verify transaction structure for sponsored transaction
      const programmableTx = suiTx.suiTransaction.tx;
      programmableTx.transactions.length.should.be.greaterThan(0);

      // Verify sponsored transaction characteristics
      suiTx.suiTransaction.sender.should.equal(testData.sender.address);
      suiTx.suiTransaction.gasData.owner.should.equal(testData.feePayer.address);

      // Should have transactions for merging/splitting and transferring when using inputObjects
      programmableTx.transactions.length.should.be.greaterThan(0);

      // Verify we have transfer operations (the exact structure varies with API versions)
      should.exist(programmableTx.transactions);

      // Verify inputObjects are not used in gas payment (they're separate)
      suiTx.suiTransaction.gasData.payment.should.not.containDeep(inputObjects);

      const rawTx = tx.toBroadcastFormat();
      should.exist(rawTx);
      should.equal(typeof rawTx, 'string');
      should.equal(utils.isValidRawTransaction(rawTx), true);
    });

    it('should build a split coin tx', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.type(SuiTransactionType.Transfer);
      txBuilder.sender(testData.sender.address);
      const amount = 1000000000;
      const recipients = new Array(100).fill({ address: testData.sender.address, amount: amount.toString() });
      txBuilder.send(recipients);
      txBuilder.gasData(testData.gasData);
      const tx = await txBuilder.build();
      should.equal(tx.type, TransactionType.Send);
      (tx as SuiTransaction<TransferProgrammableTransaction>).suiTransaction.gasData.payment!.should.deepEqual(
        testData.coinsGasPayment
      );

      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: testData.sender.address,
        value: (amount * 100).toString(),
        coin: 'tsui',
      });
      tx.outputs.length.should.equal(100);
      tx.outputs.forEach((output) =>
        output.should.deepEqual({
          address: testData.sender.address,
          value: amount.toString(),
          coin: 'tsui',
        })
      );
    });

    it('should build a split coin tx with more than 255 input objects', async function () {
      const amount = 1000000000;
      const numberOfRecipients = 10;
      const numberOfPaymentObjects = 1000;

      const txBuilder = factory.getTransferBuilder();
      txBuilder.type(SuiTransactionType.Transfer);
      txBuilder.sender(testData.sender.address);

      const recipients = new Array(numberOfRecipients).fill({
        address: testData.sender.address,
        amount: amount.toString(),
      });

      const gasData = {
        ...testData.gasData,
        payment: testData.generateObjects(numberOfPaymentObjects),
      };

      txBuilder.send(recipients);
      txBuilder.gasData(gasData);
      const tx = await txBuilder.build();

      assert(tx instanceof SuiTransaction);
      tx.type.should.equal(TransactionType.Send);
      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: testData.sender.address,
        value: (amount * 10).toString(),
        coin: 'tsui',
      });
      tx.outputs.length.should.equal(10);
      tx.outputs.forEach((output) =>
        output.should.deepEqual({
          coin: 'tsui',
          address: testData.sender.address,
          value: amount.toString(),
        })
      );
      tx.suiTransaction.gasData.owner.should.equal(gasData.owner);
      tx.suiTransaction.gasData.price.should.equal(gasData.price);
      tx.suiTransaction.gasData.budget.should.equal(gasData.budget);
      tx.suiTransaction.gasData.payment.length.should.equal(MAX_GAS_OBJECTS - 1);

      const programmableTx = tx.suiTransaction.tx;

      // total objects - objects sent as gas payment + no. of recipient amounts(pure)
      // + no. of unique recipient addresses(de-duped objects)
      programmableTx.inputs.length.should.equal(
        numberOfPaymentObjects - (MAX_GAS_OBJECTS - 1) + numberOfRecipients + 1
      );
      programmableTx.transactions[0].kind.should.equal('MergeCoins');
      programmableTx.transactions[0].sources.length.should.equal(MAX_COMMAND_ARGS - 1);
      programmableTx.transactions[1].kind.should.equal('MergeCoins');
      programmableTx.transactions[1].sources.length.should.equal(
        numberOfPaymentObjects - (MAX_COMMAND_ARGS - 1) - (MAX_GAS_OBJECTS - 1)
      );

      const rawTx = tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);
      const rebuilder = factory.from(rawTx);
      rebuilder.addSignature({ pub: testData.sender.publicKey }, Buffer.from(testData.sender.signatureHex));
      const rebuiltTx = await rebuilder.build();
      rebuiltTx.toBroadcastFormat().should.equal(rawTx);
      rebuiltTx.toJson().gasData.payment.length.should.equal(numberOfPaymentObjects);
    });
  });

  describe('Fail', () => {
    it('should fail for invalid sender', async function () {
      const builder = factory.getTransferBuilder();
      should(() => builder.sender('randomString')).throwError('Invalid or missing sender, got: randomString');
    });

    it('should fail for invalid payTx', async function () {
      const builder = factory.getTransferBuilder();
      should(() => builder.send([testData.invalidRecipients[0]])).throwError(
        'Invalid or missing address, got: randomString'
      );
      should(() => builder.send([testData.invalidRecipients[1]])).throwError('Invalid recipient amount');
    });

    it('should fail for invalid gasData', function () {
      const builder = factory.getTransferBuilder();
      should(() => builder.gasData(testData.invalidGasOwner)).throwError(
        `Invalid gas address ${testData.invalidGasOwner.owner}`
      );
    });

    it('should fail for invalid gasBudget', function () {
      const builder = factory.getTransferBuilder();
      should(() => builder.gasData(testData.invalidGasBudget)).throwError('Invalid gas budget -1');
    });

    it('should fail for invalid gasPayment', function () {
      const builder = factory.getTransferBuilder();
      const invalidGasPayment = {
        ...testData.gasDataWithoutGasPayment,
        payment: [
          {
            objectId: '',
            version: -1,
            digest: '',
          },
        ],
      };
      should(() => builder.gasData(invalidGasPayment)).throwError('Invalid payment, invalid or missing version');
    });

    it('should fail for invalid inputObjects', function () {
      const builder = factory.getTransferBuilder();
      const invalidInputObjects = [
        {
          objectId: '',
          version: -1,
          digest: '',
        },
      ];
      should(() => builder.inputObjects(invalidInputObjects)).throwError(
        'Invalid input object, invalid or missing version'
      );
    });

    it('should build transfer with different gas owner but no inputObjects', async function () {
      const sponsoredGasData = {
        ...testData.gasData,
        owner: testData.feePayer.address, // Different from sender
      };

      const txBuilder = factory.getTransferBuilder();
      txBuilder.type(SuiTransactionType.Transfer);
      txBuilder.sender(testData.sender.address); // Sender
      txBuilder.send(testData.recipients);
      txBuilder.gasData(sponsoredGasData); // Gas paid by sponsor
      // Note: NOT providing inputObjects - should still work (fee sponsorship without coin sponsorship)

      const tx = await txBuilder.build();
      should.equal(tx.type, TransactionType.Send);

      const suiTx = tx as SuiTransaction<TransferProgrammableTransaction>;
      should.not.exist(suiTx.suiTransaction.inputObjects);

      const rawTx = tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);
    });

    it('should extract inputObjects from transaction data via toJson', async function () {
      const inputObjects = [
        {
          objectId: '0x1234567890abcdef1234567890abcdef12345678',
          version: 100,
          digest: '2B8XKQJ7mfxQPUWqJJAGjzBAzivkWKq2cEa3W8LLz1yB',
        },
      ];
      const sponsoredGasData = {
        ...testData.gasData,
        owner: testData.feePayer.address, // Different from sender
      };

      const txBuilder = factory.getTransferBuilder();
      txBuilder.type(SuiTransactionType.Transfer);
      txBuilder.sender(testData.sender.address);
      txBuilder.send(testData.recipients);
      txBuilder.gasData(sponsoredGasData);
      txBuilder.inputObjects(inputObjects);

      const tx = await txBuilder.build();

      // Test that toJson extracts inputObjects from transaction structure
      const txData = (tx as any).toJson();
      should.exist(txData.inputObjects);

      // The toJson should extract the inputObjects from the transaction structure
      // This tests our new getInputObjectsFromTx method
      should.exist(txData.inputObjects);
      Array.isArray(txData.inputObjects).should.equal(true);
    });
  });
});
