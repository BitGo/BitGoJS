import should from 'should';
import { coins } from '@bitgo/statics';
import { TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilderFactory, Transaction, NFTTransaction, NFTTransactionBuilder } from '../../src';
import * as testData from '../resources/vet';

describe('nftTransactionBuilder', () => {
  const factory = new TransactionBuilderFactory(coins.get('tvet:sdt'));

  /**
   * Sets up an NFT transaction builder with common parameters for testing.
   * @param txBuilder - The transaction builder to set up
   * @param senderAddress - The sender's address
   * @param recipients - The recipients for the transaction
   * @param nftCollectionId - Optional NFT collection ID
   * @param tokenId - Optional token ID
   */
  function setupNFTTransactionBuilder(
    txBuilder: NFTTransactionBuilder,
    senderAddress: string,
    recipients: { address: string; amount: string }[],
    nftCollectionId?: string,
    tokenId?: string
  ) {
    txBuilder.sender(senderAddress);
    txBuilder.gas(21000);
    txBuilder.nonce('64248');
    txBuilder.blockRef('0x014ead140e77bbc1');
    txBuilder.expiration(64);
    txBuilder.gasPriceCoef(128);
    if (nftCollectionId) {
      txBuilder.nftCollectionId(nftCollectionId);
    }
    if (tokenId) {
      txBuilder.tokenId(tokenId);
    }
    txBuilder.recipients(recipients);
    txBuilder.addFeePayerAddress(testData.feePayer.address);
  }

  describe('Succeed', () => {
    it('should build a nft transfer transaction', async function () {
      const transaction = new NFTTransaction(coins.get('tvet:sdt'));
      const txBuilder = factory.getNFTTransactionBuilder(transaction);
      setupNFTTransactionBuilder(
        txBuilder,
        testData.addresses.validAddresses[0],
        testData.nftRecipients,
        testData.NFT_CONTRACT_ADDRESS,
        '100131'
      );
      const tx = (await txBuilder.build()) as NFTTransaction;
      should.equal(tx.sender, testData.addresses.validAddresses[0]);
      should.equal(tx.recipients[0].address, testData.nftRecipients[0].address);
      should.equal(tx.recipients[0].amount, testData.nftRecipients[0].amount);
      should.equal(tx.gas, 21000);
      should.equal(tx.getFee(), '315411764705882352');
      should.equal(tx.nonce, '64248');
      should.equal(tx.expiration, 64);
      should.equal(tx.type, TransactionType.SendNFT);
      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: testData.addresses.validAddresses[0],
        value: testData.nftRecipients[0].amount,
        coin: 'tvet:sdt',
      });
      tx.outputs.length.should.equal(1);
      tx.outputs[0].should.deepEqual({
        address: testData.nftRecipients[0].address,
        value: testData.nftRecipients[0].amount,
        coin: 'tvet:sdt',
      });
      const rawTx = tx.toBroadcastFormat();
      should.equal(txBuilder.isValidRawTransaction(rawTx), true);
      rawTx.should.equal(testData.UNSIGNED_TRANSACTION_4);
    });

    it('should build a transaction from signed hex', async function () {
      const txBuilder = factory.from(testData.SPONSORED_NFT_TRANSACTION);
      txBuilder.getNonce().should.equal('64248');

      const tx = (await txBuilder.build()) as NFTTransaction;
      should.equal(tx.type, TransactionType.SendNFT);
      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: testData.addresses.validAddresses[3],
        value: '1',
        coin: 'tvet:sdt',
      });
      tx.outputs.length.should.equal(1);
      tx.outputs[0].should.deepEqual({
        address: testData.addresses.validAddresses[0],
        value: '1',
        coin: 'tvet:sdt',
      });
      should.equal(tx.id, '0xfdd0343df857268994a737494ea9c2ac22b5a1c46c57e89d44c3e7be0fc52d56');
      should.equal(tx.gas, 21000);
      should.equal(tx.getFee(), '315411764705882352');
      should.equal(tx.nonce, '64248');
      should.equal(tx.expiration, 64);
      should.equal(tx.nftCollectionId, '0x887d9102f0003f1724d8fd5d4fe95a11572fcd77');
      should.equal(tx.tokenId, '100131');
      should.equal(tx.type, TransactionType.SendNFT);
      const rawTx = tx.toBroadcastFormat();
      should.equal(txBuilder.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.SPONSORED_NFT_TRANSACTION);
    });

    it('should validate a valid signablePayload', async function () {
      const transaction = new NFTTransaction(coins.get('tvet:sdt'));
      const txBuilder = factory.getNFTTransactionBuilder(transaction);
      setupNFTTransactionBuilder(
        txBuilder,
        testData.addresses.validAddresses[3],
        testData.nftRecipients2,
        testData.NFT_CONTRACT_ADDRESS,
        '100131'
      );
      const tx = (await txBuilder.build()) as Transaction;
      const signablePayload = tx.signablePayload;
      should.equal(signablePayload.toString('hex'), testData.VALID_NFT_SIGNABLE_PAYLOAD);
    });

    it('should build a unsigned tx and validate its toJson', async function () {
      const transaction = new NFTTransaction(coins.get('tvet:sdt'));
      const txBuilder = factory.getNFTTransactionBuilder(transaction);
      setupNFTTransactionBuilder(
        txBuilder,
        testData.addresses.validAddresses[3],
        testData.nftRecipients2,
        testData.NFT_CONTRACT_ADDRESS,
        '100131'
      );
      const tx = (await txBuilder.build()) as Transaction;
      const toJson = tx.toJson();
      should.equal(toJson.sender, testData.addresses.validAddresses[3]);
      should.deepEqual(toJson.recipients, [
        {
          address: testData.nftRecipients2[0].address,
          amount: testData.nftRecipients2[0].amount,
        },
      ]);
      should.equal(toJson.nonce, '64248');
      should.equal(toJson.gas, 21000);
      should.equal(toJson.gasPriceCoef, 128);
      should.equal(toJson.expiration, 64);
      should.equal(toJson.feePayer, testData.feePayer.address);
      should.equal(toJson.nftCollectionId, testData.NFT_CONTRACT_ADDRESS);
      should.equal(toJson.tokenId, '100131');
    });

    it('should build a signed tx and validate its toJson', async function () {
      const txBuilder = factory.from(testData.SPONSORED_NFT_TRANSACTION);
      const tx = (await txBuilder.build()) as NFTTransaction;
      const toJson = tx.toJson();
      should.equal(toJson.sender, testData.addresses.validAddresses[3]);
      should.deepEqual(toJson.recipients, [
        {
          address: testData.nftRecipients2[0].address,
          amount: testData.nftRecipients2[0].amount,
        },
      ]);
      should.equal(toJson.nonce, '64248');
      should.equal(toJson.gas, 21000);
      should.equal(toJson.gasPriceCoef, 128);
      should.equal(toJson.expiration, 64);
      should.equal(toJson.nftCollectionId, testData.NFT_CONTRACT_ADDRESS);
      should.equal(toJson.tokenId, '100131');
    });

    it('should build a unsigned tx then add sender sig and build again', async function () {
      const transaction = new NFTTransaction(coins.get('tvet:sdt'));
      const txBuilder = factory.getNFTTransactionBuilder(transaction);
      setupNFTTransactionBuilder(
        txBuilder,
        testData.addresses.validAddresses[3],
        testData.nftRecipients2,
        testData.NFT_CONTRACT_ADDRESS,
        '100131'
      );
      const tx = (await txBuilder.build()) as Transaction;
      const unsignedSerializedTx = tx.toBroadcastFormat();
      const builder1 = factory.from(unsignedSerializedTx);
      builder1.addSenderSignature(Buffer.from(testData.senderSig3, 'hex'));
      const senderSignedTx = await builder1.build();
      const senderSignedSerializedTx = senderSignedTx.toBroadcastFormat();
      should.equal(senderSignedSerializedTx, testData.senderSignedSerializedHex3);

      const builder2 = factory.from(testData.senderSignedSerializedHex3);
      builder2.addSenderSignature(Buffer.from(testData.senderSig3, 'hex'));
      builder2.addFeePayerSignature(Buffer.from(testData.feePayerSig3, 'hex'));
      const completelySignedTx = await builder2.build();
      should.equal(completelySignedTx.toBroadcastFormat(), testData.completeSignedSerializedHex3);
      should.equal(completelySignedTx.id, '0xfdd0343df857268994a737494ea9c2ac22b5a1c46c57e89d44c3e7be0fc52d56');
    });
  });

  describe('Fail', () => {
    it('should fail for invalid sender', async function () {
      const transaction = new Transaction(coins.get('tvet:sdt'));
      const builder = factory.getNFTTransactionBuilder(transaction);
      should(() => builder.sender('randomString')).throwError('Invalid address randomString');
    });

    it('should fail for invalid recipient', async function () {
      const builder = factory.getNFTTransactionBuilder();
      should(() => builder.recipients([testData.invalidRecipients[0]])).throwError('Invalid address randomString');
      should(() => builder.recipients([testData.invalidRecipients[1]])).throwError(
        'Value cannot be anything other than 1 for NFT transfer'
      );
      should(() => builder.recipients([testData.invalidRecipients[2]])).throwError('Invalid amount format');
      should(() => builder.recipients([testData.invalidRecipients[3]])).throwError(
        'Value cannot be anything other than 1 for NFT transfer'
      );
    });

    it('should fail for invalid gas amount', async function () {
      const builder = factory.getNFTTransactionBuilder();
      should(() => builder.gas(-1)).throwError('Value cannot be less than zero');
    });

    it('should fail to build if NFT Collection ID is not set', async function () {
      const transaction = new NFTTransaction(coins.get('tvet:sdt'));
      const txBuilder = factory.getNFTTransactionBuilder(transaction);
      setupNFTTransactionBuilder(txBuilder, testData.addresses.validAddresses[0], testData.nftRecipients);
      try {
        await txBuilder.build();
      } catch (err) {
        should.equal(err.message, 'NFT collection id is not set');
      }
    });

    it('should fail to build if Token id is not set', async function () {
      const transaction = new NFTTransaction(coins.get('tvet:sdt'));
      const txBuilder = factory.getNFTTransactionBuilder(transaction);
      setupNFTTransactionBuilder(
        txBuilder,
        testData.addresses.validAddresses[0],
        testData.nftRecipients,
        testData.NFT_CONTRACT_ADDRESS
      );
      try {
        await txBuilder.build();
      } catch (err) {
        should.equal(err.message, 'Token id is not set');
      }
    });

    it('should fail on setting invalid contract address', async function () {
      const transaction = new NFTTransaction(coins.get('tvet:vtho'));
      const txBuilder = factory.getNFTTransactionBuilder(transaction);
      setupNFTTransactionBuilder(
        txBuilder,
        testData.addresses.validAddresses[0],
        testData.nftRecipients,
        undefined,
        '100131'
      );
      should(() => txBuilder.nftCollectionId('InvalidTokenAddress')).throwError(
        'Invalid nftCollectionId, must be a valid contract address'
      );
    });
  });
});
