import { register } from '../../../../../src';
import { TransactionBuilderFactory, KeyPair, Utils, AtaInitializationBuilder } from '../../../../../src/coin/sol';
import should from 'should';
import * as testData from '../../../../resources/sol/sol';
import { BaseTransaction } from '@bitgo/sdk-core';

describe('Sol Associated Token Account Builder', () => {
  function verifyInputOutputAndRawTransaction(
    tx: BaseTransaction,
    rawTx: string,
    owner: { pubkey: string; ataPubkey: string } = sender,
  ) {
    tx.inputs.length.should.equal(1);
    tx.inputs[0].should.deepEqual({
      address: owner.pubkey,
      value: rentAmount,
      coin: mint,
    });
    tx.outputs.length.should.equal(1);
    tx.outputs[0].should.deepEqual({
      address: owner.ataPubkey,
      value: rentAmount,
      coin: mint,
    });

    should.equal(Utils.isValidRawTransaction(rawTx), true);
  }

  const factory = register('sol', TransactionBuilderFactory);
  const ataInitBuilder = () => {
    const txBuilder = factory.getAtaInitializationBuilder();
    txBuilder.nonce(recentBlockHash);
    txBuilder.sender(account.pub);
    txBuilder.mint(mint);
    txBuilder.rentExemptAmount(rentAmount);

    return txBuilder;
  };

  const account = new KeyPair(testData.associatedTokenAccounts.accounts[0]).getKeys();
  const sender = {
    pubkey: account.pub,
    ataPubkey: testData.associatedTokenAccounts.accounts[0].ata,
  };
  const wrongAccount = new KeyPair({ prv: testData.prvKeys.prvKey1.base58 }).getKeys();
  const mint = testData.associatedTokenAccounts.mint;
  const recentBlockHash = 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi';
  const rentAmount = '30000';

  // for diff owner case
  const accountOwner = new KeyPair(testData.associatedTokenAccounts.accounts[1]).getKeys();
  const ownerPubkeys = {
    pubkey: accountOwner.pub,
    ataPubkey: testData.associatedTokenAccounts.accounts[1].ata,
  };

  describe('Build and sign', () => {
    describe('Succeed', () => {
      it('build an associated token account init tx unsigned', async () => {
        const txBuilder = ataInitBuilder();
        const tx = await txBuilder.build();
        const rawTx = tx.toBroadcastFormat();

        verifyInputOutputAndRawTransaction(tx, rawTx);
        should.equal(rawTx, testData.ATA_INIT_UNSIGNED_TX);
      });

      it('build an associated token account init tx unsigned with memo', async () => {
        const txBuilder = ataInitBuilder();
        txBuilder.memo('test memo please ignore');
        const tx = await txBuilder.build();
        const rawTx = tx.toBroadcastFormat();

        verifyInputOutputAndRawTransaction(tx, rawTx);
        should.equal(rawTx, testData.ATA_INIT_UNSIGNED_TX_WITH_MEMO);
      });

      it('build an associated token account init tx signed', async () => {
        const txBuilder = ataInitBuilder();
        txBuilder.sender(account.pub);
        txBuilder.sign({ key: account.prv });
        const tx = await txBuilder.build();
        const rawTx = tx.toBroadcastFormat();

        verifyInputOutputAndRawTransaction(tx, rawTx);
        should.equal(rawTx, testData.ATA_INIT_SIGNED_TX);
      });

      it('build an associated token account init tx with memo signed', async () => {
        const txBuilder = ataInitBuilder();
        txBuilder.memo('test memo please ignore');
        txBuilder.sender(account.pub);
        txBuilder.sign({ key: account.prv });
        const tx = await txBuilder.build();
        const rawTx = tx.toBroadcastFormat();

        verifyInputOutputAndRawTransaction(tx, rawTx);
        should.equal(rawTx, testData.ATA_INIT_SIGNED_TX_WITH_MEMO);
      });
    });

    describe('ATA creation for different owner', () => {
      it('build an associated token account init for diff owner tx unsigned', async () => {
        const txBuilder = ataInitBuilder();
        txBuilder.owner(accountOwner.pub);
        const tx = await txBuilder.build();
        const rawTx = tx.toBroadcastFormat();

        verifyInputOutputAndRawTransaction(tx, rawTx, ownerPubkeys);
        should.equal(rawTx, testData.ATA_INIT_UNSIGNED_DIFF_OWNER_TX);
      });

      it('build an associated token account init for diff owner tx unsigned with memo', async () => {
        const txBuilder = ataInitBuilder();
        txBuilder.owner(accountOwner.pub);
        txBuilder.memo('test memo please ignore');
        const tx = await txBuilder.build();
        const rawTx = tx.toBroadcastFormat();

        verifyInputOutputAndRawTransaction(tx, rawTx, ownerPubkeys);
        should.equal(rawTx, testData.ATA_INIT_UNSIGNED_DIFF_OWNER_TX_WITH_MEMO);
      });

      it('build an associated token account init for diff owner tx signed', async () => {
        const txBuilder = ataInitBuilder();
        txBuilder.owner(accountOwner.pub);
        txBuilder.sign({ key: account.prv });
        const tx = await txBuilder.build();
        const rawTx = tx.toBroadcastFormat();

        verifyInputOutputAndRawTransaction(tx, rawTx, ownerPubkeys);
        should.equal(rawTx, testData.ATA_INIT_SIGNED_DIFF_OWNER_TX);
      });

      it('build an associated token account init for diff owner tx with memo signed', async () => {
        const txBuilder = ataInitBuilder();
        txBuilder.owner(accountOwner.pub);
        txBuilder.memo('test memo please ignore');
        txBuilder.sign({ key: account.prv });
        const tx = await txBuilder.build();
        const rawTx = tx.toBroadcastFormat();

        verifyInputOutputAndRawTransaction(tx, rawTx, ownerPubkeys);
        should.equal(rawTx, testData.ATA_INIT_SIGNED_DIFF_OWNER_TX_WITH_MEMO);
      });
    });

    describe('Fail', () => {
      it('build an associated token account init tx when mint is invalid', () => {
        const txBuilder = ataInitBuilder();
        should(() => txBuilder.mint('invalidToken')).throwError('Invalid transaction: invalid mint, got: invalidToken');
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
        await txBuilder.build().should.rejectedWith('Invalid transaction: invalid or missing mint, got: undefined');
      });

      it('build when mint is invalid', async () => {
        const txBuilder = factory.getAtaInitializationBuilder();
        should(() => txBuilder.mint('sol:invalid mint')).throwError(
          'Invalid transaction: invalid mint, got: sol:invalid mint',
        );
      });

      it('build when rentExemptAmount is invalid', async () => {
        const txBuilder = ataInitBuilder();
        should(() => txBuilder.rentExemptAmount('invalid amount')).throwError(
          'Invalid transaction: invalid rentExemptAmount, got: invalid amount',
        );
      });

      it('build when owner is invalid', async () => {
        const txBuilder = ataInitBuilder();
        should(() => txBuilder.owner('invalid owner')).throwError(
          'Invalid transaction: invalid owner, got: invalid owner',
        );
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
        (txBuilder as AtaInitializationBuilder).rentExemptAmount(rentAmount);
        txBuilder.sign({ key: account.prv });
        const tx = await txBuilder.build();
        const rawTx = tx.toBroadcastFormat();

        verifyInputOutputAndRawTransaction(tx, rawTx);
        should.equal(rawTx, testData.ATA_INIT_SIGNED_TX);
      });

      it('build from a unsigned ATA init with memo and sign it', async () => {
        const txBuilder = factory.from(testData.ATA_INIT_UNSIGNED_TX_WITH_MEMO);
        (txBuilder as AtaInitializationBuilder).rentExemptAmount(rentAmount);
        txBuilder.sign({ key: account.prv });
        const tx = await txBuilder.build();
        const rawTx = tx.toBroadcastFormat();

        verifyInputOutputAndRawTransaction(tx, rawTx);
        should.equal(rawTx, testData.ATA_INIT_SIGNED_TX_WITH_MEMO);
      });

      it('build from a unsigned ATA init with diff owner and sign it', async () => {
        const txBuilder = factory.from(testData.ATA_INIT_UNSIGNED_DIFF_OWNER_TX);
        (txBuilder as AtaInitializationBuilder).rentExemptAmount(rentAmount);
        txBuilder.sign({ key: account.prv });
        const tx = await txBuilder.build();
        const rawTx = tx.toBroadcastFormat();

        verifyInputOutputAndRawTransaction(tx, rawTx, ownerPubkeys);
        should.equal(rawTx, testData.ATA_INIT_SIGNED_DIFF_OWNER_TX);
      });

      it('build from a unsigned ATA init with diff owner with memo and sign it', async () => {
        const txBuilder = factory.from(testData.ATA_INIT_UNSIGNED_DIFF_OWNER_TX_WITH_MEMO);
        (txBuilder as AtaInitializationBuilder).rentExemptAmount(rentAmount);
        txBuilder.sign({ key: account.prv });
        const tx = await txBuilder.build();
        const rawTx = tx.toBroadcastFormat();

        verifyInputOutputAndRawTransaction(tx, rawTx, ownerPubkeys);
        should.equal(rawTx, testData.ATA_INIT_SIGNED_DIFF_OWNER_TX_WITH_MEMO);
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
