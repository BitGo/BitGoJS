import { register } from '../../../../../src';
import { TransactionBuilderFactory, KeyPair, Utils } from '../../../../../src/coin/sol';
import should from 'should';
import * as testData from '../../../../resources/sol/sol';

describe('Sol Wallet Initialization Builder', () => {
  const factory = register('tsol', TransactionBuilderFactory);

  const walletInitBuilder = () => {
    const txBuilder = factory.getWalletInitializationBuilder();
    txBuilder.nonce(recentBlockHash);
    txBuilder.feePayer(authAccount.pub);
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
        txBuilder.walletInit(nonceAccount.pub, authAccount.pub, amount);
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
        txBuilder.walletInit(nonceAccount.pub, authAccount.pub, amount);
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
        txBuilder.walletInit(nonceAccount.pub, authAccount.pub, '0');
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
        txBuilder.walletInit(nonceAccount.pub, authAccount.pub, amount);
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
        txBuilder.walletInit(nonceAccount.pub, authAccount.pub, amount);
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
        txBuilder.walletInit(nonceAccount.pub, authAccount.pub, '0');
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
        should(() => txBuilder.walletInit(invalidPubKey, authAccount.pub, amount)).throwError(
          'Invalid or missing nonceAddress, got: ' + invalidPubKey,
        );
      });

      it('for invalid authAddress', () => {
        const txBuilder = walletInitBuilder();
        should(() => txBuilder.walletInit(nonceAccount.pub, invalidPubKey, amount)).throwError(
          'Invalid or missing authAddress, got: ' + invalidPubKey,
        );
      });

      it('build a wallet init tx when the nonceAddress is equal to the fromAddress', () => {
        const txBuilder = walletInitBuilder();
        should(() => txBuilder.walletInit(authAccount.pub, authAccount.pub, amount)).throwError(
          'nonceAddress cant be equal to fromAddress',
        );
      });

      it('build a wallet init tx when amount is invalid', () => {
        const txBuilder = walletInitBuilder();
        should(() => txBuilder.walletInit(nonceAccount.pub, authAccount.pub, 'randomstring')).throwError(
          'Invalid or missing amount, got: randomstring',
        );
      });

      it('build a wallet init tx and sign with an incorrect account', async () => {
        const txBuilder = walletInitBuilder();
        txBuilder.walletInit(nonceAccount.pub, authAccount.pub, amount);
        txBuilder.sign({ key: wrongAccount.prv });
        await txBuilder.build().should.rejectedWith('unknown signer: CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S');
      });

      it('build when nonce is not provided', async () => {
        const txBuilder = factory.getWalletInitializationBuilder();
        txBuilder.feePayer(authAccount.pub);
        txBuilder.walletInit(nonceAccount.pub, authAccount.pub, amount);
        txBuilder.sign({ key: authAccount.prv });
        await txBuilder.build().should.rejectedWith('Invalid transaction: missing nonce blockhash');
      });

      it('build when feePayer is not provided', async () => {
        const txBuilder = factory.getWalletInitializationBuilder();
        txBuilder.nonce(recentBlockHash);
        txBuilder.walletInit(nonceAccount.pub, authAccount.pub, amount);
        txBuilder.sign({ key: authAccount.prv });
        await txBuilder.build().should.rejectedWith('Invalid transaction: missing feePayer');
      });

      it('to use wallet Init method more than once', async () => {
        const txBuilder = walletInitBuilder();
        txBuilder.walletInit(nonceAccount.pub, authAccount.pub, amount);
        should(() => txBuilder.walletInit(nonceAccount.pub, authAccount.pub, amount)).throwError(
          'Cannot use walletInit method more than once',
        );
      });

      it('to add memo without other operation', async () => {
        const txBuilder = walletInitBuilder();
        should(() => txBuilder.memo('test memo please ignore')).throwError(
          'Cannot use memo before adding other operation',
        );
      });

      it('to add a second memo', async () => {
        const txBuilder = walletInitBuilder();
        txBuilder.walletInit(nonceAccount.pub, authAccount.pub, amount);
        txBuilder.memo('test memo please ignore');
        should(() => txBuilder.memo('second memo')).throwError('Only 1 memo is allowed');
      });

      it('to sign twice with the same key', () => {
        const txBuilder = factory.from(testData.WALLET_INIT_UNSIGNED_TX);
        txBuilder.sign({ key: authAccount.prv });
        should(() => txBuilder.sign({ key: authAccount.prv })).throwError(
          'Duplicated signer: ' + authAccount.prv?.toString(),
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
