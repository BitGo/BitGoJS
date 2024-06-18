import assert from 'assert';
import { getBuilderFactory } from '../getBuilderFactory';
import * as testData from '../../resources/sui';
import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import utils from '../../../src/lib/utils';
import { Transaction as SuiTransaction } from '../../../src/lib/transaction';
import { StakingProgrammableTransaction, SuiTransactionType } from '../../../src/lib/iface';
import { MAX_COMMAND_ARGS, MAX_GAS_OBJECTS } from '../../../src/lib/constants';

describe('Sui Staking Builder', () => {
  const factory = getBuilderFactory('tsui');

  describe('Succeed', () => {
    it('should build a staking tx', async function () {
      const txBuilder = factory.getStakingBuilder();
      txBuilder.type(SuiTransactionType.AddStake);
      txBuilder.sender(testData.sender.address);
      txBuilder.stake([testData.requestAddStake]);
      txBuilder.gasData(testData.gasData);
      const tx = await txBuilder.build();
      should.equal(tx.type, TransactionType.StakingAdd);
      (tx as SuiTransaction<StakingProgrammableTransaction>).suiTransaction.gasData.payment!.should.deepEqual(
        testData.coinsGasPayment
      );

      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: testData.sender.address,
        value: testData.STAKING_AMOUNT.toString(),
        coin: 'tsui',
      });
      tx.outputs.length.should.equal(1);
      tx.outputs[0].should.deepEqual({
        address: testData.requestAddStake.validatorAddress,
        value: testData.requestAddStake.amount.toString(),
        coin: 'tsui',
      });
      const rawTx = tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.ADD_STAKE);
    });

    it('should build a staking tx with more than 255 input objects', async function () {
      const numberOfPaymentObjects = 1000;
      const txBuilder = factory.getStakingBuilder();
      txBuilder.type(SuiTransactionType.AddStake);
      txBuilder.sender(testData.sender.address);

      const gasData = {
        ...testData.gasData,
        payment: testData.generateObjects(numberOfPaymentObjects),
      };

      txBuilder.stake([testData.requestAddStake]);
      txBuilder.gasData(gasData);
      const tx = await txBuilder.build();

      assert(tx instanceof SuiTransaction);
      tx.type.should.equal(TransactionType.StakingAdd);
      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: testData.sender.address,
        value: testData.STAKING_AMOUNT.toString(),
        coin: 'tsui',
      });
      tx.outputs.length.should.equal(1);
      tx.outputs[0].should.deepEqual({
        address: testData.requestAddStake.validatorAddress,
        value: testData.requestAddStake.amount.toString(),
        coin: 'tsui',
      });

      tx.suiTransaction.gasData.owner.should.equal(gasData.owner);
      tx.suiTransaction.gasData.price.should.equal(gasData.price);
      tx.suiTransaction.gasData.budget.should.equal(gasData.budget);
      tx.suiTransaction.gasData.payment.length.should.equal(MAX_GAS_OBJECTS - 1);

      const programmableTx = tx.suiTransaction.tx;

      // total objects - objects sent as gas payment
      // + (staked amount object + SUI system state object + validator address = 3)
      programmableTx.inputs.length.should.equal(numberOfPaymentObjects - (MAX_GAS_OBJECTS - 1) + 3);
      programmableTx.transactions[0].kind.should.equal('MergeCoins');
      programmableTx.transactions[0].sources.length.should.equal(MAX_COMMAND_ARGS - 1);
      programmableTx.transactions[1].kind.should.equal('MergeCoins');
      programmableTx.transactions[1].sources.length.should.equal(
        numberOfPaymentObjects - (MAX_COMMAND_ARGS - 1) - (MAX_GAS_OBJECTS - 1)
      );

      const rawTx = tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);
      const rebuilder = factory.getStakingBuilder();
      rebuilder.from(rawTx);
      rebuilder.addSignature({ pub: testData.sender.publicKey }, Buffer.from(testData.sender.signatureHex));
      const rebuiltTx = await rebuilder.build();
      rebuiltTx.toBroadcastFormat().should.equal(rawTx);
    });
  });

  describe('Fail', () => {
    it('should fail for invalid sender', async function () {
      const builder = factory.getStakingBuilder();
      should(() => builder.sender('randomString')).throwError('Invalid or missing sender, got: randomString');
    });

    it('should fail for invalid gasData', function () {
      const builder = factory.getStakingBuilder();
      should(() => builder.gasData(testData.invalidGasOwner)).throwError(
        `Invalid gas address ${testData.invalidGasOwner.owner}`
      );
    });

    it('should fail for invalid gasBudget', function () {
      const builder = factory.getStakingBuilder();
      should(() => builder.gasData(testData.invalidGasBudget)).throwError('Invalid gas budget -1');
    });

    it('should fail for invalid gasPayment', function () {
      const builder = factory.getStakingBuilder();
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
