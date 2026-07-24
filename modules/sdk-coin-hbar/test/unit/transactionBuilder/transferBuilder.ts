import assert from 'assert';
import * as should from 'should';
import { getBuilderFactory } from '../getBuilderFactory';
import * as testData from '../../resources/hbar';
import { TransactionType } from '@bitgo/sdk-core';

describe('HBAR Transfer Builder', () => {
  const factory = getBuilderFactory('thbar');

  const initTxBuilder = () => {
    const txBuilder = factory.getTransferBuilder();
    txBuilder.fee({ fee: testData.FEE });
    txBuilder.source({ address: testData.ACCOUNT_1.accountId });
    txBuilder.send({
      address: testData.ACCOUNT_2.accountId,
      amount: '10',
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
        should.deepEqual(txJson.to, testData.ACCOUNT_2.accountId);
        should.deepEqual(txJson.amount, '10');
        txJson.instructionsData.params.recipients.length.should.equal(1);
        txJson.instructionsData.params.recipients[0].should.deepEqual({
          address: testData.ACCOUNT_2.accountId,
          amount: '10',
        });
        should.deepEqual(txJson.from, testData.ACCOUNT_1.accountId);
        should.deepEqual(txJson.fee.toString(), testData.FEE);
        should.deepEqual(tx.toBroadcastFormat(), testData.SIGNED_TRANSFER_TRANSACTION);
        tx.type.should.equal(TransactionType.Send);

        tx.outputs.length.should.equal(1);
        tx.outputs[0].address.should.equal(testData.ACCOUNT_2.accountId);
        tx.outputs[0].value.should.equal('10');
        tx.inputs.length.should.equal(1);
        tx.inputs[0].address.should.equal(testData.ACCOUNT_1.accountId);
        tx.inputs[0].value.should.equal('10');
      });

      it('a transfer transaction signed multiple times', async () => {
        const builder = initTxBuilder();
        builder.startTime('1596110493.372646570');
        builder.sign({ key: testData.ACCOUNT_1.prvKeyWithPrefix });
        builder.sign({ key: testData.ACCOUNT_2.privateKey });
        builder.sign({ key: testData.ACCOUNT_3.privateKey });
        const tx = await builder.build();
        const txJson = tx.toJson();
        should.deepEqual(tx.signature.length, 3);
        should.deepEqual(txJson.fee.toString(), testData.FEE);
        should.deepEqual(tx.toBroadcastFormat(), testData.THREE_TIMES_SIGNED_TRANSACTION);
      });

      it('a transfer transaction with amount 0', async () => {
        const builder = factory.getTransferBuilder();
        builder.fee({ fee: testData.FEE });
        builder.source({ address: testData.ACCOUNT_1.accountId });
        builder.send({
          address: testData.ACCOUNT_2.accountId,
          amount: '0',
        });

        const tx = await builder.build();
        const txJson = tx.toJson();
        should.deepEqual(txJson.to, testData.ACCOUNT_2.accountId);
        should.deepEqual(txJson.amount, '0');
        txJson.instructionsData.params.recipients.length.should.equal(1);
        txJson.instructionsData.params.recipients[0].should.deepEqual({
          address: testData.ACCOUNT_2.accountId,
          amount: '0',
        });
        should.deepEqual(txJson.from, testData.ACCOUNT_1.accountId);
        should.deepEqual(txJson.fee.toString(), testData.FEE);
      });

      it('a transfer transaction with memo', async () => {
        const builder = initTxBuilder();
        builder.memo('This is an example');
        const tx = await builder.build();
        const txJson = tx.toJson();
        should.deepEqual(txJson.to, testData.ACCOUNT_2.accountId);
        should.deepEqual(txJson.amount, '10');
        txJson.instructionsData.params.recipients.length.should.equal(1);
        txJson.instructionsData.params.recipients[0].should.deepEqual({
          address: testData.ACCOUNT_2.accountId,
          amount: '10',
        });
        should.deepEqual(txJson.memo, 'This is an example');
        should.deepEqual(txJson.from, testData.ACCOUNT_1.accountId);
        should.deepEqual(txJson.fee.toString(), testData.FEE);
      });

      it('a non signed transfer transaction', async () => {
        const builder = initTxBuilder();
        builder.startTime('1596110493.372646570');
        builder.validDuration(1000000);
        builder.node({ nodeId: '0.0.2345' });
        const tx = await builder.build();
        const txJson = tx.toJson();
        should.deepEqual(txJson.to, testData.ACCOUNT_2.accountId);
        should.deepEqual(txJson.amount, '10');
        txJson.instructionsData.params.recipients.length.should.equal(1);
        txJson.instructionsData.params.recipients[0].should.deepEqual({
          address: testData.ACCOUNT_2.accountId,
          amount: '10',
        });
        should.deepEqual(txJson.from, testData.ACCOUNT_1.accountId);
        should.deepEqual(txJson.fee.toString(), testData.FEE);
        should.deepEqual(tx.toBroadcastFormat(), testData.NON_SIGNED_TRANSFER_TRANSACTION);
      });

      it('a multisig transfer transaction', async () => {
        const builder = initTxBuilder();
        builder.startTime('1596110493.372646570');
        builder.sign({ key: testData.ACCOUNT_1.prvKeyWithPrefix });
        builder.sign({ key: testData.ACCOUNT_2.privateKey });
        builder.sign({ key: testData.ACCOUNT_3.privateKey });
        const tx = await builder.build();
        should.deepEqual(tx.toBroadcastFormat(), testData.THREE_TIMES_SIGNED_TRANSACTION);
      });

      it('a transaction between accounts with realm and shard non zero', async () => {
        const builder = factory.getTransferBuilder();
        builder.fee({ fee: testData.FEE });
        builder.source({ address: '2.3.456' });
        builder.send({
          address: '3.4.567',
          amount: '10',
        });
        builder.node({ nodeId: '5.2.2345' });
        const tx = await builder.build();
        const txJson = tx.toJson();
        should.deepEqual(txJson.to, '3.4.567');
        txJson.instructionsData.params.recipients.length.should.equal(1);
        txJson.instructionsData.params.recipients[0].should.deepEqual({
          address: '3.4.567',
          amount: '10',
        });
        should.deepEqual(txJson.node, '5.2.2345');
        should.deepEqual(txJson.from, '2.3.456');
      });

      it('a transaction between accounts without realm and shard', async () => {
        const builder = factory.getTransferBuilder();
        builder.fee({ fee: testData.FEE });
        builder.source({ address: '456' });
        builder.send({
          address: '567',
          amount: '10',
        });
        builder.node({ nodeId: '2345' });
        const tx = await builder.build();
        const txJson = tx.toJson();
        should.deepEqual(txJson.to, '0.0.567');
        txJson.instructionsData.params.recipients.length.should.equal(1);
        txJson.instructionsData.params.recipients[0].should.deepEqual({
          address: '0.0.567',
          amount: '10',
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
        });

        const tx = await builder.build();
        const txJson = tx.toJson();
        txJson.instructionsData.params.recipients.length.should.equal(2);
        txJson.instructionsData.params.recipients[0].should.deepEqual({
          address: testData.ACCOUNT_2.accountId,
          amount: '10',
        });
        txJson.instructionsData.params.recipients[1].should.deepEqual({
          address: testData.ACCOUNT_3.accountId,
          amount: '15',
        });
        should.deepEqual(txJson.from, testData.ACCOUNT_1.accountId);
        should.deepEqual(txJson.fee.toString(), testData.FEE);

        tx.outputs.length.should.equal(2);
        tx.outputs[0].address.should.equal(testData.ACCOUNT_2.accountId);
        tx.outputs[0].value.should.equal('10');
        tx.outputs[1].address.should.equal(testData.ACCOUNT_3.accountId);
        tx.outputs[1].value.should.equal('15');
        tx.inputs.length.should.equal(1);
        tx.inputs[0].address.should.equal(testData.ACCOUNT_1.accountId);
        tx.inputs[0].value.should.equal('25');

        should.deepEqual(tx.toBroadcastFormat(), testData.NON_SIGNED_MULTI_TRANSFER_TRANSACTION);
      });
    });

    describe('serialized transactions', () => {
      it('a non signed transfer transaction from serialized', async () => {
        const builder = factory.from(testData.NON_SIGNED_TRANSFER_TRANSACTION);
        builder.sign({ key: testData.ACCOUNT_1.prvKeyWithPrefix });
        const tx2 = await builder.build();
        should.deepEqual(tx2.toBroadcastFormat(), testData.SIGNED_TRANSFER_TRANSACTION);
        tx2.type.should.equal(TransactionType.Send);
      });

      it('a non signed multirecipients transfer transaction from serialized', async () => {
        const builder = factory.from(testData.NON_SIGNED_MULTI_TRANSFER_TRANSACTION);
        builder.sign({ key: testData.ACCOUNT_1.prvKeyWithPrefix });
        const tx2 = await builder.build();
        should.deepEqual(tx2.toBroadcastFormat(), testData.SIGNED_MULTI_TRANSFER_TRANSACTION);
        tx2.type.should.equal(TransactionType.Send);
      });

      it('a signed transfer transaction from serialized', async () => {
        const txBuilder = factory.from(testData.SIGNED_MAINNET_TRANSFER_TRANSACTION);
        const tx = await txBuilder.build();
        should.deepEqual(tx.toBroadcastFormat(), testData.SIGNED_MAINNET_TRANSFER_TRANSACTION);
        tx.type.should.equal(TransactionType.Send);
        tx.toJson().hash.should.equal(testData.SIGNED_MAINNET_TRANSFER_TRANSACTION_ID);
      });

      it('an offline multisig transfer transaction', async () => {
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

        should.deepEqual(tx3.toBroadcastFormat(), testData.THREE_TIMES_SIGNED_TRANSACTION);
      });
    });
  });

  describe('should fail', () => {
    it('a transfer transaction with an invalid key', () => {
      const builder = initTxBuilder();
      assert.throws(
        () => builder.sign({ key: '5bb72603f237c0993f7973d37fdade32c71aa94aee686aa79d260acba1882d90AA' }),
        (e: any) => e.message === 'Invalid private key'
      );
    });

    it('a transfer transaction with more signatures than allowed', () => {
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

    it('a transfer transaction with an invalid destination address using deprecated to method', () => {
      const txBuilder = factory.getTransferBuilder();
      assert.throws(
        () => txBuilder.to('invalidaddress'),
        (e: any) => e.message === 'Invalid address'
      );
    });

    it('a transfer transaction with an invalid amount using deprecated amount method: text value', () => {
      const txBuilder = factory.getTransferBuilder();
      assert.throws(
        () => txBuilder.amount('invalidamount'),
        (e: any) => e.message === 'Invalid amount'
      );
    });

    it('a transfer transaction with an invalid amount using deprecated amount method: negative value', () => {
      const txBuilder = factory.getTransferBuilder();
      assert.throws(
        () => txBuilder.amount('-5'),
        (e: any) => e.message === 'Invalid amount'
      );
    });

    it('a transfer transaction with an invalid destination address', () => {
      const txBuilder = factory.getTransferBuilder();
      assert.throws(
        () =>
          txBuilder.send({
            address: 'invalidaddress',
            amount: '10000',
          }),
        (e: any) => e.message === 'Invalid address'
      );
    });

    it('a transfer transaction with an invalid amount: text value', () => {
      const txBuilder = factory.getTransferBuilder();
      assert.throws(
        () =>
          txBuilder.send({
            address: testData.ACCOUNT_2.accountId,
            amount: 'invalidamount',
          }),
        (e: any) => e.message === 'Invalid amount'
      );
    });

    it('a transfer transaction with an invalid amount: negative value', () => {
      const txBuilder = factory.getTransferBuilder();
      assert.throws(
        () =>
          txBuilder.send({
            address: testData.ACCOUNT_2.accountId,
            amount: '-5',
          }),
        (e: any) => e.message === 'Invalid amount'
      );
    });

    it('a transfer transaction with an invalid destination memo', () => {
      const txBuilder = factory.getTransferBuilder();
      assert.throws(
        () =>
          txBuilder.memo(
            'This sentence has more than 100 bytes allowed for the memo, this should throw error -----------------'
          ),
        (e: any) => e.message === 'Memo must not be longer than 100 bytes'
      );
    });

    it('a transfer transaction without destination param', async () => {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.fee({ fee: '1000000000' });
      txBuilder.source({ address: testData.ACCOUNT_1.accountId });
      txBuilder.amount('10');
      await txBuilder.build().should.be.rejectedWith('Invalid transaction: missing recipients');
    });

    it('a transfer transaction without amount', async () => {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.fee({ fee: '1000000000' });
      txBuilder.source({ address: testData.ACCOUNT_1.accountId });
      txBuilder.to(testData.ACCOUNT_2.accountId);
      await txBuilder.build().should.be.rejectedWith('Invalid transaction: missing recipients');
    });

    it('a transfer transaction with invalid start time', () => {
      const txBuilder = factory.getTransferBuilder();
      assert.throws(
        () => txBuilder.startTime('invalid start time'),
        (e: any) => e.message === 'Invalid value for time parameter'
      );
      assert.throws(
        () => txBuilder.startTime('-5'),
        (e: any) => e.message === 'Invalid value for time parameter'
      );
    });

    it('a transfer transaction with invalid node', () => {
      const txBuilder = factory.getTransferBuilder();
      assert.throws(
        () => txBuilder.node({ nodeId: 'invalid node' }),
        (e: any) => e.message === 'Invalid Hedera node address'
      );
    });
  });
});
