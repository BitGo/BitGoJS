import assert from 'assert';
import * as should from 'should';
import { getBuilderFactory } from '../getBuilderFactory';
import * as testData from '../../resources/hbar';
import { TransactionType } from '@bitgo/sdk-core';

describe('HBAR Token Associate Builder', () => {
  const factory = getBuilderFactory('thbar');
  const TOKEN_NAME = 'thbar:usdc';
  const initTxBuilder = () => {
    const txBuilder = factory.getTokenAssociateBuilder();
    txBuilder.fee({ fee: testData.FEE });
    txBuilder.source({ address: testData.ACCOUNT_1.accountId });
    txBuilder.account(testData.ACCOUNT_1.accountId);
    txBuilder.tokens(TOKEN_NAME);
    return txBuilder;
  };

  describe('should build ', () => {
    describe('non serialized transactions', () => {
      it('a signed token associate transaction', async () => {
        const builder = initTxBuilder();
        builder.validDuration(1000000);
        builder.node({ nodeId: '0.0.2345' });
        builder.startTime('1596110493.372646570');
        builder.sign({ key: testData.ACCOUNT_1.prvKeyWithPrefix });
        const tx = await builder.build();
        const txJson = tx.toJson();
        should.deepEqual(tx.signature.length, 1);
        txJson.instructionsData.params.tokenNames.length.should.equal(1);
        txJson.instructionsData.params.tokenNames[0].should.deepEqual(TOKEN_NAME);
        txJson.instructionsData.params.accountId.should.deepEqual(testData.ACCOUNT_1.accountId);
        should.deepEqual(txJson.from, testData.ACCOUNT_1.accountId);
        should.deepEqual(txJson.fee.toString(), testData.FEE);
        should.deepEqual(tx.toBroadcastFormat(), testData.SIGNED_TOKEN_ASSOCIATE_TRANSACTION);
        tx.type.should.equal(TransactionType.AssociatedTokenAccountInitialization);

        tx.outputs.length.should.equal(1);
        tx.outputs[0].should.deepEqual({
          address: testData.ACCOUNT_1.accountId,
          value: '0',
          coin: TOKEN_NAME,
        });
        tx.inputs.length.should.equal(1);
        tx.inputs[0].should.deepEqual({
          address: testData.ACCOUNT_1.accountId,
          value: '0',
          coin: TOKEN_NAME,
        });
      });

      it('a token associate transaction with memo', async () => {
        const builder = initTxBuilder();
        builder.memo('This is an example');
        const tx = await builder.build();
        const txJson = tx.toJson();
        txJson.instructionsData.params.tokenNames.length.should.equal(1);
        txJson.instructionsData.params.tokenNames[0].should.deepEqual(TOKEN_NAME);
        txJson.instructionsData.params.accountId.should.deepEqual(testData.ACCOUNT_1.accountId);
        should.deepEqual(txJson.memo, 'This is an example');
        should.deepEqual(txJson.from, testData.ACCOUNT_1.accountId);
        should.deepEqual(txJson.fee.toString(), testData.FEE);
      });

      it('a non signed token associate transaction', async () => {
        const builder = initTxBuilder();
        builder.startTime('1596110493.372646570');
        builder.validDuration(1000000);
        builder.node({ nodeId: '0.0.2345' });
        const tx = await builder.build();
        const txJson = tx.toJson();
        txJson.instructionsData.params.tokenNames.length.should.equal(1);
        txJson.instructionsData.params.tokenNames[0].should.deepEqual(TOKEN_NAME);
        txJson.instructionsData.params.accountId.should.deepEqual(testData.ACCOUNT_1.accountId);
        should.deepEqual(txJson.from, testData.ACCOUNT_1.accountId);
        should.deepEqual(txJson.fee.toString(), testData.FEE);
        should.deepEqual(tx.toBroadcastFormat(), testData.NON_SIGNED_TOKEN_ASSOCIATE_TRANSACTION);
      });

      it('a token associate transaction between accounts with realm and shard non zero', async () => {
        const builder = factory.getTokenAssociateBuilder();
        builder.fee({ fee: testData.FEE });
        builder.source({ address: '2.3.456' });
        builder.account('3.4.567');
        builder.tokens(TOKEN_NAME);
        builder.node({ nodeId: '5.2.2345' });
        const tx = await builder.build();
        const txJson = tx.toJson();
        txJson.instructionsData.params.tokenNames.length.should.equal(1);
        txJson.instructionsData.params.tokenNames[0].should.deepEqual(TOKEN_NAME);
        txJson.instructionsData.params.accountId.should.deepEqual('3.4.567');
        should.deepEqual(txJson.node, '5.2.2345');
        should.deepEqual(txJson.from, '2.3.456');
      });

      it('a token associate transaction between accounts without realm and shard', async () => {
        const builder = factory.getTokenAssociateBuilder();
        builder.fee({ fee: testData.FEE });
        builder.source({ address: '456' });
        builder.account('567');
        builder.tokens(TOKEN_NAME);
        builder.node({ nodeId: '2345' });
        const tx = await builder.build();
        const txJson = tx.toJson();
        txJson.instructionsData.params.tokenNames.length.should.equal(1);
        txJson.instructionsData.params.tokenNames[0].should.deepEqual(TOKEN_NAME);
        txJson.instructionsData.params.accountId.should.deepEqual('0.0.567');
        should.deepEqual(txJson.node, '0.0.2345');
        should.deepEqual(txJson.from, '0.0.456');
      });

      describe('serialized token transactions', () => {
        it('a non signed token transfer transaction from serialized', async () => {
          const builder = factory.from(testData.NON_SIGNED_TOKEN_ASSOCIATE_TRANSACTION);
          builder.sign({ key: testData.ACCOUNT_1.prvKeyWithPrefix });
          const tx2 = await builder.build();
          should.deepEqual(tx2.toBroadcastFormat(), testData.SIGNED_TOKEN_ASSOCIATE_TRANSACTION);
          tx2.type.should.equal(TransactionType.AssociatedTokenAccountInitialization);
        });

        it('an offline multisig token transfer transaction', async () => {
          const builder = initTxBuilder();
          builder.startTime('1596110493.372646570');
          builder.sign({ key: testData.ACCOUNT_1.prvKeyWithPrefix });
          const tx = await builder.build();
          should.deepEqual(tx.signature.length, 1);

          const builder2 = factory.from(tx.toBroadcastFormat());
          builder2.sign({ key: testData.ACCOUNT_2.privateKey });
          const tx2 = await builder2.build();
          should.deepEqual(tx2.signature.length, 2);

          const builder3 = factory.from(tx2.toBroadcastFormat());
          builder3.sign({ key: testData.ACCOUNT_3.privateKey });
          const tx3 = await builder3.build();
          should.deepEqual(tx3.signature.length, 3);

          should.deepEqual(tx3.toBroadcastFormat(), testData.THREE_TIMES_SIGNED_TOKEN_ASSOCIATE_TRANSACTION);
        });
      });
    });

    describe('should fail', () => {
      it('a token associate transaction with an invalid key', () => {
        const builder = initTxBuilder();
        assert.throws(
          () => builder.sign({ key: '5bb72603f237c0993f7973d37fdade32c71aa94aee686aa79d260acba1882d90AA' }),
          (e: any) => e.message === 'Invalid private key'
        );
      });

      it('a token associate transaction with more signatures than allowed', () => {
        const builder = initTxBuilder();
        builder.sign({ key: testData.ACCOUNT_2.privateKey });
        builder.sign({ key: testData.ACCOUNT_1.prvKeyWithPrefix });
        builder.sign({ key: testData.ACCOUNT_3.privateKey });
        assert.throws(
          () => builder.sign({ key: '5bb72603f237c0993f7973d37fdade32c71aa94aee686aa79d260acba1882d90' }),
          (e: any) => e.message === 'A maximum of 3 can sign the transaction.'
        );
      });

      it('a token associate transaction with repeated sign', () => {
        const builder = initTxBuilder();
        builder.sign({ key: testData.ACCOUNT_1.prvKeyWithPrefix });
        assert.throws(
          () => builder.sign({ key: testData.ACCOUNT_1.prvKeyWithPrefix }),
          (e: any) =>
            e.message ===
            'Repeated sign: 302e020100300506032b65700422042062b0b669de0ab5e91b4328e1431859a5ca47e7426e701019272f5c2d52825b01'
        );
      });

      it('a token associate transaction with an invalid account id', () => {
        const txBuilder = factory.getTokenAssociateBuilder();
        assert.throws(
          () => txBuilder.account('invalidaccountId'),
          (e: any) => e.message === 'Unsupported account address: invalidaccountId'
        );
      });

      it('a token transfer transaction with an invalid destination memo', () => {
        const txBuilder = factory.getTokenAssociateBuilder();
        assert.throws(
          () =>
            txBuilder.memo(
              'This sentence has more than 100 bytes allowed for the memo, this should throw error -----------------'
            ),
          (e: any) => e.message === 'Memo must not be longer than 100 bytes'
        );
      });

      it('a token transfer transaction with an invalid token name', () => {
        const txBuilder = factory.getTokenAssociateBuilder();
        assert.throws(
          () => txBuilder.tokens('invalidtokenname'),
          (e: any) => e.message === 'Unsupported token: invalidtokenname'
        );
      });

      it('a token transfer transaction with an repeated token name', () => {
        const txBuilder = factory.getTokenAssociateBuilder();
        txBuilder.tokens('thbar:usdc');
        assert.throws(
          () => txBuilder.tokens('thbar:usdc'),
          (e: any) => e.message === 'Repeated token ID: 0.0.2276691'
        );
      });

      it('a token associate transaction with invalid start time', () => {
        const txBuilder = factory.getTokenAssociateBuilder();
        assert.throws(
          () => txBuilder.startTime('invalid start time'),
          (e: any) => e.message === 'Invalid value for time parameter'
        );
        assert.throws(
          () => txBuilder.startTime('-5'),
          (e: any) => e.message === 'Invalid value for time parameter'
        );
      });

      it('a token associate transaction with invalid node', () => {
        const txBuilder = factory.getTokenAssociateBuilder();
        assert.throws(
          () => txBuilder.node({ nodeId: 'invalid node' }),
          (e: any) => e.message === 'Invalid Hedera node address'
        );
      });
    });
  });
});
