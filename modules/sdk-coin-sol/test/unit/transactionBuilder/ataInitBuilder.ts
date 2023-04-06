import { KeyPair, Utils, AtaInitializationBuilder } from '../../../src';
import should from 'should';
import * as testData from '../../resources/sol';
import { BaseTransaction } from '@bitgo/sdk-core';
import { getBuilderFactory } from '../getBuilderFactory';

describe('Sol Associated Token Account Builder', () => {
  function verifyInputOutputAndRawTransaction(
    tx: BaseTransaction,
    rawTx: string,
    owner: { pubkey: string; ataPubkey: string } = sender
  ) {
    tx.inputs.length.should.equal(0);
    tx.outputs.length.should.equal(0);
    const instructions = tx.toJson().instructionsData;
    let ataInitInstruction;
    for (const instruction of instructions) {
      if (instruction.type === 'CreateAssociatedTokenAccount') {
        ataInitInstruction = instruction;
        break;
      }
    }
    should.exist(ataInitInstruction);
    ataInitInstruction.params.tokenName.should.equal(mint);

    should.equal(Utils.isValidRawTransaction(rawTx), true);
  }

  const factory = getBuilderFactory('sol');
  const ataInitBuilder = () => {
    const txBuilder = factory.getAtaInitializationBuilder();
    txBuilder.nonce(recentBlockHash);
    txBuilder.sender(account.pub);
    txBuilder.mint(mint);
    txBuilder.rentExemptAmount(rentAmount);

    return txBuilder;
  };

  const account = new KeyPair(testData.associatedTokenAccounts.accounts[0]).getKeys();
  const nonceAccount = new KeyPair(testData.nonceAccount).getKeys();
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

      it('build an associated token account init tx with durable nonce unsigned', async () => {
        const txBuilder = ataInitBuilder();
        txBuilder.memo('test memo please ignore');
        txBuilder.sender(account.pub);
        txBuilder.nonce(recentBlockHash, { walletNonceAddress: nonceAccount.pub, authWalletAddress: account.pub });

        const tx = await txBuilder.build();
        const rawTx = tx.toBroadcastFormat();

        verifyInputOutputAndRawTransaction(tx, rawTx);

        should.equal(rawTx, testData.ATA_INIT_UNSIGNED_TX_DURABLE_NONCE);
      });

      it('build an associated token account init tx with durable nonce signed', async () => {
        const txBuilder = ataInitBuilder();
        txBuilder.memo('test memo please ignore');
        txBuilder.sender(account.pub);
        txBuilder.nonce(recentBlockHash, { walletNonceAddress: nonceAccount.pub, authWalletAddress: account.pub });
        txBuilder.sign({ key: account.prv });

        const tx = await txBuilder.build();
        const rawTx = tx.toBroadcastFormat();

        verifyInputOutputAndRawTransaction(tx, rawTx);

        should.equal(rawTx, testData.ATA_INIT_SIGNED_TX_DURABLE_NONCE);
      });
    });

    describe('ATA creation with different owner', () => {
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
        should(() => txBuilder.mint('invalidToken')).throwError(
          'Invalid transaction: invalid token name, got: invalidToken'
        );
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
        await txBuilder.build().should.rejectedWith('Mint must be set before building the transaction');
      });

      it('build when mint is invalid', async () => {
        const txBuilder = factory.getAtaInitializationBuilder();
        should(() => txBuilder.mint('sol:invalid mint')).throwError(
          'Invalid transaction: invalid token name, got: sol:invalid mint'
        );
      });

      it('build when rentExemptAmount is invalid', async () => {
        const txBuilder = ataInitBuilder();
        should(() => txBuilder.rentExemptAmount('invalid amount')).throwError(
          'Invalid tokenAccountRentExemptAmount, got: invalid amount'
        );
        should(() => txBuilder.associatedTokenAccountRent('invalid amount')).throwError(
          'Invalid tokenAccountRentExemptAmount, got: invalid amount'
        );
      });

      it('build when owner is invalid', async () => {
        const txBuilder = ataInitBuilder();
        should(() => txBuilder.owner('invalid owner')).throwError(
          'Invalid or missing ownerAddress, got: invalid owner'
        );
      });

      it('to sign twice with the same key', () => {
        const txBuilder = factory.from(testData.ATA_INIT_UNSIGNED_TX);
        txBuilder.sign({ key: account.prv });
        should(() => txBuilder.sign({ key: account.prv })).throwError('Duplicated signer: ' + account.prv?.toString());
      });
    });
  });

  describe('Build and sign with enableToken', () => {
    const recipients = [
      {
        ownerAddress: sender.pubkey,
        tokenName: mint,
      },
      {
        ownerAddress: ownerPubkeys.pubkey,
        tokenName: 'sol:ray',
      },
    ];
    const multiAtaInitBuilder = (recipients) => {
      const txBuilder = factory.getAtaInitializationBuilder();
      txBuilder.nonce(recentBlockHash);
      recipients.forEach((recipient) => {
        txBuilder.enableToken(recipient);
      });
      txBuilder.sender(sender.pubkey);
      txBuilder.rentExemptAmount(rentAmount);

      return txBuilder;
    };

    describe('ATA creation for multiple recipients', () => {
      it('build an associated token account init for multiple recipients', async () => {
        const txBuilder = multiAtaInitBuilder(recipients);
        const tx = await txBuilder.build();
        const rawTx = tx.toBroadcastFormat();
        const ownerRayATA = 'ACEuzYtR4gBFt6HLQTYisg2T7k8Vh4ss1SpnqmbVQSNy';

        tx.inputs.length.should.equal(0);
        tx.outputs.length.should.equal(0);
        const instructions = tx.toJson().instructionsData;

        instructions.length.should.equal(2);
        instructions[0].params.tokenName.should.equal(mint);
        instructions[0].params.ownerAddress.should.equal(sender.pubkey);
        instructions[0].params.ataAddress.should.equal(sender.ataPubkey);
        instructions[1].params.tokenName.should.equal('sol:ray');
        instructions[1].params.ownerAddress.should.equal(ownerPubkeys.pubkey);
        instructions[1].params.ataAddress.should.equal(ownerRayATA);

        should.equal(rawTx, testData.MULTI_ATA_INIT_UNSIGNED_TX);
      });

      it('build an associated token account init for multiple recipients with memo', async () => {
        const txBuilder = multiAtaInitBuilder(recipients);
        txBuilder.memo('test memo please ignore');
        const tx = await txBuilder.build();
        const rawTx = tx.toBroadcastFormat();

        should.equal(rawTx, testData.MULTI_ATA_INIT_UNSIGNED_TX_WITH_MEMO);
      });

      it('build an associated token account init tx for multiple recipients signed', async () => {
        const txBuilder = multiAtaInitBuilder(recipients);
        txBuilder.sign({ key: account.prv });
        const tx = await txBuilder.build();
        const rawTx = tx.toBroadcastFormat();

        should.equal(rawTx, testData.MULTI_ATA_INIT_SIGNED_TX);
      });

      it('build an associated token account init for multiple recipients tx with memo signed', async () => {
        const txBuilder = multiAtaInitBuilder(recipients);
        txBuilder.memo('test memo please ignore');
        txBuilder.sign({ key: account.prv });
        const tx = await txBuilder.build();
        const rawTx = tx.toBroadcastFormat();

        should.equal(rawTx, testData.MULTI_ATA_INIT_SIGNED_TX_WITH_MEMO);
      });
    });

    describe('Fail', () => {
      it('should fail to build an associated token account init with duplicate recipients', async () => {
        const duplicateRecipient = {
          ownerAddress: sender.pubkey,
          tokenName: mint,
        };
        const txBuilder = multiAtaInitBuilder(recipients);
        should(() => txBuilder.enableToken(duplicateRecipient)).throwError(
          'Invalid transaction: invalid duplicate recipients, got: owner 12f6D3WubGVeQoH2m8kTvvcrasWdXWwtVzUCyRNDZxA2 and tokenName sol:usdc twice'
        );
      });

      it('build an associated token account init tx when mint is invalid', () => {
        const errorMintRecipient = {
          ownerAddress: ownerPubkeys.pubkey,
          tokenName: 'invalidToken',
        };
        const txBuilder = multiAtaInitBuilder(recipients);
        should(() => txBuilder.enableToken(errorMintRecipient)).throwError(
          'Invalid transaction: invalid token name, got: invalidToken'
        );
      });

      it('build a wallet init tx and sign with an incorrect account', async () => {
        const txBuilder = multiAtaInitBuilder(recipients);
        txBuilder.sender(account.pub);
        txBuilder.sign({ key: wrongAccount.prv });
        await txBuilder.build().should.rejectedWith('unknown signer: CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S');
      });

      it('build when nonce is not provided', async () => {
        const txBuilder = factory.getAtaInitializationBuilder();
        txBuilder.sender(account.pub);
        txBuilder.enableToken({
          ownerAddress: account.pub,
          tokenName: mint,
        });
        txBuilder.sign({ key: account.prv });
        await txBuilder.build().should.rejectedWith('Invalid transaction: missing nonce blockhash');
      });

      it('build when sender is not provided', async () => {
        const txBuilder = factory.getAtaInitializationBuilder();
        txBuilder.nonce(recentBlockHash);
        txBuilder.enableToken({
          ownerAddress: account.pub,
          tokenName: mint,
        });
        txBuilder.sign({ key: account.prv });
        await txBuilder.build().should.rejectedWith('Invalid transaction: missing sender');
      });

      it('build when recipient is not provided', async () => {
        const txBuilder = factory.getAtaInitializationBuilder();
        txBuilder.sender(account.pub);
        txBuilder.nonce(recentBlockHash);
        txBuilder.sign({ key: account.prv });
        await txBuilder.build().should.rejectedWith('Mint must be set before building the transaction');
      });

      it('build when rentExemptAmount is invalid', async () => {
        const txBuilder = multiAtaInitBuilder(recipients);
        should(() => txBuilder.rentExemptAmount('invalid amount')).throwError(
          'Invalid tokenAccountRentExemptAmount, got: invalid amount'
        );
        should(() => txBuilder.associatedTokenAccountRent('invalid amount')).throwError(
          'Invalid tokenAccountRentExemptAmount, got: invalid amount'
        );
      });

      it('build when token owner is invalid', async () => {
        const invalidOwner = {
          ownerAddress: 'invalid owner',
          tokenName: mint,
        };
        const txBuilder = multiAtaInitBuilder(recipients);
        should(() => txBuilder.enableToken(invalidOwner)).throwError(
          'Invalid or missing ownerAddress, got: invalid owner'
        );
      });

      it('to sign twice with the same key', () => {
        const txBuilder = factory.from(testData.MULTI_ATA_INIT_UNSIGNED_TX);
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

      it('build from a unsigned ATA init for multi recipients and sign it', async () => {
        const txBuilder = factory.from(testData.MULTI_ATA_INIT_UNSIGNED_TX);
        (txBuilder as AtaInitializationBuilder).rentExemptAmount(rentAmount);
        txBuilder.sign({ key: account.prv });
        const tx = await txBuilder.build();
        const rawTx = tx.toBroadcastFormat();

        should.equal(rawTx, testData.MULTI_ATA_INIT_SIGNED_TX);
      });

      it('build from a unsigned ATA init for multi recipients with memo and sign it', async () => {
        const txBuilder = factory.from(testData.MULTI_ATA_INIT_UNSIGNED_TX_WITH_MEMO);
        (txBuilder as AtaInitializationBuilder).rentExemptAmount(rentAmount);
        txBuilder.sign({ key: account.prv });
        const tx = await txBuilder.build();
        const rawTx = tx.toBroadcastFormat();

        should.equal(rawTx, testData.MULTI_ATA_INIT_SIGNED_TX_WITH_MEMO);
      });

      it('build from an unsigned ATA init with durable nonce and sign it', async () => {
        const txBuilder = factory.from(testData.ATA_INIT_UNSIGNED_TX_DURABLE_NONCE);
        txBuilder.sign({ key: account.prv });

        const tx = await txBuilder.build();
        const rawTx = tx.toBroadcastFormat();

        should.equal(rawTx, testData.ATA_INIT_SIGNED_TX_DURABLE_NONCE);
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
