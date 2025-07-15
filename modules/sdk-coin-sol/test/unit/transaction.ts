import assert from 'assert';
import should from 'should';
import { coins } from '@bitgo/statics';
import { KeyPair, Transaction } from '../../src/lib';
import * as testData from '../resources/sol';
import { PublicKey, Transaction as SolTransaction } from '@solana/web3.js';
import { getBuilderFactory } from './getBuilderFactory';

describe('Sol Transaction', () => {
  const coin = coins.get('tsol');

  describe('toJson should', () => {
    it('throw empty transaction', () => {
      const tx = new Transaction(coin);
      assert.throws(() => tx.toJson(), /Empty transaction/);
      assert.throws(() => tx.toBroadcastFormat(), /Empty transaction/);
    });
    it('throw for toJson of empty tx', () => {
      const tx = new Transaction(coin);
      should(() => tx.toJson()).throwError('Empty transaction');
      tx.solTransaction = new SolTransaction();
      tx.solTransaction.recentBlockhash = testData.blockHashes.validBlockHashes[0];
      should(() => tx.toJson()).throwError('Invalid transaction, transaction type not supported: undefined');
    });

    it('succeed for a unsigned transfer tx', () => {
      const tx = new Transaction(coin);
      tx.fromRawTransaction(testData.TRANSFER_UNSIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE);
      tx.signature.should.be.empty();
      const txJson = tx.toJson();
      txJson.should.have.properties(['id', 'feePayer', 'nonce', 'numSignatures', 'instructionsData']);
      txJson.id?.should.equal(undefined);
      txJson.feePayer?.should.equal('5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe');
      txJson.nonce.should.equal('GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi');
      txJson.numSignatures.should.equal(0);
      txJson.instructionsData.length.should.equal(3);
      txJson.lamportsPerSignature?.should.be.undefined();
      txJson.instructionsData.should.deepEqual([
        {
          type: 'NonceAdvance',
          params: {
            walletNonceAddress: '8Y7RM6JfcX4ASSNBkrkrmSbRu431YVi9Y3oLFnzC2dCh',
            authWalletAddress: '5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe',
          },
        },
        {
          type: 'Transfer',
          params: {
            fromAddress: '5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe',
            toAddress: 'CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S',
            amount: '300000',
          },
        },
        {
          type: 'Memo',
          params: {
            memo: 'test memo',
          },
        },
      ]);
    });

    it('succeed for a multi transfer tx', () => {
      const tx = new Transaction(coin);
      tx.fromRawTransaction(testData.MULTI_TRANSFER_SIGNED);
      const txJson = tx.toJson();
      txJson.should.have.properties(['id', 'feePayer', 'nonce', 'numSignatures', 'instructionsData']);
      txJson.id?.should.equal(
        'TPVcc18CYxPnM3eRgQhdb6V6ZLa34Dv3dU7MtvKPuy5ZPKLM1uZPFFEmF2m184PTWKRZ1Uq6NKFZWwr2krKk63f'
      );
      tx.signature.should.deepEqual([
        'TPVcc18CYxPnM3eRgQhdb6V6ZLa34Dv3dU7MtvKPuy5ZPKLM1uZPFFEmF2m184PTWKRZ1Uq6NKFZWwr2krKk63f',
      ]);
      txJson.feePayer?.should.equal('5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe');
      txJson.nonce.should.equal('GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi');
      txJson.numSignatures.should.equal(1);
      txJson.lamportsPerSignature?.should.be.undefined();
      txJson.instructionsData.length.should.equal(8);
      txJson.instructionsData.should.deepEqual([
        {
          type: 'NonceAdvance',
          params: {
            walletNonceAddress: '8Y7RM6JfcX4ASSNBkrkrmSbRu431YVi9Y3oLFnzC2dCh',
            authWalletAddress: '5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe',
          },
        },
        {
          type: 'Transfer',
          params: {
            fromAddress: '5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe',
            toAddress: 'CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S',
            amount: '300000',
          },
        },
        {
          type: 'Transfer',
          params: {
            fromAddress: '5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe',
            toAddress: '6B55XMiaS6tUZw5Tt3G1RaXAqdrvN38yXVDJmWvKLkiM',
            amount: '300000',
          },
        },
        {
          type: 'Transfer',
          params: {
            fromAddress: '5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe',
            toAddress: 'C1UjpxcXNBpp1UyvYsuNBNZ5Da1G1i49g3yTvC23Ny7e',
            amount: '300000',
          },
        },
        {
          type: 'Transfer',
          params: {
            fromAddress: '5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe',
            toAddress: 'CpUYXh9xXoWfkBVaBQRZ8nAgDbT16GZeQdqveeBS1hmk',
            amount: '300000',
          },
        },
        {
          type: 'Transfer',
          params: {
            fromAddress: '5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe',
            toAddress: '64s6NjmEokdhicHEd432X5Ut2EDfDmVqdvGh4rASn1gd',
            amount: '300000',
          },
        },
        {
          type: 'Transfer',
          params: {
            fromAddress: '5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe',
            toAddress: '6nXxL2jMSdkgfHm13Twvn1gzRAPdrWnWLfu89PJL3Aqe',
            amount: '300000',
          },
        },
        {
          type: 'Memo',
          params: {
            memo: 'test memo',
          },
        },
      ]);
    });
  });

  describe('sign should', () => {
    it('fail if the tx doesnt have nonce', async () => {
      const tx = new Transaction(coin);
      tx.solTransaction = new SolTransaction();
      tx.solTransaction.feePayer = new PublicKey(testData.authAccount.pub);
      const kp = new KeyPair({ prv: testData.prvKeys.prvKey1.base58 });
      await tx.sign(kp).should.be.rejectedWith('Nonce is required before signing');
    });

    it('fail if the tx doesnt have feePayer', async () => {
      const tx = new Transaction(coin);
      const kp = new KeyPair({ prv: testData.prvKeys.prvKey1.base58 });
      tx.solTransaction = new SolTransaction();
      tx.solTransaction.recentBlockhash = testData.blockHashes.validBlockHashes[0];
      await tx.sign(kp).should.be.rejectedWith('feePayer is required before signing');
    });

    it('fail if the KeyPair is not the right one', async () => {
      const tx = new Transaction(coin);
      tx.fromRawTransaction(testData.RAW_TX_UNSIGNED);
      const keypair = new KeyPair({ prv: testData.prvKeys.prvKey1.base58 });
      await tx.sign(keypair).should.be.rejectedWith('unknown signer: CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S');
    });

    it('fail if the KeyPair doesnt have a prv key', async () => {
      const tx = new Transaction(coin);
      tx.fromRawTransaction(testData.RAW_TX_UNSIGNED);
      const keypair = new KeyPair({ pub: testData.pubKeys.validPubKeys[0] });
      await tx.sign(keypair).should.be.rejectedWith('Missing private key');
    });

    it('succeed to sign with 1 KeyPair', async () => {
      const tx = new Transaction(coin);
      tx.fromRawTransaction(testData.RAW_TX_UNSIGNED);
      const keypair = new KeyPair({ prv: testData.accountWithSeed.privateKey.base58 });
      await tx.sign(keypair).should.be.fulfilled();
      should.equal(tx.toBroadcastFormat(), testData.RAW_TX_SIGNED);
    });

    it('succeed when try to sign with the same keyPair multiple times ', async () => {
      const tx = new Transaction(coin);
      tx.fromRawTransaction(testData.RAW_TX_UNSIGNED);
      const keypair = new KeyPair({ prv: testData.accountWithSeed.privateKey.base58 });
      await tx.sign([keypair, keypair, keypair, keypair]).should.be.fulfilled();
      should.equal(tx.toBroadcastFormat(), testData.RAW_TX_SIGNED);
    });

    it('succeed when try to sign with a keyPair that already signed', async () => {
      const tx = new Transaction(coin);
      tx.fromRawTransaction(testData.RAW_TX_SIGNED);
      const keypair = new KeyPair({ prv: testData.accountWithSeed.privateKey.base58 });
      await tx.sign(keypair).should.be.fulfilled();
      should.equal(tx.toBroadcastFormat(), testData.RAW_TX_SIGNED);
    });
  });

  describe('transaction parsing', function () {
    it('fromRawTransaction and toBroadcastFormat', async function () {
      const tx = new Transaction(coin);
      tx.fromRawTransaction(testData.RAW_TX_UNSIGNED);
      should.equal(tx.toBroadcastFormat(), testData.RAW_TX_UNSIGNED);
    });

    it('fromRawTransaction, sign and toBroadcastFormat ', async function () {
      const tx = new Transaction(coin);
      tx.fromRawTransaction(testData.RAW_TX_UNSIGNED);
      const keypair = new KeyPair({ prv: testData.accountWithSeed.privateKey.base58 });
      await tx.sign(keypair);
      should.equal(tx.toBroadcastFormat(), testData.RAW_TX_SIGNED);
    });
  });

  describe('explain transaction', function () {
    const factory = getBuilderFactory('tsol');
    const blockHash = testData.blockHashes.validBlockHashes[0];
    const sender = testData.authAccount.pub;
    const address = testData.addresses.validAddresses[0];
    const amount = '10000';
    const wallet = new KeyPair(testData.authAccount).getKeys();
    const stakeAccount = new KeyPair(testData.stakeAccount).getKeys();
    const validator = testData.validator;

    it('should explain single transfer transaction', async function () {
      const tx = await factory
        .getTransferBuilder()
        .nonce(blockHash)
        .sender(sender)
        .send({ address, amount })
        .fee({ amount: 5000 })
        .build();

      const explainedTransaction = tx.explainTransaction();
      explainedTransaction.should.deepEqual({
        displayOrder: [
          'id',
          'type',
          'blockhash',
          'durableNonce',
          'outputAmount',
          'changeAmount',
          'outputs',
          'changeOutputs',
          'fee',
          'memo',
        ],
        id: 'UNAVAILABLE',
        type: 'Send',
        changeOutputs: [],
        changeAmount: '0',
        outputAmount: '10000',
        outputs: [
          {
            address: 'DesU7XscZjng8yj5VX6AZsk3hWSW4sQ3rTG2LuyQ2P4H',
            amount: '10000',
          },
        ],
        fee: {
          fee: '5000',
          feeRate: 5000,
        },
        memo: undefined,
        blockhash: '5ne7phA48Jrvpn39AtupB8ZkCCAy8gLTfpGihZPuDqen',
        durableNonce: undefined,
      });
    });

    it('should explain single transfer with durable nonce transaction', async function () {
      const tx = await factory
        .getTransferBuilder()
        .nonce(blockHash, { walletNonceAddress: testData.nonceAccount.pub, authWalletAddress: sender })
        .sender(sender)
        .send({ address, amount })
        .build();

      const explainedTransaction = tx.explainTransaction();
      explainedTransaction.should.deepEqual({
        displayOrder: [
          'id',
          'type',
          'blockhash',
          'durableNonce',
          'outputAmount',
          'changeAmount',
          'outputs',
          'changeOutputs',
          'fee',
          'memo',
        ],
        id: 'UNAVAILABLE',
        type: 'Send',
        changeOutputs: [],
        changeAmount: '0',
        outputAmount: '10000',
        outputs: [
          {
            address: 'DesU7XscZjng8yj5VX6AZsk3hWSW4sQ3rTG2LuyQ2P4H',
            amount: '10000',
          },
        ],
        fee: {
          fee: 'UNAVAILABLE',
          feeRate: undefined,
        },
        memo: undefined,
        blockhash: '5ne7phA48Jrvpn39AtupB8ZkCCAy8gLTfpGihZPuDqen',
        durableNonce: {
          authWalletAddress: '5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe',
          walletNonceAddress: '8Y7RM6JfcX4ASSNBkrkrmSbRu431YVi9Y3oLFnzC2dCh',
        },
      });
    });

    it('should explain multi transfer with durable nonce and memo transaction', async function () {
      const tx = await factory
        .getTransferBuilder()
        .nonce(blockHash, { walletNonceAddress: testData.nonceAccount.pub, authWalletAddress: sender })
        .sender(sender)
        .memo('memo text')
        .send({ address, amount })
        .send({ address: testData.addresses.validAddresses[1], amount })
        .send({ address: testData.addresses.validAddresses[2], amount })
        .build();

      const explainedTransaction = tx.explainTransaction();
      explainedTransaction.should.deepEqual({
        displayOrder: [
          'id',
          'type',
          'blockhash',
          'durableNonce',
          'outputAmount',
          'changeAmount',
          'outputs',
          'changeOutputs',
          'fee',
          'memo',
        ],
        id: 'UNAVAILABLE',
        type: 'Send',
        changeOutputs: [],
        changeAmount: '0',
        outputAmount: '30000',
        outputs: [
          {
            address: 'DesU7XscZjng8yj5VX6AZsk3hWSW4sQ3rTG2LuyQ2P4H',
            amount: '10000',
          },
          {
            address: 'Azz9EmNuhtjoYrhWvidWx1Hfd14SNBsYyzXhA9Tnoca8',
            amount: '10000',
          },
          {
            address: '2n2xqWM9Z18LqxfJzkNrMMFWiDUFYA2k6WSgSnf6EnJs',
            amount: '10000',
          },
        ],
        fee: {
          fee: 'UNAVAILABLE',
          feeRate: undefined,
        },
        memo: 'memo text',
        blockhash: '5ne7phA48Jrvpn39AtupB8ZkCCAy8gLTfpGihZPuDqen',
        durableNonce: {
          authWalletAddress: '5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe',
          walletNonceAddress: '8Y7RM6JfcX4ASSNBkrkrmSbRu431YVi9Y3oLFnzC2dCh',
        },
      });
    });

    it('should explain signed transfer transaction', async function () {
      const tx = await factory
        .getTransferBuilder()
        .fee({ amount: 5000 })
        .nonce(blockHash)
        .sender(sender)
        .send({ address, amount })
        .build();
      await (tx as Transaction).sign(new KeyPair({ prv: testData.authAccount.prv }));

      const explainedTransaction = tx.explainTransaction();
      explainedTransaction.should.deepEqual({
        displayOrder: [
          'id',
          'type',
          'blockhash',
          'durableNonce',
          'outputAmount',
          'changeAmount',
          'outputs',
          'changeOutputs',
          'fee',
          'memo',
        ],
        id: tx.id,
        type: 'Send',
        changeOutputs: [],
        changeAmount: '0',
        outputAmount: '10000',
        outputs: [
          {
            address: 'DesU7XscZjng8yj5VX6AZsk3hWSW4sQ3rTG2LuyQ2P4H',
            amount: '10000',
          },
        ],
        fee: {
          fee: '5000',
          feeRate: 5000,
        },
        memo: undefined,
        blockhash: '5ne7phA48Jrvpn39AtupB8ZkCCAy8gLTfpGihZPuDqen',
        durableNonce: undefined,
      });
    });

    it('should explain wallet init transaction', async function () {
      const tx = await factory
        .getWalletInitializationBuilder()
        .fee({ amount: 5000 })
        .sender(sender)
        .nonce(blockHash)
        .address(testData.addresses.validAddresses[1])
        .amount(amount)
        .build();

      const explainedTransaction = tx.explainTransaction();
      explainedTransaction.should.deepEqual({
        displayOrder: [
          'id',
          'type',
          'blockhash',
          'durableNonce',
          'outputAmount',
          'changeAmount',
          'outputs',
          'changeOutputs',
          'fee',
          'memo',
        ],
        id: 'UNAVAILABLE',
        type: 'WalletInitialization',
        changeOutputs: [],
        changeAmount: '0',
        outputAmount: '10000',
        outputs: [
          {
            address: 'Azz9EmNuhtjoYrhWvidWx1Hfd14SNBsYyzXhA9Tnoca8',
            amount: '10000',
          },
        ],
        fee: {
          fee: '10000',
          feeRate: 5000,
        },
        memo: undefined,
        blockhash: '5ne7phA48Jrvpn39AtupB8ZkCCAy8gLTfpGihZPuDqen',
        durableNonce: undefined,
      });
    });

    it('should explain wallet init with durable nonce and memo transaction', async function () {
      const tx = await factory
        .getWalletInitializationBuilder()
        .sender(sender)
        .nonce(blockHash, { walletNonceAddress: testData.nonceAccount.pub, authWalletAddress: sender })
        .memo('memo text')
        .address(testData.addresses.validAddresses[1])
        .amount(amount)
        .build();

      const explainedTransaction = tx.explainTransaction();
      explainedTransaction.should.deepEqual({
        displayOrder: [
          'id',
          'type',
          'blockhash',
          'durableNonce',
          'outputAmount',
          'changeAmount',
          'outputs',
          'changeOutputs',
          'fee',
          'memo',
        ],
        id: 'UNAVAILABLE',
        type: 'WalletInitialization',
        changeOutputs: [],
        changeAmount: '0',
        outputAmount: '10000',
        outputs: [
          {
            address: 'Azz9EmNuhtjoYrhWvidWx1Hfd14SNBsYyzXhA9Tnoca8',
            amount: '10000',
          },
        ],
        fee: {
          fee: 'UNAVAILABLE',
          feeRate: undefined,
        },
        memo: 'memo text',
        blockhash: '5ne7phA48Jrvpn39AtupB8ZkCCAy8gLTfpGihZPuDqen',
        durableNonce: {
          authWalletAddress: '5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe',
          walletNonceAddress: '8Y7RM6JfcX4ASSNBkrkrmSbRu431YVi9Y3oLFnzC2dCh',
        },
      });
    });

    it('should explain signed wallet init transaction', async function () {
      const tx = await factory
        .getWalletInitializationBuilder()
        .fee({ amount: 5000 })
        .sender(sender)
        .nonce(blockHash)
        .address(testData.addresses.validAddresses[1])
        .amount(amount)
        .build();
      await (tx as Transaction).sign(new KeyPair({ prv: testData.authAccount.prv }));

      const explainedTransaction = tx.explainTransaction();
      explainedTransaction.should.deepEqual({
        displayOrder: [
          'id',
          'type',
          'blockhash',
          'durableNonce',
          'outputAmount',
          'changeAmount',
          'outputs',
          'changeOutputs',
          'fee',
          'memo',
        ],
        id: tx.id,
        type: 'WalletInitialization',
        changeOutputs: [],
        changeAmount: '0',
        outputAmount: '10000',
        outputs: [
          {
            address: 'Azz9EmNuhtjoYrhWvidWx1Hfd14SNBsYyzXhA9Tnoca8',
            amount: '10000',
          },
        ],
        fee: {
          fee: '10000',
          feeRate: 5000,
        },
        memo: undefined,
        blockhash: '5ne7phA48Jrvpn39AtupB8ZkCCAy8gLTfpGihZPuDqen',
        durableNonce: undefined,
      });
    });

    it('should explain create ATA transaction', async function () {
      const tx = await factory
        .getAtaInitializationBuilder()
        .fee({ amount: 5000 })
        .sender(sender)
        .nonce(blockHash)
        .mint('tsol:usdc')
        .rentExemptAmount(amount)
        .build();

      const explainedTransaction = tx.explainTransaction();
      explainedTransaction.should.deepEqual({
        displayOrder: [
          'id',
          'type',
          'blockhash',
          'durableNonce',
          'outputAmount',
          'changeAmount',
          'outputs',
          'changeOutputs',
          'fee',
          'memo',
        ],
        id: 'UNAVAILABLE',
        type: 'AssociatedTokenAccountInitialization',
        changeOutputs: [],
        changeAmount: '0',
        outputAmount: '0',
        outputs: [],
        fee: {
          fee: '15000',
          feeRate: 5000,
        },
        memo: undefined,
        blockhash: '5ne7phA48Jrvpn39AtupB8ZkCCAy8gLTfpGihZPuDqen',
        durableNonce: undefined,
      });
    });

    it('should activate builder ', async function () {
      const tx = await factory
        .getStakingActivateBuilder()
        .stakingAddress(stakeAccount.pub)
        .sender(wallet.pub)
        .nonce(blockHash)
        .amount(amount)
        .validator(validator.pub)
        .fee({ amount: 5000 })
        .build();

      const explainedTransaction = tx.explainTransaction();
      explainedTransaction.should.deepEqual({
        displayOrder: [
          'id',
          'type',
          'blockhash',
          'durableNonce',
          'outputAmount',
          'changeAmount',
          'outputs',
          'changeOutputs',
          'fee',
          'memo',
        ],
        id: 'UNAVAILABLE',
        type: 'StakingActivate',
        changeOutputs: [],
        changeAmount: '0',
        outputAmount: '10000',
        outputs: [
          {
            address: '7dRuGFbU2y2kijP6o1LYNzVyz4yf13MooqoionCzv5Za',
            amount: '10000',
          },
        ],
        fee: {
          fee: '10000',
          feeRate: 5000,
        },
        memo: undefined,
        blockhash: '5ne7phA48Jrvpn39AtupB8ZkCCAy8gLTfpGihZPuDqen',
        durableNonce: undefined,
      });
    });

    it('should deactivate builder ', async function () {
      const recentBlockHash = 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi';
      const tx = await factory
        .getStakingDeactivateBuilder()
        .stakingAddress(stakeAccount.pub)
        .sender(wallet.pub)
        .stakingAddress(stakeAccount.pub)
        .nonce(recentBlockHash)
        .fee({ amount: 5000 })
        .build();

      const explainedTransaction = tx.explainTransaction();
      explainedTransaction.should.deepEqual({
        displayOrder: [
          'id',
          'type',
          'blockhash',
          'durableNonce',
          'outputAmount',
          'changeAmount',
          'outputs',
          'changeOutputs',
          'fee',
          'memo',
        ],
        id: 'UNAVAILABLE',
        type: 'StakingDeactivate',
        changeOutputs: [],
        changeAmount: '0',
        outputAmount: '0',
        outputs: [],
        fee: {
          fee: '5000',
          feeRate: 5000,
        },
        memo: undefined,
        blockhash: 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi',
        durableNonce: undefined,
      });
    });

    it('should explain withdraw transaction ', async function () {
      const recentBlockHash = 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi';
      const tx = await factory
        .getStakingWithdrawBuilder()
        .stakingAddress(stakeAccount.pub)
        .sender(wallet.pub)
        .amount(amount)
        .nonce(recentBlockHash)
        .fee({ amount: 5000 })
        .build();

      const explainedTransaction = tx.explainTransaction();
      explainedTransaction.should.deepEqual({
        displayOrder: [
          'id',
          'type',
          'blockhash',
          'durableNonce',
          'outputAmount',
          'changeAmount',
          'outputs',
          'changeOutputs',
          'fee',
          'memo',
        ],
        id: 'UNAVAILABLE',
        type: 'StakingWithdraw',
        changeOutputs: [],
        changeAmount: '0',
        outputAmount: '10000',
        outputs: [
          {
            address: '5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe',
            amount: '10000',
          },
        ],
        fee: {
          fee: '5000',
          feeRate: 5000,
        },
        memo: undefined,
        blockhash: 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi',
        durableNonce: undefined,
      });
    });

    it('should explain withdraw transaction with memo and durable nonce ', async function () {
      const tx = await factory
        .getStakingWithdrawBuilder()
        .stakingAddress(stakeAccount.pub)
        .sender(wallet.pub)
        .amount(amount)
        .nonce(blockHash, { walletNonceAddress: testData.nonceAccount.pub, authWalletAddress: sender })
        .memo('memo text')
        .fee({ amount: 5000 })
        .build();
      tx.signablePayload;

      const explainedTransaction = tx.explainTransaction();
      explainedTransaction.should.deepEqual({
        displayOrder: [
          'id',
          'type',
          'blockhash',
          'durableNonce',
          'outputAmount',
          'changeAmount',
          'outputs',
          'changeOutputs',
          'fee',
          'memo',
        ],
        id: 'UNAVAILABLE',
        type: 'StakingWithdraw',
        changeOutputs: [],
        changeAmount: '0',
        outputAmount: '10000',
        outputs: [
          {
            address: '5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe',
            amount: '10000',
          },
        ],
        fee: {
          fee: '5000',
          feeRate: 5000,
        },
        memo: 'memo text',
        blockhash: '5ne7phA48Jrvpn39AtupB8ZkCCAy8gLTfpGihZPuDqen',
        durableNonce: {
          walletNonceAddress: testData.nonceAccount.pub,
          authWalletAddress: sender,
        },
      });
    });

    it('should explain single token transfer transaction', async function () {
      const tx = await factory
        .getTokenTransferBuilder()
        .nonce(blockHash)
        .sender(sender)
        .send({ address, amount, tokenName: 'tsol:usdc' })
        .fee({ amount: 5000 })
        .build();

      const explainedTransaction = tx.explainTransaction();
      explainedTransaction.should.deepEqual({
        displayOrder: [
          'id',
          'type',
          'blockhash',
          'durableNonce',
          'outputAmount',
          'changeAmount',
          'outputs',
          'changeOutputs',
          'fee',
          'memo',
        ],
        id: 'UNAVAILABLE',
        type: 'Send',
        changeOutputs: [],
        changeAmount: '0',
        outputAmount: '0',
        outputs: [
          {
            address: 'DesU7XscZjng8yj5VX6AZsk3hWSW4sQ3rTG2LuyQ2P4H',
            amount: '10000',
            tokenName: 'tsol:usdc',
          },
        ],
        fee: {
          fee: '5000',
          feeRate: 5000,
        },
        memo: undefined,
        blockhash: '5ne7phA48Jrvpn39AtupB8ZkCCAy8gLTfpGihZPuDqen',
        durableNonce: undefined,
      });
    });

    it('should explain multi token transfer with durable nonce and memo transaction', async function () {
      const tx = await factory
        .getTokenTransferBuilder()
        .nonce(blockHash, { walletNonceAddress: testData.nonceAccount.pub, authWalletAddress: sender })
        .sender(sender)
        .memo('memo text')
        .send({ address, amount, tokenName: 'tsol:usdc' })
        .send({ address: testData.addresses.validAddresses[1], amount, tokenName: 'tsol:usdc' })
        .send({ address: testData.addresses.validAddresses[2], amount, tokenName: 'tsol:usdc' })
        .build();

      const explainedTransaction = tx.explainTransaction();
      explainedTransaction.should.deepEqual({
        displayOrder: [
          'id',
          'type',
          'blockhash',
          'durableNonce',
          'outputAmount',
          'changeAmount',
          'outputs',
          'changeOutputs',
          'fee',
          'memo',
        ],
        id: 'UNAVAILABLE',
        type: 'Send',
        changeOutputs: [],
        changeAmount: '0',
        outputAmount: '0',
        outputs: [
          {
            address: 'DesU7XscZjng8yj5VX6AZsk3hWSW4sQ3rTG2LuyQ2P4H',
            amount: '10000',
            tokenName: 'tsol:usdc',
          },
          {
            address: 'Azz9EmNuhtjoYrhWvidWx1Hfd14SNBsYyzXhA9Tnoca8',
            amount: '10000',
            tokenName: 'tsol:usdc',
          },
          {
            address: '2n2xqWM9Z18LqxfJzkNrMMFWiDUFYA2k6WSgSnf6EnJs',
            amount: '10000',
            tokenName: 'tsol:usdc',
          },
        ],
        fee: {
          fee: 'UNAVAILABLE',
          feeRate: undefined,
        },
        memo: 'memo text',
        blockhash: '5ne7phA48Jrvpn39AtupB8ZkCCAy8gLTfpGihZPuDqen',
        durableNonce: {
          authWalletAddress: '5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe',
          walletNonceAddress: '8Y7RM6JfcX4ASSNBkrkrmSbRu431YVi9Y3oLFnzC2dCh',
        },
      });
    });
  });
});
