import should from 'should';
import { coins } from '@bitgo/statics';
import { TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilderFactory, FlushTokenTransaction } from '../../src';
import * as testData from '../resources/vet';

describe('Flush Token Transaction', () => {
  const factory = new TransactionBuilderFactory(coins.get('tvet'));

  describe('Succeed', () => {
    it('should build a flush token transaction', async function () {
      const transaction = new FlushTokenTransaction(coins.get('tvet'));
      const txBuilder = factory.getFlushTokenTransactionBuilder(transaction);
      txBuilder.gas(21000);
      txBuilder.nonce('64248');
      txBuilder.blockRef('0x014ead140e77bbc1');
      txBuilder.expiration(64);
      txBuilder.gasPriceCoef(128);
      txBuilder.contract(testData.FORWARDER_ADDRESS);
      txBuilder.tokenAddress(testData.TOKEN_ADDRESS);
      txBuilder.forwarderVersion(4);
      const tx = (await txBuilder.build()) as FlushTokenTransaction;
      should.equal(tx.gas, 21000);
      should.equal(tx.nonce, '64248');
      should.equal(tx.expiration, 64);
      should.equal(tx.type, TransactionType.FlushTokens);
      should.equal(tx.blockRef, '0x014ead140e77bbc1');
      should.equal(tx.clauses.length, 1);
      should.equal(tx.clauses[0].to, testData.FORWARDER_ADDRESS);
      should.equal(tx.clauses[0].data, testData.FLUSH_TOKEN_DATA);
      should.equal(tx.clauses[0].value, '0x0');
      const rawTx = tx.toBroadcastFormat();
      should.equal(txBuilder.isValidRawTransaction(rawTx), true);
      rawTx.should.equal(testData.FLUSH_TOKEN_TRANSACTION);
    });

    it('should succeed to validate a valid signablePayload', async function () {
      const transaction = new FlushTokenTransaction(coins.get('tvet'));
      const txBuilder = factory.getFlushTokenTransactionBuilder(transaction);
      txBuilder.gas(21000);
      txBuilder.nonce('64248');
      txBuilder.blockRef('0x014ead140e77bbc1');
      txBuilder.expiration(64);
      txBuilder.gasPriceCoef(128);
      txBuilder.contract(testData.FORWARDER_ADDRESS);
      txBuilder.tokenAddress(testData.TOKEN_ADDRESS);
      txBuilder.forwarderVersion(4);
      const tx = (await txBuilder.build()) as FlushTokenTransaction;
      const signablePayload = tx.signablePayload;
      should.equal(signablePayload.toString('hex'), testData.FLUSH_TOKEN_SIGNABLE_PAYLOAD);
    });

    it('should build a unsigned tx and validate its toJson', async function () {
      const transaction = new FlushTokenTransaction(coins.get('tvet'));
      const txBuilder = factory.getFlushTokenTransactionBuilder(transaction);
      txBuilder.gas(21000);
      txBuilder.nonce('64248');
      txBuilder.blockRef('0x014ead140e77bbc1');
      txBuilder.expiration(64);
      txBuilder.gasPriceCoef(128);
      txBuilder.contract(testData.FORWARDER_ADDRESS);
      txBuilder.tokenAddress(testData.TOKEN_ADDRESS);
      txBuilder.forwarderVersion(4);
      const tx = (await txBuilder.build()) as FlushTokenTransaction;

      const toJson = tx.toJson();
      should.equal(toJson.nonce, '64248');
      should.equal(toJson.gas, 21000);
      should.equal(toJson.gasPriceCoef, 128);
      should.equal(toJson.expiration, 64);
      should.equal(toJson.data, testData.FLUSH_TOKEN_DATA);
      should.equal(toJson.to, testData.FORWARDER_ADDRESS);
      should.equal(toJson.tokenAddress, testData.TOKEN_ADDRESS);
      should.equal(toJson.value, '0');
    });

    it('should build properly from serialized', async () => {
      const txBuilder = factory.from(testData.SERIALIZED_SIGNED_FLUSH_TOKEN_TX);
      const signedTx = await txBuilder.build();
      const signedtxJson = signedTx.toJson();
      should.equal(signedtxJson.gas, 150000);

      txBuilder.gas(180000);
      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      should.equal(txJson.to, testData.FORWARDER_ADDRESS_NEW);
      should.equal(txJson.gas, 180000);
      console.log('txJson:', txJson);
    });
  });

  describe('Fail', () => {
    it('should fail if invalid params are used to build a tx', async function () {
      const transaction = new FlushTokenTransaction(coins.get('tvet'));
      const txBuilder = factory.getFlushTokenTransactionBuilder(transaction);

      should(() => txBuilder.tokenAddress('randomString')).throwError('Invalid address randomString');
      should(() => txBuilder.contract('randomString')).throwError('Invalid address randomString');
      should(() => txBuilder.forwarderVersion(3)).throwError('Invalid forwarder version: 3');
    });
  });
});
