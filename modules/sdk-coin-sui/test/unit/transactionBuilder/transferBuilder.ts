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
      const rebuilder = factory.getTransferBuilder();
      rebuilder.from(rawTx);
      rebuilder.addSignature({ pub: testData.sender.publicKey }, Buffer.from(testData.sender.signatureHex));
      const rebuiltTx = await rebuilder.build();
      rebuiltTx.toBroadcastFormat().should.equal(rawTx);
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
  });
});
