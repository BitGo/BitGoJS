import assert from 'assert';
import * as should from 'should';
import { getBuilderFactory } from '../getBuilderFactory';
import * as testData from '../../resources/hbar';
import { TransactionType } from '@bitgo/sdk-core';

describe('HBAR Account Update Builder', () => {
  const factory = getBuilderFactory('thbar');

  const NODE_ID = 3;

  const initTxBuilder = () => {
    const txBuilder = factory.getAccountUpdateBuilder();
    txBuilder.fee({ fee: testData.FEE });
    txBuilder.source({ address: testData.ACCOUNT_1.accountId });
    txBuilder.stakedNodeId(NODE_ID);
    return txBuilder;
  };

  describe('should build', () => {
    describe('non serialized transactions', () => {
      it('a stake transaction', async () => {
        const builder = initTxBuilder();
        builder.validDuration(1000000);
        builder.node({ nodeId: '0.0.2345' });
        builder.startTime('1596110493.372646570');
        const tx = await builder.build();
        const txJson = tx.toJson();
        txJson.instructionsData.params.accountId.should.deepEqual(testData.ACCOUNT_1.accountId);
        txJson.instructionsData.params.stakedNodeId.should.deepEqual(NODE_ID.toString());
        should.deepEqual(txJson.from, testData.ACCOUNT_1.accountId);
        should.deepEqual(txJson.fee.toString(), testData.FEE);
        tx.type.should.equal(TransactionType.AccountUpdate);
        tx.inputs.length.should.equal(1);
        tx.inputs[0].should.deepEqual({
          address: testData.ACCOUNT_1.accountId,
          value: '0',
          coin: 'thbar',
        });
        tx.outputs.length.should.equal(1);
        tx.outputs[0].should.deepEqual({
          address: testData.ACCOUNT_1.accountId,
          value: '0',
          coin: 'thbar',
        });
      });

      it('an unstake transaction with stakedNodeId -1', async () => {
        const txBuilder = factory.getAccountUpdateBuilder();
        txBuilder.fee({ fee: testData.FEE });
        txBuilder.source({ address: testData.ACCOUNT_1.accountId });
        txBuilder.stakedNodeId(-1);
        txBuilder.validDuration(1000000);
        txBuilder.node({ nodeId: '0.0.2345' });
        txBuilder.startTime('1596110493.372646570');
        const tx = await txBuilder.build();
        const txJson = tx.toJson();
        txJson.instructionsData.params.stakedNodeId.should.deepEqual('-1');
        txJson.instructionsData.params.accountId.should.deepEqual(testData.ACCOUNT_1.accountId);
        tx.type.should.equal(TransactionType.AccountUpdate);
      });

      it('a stake transaction with declineReward set to true', async () => {
        const builder = initTxBuilder();
        builder.declineStakingReward(true);
        builder.node({ nodeId: '0.0.2345' });
        builder.startTime('1596110493.372646570');
        const tx = await builder.build();
        const txJson = tx.toJson();
        txJson.instructionsData.params.declineReward.should.equal(true);
        txJson.instructionsData.params.stakedNodeId.should.deepEqual(NODE_ID.toString());
      });

      it('a stake transaction with declineReward set to false', async () => {
        const builder = initTxBuilder();
        builder.declineStakingReward(false);
        builder.node({ nodeId: '0.0.2345' });
        builder.startTime('1596110493.372646570');
        const tx = await builder.build();
        const txJson = tx.toJson();
        txJson.instructionsData.params.declineReward.should.equal(false);
      });

      it('a signed stake transaction', async () => {
        const builder = initTxBuilder();
        builder.validDuration(1000000);
        builder.node({ nodeId: '0.0.2345' });
        builder.startTime('1596110493.372646570');
        builder.sign({ key: testData.ACCOUNT_1.prvKeyWithPrefix });
        const tx = await builder.build();
        should.deepEqual(tx.signature.length, 1);
        tx.type.should.equal(TransactionType.AccountUpdate);
      });

      it('a stake transaction with explicit account id', async () => {
        const txBuilder = factory.getAccountUpdateBuilder();
        txBuilder.fee({ fee: testData.FEE });
        txBuilder.source({ address: testData.ACCOUNT_1.accountId });
        txBuilder.account(testData.ACCOUNT_2.accountId);
        txBuilder.stakedNodeId(NODE_ID);
        txBuilder.node({ nodeId: '0.0.2345' });
        const tx = await txBuilder.build();
        const txJson = tx.toJson();
        txJson.instructionsData.params.accountId.should.deepEqual(testData.ACCOUNT_2.accountId);
      });
    });

    describe('serialized transactions', () => {
      it('a signed account update transaction round-trip', async () => {
        const builder = initTxBuilder();
        builder.validDuration(1000000);
        builder.node({ nodeId: '0.0.2345' });
        builder.startTime('1596110493.372646570');
        builder.sign({ key: testData.ACCOUNT_1.prvKeyWithPrefix });
        const tx = await builder.build();
        const serialized = tx.toBroadcastFormat();

        const builder2 = factory.from(serialized);
        builder2.sign({ key: testData.ACCOUNT_2.privateKey });
        const tx2 = await builder2.build();
        should.deepEqual(tx2.signature.length, 2);
        tx2.type.should.equal(TransactionType.AccountUpdate);
        tx2.toJson().instructionsData.params.stakedNodeId.should.deepEqual(NODE_ID.toString());
      });

      it('an unsigned account update transaction round-trip', async () => {
        const builder = initTxBuilder();
        builder.validDuration(1000000);
        builder.node({ nodeId: '0.0.2345' });
        builder.startTime('1596110493.372646570');
        const tx = await builder.build();
        const serialized = tx.toBroadcastFormat();

        const builder2 = factory.from(serialized);
        const tx2 = await builder2.build();
        tx2.type.should.equal(TransactionType.AccountUpdate);
        tx2.toJson().instructionsData.params.accountId.should.deepEqual(testData.ACCOUNT_1.accountId);
        tx2.toJson().instructionsData.params.stakedNodeId.should.deepEqual(NODE_ID.toString());
      });
    });
  });

  describe('should fail', () => {
    it('a stake transaction without stakedNodeId', async () => {
      const txBuilder = factory.getAccountUpdateBuilder();
      txBuilder.fee({ fee: testData.FEE });
      txBuilder.source({ address: testData.ACCOUNT_1.accountId });
      txBuilder.node({ nodeId: '0.0.2345' });
      await txBuilder.build().should.be.rejectedWith('Invalid transaction: missing stakedNodeId');
    });

    it('a stake transaction with an invalid account id', () => {
      const txBuilder = factory.getAccountUpdateBuilder();
      assert.throws(
        () => txBuilder.account('invalidAccountId'),
        (e: any) => e.message === 'Invalid account address: invalidAccountId'
      );
    });

    it('a stake transaction with more signatures than allowed', () => {
      const builder = initTxBuilder();
      builder.sign({ key: testData.ACCOUNT_1.prvKeyWithPrefix });
      builder.sign({ key: testData.ACCOUNT_2.privateKey });
      builder.sign({ key: testData.ACCOUNT_3.privateKey });
      assert.throws(
        () => builder.sign({ key: '5bb72603f237c0993f7973d37fdade32c71aa94aee686aa79d260acba1882d9a' }),
        (e: any) => e.message === 'A maximum of 3 can sign the transaction.'
      );
    });

    it('a stake transaction with an invalid key', () => {
      const builder = initTxBuilder();
      assert.throws(
        () => builder.sign({ key: '5bb72603f237c0993f7973d37fdade32c71aa94aee686aa79d260acba1882d90AA' }),
        (e: any) => e.message === 'Invalid private key'
      );
    });
  });
});
