import should from 'should';
import { register } from '../../../../../src/index';
import { TransactionBuilderFactory, KeyPair } from '../../../../../src/coin/cspr/';
import { WalletInitializationBuilder } from '../../../../../src/coin/cspr/walletInitializationBuilder';
import * as testData from '../../../../resources/cspr/cspr';
import { TransactionType } from '../../../../../src/coin/baseCoin';


describe('Casper Wallet Initialization Builder', () => {
  const factory = register('tcspr', TransactionBuilderFactory);
  it('get wallet init builder', () => {
    should.throws(() => {
      factory.getWalletInitializationBuilder();
    });
  });
});

describe('HBAR Wallet initialization', () => {
  const factory = register('tcspr', TransactionBuilderFactory);

  // TODO : make a different case for .fee({gasLimit: '1000}) and .fee({gasPrice: '1000', gasLimit:'10000'});
  const initTxBuilder = () => {
    const txBuilder = factory.getWalletInitializationBuilder();
    txBuilder.fee({ gasLimit: '1000000000' });
    txBuilder.owner(testData.OWNER_1.publicKey);
    txBuilder.owner(testData.OWNER_2.publicKey);
    txBuilder.owner(testData.OWNER_3.publicKey);
    txBuilder.source({ address: testData.OWNER_1.accountHash });
    txBuilder.sign({ key: testData.OWNER_1.privateKey });
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
      should.equal(txJson.from, testData.OWNER_1.accountHash );
      tx.type.should.equal(TransactionType.WalletInitialization);
    });

    it('offline signing init transaction', async () => {
      const txBuilder1 = factory.getWalletInitializationBuilder();
      txBuilder1.fee({ gasLimit: '1000000000' });
      txBuilder1.owner(testData.OWNER_1.publicKey);
      txBuilder1.owner(testData.OWNER_2.publicKey);
      txBuilder1.owner(testData.OWNER_3.publicKey);
      txBuilder1.source({ address: testData.OWNER_1.accountHash });
      const tx1 = await txBuilder1.build();
      const factory2 = register('tcspr', TransactionBuilderFactory);
      const txBuilder2 = factory2.from(tx1.toBroadcastFormat());
      txBuilder2.sign({ key: testData.OWNER_1.privateKey });
      const tx2 = await txBuilder2.build();

      const factory3 = register('tcspr', TransactionBuilderFactory);
      const txBuilder3 = factory3.from(tx2.toBroadcastFormat());
      txBuilder3.sign({ key: testData.OWNER_2.prvKeyWithPrefix });
      const tx3 = await txBuilder3.build();

      should.deepEqual(tx2.signature.length, 1);
      should.deepEqual(tx3.signature.length, 2);
      should.deepEqual(tx2.toBroadcastFormat(), testData.WALLET_BUILDER_SIGNED_TRANSACTION);
      should.deepEqual(tx3.toBroadcastFormat(), testData.WALLET_BUILDER_SIGNED_TWICE_TRANSACTION);
    });

    it('initialize from invalid tx adding new fields', async () => {
      const txBuilder = factory.from(testData.WALLET_INIT_2_OWNERS) as WalletInitializationBuilder;
      txBuilder.owner(testData.OWNER_3.publicKey);
      txBuilder.sign({ key: testData.OWNER_1.privateKey });
      const tx = await txBuilder.build();

      should.deepEqual(tx.signature.length, 1);
      should.deepEqual(tx.toBroadcastFormat(), testData.WALLET_BUILDER_SIGNED_TRANSACTION);
    });

    it('an init transaction with external signature', async () => {
      const txBuilder = factory.getWalletInitializationBuilder();
      txBuilder.fee({ gasLimit: '1000000000' });
      txBuilder.owner(testData.OWNER_1.publicKey);
      txBuilder.owner(testData.OWNER_2.publicKey);
      txBuilder.owner(testData.OWNER_3.publicKey);
      txBuilder.source({ address: testData.OWNER_1.accountHash });
      txBuilder.signature(
        '20bc01a6da677b99974b17204de5ff6f34f8e5904f58d6df1ceb39b473e7295dccf60fcedaf4f' +
          'dc3f6bef93edcfbe2a7ec33cc94c893906a063383c27b014f09',
        new KeyPair({ pub: testData.OWNER_1.xpub }),
      );

      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      should.equal(txJson.from, testData.OWNER_1.accountHash);
    });

    it('an init transaction with external signature included twice', async () => {
      const txBuilder = factory.getWalletInitializationBuilder();
      txBuilder.fee({ gasLimit: '1000000000' });
      txBuilder.owner(testData.OWNER_1.publicKey);
      txBuilder.owner(testData.OWNER_2.publicKey);
      txBuilder.owner(testData.OWNER_3.publicKey);
      txBuilder.source({ address: testData.OWNER_1.accountHash });
      txBuilder.signature(
        '20bc01a6da677b99974b17204de5ff6f34f8e5904f58d6df1ceb39b473e7295dccf60fcedaf4f' +
          'dc3f6bef93edcfbe2a7ec33cc94c893906a063383c27b014f09',
        new KeyPair({ pub: testData.OWNER_1.xpub }),
      );
      txBuilder.signature(
        '20bc01a6da677b99974b17204de5ff6f34f8e5904f58d6df1ceb39b473e7295dccf60fcedaf4f' +
          'dc3f6bef93edcfbe2a7ec33cc94c893906a063383c27b014f09',
        new KeyPair({ pub: testData.OWNER_1.xpub }),
      );

      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      should.equal(txJson.from, testData.OWNER_1.accountHash);
    });
  });

  describe('should fail to build', () => {
    it('a transaction without fee', async () => {
      const txBuilder = factory.getWalletInitializationBuilder();
      txBuilder.owner(testData.OWNER_1.publicKey);
      txBuilder.owner(testData.OWNER_2.publicKey);
      txBuilder.owner(testData.OWNER_3.publicKey);
      txBuilder.source({ address: testData.OWNER_1.accountHash });
      await txBuilder.build().should.be.rejectedWith('Invalid transaction: missing fee');
    });

    it('a wallet initialization the wrong number of owners', async () => {
      const txBuilder = factory.getWalletInitializationBuilder();
      txBuilder.fee({ gasLimit: '1000000000' });
      txBuilder.owner(testData.OWNER_1.publicKey);
      txBuilder.owner(testData.OWNER_2.publicKey);
      txBuilder.source({ address: testData.OWNER_1.accountHash });
      await txBuilder
        .build()
        .should.be.rejectedWith('Invalid transaction: wrong number of owners -- required: 3, found: 2');

      should.throws(
        () => txBuilder.owner(testData.OWNER_1.publicKey),
        'Repeated owner address: ' + testData.OWNER_1.publicKey,
      );

      const newTxBuilder = factory.getWalletInitializationBuilder();
      newTxBuilder.fee({ gasLimit: '1000000000' });
      newTxBuilder.source({ address: testData.OWNER_1.accountHash });
      await newTxBuilder
        .build()
        .should.be.rejectedWith('Invalid transaction: wrong number of owners -- required: 3, found: 0');
    });

    it('a transaction with invalid source', async () => {
      const factory = register('tcspr', TransactionBuilderFactory);
      const txBuilder = factory.getWalletInitializationBuilder();
      txBuilder.fee({ gasLimit: '1000000000' });
      txBuilder.owner(testData.OWNER_1.publicKey);
      txBuilder.owner(testData.OWNER_2.publicKey);
      txBuilder.owner(testData.OWNER_3.publicKey);
      await txBuilder.build().should.be.rejectedWith('Invalid transaction: missing source');
    });
  });

  describe('should validate', () => {
    it('an address', async () => {
      const txBuilder = factory.getWalletInitializationBuilder();
      txBuilder.validateAddress({ address: testData.VALID_ADDRESS });
      should.throws(
        () => txBuilder.validateAddress({ address: testData.INVALID_ADDRESS }),
        'Invalid address ' + testData.INVALID_ADDRESS,
      );
      should.throws(
        () => txBuilder.validateAddress({ address: testData.INVALID_ADDRESS }),
        'Invalid address ' + testData.INVALID_ADDRESS_EMPTY,
      );
      should.throws(
        () => txBuilder.validateAddress({ address: testData.INVALID_ADDRESS }),
        'Invalid address ' + testData.INVALID_ADDRESS_EMPTY_W_SPACES,
      );
    });

    it('value should be greater than zero', () => {
      const txBuilder = factory.getWalletInitializationBuilder();
      should.throws(() => txBuilder.fee({ gasLimit: '-10' }));
      should.doesNotThrow(() => txBuilder.fee({ gasLimit: '10' }));
    });

    it('a private key', () => {
      const txBuilder = factory.getWalletInitializationBuilder();
      should.throws(() => txBuilder.validateKey({ key: 'abc' }), 'Invalid key');
      should.doesNotThrow(() => txBuilder.validateKey({ key: testData.OWNER_1.xpub }));
    });

    it('a raw transaction', async () => {
      const txBuilder = factory.getWalletInitializationBuilder();
      should.doesNotThrow(() => txBuilder.validateRawTransaction(testData.WALLET_INITIALIZATION));
      should.throws(() => txBuilder.validateRawTransaction('0x00001000'));
      should.throws(() => txBuilder.validateRawTransaction(''));
      should.throws(() => txBuilder.validateRawTransaction('pqrs'));
      should.throws(() => txBuilder.validateRawTransaction(1234));
    });

    it('a transaction to build', async () => {
      const txBuilder = factory.getWalletInitializationBuilder();
      should.throws(() => txBuilder.validateTransaction(), 'Invalid transaction: missing fee');
      txBuilder.fee({ gasLimit: '10' });
      should.throws(() => txBuilder.validateTransaction(), 'Invalid transaction: missing source');
      txBuilder.source({ address: testData.VALID_ADDRESS });
      should.throws(() => txBuilder.validateTransaction(), 'wrong number of owners -- required: 3, found: 0');
      txBuilder.owner(testData.OWNER_1.publicKey);
      should.throws(() => txBuilder.validateTransaction(), 'wrong number of owners -- required: 3, found: 1');
      txBuilder.owner(testData.OWNER_2.publicKey);
      should.throws(() => txBuilder.validateTransaction(), 'wrong number of owners -- required: 3, found: 2');
      txBuilder.owner(testData.OWNER_3.publicKey);
      should.doesNotThrow(() => txBuilder.validateTransaction());
    });
  });
});
