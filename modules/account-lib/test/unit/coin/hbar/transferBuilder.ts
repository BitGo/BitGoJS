import should from 'should';
import { register } from '../../../../src/index';
import { TransactionBuilderFactory } from '../../../../src/coin/hbar';
import * as testData from '../../../resources/hbar/hbar';

describe('HBAR Transfer Builder', () => {
  const factory = register('thbar', TransactionBuilderFactory);

  const initTxBuilder = () => {
    const txBuilder = factory.getTransferBuilder();
    txBuilder.fee({ fee: testData.FEE });
    txBuilder.source({ address: testData.ACCOUNT_1.accountId });
    txBuilder.to(testData.ACCOUNT_2.accountId);
    txBuilder.amount('10');
    return txBuilder;
  };

  describe('should build ', () => {
    it('a signed transfer transaction', async () => {
      const builder = initTxBuilder();
      builder.validDuration(1000000);
      builder.node({ nodeId: '0.0.2345' });
      builder.startTime('1596110493.372646570');
      builder.sign({ key: testData.ACCOUNT_1.privateKey });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.to, testData.ACCOUNT_2.accountId);
      should.deepEqual(txJson.amount, '10');
      should.deepEqual(txJson.from, testData.ACCOUNT_1.accountId);
      should.deepEqual(txJson.fee.toString(), testData.FEE);
      should.deepEqual(tx.toBroadcastFormat(), testData.SIGNED_TRANSFER_TRANSACTION);
    });

    it('a transfer transaction with amount 0', async () => {
      const builder = initTxBuilder();
      builder.amount('0');
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.to, testData.ACCOUNT_2.accountId);
      should.deepEqual(txJson.amount, '0');
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
      should.deepEqual(txJson.memo, 'This is an example');
      should.deepEqual(txJson.from, testData.ACCOUNT_1.accountId);
      should.deepEqual(txJson.fee.toString(), testData.FEE);
    });

    it('a non signed transfer transaction', async () => {
      const builder = initTxBuilder();
      builder.startTime('1596110493.372646570');
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.to, testData.ACCOUNT_2.accountId);
      should.deepEqual(txJson.amount, '10');
      should.deepEqual(txJson.from, testData.ACCOUNT_1.accountId);
      should.deepEqual(txJson.fee.toString(), testData.FEE);
      should.deepEqual(tx.toBroadcastFormat(), testData.NON_SIGNED_TRANSFER_TRANSACTION);
    });

    it('a non signed transaction from serialized', async () => {
      const builder = initTxBuilder();
      const tx = await builder.build();
      const raw = tx.toBroadcastFormat();
      const builder2 = factory.getTransferBuilder();
      builder2.from(raw);
      // Delete these lines when fromImplentation is implemented
      builder2.to(testData.ACCOUNT_2.accountId);
      builder2.amount('10');
      //
      const tx2 = await builder2.build();
      should.deepEqual(tx.toJson(), tx2.toJson());
      should.deepEqual(raw, tx2.toBroadcastFormat());
    });

    it('a signed serialized transaction', async () => {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.from(testData.SIGNED_TRANSFER_TRANSACTION);
      const tx = await txBuilder.build();
      should.deepEqual(tx.toBroadcastFormat(), testData.SIGNED_TRANSFER_TRANSACTION);
    });
  });

  describe('should fail', () => {
    it('a transfer transaction with an invalid key', () => {
      const builder = initTxBuilder();
      should.throws(
        () => builder.sign({ key: 'invalidKey' }),
        e => e.message === 'Invalid private key',
      );
    });

    it('a transfer transaction with more signatures than allowed', () => {
      const builder = initTxBuilder();
      builder.sign({ key: testData.ACCOUNT_2.privateKey });
      builder.sign({ key: testData.ACCOUNT_1.privateKey });
      builder.sign({ key: testData.ACCOUNT_3.privateKey });
      should.throws(
        () => builder.sign({ key: '5bb72603f237c0993f7973d37fdade32c71aa94aee686aa79d260acba1882d90' }),
        e => e.message === 'A maximum of 3 can sign the transaction.',
      );
    });

    it('a transfer transaction with repeated sign', () => {
      const builder = initTxBuilder();
      builder.sign({ key: testData.ACCOUNT_1.privateKey });
      should.throws(
        () => builder.sign({ key: testData.ACCOUNT_1.privateKey }),
        e =>
          e.message ===
          'Repeated sign: 302e020100300506032b65700422042062b0b669de0ab5e91b4328e1431859a5ca47e7426e701019272f5c2d52825b01',
      );
    });

    it('a transfer transaction with an invalid destination address', () => {
      const txBuilder = factory.getTransferBuilder();
      should.throws(
        () => txBuilder.to('invalidaddress'),
        e => e.message === 'Invalid address',
      );
    });

    it('a transfer transaction with an invalid amount: text value', () => {
      const txBuilder = factory.getTransferBuilder();
      should.throws(
        () => txBuilder.amount('invalidamount'),
        e => e.message === 'Invalid amount',
      );
    });

    it('a transfer transaction with an invalid amount: negative value', () => {
      const txBuilder = factory.getTransferBuilder();
      should.throws(
        () => txBuilder.amount('-5'),
        e => e.message === 'Invalid amount',
      );
    });

    it('a transfer transaction with an invalid destination memo', () => {
      const txBuilder = factory.getTransferBuilder();
      should.throws(
        () => txBuilder.memo('This sentence has more than 100 bytes allowed for the memo'),
        e => e.message === 'Memo must not be longer than 100 bytes',
      );
    });

    it('a transfer transaction without destination param', async () => {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.fee({ fee: '1000000000' });
      txBuilder.source({ address: testData.ACCOUNT_1.accountId });
      txBuilder.amount('10');
      await txBuilder.build().should.be.rejectedWith('Invalid transaction: missing to');
    });

    it('a transfer transaction without amount', async () => {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.fee({ fee: '1000000000' });
      txBuilder.source({ address: testData.ACCOUNT_1.accountId });
      txBuilder.to(testData.ACCOUNT_2.accountId);
      await txBuilder.build().should.be.rejectedWith('Invalid transaction: missing amount');
    });

    it('a transfer transaction with invalid start time', () => {
      const txBuilder = factory.getTransferBuilder();
      should.throws(
        () => txBuilder.startTime('invalid start time'),
        e => e.message === 'Invalid value for time parameter',
      );
      should.throws(
        () => txBuilder.startTime('-5'),
        e => e.message === 'Invalid value for time parameter',
      );
    });

    it('a transfer transaction with invalid node', () => {
      const txBuilder = factory.getTransferBuilder();
      should.throws(
        () => txBuilder.node({ nodeId: 'invalid node' }),
        e => e.message === 'Invalid Hedera node address',
      );
    });
  });
});
