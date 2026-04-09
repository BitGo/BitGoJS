import { getBuilderFactory } from '../getBuilderFactory';
import { KeyPair, Utils } from '../../../src';
import should from 'should';
import * as testData from '../../resources/sol';

describe('Sol Transfer Builder', () => {
  const factory = getBuilderFactory('tsol');

  const transferBuilder = () => {
    const txBuilder = factory.getTransferBuilder();
    txBuilder.nonce(recentBlockHash);
    txBuilder.sender(authAccount.pub);
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
      txBuilder.sender(authAccount.pub);
      txBuilder.send({ address: otherAccount.pub, amount });
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
      txBuilder.sender(authAccount.pub);
      txBuilder.send({ address: otherAccount.pub, amount });
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
      const txJson = tx.toJson();
      txJson.durableNonce.should.deepEqual({
        walletNonceAddress: nonceAccount.pub,
        authWalletAddress: authAccount.pub,
      });
    });

    it('build a transfer tx unsigned with memo and durable nonce', async () => {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.nonce(recentBlockHash, { walletNonceAddress: nonceAccount.pub, authWalletAddress: authAccount.pub });
      txBuilder.sender(authAccount.pub);
      txBuilder.send({ address: otherAccount.pub, amount });
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
      txBuilder.sender(authAccount.pub);
      txBuilder.send({ address: otherAccount.pub, amount });
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
      txBuilder.sender(authAccount.pub);
      txBuilder.send({ address: otherAccount.pub, amount });
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
      txBuilder.sender(authAccount.pub);
      txBuilder.send({ address: otherAccount.pub, amount });
      txBuilder.send({ address: account1.pub, amount });
      txBuilder.send({ address: account2.pub, amount });
      txBuilder.send({ address: account3.pub, amount });
      txBuilder.send({ address: account4.pub, amount });
      txBuilder.send({ address: account5.pub, amount });
      txBuilder.memo(memo);
      txBuilder.sign({ key: authAccount.prv });
      const tx = await txBuilder.build();
      tx.inputs.length.should.equal(6);
      tx.inputs[0].should.deepEqual({
        address: authAccount.pub,
        value: amount,
        coin: 'tsol',
      });
      tx.inputs[1].should.deepEqual({
        address: authAccount.pub,
        value: amount,
        coin: 'tsol',
      });
      tx.inputs[2].should.deepEqual({
        address: authAccount.pub,
        value: amount,
        coin: 'tsol',
      });
      tx.inputs[3].should.deepEqual({
        address: authAccount.pub,
        value: amount,
        coin: 'tsol',
      });
      tx.inputs[4].should.deepEqual({
        address: authAccount.pub,
        value: amount,
        coin: 'tsol',
      });
      tx.inputs[5].should.deepEqual({
        address: authAccount.pub,
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
        address: account1.pub,
        value: amount,
        coin: 'tsol',
      });
      tx.outputs[2].should.deepEqual({
        address: account2.pub,
        value: amount,
        coin: 'tsol',
      });
      tx.outputs[3].should.deepEqual({
        address: account3.pub,
        value: amount,
        coin: 'tsol',
      });
      tx.outputs[4].should.deepEqual({
        address: account4.pub,
        value: amount,
        coin: 'tsol',
      });
      tx.outputs[5].should.deepEqual({
        address: account5.pub,
        value: amount,
        coin: 'tsol',
      });
      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.MULTI_TRANSFER_SIGNED);
    });
  });
  describe('Fail', () => {
    it('for invalid sender', () => {
      const txBuilder = transferBuilder();
      should(() => txBuilder.sender(invalidPubKey)).throwError('Invalid or missing sender, got: ' + invalidPubKey);
    });

    it('for invalid toAddress', () => {
      const txBuilder = transferBuilder();
      should(() => txBuilder.send({ address: invalidPubKey, amount })).throwError(
        'Invalid or missing address, got: ' + invalidPubKey
      );
    });

    it('for invalid amount', async () => {
      const invalidAmount = 'randomstring';
      const txBuilder = transferBuilder();
      should(() => txBuilder.send({ address: nonceAccount.pub, amount: invalidAmount })).throwError(
        'Invalid or missing amount, got: ' + invalidAmount
      );

      const excessiveAmount = '9007199254740992';
      should(() => txBuilder.send({ address: nonceAccount.pub, amount: excessiveAmount })).throwError(
        `input amount ${excessiveAmount} exceeds max safe int 9007199254740991`
      );
    });

    it('to sign twice with the same key', () => {
      const txBuilder = factory.from(testData.TRANSFER_UNSIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE);
      txBuilder.sign({ key: authAccount.prv });
      should(() => txBuilder.sign({ key: authAccount.prv })).throwError(
        'Duplicated signer: ' + authAccount.prv?.toString()
      );
    });
  });
});
