import { register } from '../../../../../src';
import { TransactionBuilderFactory, KeyPair, Utils } from '../../../../../src/coin/sol';
import should from 'should';
import * as testData from '../../../../resources/sol/sol';

describe('Sol Transfer Builder', () => {
  const factory = register('tsol', TransactionBuilderFactory);

  const transferBuilder = () => {
    const txBuilder = factory.getTransferBuilder();
    txBuilder.nonce(recentBlockHash);
    txBuilder.feePayer(authAccount.pub);
    return txBuilder;
  };

  const authAccount = new KeyPair(testData.authAccount).getKeys();
  const nonceAccount = new KeyPair(testData.nonceAccount).getKeys();
  const otherAccount = new KeyPair({ prv: testData.prvKeys.prvKey1.base58 }).getKeys();
  const invalidPubKey = testData.pubKeys.invalidPubKeys[0];
  const recentBlockHash = 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi';
  const amount = '300000';
  const memo = 'test memo';

  describe('Succeed', () => {
    it('build a transfer tx unsigned with memo', async () => {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.nonce(recentBlockHash);
      txBuilder.feePayer(authAccount.pub);
      txBuilder.transfer(authAccount.pub, otherAccount.pub, amount);
      txBuilder.memo(memo);
      const tx = await txBuilder.build();
      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: authAccount.pub,
        value: amount,
        coin: 'tsol',
      });
      tx.outputs.length.should.equal(1);
      tx.outputs[0].should.deepEqual({
        address: otherAccount.pub,
        value: amount,
        coin: 'tsol',
      });
      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.TRANSFER_UNSIGNED_TX_WITH_MEMO);
    });

    it('build a transfer tx unsigned with durable nonce', async () => {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.nonce(recentBlockHash, { walletNonceAddress: nonceAccount.pub, authWalletAddress: authAccount.pub });
      txBuilder.feePayer(authAccount.pub);
      txBuilder.transfer(authAccount.pub, otherAccount.pub, amount);
      const tx = await txBuilder.build();
      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: authAccount.pub,
        value: amount,
        coin: 'tsol',
      });
      tx.outputs.length.should.equal(1);
      tx.outputs[0].should.deepEqual({
        address: otherAccount.pub,
        value: amount,
        coin: 'tsol',
      });
      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.TRANSFER_UNSIGNED_TX_WITH_DURABLE_NONCE);
    });

    it('build a transfer tx unsigned with memo and durable nonce', async () => {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.nonce(recentBlockHash, { walletNonceAddress: nonceAccount.pub, authWalletAddress: authAccount.pub });
      txBuilder.feePayer(authAccount.pub);
      txBuilder.transfer(authAccount.pub, otherAccount.pub, amount);
      txBuilder.memo(memo);
      const tx = await txBuilder.build();
      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: authAccount.pub,
        value: amount,
        coin: 'tsol',
      });
      tx.outputs.length.should.equal(1);
      tx.outputs[0].should.deepEqual({
        address: otherAccount.pub,
        value: amount,
        coin: 'tsol',
      });
      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.TRANSFER_UNSIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE);
    });

    it('build a transfer tx unsigned without memo or durable nonce', async () => {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.nonce(recentBlockHash);
      txBuilder.feePayer(authAccount.pub);
      txBuilder.transfer(authAccount.pub, otherAccount.pub, amount);
      const tx = await txBuilder.build();
      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: authAccount.pub,
        value: amount,
        coin: 'tsol',
      });
      tx.outputs.length.should.equal(1);
      tx.outputs[0].should.deepEqual({
        address: otherAccount.pub,
        value: amount,
        coin: 'tsol',
      });
      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.TRANSFER_UNSIGNED_TX_WITHOUT_MEMO);
    });

    it('build a transfer tx signed with memo and durable nonce', async () => {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.nonce(recentBlockHash, { walletNonceAddress: nonceAccount.pub, authWalletAddress: authAccount.pub });
      txBuilder.feePayer(authAccount.pub);
      txBuilder.transfer(authAccount.pub, otherAccount.pub, amount);
      txBuilder.memo(memo);
      txBuilder.sign({ key: authAccount.prv });
      const tx = await txBuilder.build();
      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: authAccount.pub,
        value: amount,
        coin: 'tsol',
      });
      tx.outputs.length.should.equal(1);
      tx.outputs[0].should.deepEqual({
        address: otherAccount.pub,
        value: amount,
        coin: 'tsol',
      });
      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.TRANSFER_SIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE);
    });

    it('build a multi transfer tx signed with memo and durable nonce', async () => {
      const account1 = new KeyPair({ prv: testData.extraAccounts.prv1 }).getKeys();
      const account2 = new KeyPair({ prv: testData.extraAccounts.prv2 }).getKeys();
      const account3 = new KeyPair({ prv: testData.extraAccounts.prv3 }).getKeys();
      const account4 = new KeyPair({ prv: testData.extraAccounts.prv4 }).getKeys();
      const account5 = new KeyPair({ prv: testData.extraAccounts.prv5 }).getKeys();

      const txBuilder = factory.getTransferBuilder();
      txBuilder.nonce(recentBlockHash, { walletNonceAddress: nonceAccount.pub, authWalletAddress: authAccount.pub });
      txBuilder.feePayer(authAccount.pub);
      txBuilder.transfer(authAccount.pub, otherAccount.pub, amount);
      txBuilder.transfer(account1.pub, account2.pub, amount);
      txBuilder.transfer(account2.pub, account3.pub, amount);
      txBuilder.transfer(account3.pub, account4.pub, amount);
      txBuilder.transfer(account4.pub, account5.pub, amount);
      txBuilder.transfer(account5.pub, account1.pub, amount);
      txBuilder.memo(memo);
      txBuilder.sign({ key: authAccount.prv });
      txBuilder.sign({ key: account1.prv });
      txBuilder.sign({ key: account2.prv });
      txBuilder.sign({ key: account3.prv });
      txBuilder.sign({ key: account4.prv });
      txBuilder.sign({ key: account5.prv });
      const tx = await txBuilder.build();
      tx.inputs.length.should.equal(6);
      tx.inputs[0].should.deepEqual({
        address: authAccount.pub,
        value: amount,
        coin: 'tsol',
      });
      tx.inputs[1].should.deepEqual({
        address: account1.pub,
        value: amount,
        coin: 'tsol',
      });
      tx.inputs[2].should.deepEqual({
        address: account2.pub,
        value: amount,
        coin: 'tsol',
      });
      tx.inputs[3].should.deepEqual({
        address: account3.pub,
        value: amount,
        coin: 'tsol',
      });
      tx.inputs[4].should.deepEqual({
        address: account4.pub,
        value: amount,
        coin: 'tsol',
      });
      tx.inputs[5].should.deepEqual({
        address: account5.pub,
        value: amount,
        coin: 'tsol',
      });
      tx.outputs.length.should.equal(6);
      tx.outputs[0].should.deepEqual({
        address: otherAccount.pub,
        value: amount,
        coin: 'tsol',
      });
      tx.outputs[1].should.deepEqual({
        address: account2.pub,
        value: amount,
        coin: 'tsol',
      });
      tx.outputs[2].should.deepEqual({
        address: account3.pub,
        value: amount,
        coin: 'tsol',
      });
      tx.outputs[3].should.deepEqual({
        address: account4.pub,
        value: amount,
        coin: 'tsol',
      });
      tx.outputs[4].should.deepEqual({
        address: account5.pub,
        value: amount,
        coin: 'tsol',
      });
      tx.outputs[5].should.deepEqual({
        address: account1.pub,
        value: amount,
        coin: 'tsol',
      });
      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.MULTI_TRANSFER_SIGNED);
    });
  });

  describe('Fail', () => {
    it('for invalid fromAddress', () => {
      const txBuilder = transferBuilder();
      should(() => txBuilder.transfer(invalidPubKey, nonceAccount.pub, amount)).throwError(
        'Invalid or missing fromAddress, got: ' + invalidPubKey,
      );
    });

    it('for invalid toAddress', () => {
      const txBuilder = transferBuilder();
      should(() => txBuilder.transfer(authAccount.pub, invalidPubKey, amount)).throwError(
        'Invalid or missing toAddress, got: ' + invalidPubKey,
      );
    });

    it('for invalid amount', () => {
      const invalidAmount = 'randomstring';
      const txBuilder = transferBuilder();
      should(() => txBuilder.transfer(authAccount.pub, nonceAccount.pub, invalidAmount)).throwError(
        'Invalid or missing amount, got: ' + invalidAmount,
      );
    });

    it('to add memo without other operation', async () => {
      const txBuilder = transferBuilder();
      should(() => txBuilder.memo('test memo please ignore')).throwError(
        'Cannot use memo before adding other operation',
      );
    });

    it('to add a second memo', async () => {
      const txBuilder = transferBuilder();
      txBuilder.transfer(nonceAccount.pub, authAccount.pub, amount);
      txBuilder.memo('test memo please ignore');
      should(() => txBuilder.memo('second memo')).throwError('Only 1 memo is allowed');
    });

    it('to sign twice with the same key', () => {
      const txBuilder = factory.from(testData.TRANSFER_UNSIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE);
      txBuilder.sign({ key: authAccount.prv });
      should(() => txBuilder.sign({ key: authAccount.prv })).throwError(
        'Duplicated signer: ' + authAccount.prv?.toString(),
      );
    });
  });
});
