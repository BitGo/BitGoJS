import assert from 'assert';
import * as should from 'should';
import { getBuilderFactory } from '../getBuilderFactory';
import { KeyPair } from '../../../src';
import * as testData from '../../resources/hbar';
import { TransactionType } from '@bitgo/sdk-core';
import { WalletInitializationBuilder } from '../../../src/lib/walletInitializationBuilder';

describe('HBAR Wallet initialization', () => {
  const factory = getBuilderFactory('thbar');

  const initTxBuilder = () => {
    const txBuilder = factory.getWalletInitializationBuilder();
    txBuilder.fee({ fee: '1000000000' });
    txBuilder.owner(testData.OWNER1);
    txBuilder.owner(testData.OWNER2);
    txBuilder.owner(testData.OWNER3);
    txBuilder.source({ address: testData.OPERATOR.accountId });
    txBuilder.sign({ key: testData.OPERATOR.privateKey });
    return txBuilder;
  };

  describe('should build ', () => {
    it('a valid raw tx for wallet init', async () => {
      const builder = initTxBuilder();
      const tx = await builder.build();
      const raw = tx.toBroadcastFormat();
      const builder2 = factory.from(raw);
      const tx2 = await builder2.build();
      should.deepEqual(tx.signature.length, 1);
      should.deepEqual(tx.toJson(), tx2.toJson());
      should.deepEqual(raw, tx2.toBroadcastFormat());
      tx.type.should.equal(TransactionType.WalletInitialization);
      tx2.type.should.equal(TransactionType.WalletInitialization);
    });

    it('an init transaction', async () => {
      const txBuilder = initTxBuilder();
      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      txJson.fee.should.equal(1000000000);
      should.deepEqual(tx.signature.length, 1);
      should.equal(txJson.from, testData.OPERATOR.accountId);
      tx.type.should.equal(TransactionType.WalletInitialization);
    });

    it('offline signing init transaction', async () => {
      const txBuilder1 = factory.getWalletInitializationBuilder();
      txBuilder1.startTime('1596110493.372646570');
      txBuilder1.fee({ fee: '1000000000' });
      txBuilder1.owner(testData.OWNER1);
      txBuilder1.owner(testData.OWNER2);
      txBuilder1.owner(testData.OWNER3);
      txBuilder1.source({ address: testData.OPERATOR.accountId });
      const tx1 = await txBuilder1.build();
      const factory2 = getBuilderFactory('thbar');
      const txBuilder2 = factory2.from(tx1.toBroadcastFormat());
      txBuilder2.sign({ key: testData.OPERATOR.privateKey });
      const tx2 = await txBuilder2.build();

      const factory3 = getBuilderFactory('thbar');
      const txBuilder3 = factory3.from(tx2.toBroadcastFormat());
      txBuilder3.sign({ key: testData.ACCOUNT_1.prvKeyWithPrefix });
      const tx3 = await txBuilder3.build();

      should.deepEqual(tx2.signature.length, 1);
      should.deepEqual(tx3.signature.length, 2);
      should.deepEqual(tx2.toBroadcastFormat(), testData.WALLET_BUILDER_SIGNED_TRANSACTION);
      should.deepEqual(tx3.toBroadcastFormat(), testData.WALLET_BUILDER_SIGNED_TWICE_TRANSACTION);
    });

    it('initialize from invalid tx adding new fields', async () => {
      const txBuilder = factory.from(testData.WALLET_INIT_2_OWNERS) as WalletInitializationBuilder;
      txBuilder.owner(testData.OWNER3);
      txBuilder.sign({ key: testData.OPERATOR.privateKey });
      const tx = await txBuilder.build();

      should.deepEqual(tx.signature.length, 1);
      should.deepEqual(tx.toBroadcastFormat(), testData.WALLET_BUILDER_SIGNED_TRANSACTION);
    });

    it('an init transaction with external signature', async () => {
      const txBuilder = factory.getWalletInitializationBuilder();
      txBuilder.fee({ fee: '1000000000' });
      txBuilder.owner(testData.OWNER1);
      txBuilder.owner(testData.OWNER2);
      txBuilder.owner(testData.OWNER3);
      txBuilder.source({ address: testData.OPERATOR.accountId });
      txBuilder.signature(
        '20bc01a6da677b99974b17204de5ff6f34f8e5904f58d6df1ceb39b473e7295dccf60fcedaf4f' +
          'dc3f6bef93edcfbe2a7ec33cc94c893906a063383c27b014f09',
        new KeyPair({ pub: testData.ACCOUNT_1.pubKeyWithPrefix })
      );

      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      should.equal(txJson.from, testData.OPERATOR.accountId);
    });

    it('an init transaction with external signature included twice', async () => {
      const txBuilder = factory.getWalletInitializationBuilder();
      txBuilder.fee({ fee: '1000000000' });
      txBuilder.owner(testData.OWNER1);
      txBuilder.owner(testData.OWNER2);
      txBuilder.owner(testData.OWNER3);
      txBuilder.source({ address: testData.OPERATOR.accountId });
      txBuilder.signature(
        '20bc01a6da677b99974b17204de5ff6f34f8e5904f58d6df1ceb39b473e7295dccf60fcedaf4f' +
          'dc3f6bef93edcfbe2a7ec33cc94c893906a063383c27b014f09',
        new KeyPair({ pub: testData.ACCOUNT_1.pubKeyWithPrefix })
      );
      txBuilder.signature(
        '20bc01a6da677b99974b17204de5ff6f34f8e5904f58d6df1ceb39b473e7295dccf60fcedaf4f' +
          'dc3f6bef93edcfbe2a7ec33cc94c893906a063383c27b014f09',
        new KeyPair({ pub: testData.ACCOUNT_1.pubKeyWithPrefix })
      );

      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      should.equal(txJson.from, testData.OPERATOR.accountId);
    });
  });

  describe('should fail to build', () => {
    it('a transaction without fee', async () => {
      const txBuilder = factory.getWalletInitializationBuilder();
      txBuilder.owner(testData.OWNER1);
      txBuilder.owner(testData.OWNER2);
      txBuilder.owner(testData.OWNER3);
      txBuilder.source({ address: testData.OPERATOR.accountId });
      await txBuilder.build().should.be.rejectedWith('Invalid transaction: missing fee');
    });

    it('a wallet initialization the wrong number of owners', async () => {
      const txBuilder = factory.getWalletInitializationBuilder();
      txBuilder.fee({ fee: '1000000000' });
      txBuilder.owner(testData.OWNER1);
      txBuilder.owner(testData.OWNER2);
      txBuilder.source({ address: testData.OPERATOR.accountId });
      await txBuilder
        .build()
        .should.be.rejectedWith('Invalid transaction: wrong number of owners -- required: 3, found: 2');

      assert.throws(() => txBuilder.owner(testData.OWNER1), new RegExp('Repeated owner address: ' + testData.OWNER1));

      const newTxBuilder = factory.getWalletInitializationBuilder();
      newTxBuilder.fee({ fee: '1000000000' });
      newTxBuilder.source({ address: testData.OPERATOR.accountId });
      await newTxBuilder
        .build()
        .should.be.rejectedWith('Invalid transaction: wrong number of owners -- required: 3, found: 0');
    });

    it('a transaction with invalid source', async () => {
      const factory = getBuilderFactory('thbar');
      const txBuilder = factory.getWalletInitializationBuilder();
      txBuilder.fee({ fee: '1000000000' });
      txBuilder.owner(testData.OWNER1);
      txBuilder.owner(testData.OWNER2);
      txBuilder.owner(testData.OWNER3);
      await txBuilder.build().should.be.rejectedWith('Invalid transaction: missing source');
    });
  });

  describe('should validate', () => {
    it('an address', async () => {
      const txBuilder = factory.getWalletInitializationBuilder();
      txBuilder.validateAddress(testData.VALID_ADDRESS);
      assert.throws(
        () => txBuilder.validateAddress(testData.INVALID_ADDRESS),
        new RegExp('Invalid address ' + testData.INVALID_ADDRESS.address)
      );
    });

    it('value should be greater than zero', () => {
      const txBuilder = factory.getWalletInitializationBuilder();
      assert.throws(() => txBuilder.fee({ fee: '-10' }));
      should.doesNotThrow(() => txBuilder.fee({ fee: '10' }));
    });

    it('a private key', () => {
      const txBuilder = factory.getWalletInitializationBuilder();
      assert.throws(() => txBuilder.validateKey({ key: 'abc' }), /Invalid private key length/);
      should.doesNotThrow(() => txBuilder.validateKey({ key: testData.ACCOUNT_1.prvKeyWithPrefix }));
    });

    it('a raw transaction', async () => {
      const txBuilder = factory.getWalletInitializationBuilder();
      should.doesNotThrow(() => txBuilder.validateRawTransaction(testData.WALLET_INITIALIZATION));
      assert.throws(() => txBuilder.validateRawTransaction('0x00001000'));
      assert.throws(() => txBuilder.validateRawTransaction(''));
      assert.throws(() => txBuilder.validateRawTransaction('pqrs'));
      assert.throws(() => txBuilder.validateRawTransaction(1234));
    });

    it('a transaction to build', async () => {
      const txBuilder = factory.getWalletInitializationBuilder();
      assert.throws(() => txBuilder.validateTransaction(), /Invalid transaction: wrong number of owners/);
      txBuilder.fee({ fee: '10' });
      assert.throws(() => txBuilder.validateTransaction(), /Invalid transaction: wrong number of owners/);
      txBuilder.source(testData.VALID_ADDRESS);
      assert.throws(() => txBuilder.validateTransaction(), /wrong number of owners -- required: 3, found: 0/);
      txBuilder.owner(testData.OWNER1);
      assert.throws(() => txBuilder.validateTransaction(), /wrong number of owners -- required: 3, found: 1/);
      txBuilder.owner(testData.OWNER2);
      assert.throws(() => txBuilder.validateTransaction(), /wrong number of owners -- required: 3, found: 2/);
      txBuilder.owner(testData.OWNER3);
      should.doesNotThrow(() => txBuilder.validateTransaction());
    });
  });
});
