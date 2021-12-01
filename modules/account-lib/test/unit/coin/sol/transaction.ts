import should from 'should';
import { coins } from '@bitgo/statics';
import { Transaction } from '../../../../src/coin/sol/transaction';
import * as testData from '../../../resources/sol/sol';
import { KeyPair } from '../../../../src/coin/sol';
import { PublicKey, Transaction as SolTransaction } from '@solana/web3.js';

describe('Sol Transaction', () => {
  const coin = coins.get('tsol');

  describe('toJson should', () => {
    it('throw empty transaction', () => {
      const tx = new Transaction(coin);
      should.throws(() => tx.toJson(), 'Empty transaction');
      should.throws(() => tx.toBroadcastFormat(), 'Empty transaction');
    });
    it('throw for toJson of empty tx', () => {
      const tx = new Transaction(coin);
      tx.solTransaction = new SolTransaction();
      should(() => tx.toJson()).throwError('Nonce is not set');
      tx.solTransaction.recentBlockhash = testData.blockHashes.validBlockHashes[0];
      should(() => tx.toJson()).throwError('Invalid transaction, transaction type not supported: undefined');
    });

    it('succeed for a unsigned transfer tx', () => {
      const tx = new Transaction(coin);
      tx.fromRawTransaction(testData.TRANSFER_UNSIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE);
      const txJson = tx.toJson();
      txJson.should.have.properties(['id', 'feePayer', 'nonce', 'numSignatures', 'instructionsData']);
      txJson.id?.should.equal(undefined);
      txJson.feePayer?.should.equal('5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe');
      txJson.nonce.should.equal('GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi');
      txJson.numSignatures.should.equal(0);
      txJson.instructionsData.length.should.equal(3);
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
        '23vsfSy9jzuuXDnqcawUPTbaQXD4kz3s62FiT8q1NxbedfC1vZ9VcNMau6nxnu1VghT1Tdh9voUB5FY1WmKozzZy',
      );
      txJson.feePayer?.should.equal('5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe');
      txJson.nonce.should.equal('GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi');
      txJson.numSignatures.should.equal(1);
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
});
