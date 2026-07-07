import should from 'should';
import { coins } from '@bitgo/statics';
import { TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilderFactory, FlushCoinsTransaction } from '../../src';
import * as testData from '../resources/vet';

describe('Flush Coins Transaction', () => {
  const factory = new TransactionBuilderFactory(coins.get('tvet'));

  describe('Succeed', () => {
    it('should build a flush coins transaction', async function () {
      const transaction = new FlushCoinsTransaction(coins.get('tvet'));
      const txBuilder = factory.getFlushCoinsTransactionBuilder(transaction);
      txBuilder.gas(21000);
      txBuilder.nonce('64248');
      txBuilder.blockRef('0x014ead140e77bbc1');
      txBuilder.expiration(64);
      txBuilder.gasPriceCoef(128);
      txBuilder.contract(testData.FORWARDER_ADDRESS);
      const tx = (await txBuilder.build()) as FlushCoinsTransaction;
      should.equal(tx.gas, 21000);
      should.equal(tx.nonce, '64248');
      should.equal(tx.expiration, 64);
      should.equal(tx.type, TransactionType.FlushCoins);
      should.equal(tx.blockRef, '0x014ead140e77bbc1');
      should.equal(tx.clauses.length, 1);
      should.equal(tx.clauses[0].to, testData.FORWARDER_ADDRESS);
      should.equal(tx.clauses[0].data, testData.FLUSH_COINS_DATA);
      should.equal(tx.clauses[0].value, '0x0');
      const rawTx = tx.toBroadcastFormat();
      should.equal(txBuilder.isValidRawTransaction(rawTx), true);
      rawTx.should.equal(testData.FLUSH_COINS_TRANSACTION);
    });

    it('should validate signable payload', async function () {
      const transaction = new FlushCoinsTransaction(coins.get('tvet'));
      const txBuilder = factory.getFlushCoinsTransactionBuilder(transaction);
      txBuilder.gas(21000);
      txBuilder.nonce('64248');
      txBuilder.blockRef('0x014ead140e77bbc1');
      txBuilder.expiration(64);
      txBuilder.gasPriceCoef(128);
      txBuilder.contract(testData.FORWARDER_ADDRESS);
      const tx = (await txBuilder.build()) as FlushCoinsTransaction;
      should.equal(tx.signablePayload.toString('hex'), testData.FLUSH_COINS_SIGNABLE_PAYLOAD);
    });

    it('should build and validate toJson', async function () {
      const transaction = new FlushCoinsTransaction(coins.get('tvet'));
      const txBuilder = factory.getFlushCoinsTransactionBuilder(transaction);
      txBuilder.gas(21000);
      txBuilder.nonce('64248');
      txBuilder.blockRef('0x014ead140e77bbc1');
      txBuilder.expiration(64);
      txBuilder.gasPriceCoef(128);
      txBuilder.contract(testData.FORWARDER_ADDRESS);
      const tx = (await txBuilder.build()) as FlushCoinsTransaction;

      const toJson = tx.toJson();
      should.equal(toJson.nonce, '64248');
      should.equal(toJson.gas, 21000);
      should.equal(toJson.gasPriceCoef, 128);
      should.equal(toJson.expiration, 64);
      should.equal(toJson.data, testData.FLUSH_COINS_DATA);
      should.equal(toJson.to, testData.FORWARDER_ADDRESS);
      should.equal(toJson.value, '0');
    });

    it('should produce a valid raw transaction matching expected bytes', async () => {
      const transaction = new FlushCoinsTransaction(coins.get('tvet'));
      const txBuilder = factory.getFlushCoinsTransactionBuilder(transaction);
      txBuilder.gas(21000);
      txBuilder.nonce('64248');
      txBuilder.blockRef('0x014ead140e77bbc1');
      txBuilder.expiration(64);
      txBuilder.gasPriceCoef(128);
      txBuilder.contract(testData.FORWARDER_ADDRESS);
      const tx = (await txBuilder.build()) as FlushCoinsTransaction;
      should.equal(tx.toBroadcastFormat(), testData.FLUSH_COINS_TRANSACTION);
      should.equal(txBuilder.isValidRawTransaction(testData.FLUSH_COINS_TRANSACTION), true);
    });
  });

  describe('Fail', () => {
    it('should fail with invalid contract address', async function () {
      const transaction = new FlushCoinsTransaction(coins.get('tvet'));
      const txBuilder = factory.getFlushCoinsTransactionBuilder(transaction);
      should(() => txBuilder.contract('randomString')).throwError('Invalid address randomString');
    });

    it('should fail to validate raw tx that is not flush coins', async function () {
      const txBuilder = factory.getFlushCoinsTransactionBuilder();
      should.equal(txBuilder.isValidRawTransaction(testData.FLUSH_TOKEN_TRANSACTION), false);
    });
  });
});
