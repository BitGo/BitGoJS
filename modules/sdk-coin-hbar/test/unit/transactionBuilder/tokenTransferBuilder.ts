import assert from 'assert';
import * as should from 'should';
import { getBuilderFactory } from '../getBuilderFactory';
import * as testData from '../../resources/hbar';
import { TransactionType } from '@bitgo/sdk-core';

describe('HBAR Token Transfer Builder', () => {
  const factory = getBuilderFactory('thbar');
  const TOKEN_NAME = 'thbar:usdc';
  const initTxBuilder = (amount = '10') => {
    const txBuilder = factory.getTokenTransferBuilder();
    txBuilder.fee({ fee: testData.FEE });
    txBuilder.source({ address: testData.ACCOUNT_1.accountId });
    txBuilder.send({
      address: testData.ACCOUNT_2.accountId,
      amount: amount,
      tokenName: TOKEN_NAME,
    });
    return txBuilder;
  };

  describe('should build ', () => {
    describe('non serialized transactions', () => {
      it('a signed transfer transaction', async () => {
        const builder = initTxBuilder();
        builder.validDuration(1000000);
        builder.node({ nodeId: '0.0.2345' });
        builder.startTime('1596110493.372646570');
        builder.sign({ key: testData.ACCOUNT_1.prvKeyWithPrefix });
        const tx = await builder.build();
        const txJson = tx.toJson();
        should.deepEqual(tx.signature.length, 1);
        txJson.instructionsData.params.recipients.length.should.equal(1);
        txJson.instructionsData.params.recipients[0].should.deepEqual({
          address: testData.ACCOUNT_2.accountId,
          amount: '10',
          tokenName: TOKEN_NAME,
        });
        should.deepEqual(txJson.from, testData.ACCOUNT_1.accountId);
        should.deepEqual(txJson.fee.toString(), testData.FEE);
        should.deepEqual(tx.toBroadcastFormat(), testData.SIGNED_TOKEN_TRANSFER_TRANSACTION);
        tx.type.should.equal(TransactionType.Send);

        tx.outputs.length.should.equal(1);
        tx.outputs[0].should.deepEqual({
          address: testData.ACCOUNT_2.accountId,
          value: '10',
          coin: TOKEN_NAME,
        });
        tx.inputs.length.should.equal(1);
        tx.inputs[0].should.deepEqual({
          address: testData.ACCOUNT_1.accountId,
          value: '10',
          coin: TOKEN_NAME,
        });
      });

      it('a token transfer transaction with amount 0', async () => {
        const builder = initTxBuilder('0');
        const tx = await builder.build();
        const txJson = tx.toJson();
        txJson.instructionsData.params.recipients.length.should.equal(1);
        txJson.instructionsData.params.recipients[0].should.deepEqual({
          address: testData.ACCOUNT_2.accountId,
          amount: '0',
          tokenName: TOKEN_NAME,
        });
        should.deepEqual(txJson.from, testData.ACCOUNT_1.accountId);
        should.deepEqual(txJson.fee.toString(), testData.FEE);
      });

      it('a token transfer transaction with memo', async () => {
        const builder = initTxBuilder();
        builder.memo('This is an example');
        const tx = await builder.build();
        const txJson = tx.toJson();
        txJson.instructionsData.params.recipients.length.should.equal(1);
        txJson.instructionsData.params.recipients[0].should.deepEqual({
          address: testData.ACCOUNT_2.accountId,
          amount: '10',
          tokenName: TOKEN_NAME,
        });
        should.deepEqual(txJson.memo, 'This is an example');
        should.deepEqual(txJson.from, testData.ACCOUNT_1.accountId);
        should.deepEqual(txJson.fee.toString(), testData.FEE);
      });

      it('a non signed token transfer transaction', async () => {
        const builder = initTxBuilder();
        builder.startTime('1596110493.372646570');
        builder.validDuration(1000000);
        builder.node({ nodeId: '0.0.2345' });
        const tx = await builder.build();
        const txJson = tx.toJson();
        txJson.instructionsData.params.recipients.length.should.equal(1);
        txJson.instructionsData.params.recipients[0].should.deepEqual({
          address: testData.ACCOUNT_2.accountId,
          amount: '10',
          tokenName: TOKEN_NAME,
        });
        should.deepEqual(txJson.from, testData.ACCOUNT_1.accountId);
        should.deepEqual(txJson.fee.toString(), testData.FEE);
        should.deepEqual(tx.toBroadcastFormat(), testData.NON_SIGNED_TOKEN_TRANSFER_TRANSACTION);
      });

      it('a token transaction between accounts with realm and shard non zero', async () => {
        const builder = factory.getTokenTransferBuilder();
        builder.fee({ fee: testData.FEE });
        builder.source({ address: '2.3.456' });
        builder.send({
          address: '3.4.567',
          amount: '10',
          tokenName: TOKEN_NAME,
        });
        builder.node({ nodeId: '5.2.2345' });
        const tx = await builder.build();
        const txJson = tx.toJson();
        txJson.instructionsData.params.recipients.length.should.equal(1);
        txJson.instructionsData.params.recipients[0].should.deepEqual({
          address: '3.4.567',
          amount: '10',
          tokenName: TOKEN_NAME,
        });
        should.deepEqual(txJson.node, '5.2.2345');
        should.deepEqual(txJson.from, '2.3.456');
      });

      it('a token transaction between accounts without realm and shard', async () => {
        const builder = factory.getTokenTransferBuilder();
        builder.fee({ fee: testData.FEE });
        builder.source({ address: '456' });
        builder.send({
          address: '567',
          amount: '10',
          tokenName: TOKEN_NAME,
        });
        builder.node({ nodeId: '2345' });
        const tx = await builder.build();
        const txJson = tx.toJson();
        txJson.instructionsData.params.recipients.length.should.equal(1);
        txJson.instructionsData.params.recipients[0].should.deepEqual({
          address: '0.0.567',
          amount: '10',
          tokenName: TOKEN_NAME,
        });
        should.deepEqual(txJson.node, '0.0.2345');
        should.deepEqual(txJson.from, '0.0.456');
      });

      it('a transfer transaction with multiple recipients', async () => {
        const builder = initTxBuilder();
        builder.validDuration(1000000);
        builder.node({ nodeId: '0.0.2345' });
        builder.startTime('1596110493.372646570');
        builder.send({
          address: testData.ACCOUNT_3.accountId,
          amount: '15',
          tokenName: TOKEN_NAME,
        });

        const tx = await builder.build();
        const txJson = tx.toJson();
        txJson.instructionsData.params.recipients.length.should.equal(2);
        txJson.instructionsData.params.recipients[0].should.deepEqual({
          address: testData.ACCOUNT_2.accountId,
          amount: '10',
          tokenName: TOKEN_NAME,
        });
        txJson.instructionsData.params.recipients[1].should.deepEqual({
          address: testData.ACCOUNT_3.accountId,
          amount: '15',
          tokenName: TOKEN_NAME,
        });
        should.deepEqual(txJson.from, testData.ACCOUNT_1.accountId);
        should.deepEqual(txJson.fee.toString(), testData.FEE);

        tx.outputs.length.should.equal(2);
        tx.outputs[0].should.deepEqual({
          address: testData.ACCOUNT_2.accountId,
          value: '10',
          coin: TOKEN_NAME,
        });
        tx.outputs[1].should.deepEqual({
          address: testData.ACCOUNT_3.accountId,
          value: '15',
          coin: TOKEN_NAME,
        });
        tx.inputs.length.should.equal(1);
        tx.inputs[0].should.deepEqual({
          address: testData.ACCOUNT_1.accountId,
          value: '25',
          coin: TOKEN_NAME,
        });

        should.deepEqual(tx.toBroadcastFormat(), testData.NON_SIGNED_TOKEN_MULTI_TRANSFER_TRANSACTION);
      });
    });

    describe('serialized token transactions', () => {
      it('a non signed token transfer transaction from serialized', async () => {
        const builder = factory.from(testData.NON_SIGNED_TOKEN_TRANSFER_TRANSACTION);
        builder.sign({ key: testData.ACCOUNT_1.prvKeyWithPrefix });
        const tx2 = await builder.build();
        should.deepEqual(tx2.toBroadcastFormat(), testData.SIGNED_TOKEN_TRANSFER_TRANSACTION);
        tx2.type.should.equal(TransactionType.Send);
      });

      it('a non signed multirecipients token transfer transaction from serialized', async () => {
        const builder = factory.from(testData.NON_SIGNED_TOKEN_MULTI_TRANSFER_TRANSACTION);
        builder.sign({ key: testData.ACCOUNT_1.prvKeyWithPrefix });
        const tx2 = await builder.build();
        should.deepEqual(tx2.toBroadcastFormat(), testData.SIGNED_TOKEN_MULTI_TRANSFER_TRANSACTION);
        tx2.type.should.equal(TransactionType.Send);
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

        should.deepEqual(tx3.toBroadcastFormat(), testData.THREE_TIMES_SIGNED_TOKEN_TRANSACTION);
      });
    });
  });

  describe('should fail', () => {
    it('a token transfer transaction with an invalid key', () => {
      const builder = initTxBuilder();
      assert.throws(
        () => builder.sign({ key: '5bb72603f237c0993f7973d37fdade32c71aa94aee686aa79d260acba1882d90AA' }),
        (e: any) => e.message === 'Invalid private key'
      );
    });

    it('a token transfer transaction with more signatures than allowed', () => {
      const builder = initTxBuilder();
      builder.sign({ key: testData.ACCOUNT_2.privateKey });
      builder.sign({ key: testData.ACCOUNT_1.prvKeyWithPrefix });
      builder.sign({ key: testData.ACCOUNT_3.privateKey });
      assert.throws(
        () => builder.sign({ key: '5bb72603f237c0993f7973d37fdade32c71aa94aee686aa79d260acba1882d90' }),
        (e: any) => e.message === 'A maximum of 3 can sign the transaction.'
      );
    });

    it('a transfer transaction with repeated sign', () => {
      const builder = initTxBuilder();
      builder.sign({ key: testData.ACCOUNT_1.prvKeyWithPrefix });
      assert.throws(
        () => builder.sign({ key: testData.ACCOUNT_1.prvKeyWithPrefix }),
        (e: any) =>
          e.message ===
          'Repeated sign: 302e020100300506032b65700422042062b0b669de0ab5e91b4328e1431859a5ca47e7426e701019272f5c2d52825b01'
      );
    });

    it('a token transfer transaction with an invalid destination address', () => {
      const txBuilder = factory.getTokenTransferBuilder();
      assert.throws(
        () =>
          txBuilder.send({
            address: 'invalidaddress',
            amount: '10',
            tokenName: TOKEN_NAME,
          }),
        (e: any) => e.message === 'Invalid address'
      );
    });

    it('a token transfer transaction with an invalid amount: text value', () => {
      const txBuilder = factory.getTokenTransferBuilder();
      assert.throws(
        () =>
          txBuilder.send({
            address: testData.ACCOUNT_2.accountId,
            amount: 'invalidamount',
            tokenName: TOKEN_NAME,
          }),
        (e: any) => e.message === 'Invalid amount'
      );
    });

    it('a token transfer transaction with an invalid amount: negative value', () => {
      const txBuilder = factory.getTokenTransferBuilder();
      assert.throws(
        () =>
          txBuilder.send({
            address: testData.ACCOUNT_2.accountId,
            amount: '-5',
            tokenName: TOKEN_NAME,
          }),
        (e: any) => e.message === 'Invalid amount'
      );
    });

    it('a token transfer transaction with an invalid destination memo', () => {
      const txBuilder = factory.getTokenTransferBuilder();
      assert.throws(
        () =>
          txBuilder.memo(
            'This sentence has more than 100 bytes allowed for the memo, this should throw error -----------------'
          ),
        (e: any) => e.message === 'Memo must not be longer than 100 bytes'
      );
    });

    it('a token transfer transaction with an invalid token name', () => {
      const txBuilder = factory.getTokenTransferBuilder();
      assert.throws(
        () =>
          txBuilder.send({
            address: testData.ACCOUNT_2.accountId,
            amount: '10',
            tokenName: 'invalidtokenname',
          }),
        (e: any) => e.message === 'Invalid token name: invalidtokenname'
      );
    });

    it('a token transfer transaction without token name', async () => {
      const txBuilder = factory.getTokenTransferBuilder();
      assert.throws(
        () =>
          txBuilder.send({
            address: testData.ACCOUNT_2.accountId,
            amount: '10',
          }),
        (e: any) => e.message === 'Invalid missing token name'
      );
    });

    it('a token transfer transaction with invalid start time', () => {
      const txBuilder = factory.getTokenTransferBuilder();
      assert.throws(
        () => txBuilder.startTime('invalid start time'),
        (e: any) => e.message === 'Invalid value for time parameter'
      );
      assert.throws(
        () => txBuilder.startTime('-5'),
        (e: any) => e.message === 'Invalid value for time parameter'
      );
    });

    it('a token transfer transaction with invalid node', () => {
      const txBuilder = factory.getTokenTransferBuilder();
      assert.throws(
        () => txBuilder.node({ nodeId: 'invalid node' }),
        (e: any) => e.message === 'Invalid Hedera node address'
      );
    });
  });
});
