import assert from 'assert';
import { getBuilderFactory } from '../getBuilderFactory';
import * as testData from '../../resources/sui';
import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import utils from '../../../src/lib/utils';
import { Transaction as SuiTransaction } from '../../../src/lib/transaction';
import { SuiTransactionType } from '../../../src/lib/iface';

describe('Sui Token Transfer Builder', () => {
  const factory = getBuilderFactory('tsui:deep');

  describe('Succeed', () => {
    it('should build a token transfer', async function () {
      const amount = 1000000000;
      const numberOfRecipients = 10;
      const numberOfInputObjects = 100;
      const numberOfGasPaymentObjects = 10;

      const txBuilder = factory.getTokenTransferBuilder();
      txBuilder.type(SuiTransactionType.TokenTransfer);
      txBuilder.sender(testData.sender.address);

      const recipients = new Array(numberOfRecipients).fill({
        address: testData.sender.address,
        amount: amount.toString(),
      });

      const gasData = {
        ...testData.gasData,
        payment: testData.generateObjects(numberOfGasPaymentObjects),
      };

      const inputObjects = testData.generateObjects(numberOfInputObjects);

      txBuilder.send(recipients);
      txBuilder.gasData(gasData);
      txBuilder.inputObjects(inputObjects);

      const tx = await txBuilder.build();

      assert(tx instanceof SuiTransaction);
      tx.type.should.equal(TransactionType.Send);
      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: testData.sender.address,
        value: (amount * numberOfRecipients).toString(),
        coin: 'tsui:deep',
      });
      tx.outputs.length.should.equal(10);
      tx.outputs.forEach((output) =>
        output.should.deepEqual({
          coin: 'tsui:deep',
          address: testData.sender.address,
          value: amount.toString(),
        })
      );
      tx.suiTransaction.gasData.owner.should.equal(gasData.owner);
      tx.suiTransaction.gasData.price.should.equal(gasData.price);
      tx.suiTransaction.gasData.budget.should.equal(gasData.budget);
      tx.suiTransaction.gasData.payment.length.should.equal(10);

      const programmableTx = tx.suiTransaction.tx;

      // objects sent as input + no. of recipient amounts(pure arg) + no. of unique recipient addresses(de-duped objects = 1)
      programmableTx.inputs.length.should.equal(numberOfInputObjects + numberOfRecipients + 1);
      programmableTx.transactions[0].kind.should.equal('MergeCoins');
      programmableTx.transactions[0].sources.length.should.equal(numberOfInputObjects - 1);

      const rawTx = tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);
      const rebuilder = factory.getTokenTransferBuilder();
      rebuilder.from(rawTx);
      rebuilder.addSignature({ pub: testData.sender.publicKey }, Buffer.from(testData.sender.signatureHex));
      const rebuiltTx = await rebuilder.build();
      rebuiltTx.toBroadcastFormat().should.equal(rawTx);
      rebuiltTx.toJson().gasData.payment.length.should.equal(numberOfGasPaymentObjects);
      rebuiltTx.toJson().inputObjects.length.should.equal(numberOfInputObjects);
    });
  });

  describe('Fail', () => {
    it('should fail for invalid sender', async function () {
      const builder = factory.getTokenTransferBuilder();
      should(() => builder.sender('randomString')).throwError('Invalid or missing sender, got: randomString');
    });

    it('should fail for invalid payTx', async function () {
      const builder = factory.getTokenTransferBuilder();
      should(() => builder.send([testData.invalidRecipients[0]])).throwError(
        'Invalid or missing address, got: randomString'
      );
      should(() => builder.send([testData.invalidRecipients[1]])).throwError('Invalid recipient amount');
    });

    it('should fail for invalid gasData', function () {
      const builder = factory.getTokenTransferBuilder();
      should(() => builder.gasData(testData.invalidGasOwner)).throwError(
        `Invalid gas address ${testData.invalidGasOwner.owner}`
      );
    });

    it('should fail for invalid gasBudget', function () {
      const builder = factory.getTokenTransferBuilder();
      should(() => builder.gasData(testData.invalidGasBudget)).throwError('Invalid gas budget -1');
    });

    it('should fail for invalid gasPayment', function () {
      const builder = factory.getTokenTransferBuilder();
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
      const builder = factory.getTokenTransferBuilder();
      const invalidInputObjects = [
        {
          objectId: 'objectId',
          version: 1,
        },
      ];
      // @ts-expect-error - testing invalid input
      should(() => builder.inputObjects(invalidInputObjects)).throwError('Invalid input object, missing digest');
    });
  });
});
