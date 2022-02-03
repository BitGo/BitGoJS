import { register } from '../../../../../src';
import { TransactionBuilderFactory, KeyPair, Utils } from '../../../../../src/coin/sol';
import should from 'should';
import * as testData from '../../../../resources/sol/sol';

describe('Sol Associated Token Account Builder', () => {
  const factory = register('tsol', TransactionBuilderFactory);

  const ataInitBuilder = () => {
    const txBuilder = factory.getAtaInitializationBuilder();
    txBuilder.nonce(recentBlockHash);
    txBuilder.sender(account.pub);
    txBuilder.mint(mint);

    return txBuilder;
  };

  const account = new KeyPair(testData.associatedTokenAccounts.accounts[0]).getKeys();
  const wrongAccount = new KeyPair({ prv: testData.prvKeys.prvKey1.base58 }).getKeys();
  const mint = testData.associatedTokenAccounts.mint;
  const recentBlockHash = 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi';

  describe('Build and sign', () => {
    describe('Succeed', () => {
      it('build an associated token account init tx unsigned', async () => {
        const txBuilder = ataInitBuilder();
        const tx = await txBuilder.build();
        const rawTx = tx.toBroadcastFormat();

        tx.inputs.length.should.equal(0);
        tx.outputs.length.should.equal(0);
        should.equal(Utils.isValidRawTransaction(rawTx), true);
        should.equal(rawTx, testData.ATA_INIT_UNSIGNED_TX);
      });

      it('build an associated token account init tx unsigned with memo', async () => {
        const txBuilder = ataInitBuilder();
        txBuilder.memo('test memo please ignore');
        const tx = await txBuilder.build();
        const rawTx = tx.toBroadcastFormat();

        tx.inputs.length.should.equal(0);
        tx.outputs.length.should.equal(0);
        should.equal(Utils.isValidRawTransaction(rawTx), true);
        should.equal(rawTx, testData.ATA_INIT_UNSIGNED_TX_WITH_MEMO);
      });

      it('build an associated token account init tx signed', async () => {
        const txBuilder = ataInitBuilder();
        txBuilder.sender(account.pub);
        txBuilder.sign({ key: account.prv });
        const tx = await txBuilder.build();
        const rawTx = tx.toBroadcastFormat();

        tx.inputs.length.should.equal(0);
        tx.outputs.length.should.equal(0);
        should.equal(Utils.isValidRawTransaction(rawTx), true);
        should.equal(rawTx, testData.ATA_INIT_SIGNED_TX);
      });

      it('build an associated token account init tx with memo signed', async () => {
        const txBuilder = ataInitBuilder();
        txBuilder.memo('test memo please ignore');
        txBuilder.sender(account.pub);
        txBuilder.sign({ key: account.prv });
        const tx = await txBuilder.build();
        const rawTx = tx.toBroadcastFormat();

        tx.inputs.length.should.equal(0);
        tx.outputs.length.should.equal(0);
        should.equal(Utils.isValidRawTransaction(rawTx), true);
        should.equal(rawTx, testData.ATA_INIT_SIGNED_TX_WITH_MEMO);
      });
    });

    describe('Fail', () => {
      it('build an associated token account init tx when mint is invalid', () => {
        const txBuilder = ataInitBuilder();
        should(() => txBuilder.mint('randomstring')).throwError('Invalid or missing mint, got: randomstring');
      });

      it('build a wallet init tx and sign with an incorrect account', async () => {
        const txBuilder = ataInitBuilder();
        txBuilder.sender(account.pub);
        txBuilder.sign({ key: wrongAccount.prv });
        await txBuilder.build().should.rejectedWith('unknown signer: CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S');
      });

      it('build when nonce is not provided', async () => {
        const txBuilder = factory.getAtaInitializationBuilder();
        txBuilder.sender(account.pub);
        txBuilder.mint(mint);
        txBuilder.sign({ key: account.prv });
        await txBuilder.build().should.rejectedWith('Invalid transaction: missing nonce blockhash');
      });

      it('build when sender is not provided', async () => {
        const txBuilder = factory.getAtaInitializationBuilder();
        txBuilder.nonce(recentBlockHash);
        txBuilder.mint(mint);
        txBuilder.sign({ key: account.prv });
        await txBuilder.build().should.rejectedWith('Invalid transaction: missing sender');
      });

      it('build when mint is not provided', async () => {
        const txBuilder = factory.getAtaInitializationBuilder();
        txBuilder.sender(account.pub);
        txBuilder.nonce(recentBlockHash);
        txBuilder.sign({ key: account.prv });
        await txBuilder.build().should.rejectedWith('Invalid transaction: missing mint');
      });

      it('to sign twice with the same key', () => {
        const txBuilder = factory.from(testData.ATA_INIT_UNSIGNED_TX);
        txBuilder.sign({ key: account.prv });
        should(() => txBuilder.sign({ key: account.prv })).throwError('Duplicated signer: ' + account.prv?.toString());
      });
    });
  });

  describe('From and sign', () => {
    describe('Succeed', () => {
      it('build from a unsigned ATA init and sign it', async () => {
        const txBuilder = factory.from(testData.ATA_INIT_UNSIGNED_TX);
        txBuilder.sign({ key: account.prv });
        const tx = await txBuilder.build();
        const rawTx = tx.toBroadcastFormat();

        tx.inputs.length.should.equal(0);
        tx.outputs.length.should.equal(0);
        should.equal(Utils.isValidRawTransaction(rawTx), true);
        should.equal(rawTx, testData.ATA_INIT_SIGNED_TX);
      });

      it('build from a unsigned ATA init with memo and sign it', async () => {
        const txBuilder = factory.from(testData.ATA_INIT_UNSIGNED_TX_WITH_MEMO);
        txBuilder.sign({ key: account.prv });
        const tx = await txBuilder.build();
        const rawTx = tx.toBroadcastFormat();

        tx.inputs.length.should.equal(0);
        tx.outputs.length.should.equal(0);
        should.equal(Utils.isValidRawTransaction(rawTx), true);
        should.equal(rawTx, testData.ATA_INIT_SIGNED_TX_WITH_MEMO);
      });
    });

    describe('Fail', () => {
      it('build from a unsigned ATA init and fail to sign it', async () => {
        const txBuilder = factory.from(testData.ATA_INIT_UNSIGNED_TX);
        txBuilder.sign({ key: wrongAccount.prv });
        await txBuilder.build().should.rejectedWith('unknown signer: CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S');
      });
      it('build from a signed ATA init and fail to sign it', async () => {
        const txBuilder = factory.from(testData.ATA_INIT_SIGNED_TX);
        txBuilder.sign({ key: wrongAccount.prv });
        await txBuilder.build().should.rejectedWith('unknown signer: CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S');
      });
    });
  });
});
