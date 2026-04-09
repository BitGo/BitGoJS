import assert from 'assert';
import { getBuilderFactory } from '../getBuilderFactory';
import * as testData from '../../resources/sui';
import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import utils from '../../../src/lib/utils';
import { Transaction as SuiTransaction } from '../../../src/lib/transaction';
import { SuiTransactionType } from '../../../src/lib/iface';

describe('Walrus Staking Builder', () => {
  const factory = getBuilderFactory('tsui:wal');

  describe('Succeed', () => {
    it('should build a staking tx', async function () {
      const txBuilder = factory.getWalrusStakingBuilder();
      txBuilder.type(SuiTransactionType.WalrusStakeWithPool);
      txBuilder.sender(testData.sender.address);
      txBuilder.stake([testData.requestWalrusStakeWithPool]);
      txBuilder.gasData(testData.gasData);
      txBuilder.inputObjects([testData.walToken]);
      const tx = await txBuilder.build();

      assert(tx instanceof SuiTransaction);
      tx.type.should.equal(TransactionType.StakingAdd);
      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: testData.sender.address,
        value: testData.STAKING_AMOUNT.toString(),
        coin: 'tsui:wal',
      });
      tx.outputs.length.should.equal(1);
      tx.outputs[0].should.deepEqual({
        address: testData.requestWalrusStakeWithPool.validatorAddress,
        value: testData.requestWalrusStakeWithPool.amount.toString(),
        coin: 'tsui:wal',
      });

      const rawTx = tx.toBroadcastFormat();
      utils.isValidRawTransaction(rawTx).should.be.true();
      const rebuilder = factory.from(rawTx);
      rebuilder.addSignature({ pub: testData.sender.publicKey }, Buffer.from(testData.sender.signatureHex));
      const rebuiltTx = await rebuilder.build();
      rebuiltTx.toBroadcastFormat().should.equal(rawTx);

      tx.suiTransaction.gasData.owner.should.equal(testData.gasData.owner);
      tx.suiTransaction.gasData.price.should.equal(testData.gasData.price);
      tx.suiTransaction.gasData.budget.should.equal(testData.gasData.budget);
      tx.suiTransaction.gasData.payment.length.should.equal(testData.gasData.payment.length);

      const ptb = tx.suiTransaction.tx;
      ptb.inputs.length.should.equal(5); // WAL object, Staking shared object, Amount, Validator
      ptb.transactions[0].kind.should.equal('SplitCoins'); // Only providing one WAL token
    });

    it('should build a staking tx for multiple gas objects and WAL tokens', async function () {
      const numberOfInputObjects = 100;
      const numberOfGasPaymentObjects = 10;

      const txBuilder = factory.getWalrusStakingBuilder();
      txBuilder.type(SuiTransactionType.WalrusStakeWithPool);
      txBuilder.sender(testData.sender.address);
      txBuilder.stake([testData.requestWalrusStakeWithPool]);

      const gasData = {
        ...testData.gasData,
        payment: testData.generateObjects(numberOfGasPaymentObjects),
      };
      txBuilder.gasData(gasData);
      txBuilder.inputObjects(testData.generateObjects(numberOfInputObjects));
      const tx = await txBuilder.build();

      assert(tx instanceof SuiTransaction);
      tx.type.should.equal(TransactionType.StakingAdd);
      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: testData.sender.address,
        value: testData.STAKING_AMOUNT.toString(),
        coin: 'tsui:wal',
      });
      tx.outputs.length.should.equal(1);
      tx.outputs[0].should.deepEqual({
        address: testData.requestWalrusStakeWithPool.validatorAddress,
        value: testData.requestWalrusStakeWithPool.amount.toString(),
        coin: 'tsui:wal',
      });
      tx.suiTransaction.gasData.owner.should.equal(gasData.owner);
      tx.suiTransaction.gasData.price.should.equal(gasData.price);
      tx.suiTransaction.gasData.budget.should.equal(gasData.budget);
      tx.suiTransaction.gasData.payment.length.should.equal(10);

      const ptb = tx.suiTransaction.tx;
      ptb.inputs.length.should.equal(numberOfInputObjects + 4);
      ptb.transactions[0].kind.should.equal('MergeCoins'); // Merge all input objects provided
      ptb.transactions[0].sources.length.should.equal(numberOfInputObjects - 1);
      ptb.transactions[1].kind.should.equal('SplitCoins'); // Split the desired amount off of the input object

      const rawTx = tx.toBroadcastFormat();
      utils.isValidRawTransaction(rawTx).should.be.true();
      const rebuilder = factory.from(rawTx);
      rebuilder.addSignature({ pub: testData.sender.publicKey }, Buffer.from(testData.sender.signatureHex));
      const rebuiltTx = await rebuilder.build();
      rebuiltTx.toBroadcastFormat().should.equal(rawTx);
      rebuiltTx.toJson().gasData.payment.length.should.equal(numberOfGasPaymentObjects);
      rebuiltTx.toJson().inputObjects.length.should.equal(numberOfInputObjects);
    });
  });

  describe('Fail', () => {
    it('should fail for invalid sender', async function () {
      const builder = factory.getWalrusStakingBuilder();
      should(() => builder.sender('randomString')).throwError('Invalid or missing sender, got: randomString');
    });

    it('should fail for invalid gasData', function () {
      const builder = factory.getWalrusStakingBuilder();
      should(() => builder.gasData(testData.invalidGasOwner)).throwError(
        `Invalid gas address ${testData.invalidGasOwner.owner}`
      );
    });

    it('should fail for invalid gasBudget', function () {
      const builder = factory.getWalrusStakingBuilder();
      should(() => builder.gasData(testData.invalidGasBudget)).throwError('Invalid gas budget -1');
    });

    it('should fail for invalid gasPayment', function () {
      const builder = factory.getWalrusStakingBuilder();
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
