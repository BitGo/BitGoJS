import { getBuilderFactory } from '../getBuilderFactory';
import { KeyPair, Utils } from '../../../src';
import should from 'should';
import * as testData from '../../resources/sol';

describe('Sol Wallet Initialization Builder', () => {
  const factory = getBuilderFactory('tsol');

  const walletInitBuilder = () => {
    const txBuilder = factory.getWalletInitializationBuilder();
    txBuilder.nonce(recentBlockHash);
    txBuilder.sender(authAccount.pub);
    return txBuilder;
  };

  const authAccount = new KeyPair(testData.authAccount).getKeys();
  const nonceAccount = new KeyPair(testData.nonceAccount).getKeys();
  const wrongAccount = new KeyPair({ prv: testData.prvKeys.prvKey1.base58 }).getKeys();
  const invalidPubKey = testData.pubKeys.invalidPubKeys[0];
  const recentBlockHash = 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi';
  const amount = '300000';

  describe('Build and sign', () => {
    describe('Succeed', () => {
      it('build a wallet init tx unsigned', async () => {
        const txBuilder = walletInitBuilder();
        txBuilder.sender(authAccount.pub);
        txBuilder.address(nonceAccount.pub);
        txBuilder.amount(amount);
        const tx = await txBuilder.build();
        tx.inputs.length.should.equal(1);
        tx.inputs[0].should.deepEqual({
          address: authAccount.pub,
          value: amount,
          coin: 'tsol',
        });
        tx.outputs.length.should.equal(0);
        const rawTx = tx.toBroadcastFormat();
        should.equal(Utils.isValidRawTransaction(rawTx), true);
        should.equal(rawTx, testData.WALLET_INIT_UNSIGNED_TX);
      });

      it('build a wallet init tx unsigned with memo', async () => {
        const txBuilder = walletInitBuilder();
        txBuilder.sender(authAccount.pub);
        txBuilder.address(nonceAccount.pub);
        txBuilder.amount(amount);
        txBuilder.memo('test memo please ignore');
        const tx = await txBuilder.build();
        tx.inputs.length.should.equal(1);
        tx.inputs[0].should.deepEqual({
          address: authAccount.pub,
          value: amount,
          coin: 'tsol',
        });
        tx.outputs.length.should.equal(0);
        const rawTx = tx.toBroadcastFormat();
        should.equal(Utils.isValidRawTransaction(rawTx), true);
        should.equal(rawTx, testData.WALLET_INIT_WITH_MEMO_UNSIGNED_TX);
      });

      it('build a wallet init tx unsigned with amount 0', async () => {
        const txBuilder = walletInitBuilder();
        txBuilder.sender(authAccount.pub);
        txBuilder.address(nonceAccount.pub);
        txBuilder.amount('0');
        const tx = await txBuilder.build();
        tx.inputs.length.should.equal(1);
        tx.inputs[0].should.deepEqual({
          address: authAccount.pub,
          value: '0',
          coin: 'tsol',
        });
        tx.outputs.length.should.equal(0);
        const rawTx = tx.toBroadcastFormat();
        should.equal(Utils.isValidRawTransaction(rawTx), true);
        should.equal(rawTx, testData.WALLET_INIT_UNSIGNED_TX_AMOUNT_ZERO);
      });

      it('build a wallet init tx and sign it', async () => {
        const txBuilder = walletInitBuilder();
        txBuilder.sender(authAccount.pub);
        txBuilder.address(nonceAccount.pub);
        txBuilder.amount(amount);
        txBuilder.sign({ key: authAccount.prv });
        txBuilder.sign({ key: nonceAccount.prv });
        const tx = await txBuilder.build();
        tx.inputs.length.should.equal(1);
        tx.inputs[0].should.deepEqual({
          address: authAccount.pub,
          value: amount,
          coin: 'tsol',
        });
        tx.outputs.length.should.equal(0);
        const rawTx = tx.toBroadcastFormat();
        should.equal(Utils.isValidRawTransaction(rawTx), true);
        should.equal(rawTx, testData.WALLET_INIT_SIGNED_TX);
      });

      it('build a wallet init tx with memo and sign it', async () => {
        const txBuilder = walletInitBuilder();
        txBuilder.sender(authAccount.pub);
        txBuilder.address(nonceAccount.pub);
        txBuilder.amount(amount);
        txBuilder.memo('test memo please ignore');
        txBuilder.sign({ key: authAccount.prv });
        txBuilder.sign({ key: nonceAccount.prv });
        const tx = await txBuilder.build();
        tx.inputs.length.should.equal(1);
        tx.inputs[0].should.deepEqual({
          address: authAccount.pub,
          value: amount,
          coin: 'tsol',
        });
        tx.outputs.length.should.equal(0);
        const rawTx = tx.toBroadcastFormat();
        should.equal(Utils.isValidRawTransaction(rawTx), true);
        should.equal(rawTx, testData.WALLET_INIT_WITH_MEMO_SIGNED_TX);
      });

      it('build a wallet init tx with zero amount and sign it', async () => {
        const txBuilder = walletInitBuilder();
        txBuilder.sender(authAccount.pub);
        txBuilder.address(nonceAccount.pub);
        txBuilder.amount('0');
        txBuilder.sign({ key: authAccount.prv });
        txBuilder.sign({ key: nonceAccount.prv });
        const tx = await txBuilder.build();
        tx.inputs.length.should.equal(1);
        tx.inputs[0].should.deepEqual({
          address: authAccount.pub,
          value: '0',
          coin: 'tsol',
        });
        tx.outputs.length.should.equal(0);
        const rawTx = tx.toBroadcastFormat();
        should.equal(Utils.isValidRawTransaction(rawTx), true);
        should.equal(rawTx, testData.WALLET_INIT_SIGNED_TX_AMOUNT_ZERO);
      });
    });
    describe('Fail', () => {
      it('for invalid nonceAddress', () => {
        const txBuilder = walletInitBuilder();
        should(() => txBuilder.address(invalidPubKey)).throwError(
          'Invalid or missing nonceAddress, got: ' + invalidPubKey
        );
      });

      it('build a wallet init tx when amount is invalid', () => {
        const txBuilder = walletInitBuilder();
        should(() => txBuilder.amount('randomstring')).throwError('Invalid or missing amount, got: randomstring');
      });

      it('build a wallet init tx and sign with an incorrect account', async () => {
        const txBuilder = walletInitBuilder();
        txBuilder.sender(authAccount.pub);
        txBuilder.address(nonceAccount.pub);
        txBuilder.amount(amount);
        txBuilder.sign({ key: wrongAccount.prv });
        await txBuilder.build().should.rejectedWith('unknown signer: CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S');
      });

      it('build when nonce is not provided', async () => {
        const txBuilder = factory.getWalletInitializationBuilder();
        txBuilder.sender(authAccount.pub);
        txBuilder.address(nonceAccount.pub);
        txBuilder.amount(amount);
        txBuilder.sign({ key: authAccount.prv });
        await txBuilder.build().should.rejectedWith('Invalid transaction: missing nonce blockhash');
      });

      it('build when sender is not provided', async () => {
        const txBuilder = factory.getWalletInitializationBuilder();
        txBuilder.nonce(recentBlockHash);
        txBuilder.address(nonceAccount.pub);
        txBuilder.amount(amount);
        txBuilder.sign({ key: authAccount.prv });
        await txBuilder.build().should.rejectedWith('Invalid transaction: missing sender');
      });

      it('to sign twice with the same key', () => {
        const txBuilder = factory.from(testData.WALLET_INIT_UNSIGNED_TX);
        txBuilder.sign({ key: authAccount.prv });
        should(() => txBuilder.sign({ key: authAccount.prv })).throwError(
          'Duplicated signer: ' + authAccount.prv?.toString()
        );
      });
    });
  });
  describe('From and sign', () => {
    describe('Succeed', () => {
      it('build from a unsigned wallet init and sign it', async () => {
        const txBuilder = factory.from(testData.WALLET_INIT_UNSIGNED_TX);
        txBuilder.sign({ key: authAccount.prv });
        txBuilder.sign({ key: nonceAccount.prv });
        const tx = await txBuilder.build();
        tx.inputs.length.should.equal(1);
        tx.inputs[0].should.deepEqual({
          address: authAccount.pub,
          value: '300000',
          coin: 'tsol',
        });
        tx.outputs.length.should.equal(0);
        const rawTx = tx.toBroadcastFormat();
        should.equal(Utils.isValidRawTransaction(rawTx), true);
        should.equal(rawTx, testData.WALLET_INIT_SIGNED_TX);
      });

      it('build from a unsigned wallet init with memo and sign it', async () => {
        const txBuilder = factory.from(testData.WALLET_INIT_WITH_MEMO_UNSIGNED_TX);
        txBuilder.sign({ key: authAccount.prv });
        txBuilder.sign({ key: nonceAccount.prv });
        const tx = await txBuilder.build();
        tx.inputs.length.should.equal(1);
        tx.inputs[0].should.deepEqual({
          address: authAccount.pub,
          value: '300000',
          coin: 'tsol',
        });
        tx.outputs.length.should.equal(0);
        const rawTx = tx.toBroadcastFormat();
        should.equal(Utils.isValidRawTransaction(rawTx), true);
        should.equal(rawTx, testData.WALLET_INIT_WITH_MEMO_SIGNED_TX);
      });
    });

    describe('Fail', () => {
      it('build from a unsigned wallet init and fail to sign it', async () => {
        const txBuilder = factory.from(testData.WALLET_INIT_UNSIGNED_TX);
        txBuilder.sign({ key: wrongAccount.prv });
        await txBuilder.build().should.rejectedWith('unknown signer: CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S');
      });
      it('build from a signed wallet init and fail to sign it', async () => {
        const txBuilder = factory.from(testData.WALLET_INIT_SIGNED_TX);
        txBuilder.sign({ key: wrongAccount.prv });
        await txBuilder.build().should.rejectedWith('unknown signer: CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S');
      });
    });
  });
});
