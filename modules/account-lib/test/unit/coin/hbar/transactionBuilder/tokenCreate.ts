import should from 'should';
import { register } from '../../../../../src/index';
import { KeyPair, TransactionBuilderFactory } from '../../../../../src/coin/hbar';
import * as testData from '../../../../resources/hbar/hbar';
import { TransactionType } from '../../../../../src/coin/baseCoin';

describe('HTS token creation', () => {
  const factory = register('thbar', TransactionBuilderFactory);

  const initTxBuilder = () => {
    const txBuilder = factory.getTokenCreateBuilder();
    txBuilder.fee({ fee: '1000000000' });
    txBuilder.name('Your Token Name');
    txBuilder.symbol('F');
    txBuilder.treasuryAccount(testData.OPERATOR.accountId);
    txBuilder.initialSupply('5000');
    txBuilder.adminKey(testData.OPERATOR.publicKey);
    txBuilder.expirationTime((Date.now() + 7776000).toString());
    txBuilder.source({ address: testData.OPERATOR.accountId });
    txBuilder.sign({ key: testData.OPERATOR.privateKey });
    return txBuilder;
  };

  describe('should build ', () => {
    it('a valid raw tx for tokenCreate', async () => {
      const builder = initTxBuilder();
      const tx = await builder.build();
      const raw = tx.toBroadcastFormat();
      const builder2 = factory.from(raw);
      const tx2 = await builder2.build();
      should.deepEqual(tx.signature.length, 1);
      should.deepEqual(tx.toJson(), tx2.toJson());
      should.deepEqual(raw, tx2.toBroadcastFormat());
      tx.type.should.equal(TransactionType.TokenCreation);
      tx2.type.should.equal(TransactionType.TokenCreation);
    });

    it('a tokenCreate transaction', async () => {
      const txBuilder = initTxBuilder();
      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      txJson.fee.should.equal(1000000000);
      should.deepEqual(tx.signature.length, 1);
      should.equal(txJson.from, testData.OPERATOR.accountId);
      tx.type.should.equal(TransactionType.TokenCreation);
    });

    it('a tokenCreate transaction utilizing all available fields', async () => {
      const txBuilder = factory.getTokenCreateBuilder();
      txBuilder.fee({ fee: '1000000000' });
      txBuilder.name('Token');
      txBuilder.symbol('TKN');
      txBuilder.decimal('1');
      txBuilder.initialSupply('1000');
      txBuilder.treasuryAccount(testData.OPERATOR.accountId);
      txBuilder.adminKey(testData.OPERATOR.publicKey);
      txBuilder.kycKey(testData.OPERATOR.publicKey);
      txBuilder.freezeKey(testData.OPERATOR.publicKey);
      txBuilder.wipeKey(testData.OPERATOR.publicKey);
      txBuilder.supplyKey(testData.OPERATOR.publicKey);
      txBuilder.freezeDefault(true);
      txBuilder.expirationTime((Date.now() + 7776000).toString());
      txBuilder.autoRenewAccount(testData.OPERATOR.accountId);
      txBuilder.autoRenewPeriod('7890000');
      txBuilder.source({ address: testData.OPERATOR.accountId });
      txBuilder.sign({ key: testData.OPERATOR.privateKey });
      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      txJson.fee.should.equal(1000000000);
      should.deepEqual(tx.signature.length, 1);
      should.equal(txJson.from, testData.OPERATOR.accountId);
      tx.type.should.equal(TransactionType.TokenCreation);
    });

    it('offline signing tokenCreate transaction', async () => {
      const txBuilder1 = factory.getTokenCreateBuilder();
      txBuilder1.startTime('1596110493.372646570');
      txBuilder1.fee({ fee: '1000000000' });
      txBuilder1.name('Token 1');
      txBuilder1.symbol('TOKEN1');
      txBuilder1.treasuryAccount(testData.OPERATOR.accountId);
      txBuilder1.expirationTime('1611846757');
      txBuilder1.source({ address: testData.OPERATOR.accountId });
      const tx1 = await txBuilder1.build();
      const factory2 = register('thbar', TransactionBuilderFactory);
      const txBuilder2 = factory2.from(tx1.toBroadcastFormat());
      txBuilder2.sign({ key: testData.OPERATOR.privateKey });
      const tx2 = await txBuilder2.build();
      const factory3 = register('thbar', TransactionBuilderFactory);
      const txBuilder3 = factory3.from(tx2.toBroadcastFormat());
      txBuilder3.sign({ key: testData.ACCOUNT_1.prvKeyWithPrefix });
      const tx3 = await txBuilder3.build();
      should.deepEqual(tx2.signature.length, 1);
      should.deepEqual(tx3.signature.length, 2);
      should.deepEqual(tx2.toBroadcastFormat(), testData.TOKEN_CREATE_SIGNED_TRANSACTION);
      should.deepEqual(tx3.toBroadcastFormat(), testData.TOKEN_CREATE_SIGNED_TWICE_TRANSACTION);
    });

    it('a tokenCreate transaction with external signature', async () => {
      const txBuilder = factory.getTokenCreateBuilder();
      txBuilder.fee({ fee: '1000000000' });
      txBuilder.name('Token 1');
      txBuilder.symbol('TOKEN1');
      txBuilder.treasuryAccount(testData.OPERATOR.accountId);
      txBuilder.expirationTime('1611846757');
      txBuilder.source({ address: testData.OPERATOR.accountId });
      txBuilder.signature(
        '20bc01a6da677b99974b17204de5ff6f34f8e5904f58d6df1ceb39b473e7295dccf60fcedaf4f' +
          'dc3f6bef93edcfbe2a7ec33cc94c893906a063383c27b014f09',
        new KeyPair({ pub: testData.ACCOUNT_1.pubKeyWithPrefix }),
      );

      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      should.equal(txJson.from, testData.OPERATOR.accountId);
    });

    it('a tokenCreate transaction with external signature included twice', async () => {
      const txBuilder = factory.getTokenCreateBuilder();
      txBuilder.fee({ fee: '1000000000' });
      txBuilder.name('Token 1');
      txBuilder.symbol('TOKEN1');
      txBuilder.treasuryAccount(testData.OPERATOR.accountId);
      txBuilder.expirationTime('1611846757');
      txBuilder.source({ address: testData.OPERATOR.accountId });
      txBuilder.signature(
        '20bc01a6da677b99974b17204de5ff6f34f8e5904f58d6df1ceb39b473e7295dccf60fcedaf4f' +
          'dc3f6bef93edcfbe2a7ec33cc94c893906a063383c27b014f09',
        new KeyPair({ pub: testData.ACCOUNT_1.pubKeyWithPrefix }),
      );
      txBuilder.signature(
        '20bc01a6da677b99974b17204de5ff6f34f8e5904f58d6df1ceb39b473e7295dccf60fcedaf4f' +
          'dc3f6bef93edcfbe2a7ec33cc94c893906a063383c27b014f09',
        new KeyPair({ pub: testData.ACCOUNT_1.pubKeyWithPrefix }),
      );

      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      should.equal(txJson.from, testData.OPERATOR.accountId);
    });
  });

  describe('should fail to build', () => {
    it('a transaction without fee', async () => {
      const txBuilder = factory.getTokenCreateBuilder();
      txBuilder.name('Token 1');
      txBuilder.symbol('TOKEN1');
      txBuilder.treasuryAccount(testData.OPERATOR.accountId);
      txBuilder.expirationTime('1611846757');
      txBuilder.source({ address: testData.OPERATOR.accountId });
      await txBuilder.build().should.be.rejectedWith('Invalid transaction: missing fee');
    });

    it('a transaction with invalid source', async () => {
      const factory = register('thbar', TransactionBuilderFactory);
      const txBuilder = factory.getTokenCreateBuilder();
      txBuilder.fee({ fee: '1000000000' });
      txBuilder.name('Token 1');
      txBuilder.symbol('TOKEN1');
      txBuilder.treasuryAccount(testData.OPERATOR.accountId);
      txBuilder.expirationTime('1611846757');
      await txBuilder.build().should.be.rejectedWith('Invalid transaction: missing source');
    });
  });

  describe('should validate', () => {
    it('a transaction to build', async () => {
      const txBuilder = factory.getTokenCreateBuilder();
      should.throws(() => txBuilder.validateTransaction(), 'Invalid transaction: missing fee');
      txBuilder.fee({ fee: '10' });
      should.throws(() => txBuilder.validateTransaction(), 'Invalid transaction: missing source');
      txBuilder.source(testData.VALID_ADDRESS);
      should.throws(() => txBuilder.validateTransaction(), 'Invalid transaction: missing token name');
      txBuilder.name('Token 1');
      should.throws(() => txBuilder.validateTransaction(), 'Invalid transaction: missing token symbol');
      txBuilder.symbol('TOKEN1');
      should.throws(() => txBuilder.validateTransaction(), 'Invalid transaction: missing treasury account id');
      txBuilder.treasuryAccount(testData.OPERATOR.accountId);
      should.throws(() => txBuilder.validateTransaction(), 'Invalid transaction: missing expiration time');
      txBuilder.expirationTime('1611846757');
      should.doesNotThrow(() => txBuilder.validateTransaction());
    });

    it('an address', async () => {
      const txBuilder = factory.getTokenCreateBuilder();
      txBuilder.validateAddress(testData.VALID_ADDRESS);
      should.throws(
        () => txBuilder.validateAddress(testData.INVALID_ADDRESS),
        'Invalid address ' + testData.INVALID_ADDRESS,
      );
    });

    it('value should be greater than zero', () => {
      const txBuilder = factory.getTokenCreateBuilder();
      should.throws(() => txBuilder.fee({ fee: '-10' }));
      should.doesNotThrow(() => txBuilder.fee({ fee: '10' }));
    });

    it('a private key', () => {
      const txBuilder = factory.getTokenCreateBuilder();
      should.throws(() => txBuilder.validateKey({ key: 'abc' }), 'Invalid key');
      should.doesNotThrow(() => txBuilder.validateKey({ key: testData.ACCOUNT_1.prvKeyWithPrefix }));
    });

    it('a raw transaction', async () => {
      const txBuilder = factory.getTokenCreateBuilder();
      should.doesNotThrow(() => txBuilder.validateRawTransaction(testData.TOKEN_CREATE_SIGNED_TRANSACTION));
      should.throws(() => txBuilder.validateRawTransaction('0x00001000'));
      should.throws(() => txBuilder.validateRawTransaction(''));
      should.throws(() => txBuilder.validateRawTransaction('pqrs'));
      should.throws(() => txBuilder.validateRawTransaction(1234));
    });
  });
});
