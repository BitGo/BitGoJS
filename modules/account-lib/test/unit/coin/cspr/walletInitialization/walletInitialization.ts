import should from 'should';
import { register } from '../../../../../src/index';
import { KeyPair, TransactionBuilderFactory } from '../../../../../src/coin/cspr';
import * as testData from '../../../../resources/cspr/cspr';
import { TransactionType } from '../../../../../src/coin/baseCoin';

describe('CSPR Wallet initialization', () => {
  const factory = register('tcspr', TransactionBuilderFactory);

  const initTxBuilder = () => {
    const txBuilder = factory.getWalletInitializationBuilder();
    txBuilder.fee(testData.FEE);
    txBuilder.owner(testData.ACCOUNT_1.publicKey);
    txBuilder.owner(testData.ACCOUNT_2.publicKey);
    txBuilder.owner(testData.ACCOUNT_3.publicKey);
    txBuilder.source({ address: testData.ROOT_ACCOUNT.publicKey });
    txBuilder.sign({ key: testData.ROOT_ACCOUNT.privateKey });
    return txBuilder;
  };

  describe('should build ', () => {
    it('an init transaction', async () => {
      const txBuilder = initTxBuilder();
      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      // TODO(STXL-1458): Uncomment next line when fee is recoverable from encoded transaction
      //txJson.fee.should.equal(testData.FEE.gasLimit);
      should.deepEqual(tx.signature.length, 1);
      should.equal(txJson.from.toUpperCase(), testData.ROOT_ACCOUNT.publicKey);
      tx.type.should.equal(TransactionType.WalletInitialization);
    });

    it('an init transaction with external signature', async () => {
      const txBuilder = factory.getWalletInitializationBuilder();
      txBuilder.fee(testData.FEE);
      txBuilder.owner(testData.ACCOUNT_1.publicKey);
      txBuilder.owner(testData.ACCOUNT_2.publicKey);
      txBuilder.owner(testData.ACCOUNT_3.publicKey);
      txBuilder.source({ address: testData.ROOT_ACCOUNT.publicKey });
      txBuilder.signature(
        testData.EXTERNAL_SIGNATURE.signature,
        new KeyPair({ pub: testData.EXTERNAL_SIGNATURE.publicKey }),
      );

      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      should.equal(txJson.from.toUpperCase(), testData.ROOT_ACCOUNT.publicKey);
    });

    it('an init transaction with external signature included twice', async () => {
      const txBuilder = factory.getWalletInitializationBuilder();
      txBuilder.fee(testData.FEE);
      txBuilder.owner(testData.ACCOUNT_1.publicKey);
      txBuilder.owner(testData.ACCOUNT_2.publicKey);
      txBuilder.owner(testData.ACCOUNT_3.publicKey);
      txBuilder.source({ address: testData.ROOT_ACCOUNT.publicKey });
      txBuilder.signature(
        testData.EXTERNAL_SIGNATURE.signature,
        new KeyPair({ pub: testData.EXTERNAL_SIGNATURE.publicKey }),
      );
      txBuilder.signature(
        testData.EXTERNAL_SIGNATURE.signature,
        new KeyPair({ pub: testData.EXTERNAL_SIGNATURE.publicKey }),
      );

      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      should.equal(txJson.from.toUpperCase(), testData.ROOT_ACCOUNT.publicKey);
    });
  });

  describe('should fail to build', () => {
    const factory = register('tcspr', TransactionBuilderFactory);

    it('a transaction without fee', async () => {
      const txBuilder = factory.getWalletInitializationBuilder();
      txBuilder.owner(testData.ACCOUNT_1.publicKey);
      txBuilder.owner(testData.ACCOUNT_2.publicKey);
      txBuilder.owner(testData.ACCOUNT_3.publicKey);
      txBuilder.source({ address: testData.ROOT_ACCOUNT.publicKey });
      await txBuilder.build().should.be.rejectedWith('Invalid transaction: missing fee');
    });

    it('a wallet initialization the wrong number of owners', async () => {
      const txBuilder = factory.getWalletInitializationBuilder();
      txBuilder.fee(testData.FEE);
      txBuilder.owner(testData.ACCOUNT_1.publicKey);
      txBuilder.owner(testData.ACCOUNT_2.publicKey);
      txBuilder.source({ address: testData.ROOT_ACCOUNT.publicKey });
      await txBuilder
        .build()
        .should.be.rejectedWith('Invalid transaction: wrong number of owners -- required: 3, found: 2');

      should.throws(
        () => txBuilder.owner(testData.ACCOUNT_1.publicKey),
        'Repeated owner address: ' + testData.ACCOUNT_1.publicKey,
      );

      const newTxBuilder = factory.getWalletInitializationBuilder();
      newTxBuilder.fee(testData.FEE);
      newTxBuilder.source({ address: testData.ROOT_ACCOUNT.publicKey });
      await newTxBuilder
        .build()
        .should.be.rejectedWith('Invalid transaction: wrong number of owners -- required: 3, found: 0');
    });

    it('a transaction with invalid source', async () => {
      const factory = register('thbar', TransactionBuilderFactory);
      const txBuilder = factory.getWalletInitializationBuilder();
      txBuilder.fee(testData.FEE);
      txBuilder.owner(testData.ACCOUNT_1.publicKey);
      txBuilder.owner(testData.ACCOUNT_2.publicKey);
      txBuilder.owner(testData.ACCOUNT_3.publicKey);
      await txBuilder.build().should.be.rejectedWith('Invalid transaction: missing source');
    });
  });

  describe('should validate', () => {
    const factory = register('tcspr', TransactionBuilderFactory);

    it('an address', async () => {
      const txBuilder = factory.getWalletInitializationBuilder();
      txBuilder.validateAddress({ address: testData.VALID_ADDRESS });
      should.throws(
        () => txBuilder.validateAddress({ address: testData.INVALID_ADDRESS }),
        'Invalid address ' + testData.INVALID_ADDRESS,
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
      should.doesNotThrow(() => txBuilder.validateKey({ key: testData.ACCOUNT_1.privateKey }));
    });

    it('a transaction to build', async () => {
      const txBuilder = factory.getWalletInitializationBuilder();
      should.throws(() => txBuilder.validateTransaction(), 'Invalid transaction: missing fee');
      txBuilder.fee(testData.FEE);
      should.throws(() => txBuilder.validateTransaction(), 'Invalid transaction: missing source');
      txBuilder.source({ address: testData.VALID_ADDRESS });
      should.throws(() => txBuilder.validateTransaction(), 'wrong number of owners -- required: 3, found: 0');
      txBuilder.owner(testData.ACCOUNT_1.publicKey);
      should.throws(() => txBuilder.validateTransaction(), 'wrong number of owners -- required: 3, found: 1');
      txBuilder.owner(testData.ACCOUNT_2.publicKey);
      should.throws(() => txBuilder.validateTransaction(), 'wrong number of owners -- required: 3, found: 2');
      txBuilder.owner(testData.ACCOUNT_3.publicKey);
      should.doesNotThrow(() => txBuilder.validateTransaction());
    });
  });
});
