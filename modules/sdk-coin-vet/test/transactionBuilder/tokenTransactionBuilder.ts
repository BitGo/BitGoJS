import should from 'should';
import { coins } from '@bitgo-beta/statics';
import { TransactionType } from '@bitgo-beta/sdk-core';
import { Transaction, TransactionBuilderFactory, TokenTransaction } from '../../src';
import * as testData from '../resources/vet';

describe('tokenTransactionBuilder', () => {
  const factory = new TransactionBuilderFactory(coins.get('tvet:vtho'));
  describe('Succeed', () => {
    it('should build a token transfer transaction', async function () {
      const transaction = new TokenTransaction(coins.get('tvet:vtho'));
      const txBuilder = factory.getTokenTransactionBuilder(transaction);
      txBuilder.sender(testData.addresses.validAddresses[0]);
      txBuilder.gas(21000);
      txBuilder.nonce('64248');
      txBuilder.blockRef('0x014ead140e77bbc1');
      txBuilder.expiration(64);
      txBuilder.gasPriceCoef(128);
      txBuilder.tokenAddress(testData.TOKEN_ADDRESS);
      txBuilder.recipients(testData.recipients);
      txBuilder.addFeePayerAddress(testData.feePayer.address);
      const tx = (await txBuilder.build()) as TokenTransaction;
      should.equal(tx.sender, testData.addresses.validAddresses[0]);
      should.equal(tx.recipients[0].address, testData.recipients[0].address);
      should.equal(tx.recipients[0].amount, testData.recipients[0].amount);
      should.equal(tx.gas, 21000);
      should.equal(tx.getFee(), '315411764705882352');
      should.equal(tx.nonce, '64248');
      should.equal(tx.expiration, 64);
      should.equal(tx.type, TransactionType.Send);
      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: testData.addresses.validAddresses[0],
        value: testData.recipients[0].amount,
        coin: 'tvet:vtho',
      });
      tx.outputs.length.should.equal(1);
      tx.outputs[0].should.deepEqual({
        address: testData.recipients[0].address,
        value: testData.recipients[0].amount,
        coin: 'tvet:vtho',
      });
      const rawTx = tx.toBroadcastFormat();
      should.equal(txBuilder.isValidRawTransaction(rawTx), true);
      rawTx.should.equal(testData.UNSIGNED_TRANSACTION_3);
    });

    it('should build and send a signed tx', async function () {
      const txBuilder = factory.from(testData.SPONSORED_TOKEN_TRANSACTION);
      txBuilder.getNonce().should.equal('517737');

      const tx = (await txBuilder.build()) as TokenTransaction;
      should.equal(tx.type, TransactionType.Send);
      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: testData.addresses.validAddresses[2],
        value: testData.AMOUNT.toString(),
        coin: 'tvet:vtho',
      });
      tx.outputs.length.should.equal(1);
      tx.outputs[0].should.deepEqual({
        address: testData.recipients[0].address,
        value: testData.AMOUNT.toString(),
        coin: 'tvet:vtho',
      });
      should.equal(tx.id, '0x16a0ebdfe43a8a62e7d62e65603c9563c8342fff6d8150c71bff9ec37634f50e');
      should.equal(tx.gas, 51518);
      should.equal(tx.getFee(), '773780156862745098');
      should.equal(tx.nonce, '517737');
      should.equal(tx.expiration, 64);
      should.equal(tx.type, TransactionType.Send);
      const rawTx = tx.toBroadcastFormat();
      should.equal(txBuilder.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.SPONSORED_TOKEN_TRANSACTION);
    });

    it('should validate a valid signablePayload', async function () {
      const transaction = new TokenTransaction(coins.get('tvet:vtho'));
      const txBuilder = factory.getTokenTransactionBuilder(transaction);
      txBuilder.sender(testData.addresses.validAddresses[0]);
      txBuilder.recipients(testData.recipients);
      txBuilder.gas(21000);
      txBuilder.nonce('64248');
      txBuilder.expiration(64);
      txBuilder.blockRef('0x014ead140e77bbc1');
      txBuilder.gasPriceCoef(128);
      txBuilder.addFeePayerAddress(testData.feePayer.address);
      txBuilder.tokenAddress(testData.TOKEN_ADDRESS);
      const tx = (await txBuilder.build()) as Transaction;
      const signablePayload = tx.signablePayload;
      should.equal(signablePayload.toString('hex'), testData.VALID_TOKEN_SIGNABLE_PAYLOAD);
    });

    it('should build a unsigned tx and validate its toJson', async function () {
      const transaction = new TokenTransaction(coins.get('tvet:vtho'));
      const txBuilder = factory.getTokenTransactionBuilder(transaction);
      txBuilder.sender(testData.addresses.validAddresses[0]);
      txBuilder.recipients(testData.recipients);
      txBuilder.gas(21000);
      txBuilder.nonce('64248');
      txBuilder.expiration(64);
      txBuilder.blockRef('0x014ead140e77bbc1');
      txBuilder.gasPriceCoef(128);
      txBuilder.addFeePayerAddress(testData.feePayer.address);
      txBuilder.tokenAddress(testData.TOKEN_ADDRESS);
      const tx = (await txBuilder.build()) as TokenTransaction;
      const toJson = tx.toJson();
      should.equal(toJson.sender, testData.addresses.validAddresses[0]);
      should.deepEqual(toJson.recipients, [
        {
          address: testData.recipients[0].address,
          amount: testData.recipients[0].amount,
        },
      ]);
      should.equal(toJson.nonce, '64248');
      should.equal(toJson.gas, 21000);
      should.equal(toJson.gasPriceCoef, 128);
      should.equal(toJson.expiration, 64);
      should.equal(toJson.feePayer, testData.feePayer.address);
      should.equal(toJson.tokenAddress, testData.TOKEN_ADDRESS);
    });

    it('should build a signed tx and validate its toJson', async function () {
      const txBuilder = factory.from(testData.SPONSORED_TOKEN_TRANSACTION);
      const tx = (await txBuilder.build()) as TokenTransaction;
      const toJson = tx.toJson();
      should.equal(toJson.id, '0x16a0ebdfe43a8a62e7d62e65603c9563c8342fff6d8150c71bff9ec37634f50e');
      should.equal(toJson.sender, testData.addresses.validAddresses[2]);
      should.deepEqual(toJson.recipients, [
        {
          address: testData.addresses.validAddresses[1].toLowerCase(),
          amount: testData.AMOUNT.toString(),
        },
      ]);
      should.equal(toJson.nonce, '517737');
      should.equal(toJson.gas, 51518);
      should.equal(toJson.gasPriceCoef, 128);
      should.equal(toJson.expiration, 64);
      should.equal(toJson.tokenAddress, testData.TOKEN_ADDRESS);
    });

    it('should build a unsigned tx then add sender sig and build again', async function () {
      const transaction = new TokenTransaction(coins.get('tvet:vtho'));
      const txBuilder = factory.getTokenTransactionBuilder(transaction);
      txBuilder.sender(testData.addresses.validAddresses[2]);
      txBuilder.recipients(testData.recipients);
      txBuilder.gas(21000);
      txBuilder.nonce('64248');
      txBuilder.blockRef('0x014ead140e77bbc1');
      txBuilder.addFeePayerAddress(testData.feePayer.address);
      txBuilder.expiration(64);
      txBuilder.gasPriceCoef(128);
      txBuilder.tokenAddress(testData.TOKEN_ADDRESS);
      const tx = (await txBuilder.build()) as Transaction;
      const unsignedSerializedTx = tx.toBroadcastFormat();
      const builder1 = factory.from(unsignedSerializedTx);
      builder1.addSenderSignature(Buffer.from(testData.senderSig2, 'hex'));
      const senderSignedTx = await builder1.build();
      const senderSignedSerializedTx = senderSignedTx.toBroadcastFormat();
      should.equal(senderSignedSerializedTx, testData.senderSignedSerializedTxHex2);

      const builder2 = factory.from(testData.senderSignedSerializedTxHex2);
      builder2.addSenderSignature(Buffer.from(testData.senderSig2, 'hex'));
      builder2.addFeePayerSignature(Buffer.from(testData.feePayerSig2, 'hex'));
      const completelySignedTx = await builder2.build();
      should.equal(completelySignedTx.toBroadcastFormat(), testData.completeSignedSerializedHex2);
      should.equal(completelySignedTx.id, '0x065dfe80e3113f8c4638f17b7f255152fc52c29b42ed617cdff72fd41289152b');
    });
  });

  describe('Fail', () => {
    it('should fail for invalid sender', async function () {
      const transaction = new Transaction(coins.get('tvet:vtho'));
      const builder = factory.getTokenTransactionBuilder(transaction);
      should(() => builder.sender('randomString')).throwError('Invalid address randomString');
    });

    it('should fail for invalid recipient', async function () {
      const builder = factory.getTokenTransactionBuilder();
      should(() => builder.recipients([testData.invalidRecipients[0]])).throwError('Invalid address randomString');
      should(() => builder.recipients([testData.invalidRecipients[1]])).throwError('Value cannot be less than zero');
      should(() => builder.recipients([testData.invalidRecipients[2]])).throwError('Invalid amount format');
    });

    it('should fail for invalid gas amount', async function () {
      const builder = factory.getTokenTransactionBuilder();
      should(() => builder.gas(-1)).throwError('Value cannot be less than zero');
    });

    it('should fail to build if token address if not set', async function () {
      const transaction = new TokenTransaction(coins.get('tvet:vtho'));
      const txBuilder = factory.getTokenTransactionBuilder(transaction);
      txBuilder.sender(testData.addresses.validAddresses[0]);
      txBuilder.gas(21000);
      txBuilder.nonce('64248');
      txBuilder.blockRef('0x014ead140e77bbc1');
      txBuilder.expiration(64);
      txBuilder.gasPriceCoef(128);
      txBuilder.recipients(testData.recipients);
      txBuilder.addFeePayerAddress(testData.feePayer.address);
      try {
        await txBuilder.build();
      } catch (err) {
        should.equal(err.message, 'Token address is required');
      }
    });

    it('should fail on setting invalid token address', async function () {
      const transaction = new TokenTransaction(coins.get('tvet:vtho'));
      const txBuilder = factory.getTokenTransactionBuilder(transaction);
      txBuilder.sender(testData.addresses.validAddresses[0]);
      txBuilder.gas(21000);
      txBuilder.nonce('64248');
      txBuilder.blockRef('0x014ead140e77bbc1');
      txBuilder.expiration(64);
      txBuilder.gasPriceCoef(128);
      txBuilder.recipients(testData.recipients);
      txBuilder.addFeePayerAddress(testData.feePayer.address);
      should(() => txBuilder.tokenAddress('InvalidTokenAddress')).throwError('Invalid address InvalidTokenAddress');
    });
  });
});
