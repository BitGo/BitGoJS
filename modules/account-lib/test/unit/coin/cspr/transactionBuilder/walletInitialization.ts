import should from 'should';
import { register } from '../../../../../src';
import { KeyPair, TransactionBuilderFactory } from '../../../../../src/coin/cspr';
import * as testData from '../../../../resources/cspr/cspr';
import { TransactionType } from '../../../../../src/coin/baseCoin';
import { Transaction } from '../../../../../src/coin/cspr/transaction';
import { verifySignature } from '../../../../../src/coin/cspr/utils';
import { CLString } from 'casper-js-sdk';

describe('CSPR Wallet initialization', () => {
  const factory = register('tcspr', TransactionBuilderFactory);
  const owner1Address = new KeyPair({ pub: testData.ACCOUNT_1.publicKey }).getAddress();
  const owner2Address = new KeyPair({ pub: testData.ACCOUNT_2.publicKey }).getAddress();
  const owner3Address = new KeyPair({ pub: testData.ACCOUNT_3.publicKey }).getAddress();
  const owner4Address = new KeyPair({ pub: testData.ACCOUNT_4.publicKey }).getAddress();
  const sourceAddress = new KeyPair({ pub: testData.ROOT_ACCOUNT.publicKey }).getAddress();

  const initSignedTxBuilder = () => {
    const txBuilder = initUnsignedTxBuilder();
    txBuilder.sign({ key: testData.ROOT_ACCOUNT.privateKey });
    return txBuilder;
  };

  const initSignedTxBuilderWithExtendedKey = () => {
    const txBuilder = initUnsignedTxBuilder();
    txBuilder.sign({ key: testData.ROOT_ACCOUNT.xPrivateKey });
    return txBuilder;
  };

  const initUnsignedTxBuilder = () => {
    const txBuilder = factory.getWalletInitializationBuilder();
    txBuilder.fee(testData.FEE);
    txBuilder.owner(owner1Address);
    txBuilder.owner(owner2Address);
    txBuilder.owner(owner3Address);
    txBuilder.source({ address: sourceAddress });
    return txBuilder;
  };

  describe('should build ', () => {
    it('an init transaction', async () => {
      const txBuilder = initSignedTxBuilder();
      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.fee, testData.FEE);
      should.deepEqual(tx.signature.length, 1);
      should.doesNotThrow(() => verifySignature(tx.signature[0], txJson.hash, testData.ROOT_ACCOUNT.publicKey));
      should.equal(txJson.from, sourceAddress);
      tx.type.should.equal(TransactionType.WalletInitialization);
    });

    it('an init transaction using extended key to sign', async () => {
      const txBuilder = initSignedTxBuilderWithExtendedKey();
      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.fee, testData.FEE);
      should.deepEqual(tx.signature.length, 1);
      should.doesNotThrow(() => verifySignature(tx.signature[0], txJson.hash, testData.ROOT_ACCOUNT.publicKey));
      should.equal(txJson.from, sourceAddress);
      tx.type.should.equal(TransactionType.WalletInitialization);
    });

    it('an init transaction with external signature', async () => {
      const txBuilder = factory.getWalletInitializationBuilder();
      txBuilder.fee(testData.FEE);
      txBuilder.owner(owner1Address);
      txBuilder.owner(owner2Address);
      txBuilder.owner(owner3Address);
      txBuilder.source({ address: sourceAddress });
      txBuilder.signature(
        testData.EXTERNAL_SIGNATURE.signature,
        new KeyPair({ pub: testData.EXTERNAL_SIGNATURE.publicKey }),
      );

      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      should.equal(txJson.from, sourceAddress);
    });

    it('an init transaction with external signature included twice', async () => {
      const txBuilder = factory.getWalletInitializationBuilder();
      txBuilder.fee(testData.FEE);
      txBuilder.owner(owner1Address);
      txBuilder.owner(owner2Address);
      txBuilder.owner(owner3Address);
      txBuilder.source({ address: sourceAddress });
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
      should.equal(txJson.from, sourceAddress);
    });
  });

  describe('should fail to build', () => {
    const factory = register('tcspr', TransactionBuilderFactory);

    it('a transaction without fee', async () => {
      const txBuilder = factory.getWalletInitializationBuilder();
      txBuilder.owner(owner1Address);
      txBuilder.owner(owner2Address);
      txBuilder.owner(owner3Address);
      txBuilder.source({ address: sourceAddress });
      await txBuilder.build().should.be.rejectedWith(testData.INVALID_TRANSACTION_MISSING_FEE);
    });

    it('a wallet initialization the wrong number of owners', async () => {
      const txBuilder = factory.getWalletInitializationBuilder();
      txBuilder.fee(testData.FEE);
      txBuilder.owner(owner1Address);
      txBuilder.owner(owner2Address);
      txBuilder.source({ address: sourceAddress });
      await txBuilder.build().should.be.rejectedWith(testData.INVALID_NUMBER_OF_OWNERS_TWO_OF_THREE);

      should.throws(() => txBuilder.owner(owner1Address), 'Repeated owner address: ' + owner1Address);

      should.doesNotThrow(() => txBuilder.owner(owner3Address));
      should.throws(() => txBuilder.owner(owner4Address), 'A maximum of 3 owners can be set for a multisig wallet');

      const newTxBuilder = factory.getWalletInitializationBuilder();
      newTxBuilder.fee(testData.FEE);
      txBuilder.source({ address: sourceAddress });
      await newTxBuilder.build().should.be.rejectedWith(testData.INVALID_TRANSACTION_MISSING_OWNERS);
    });

    it('a transaction with invalid source', async () => {
      const factory = register('thbar', TransactionBuilderFactory);
      const txBuilder = factory.getWalletInitializationBuilder();
      txBuilder.fee(testData.FEE);
      txBuilder.owner(owner1Address);
      txBuilder.owner(owner2Address);
      txBuilder.owner(owner3Address);
      await txBuilder.build().should.be.rejectedWith(testData.INVALID_TRANSACTION_MISSING_SOURCE);
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
      txBuilder.owner(new KeyPair({ pub: testData.ACCOUNT_1.publicKey }).getAddress());
      should.throws(() => txBuilder.validateTransaction(), 'wrong number of owners -- required: 3, found: 1');
      txBuilder.owner(new KeyPair({ pub: testData.ACCOUNT_2.publicKey }).getAddress());
      should.throws(() => txBuilder.validateTransaction(), 'wrong number of owners -- required: 3, found: 2');
      txBuilder.owner(new KeyPair({ pub: testData.ACCOUNT_3.publicKey }).getAddress());
      should.doesNotThrow(() => txBuilder.validateTransaction());
    });
  });
  describe('should build from', () => {
    describe('serialized transactions', () => {
      it('a non signed transfer transaction from serialized', async () => {
        const builder = initUnsignedTxBuilder();
        const tx = (await builder.build()) as Transaction;
        const txJson = tx.toJson();

        should.equal((tx.casperTx.session.getArgByName('deploy_type') as CLString).value(), 'WalletInitialization');
        should.equal(
          (tx.casperTx.session.getArgByName('owner_0') as CLString).value(),
          new KeyPair({ pub: testData.ACCOUNT_1.publicKey }).getAddress(),
        );
        should.equal(
          (tx.casperTx.session.getArgByName('owner_1') as CLString).value(),
          new KeyPair({ pub: testData.ACCOUNT_2.publicKey }).getAddress(),
        );
        should.equal(
          (tx.casperTx.session.getArgByName('owner_2') as CLString).value(),
          new KeyPair({ pub: testData.ACCOUNT_3.publicKey }).getAddress(),
        );

        const builder2 = factory.getWalletInitializationBuilder();
        builder2.from(tx.toBroadcastFormat());
        const tx2 = (await builder2.build()) as Transaction;
        const tx2Json = tx2.toJson();

        should.equal((tx2.casperTx.session.getArgByName('deploy_type') as CLString).value(), 'WalletInitialization');
        should.equal(
          (tx2.casperTx.session.getArgByName('owner_0') as CLString).value(),
          new KeyPair({ pub: testData.ACCOUNT_1.publicKey }).getAddress(),
        );
        should.equal(
          (tx2.casperTx.session.getArgByName('owner_1') as CLString).value(),
          new KeyPair({ pub: testData.ACCOUNT_2.publicKey }).getAddress(),
        );
        should.equal(
          (tx2.casperTx.session.getArgByName('owner_2') as CLString).value(),
          new KeyPair({ pub: testData.ACCOUNT_3.publicKey }).getAddress(),
        );

        should.deepEqual(tx2Json, txJson, 'from implementation from factory should recreate original transaction');
      });

      it('a signed transfer transaction from serialized', async () => {
        const builder = initUnsignedTxBuilder();
        builder.sign({ key: testData.ROOT_ACCOUNT.privateKey });
        const tx = (await builder.build()) as Transaction;
        const txJson = tx.toJson();

        should.equal((tx.casperTx.session.getArgByName('deploy_type') as CLString).value(), 'WalletInitialization');
        should.equal(
          (tx.casperTx.session.getArgByName('owner_0') as CLString).value(),
          new KeyPair({ pub: testData.ACCOUNT_1.publicKey }).getAddress(),
        );
        should.equal(
          (tx.casperTx.session.getArgByName('owner_1') as CLString).value(),
          new KeyPair({ pub: testData.ACCOUNT_2.publicKey }).getAddress(),
        );
        should.equal(
          (tx.casperTx.session.getArgByName('owner_2') as CLString).value(),
          new KeyPair({ pub: testData.ACCOUNT_3.publicKey }).getAddress(),
        );

        const builder2 = factory.getWalletInitializationBuilder();
        builder2.from(tx.toBroadcastFormat());
        const tx2 = (await builder2.build()) as Transaction;
        const tx2Json = tx2.toJson();

        should.equal((tx2.casperTx.session.getArgByName('deploy_type') as CLString).value(), 'WalletInitialization');
        should.equal(
          (tx2.casperTx.session.getArgByName('owner_0') as CLString).value(),
          new KeyPair({ pub: testData.ACCOUNT_1.publicKey }).getAddress(),
        );
        should.equal(
          (tx2.casperTx.session.getArgByName('owner_1') as CLString).value(),
          new KeyPair({ pub: testData.ACCOUNT_2.publicKey }).getAddress(),
        );
        should.equal(
          (tx2.casperTx.session.getArgByName('owner_2') as CLString).value(),
          new KeyPair({ pub: testData.ACCOUNT_3.publicKey }).getAddress(),
        );

        should.deepEqual(tx2Json, txJson, 'from implementation from factory should recreate original transaction');
        should.deepEqual(
          tx2.casperTx.approvals,
          tx.casperTx.approvals,
          'from implementation from factory should get approvals correctly',
        );
      });

      it('a signed transfer transaction with extended key from serialized', async () => {
        const builder = initUnsignedTxBuilder();
        builder.sign({ key: testData.ROOT_ACCOUNT.xPrivateKey });
        const tx = (await builder.build()) as Transaction;
        const txJson = tx.toJson();

        should.equal((tx.casperTx.session.getArgByName('deploy_type') as CLString).value(), 'WalletInitialization');
        should.equal(
          (tx.casperTx.session.getArgByName('owner_0') as CLString).value(),
          new KeyPair({ pub: testData.ACCOUNT_1.publicKey }).getAddress(),
        );
        should.equal(
          (tx.casperTx.session.getArgByName('owner_1') as CLString).value(),
          new KeyPair({ pub: testData.ACCOUNT_2.publicKey }).getAddress(),
        );
        should.equal(
          (tx.casperTx.session.getArgByName('owner_2') as CLString).value(),
          new KeyPair({ pub: testData.ACCOUNT_3.publicKey }).getAddress(),
        );

        const builder2 = factory.getWalletInitializationBuilder();
        builder2.from(tx.toBroadcastFormat());
        const tx2 = (await builder2.build()) as Transaction;
        const tx2Json = tx2.toJson();

        should.equal((tx2.casperTx.session.getArgByName('deploy_type') as CLString).value(), 'WalletInitialization');
        should.equal(
          (tx2.casperTx.session.getArgByName('owner_0') as CLString).value(),
          new KeyPair({ pub: testData.ACCOUNT_1.publicKey }).getAddress(),
        );
        should.equal(
          (tx2.casperTx.session.getArgByName('owner_1') as CLString).value(),
          new KeyPair({ pub: testData.ACCOUNT_2.publicKey }).getAddress(),
        );
        should.equal(
          (tx2.casperTx.session.getArgByName('owner_2') as CLString).value(),
          new KeyPair({ pub: testData.ACCOUNT_3.publicKey }).getAddress(),
        );

        should.deepEqual(tx2Json, txJson, 'from implementation from factory should recreate original transaction');
        should.deepEqual(
          tx2.casperTx.approvals,
          tx.casperTx.approvals,
          'from implementation from factory should get approvals correctly',
        );
      });

      it('an offline multisig transfer transaction', async () => {
        const builder = initUnsignedTxBuilder();
        builder.sign({ key: testData.ROOT_ACCOUNT.privateKey });
        builder.sign({ key: testData.ACCOUNT_1.privateKey });
        const tx = (await builder.build()) as Transaction;
        const txJson = tx.toJson();

        should.equal((tx.casperTx.session.getArgByName('deploy_type') as CLString).value(), 'WalletInitialization');
        should.equal(
          (tx.casperTx.session.getArgByName('owner_0') as CLString).value(),
          new KeyPair({ pub: testData.ACCOUNT_1.publicKey }).getAddress(),
        );
        should.equal(
          (tx.casperTx.session.getArgByName('owner_1') as CLString).value(),
          new KeyPair({ pub: testData.ACCOUNT_2.publicKey }).getAddress(),
        );
        should.equal(
          (tx.casperTx.session.getArgByName('owner_2') as CLString).value(),
          new KeyPair({ pub: testData.ACCOUNT_3.publicKey }).getAddress(),
        );

        const builder2 = factory.getWalletInitializationBuilder();
        builder2.from(tx.toBroadcastFormat());
        const tx2 = (await builder2.build()) as Transaction;
        const tx2Json = tx2.toJson();

        should.equal((tx2.casperTx.session.getArgByName('deploy_type') as CLString).value(), 'WalletInitialization');
        should.equal(
          (tx2.casperTx.session.getArgByName('owner_0') as CLString).value(),
          new KeyPair({ pub: testData.ACCOUNT_1.publicKey }).getAddress(),
        );
        should.equal(
          (tx2.casperTx.session.getArgByName('owner_1') as CLString).value(),
          new KeyPair({ pub: testData.ACCOUNT_2.publicKey }).getAddress(),
        );
        should.equal(
          (tx2.casperTx.session.getArgByName('owner_2') as CLString).value(),
          new KeyPair({ pub: testData.ACCOUNT_3.publicKey }).getAddress(),
        );

        should.deepEqual(tx2Json, txJson, 'from implementation from factory should recreate original transaction');
        should.deepEqual(
          tx2.casperTx.approvals,
          tx.casperTx.approvals,
          'from implementation from factory should get approvals correctly',
        );
      });

      it('an offline multisig transfer transaction using extended keys', async () => {
        const builder = initUnsignedTxBuilder();
        builder.sign({ key: testData.ROOT_ACCOUNT.xPrivateKey });
        builder.sign({ key: testData.ACCOUNT_1.xPrivateKey });
        const tx = (await builder.build()) as Transaction;
        const txJson = tx.toJson();

        should.equal((tx.casperTx.session.getArgByName('deploy_type') as CLString).value(), 'WalletInitialization');
        should.equal(
          (tx.casperTx.session.getArgByName('owner_0') as CLString).value(),
          new KeyPair({ pub: testData.ACCOUNT_1.publicKey }).getAddress(),
        );
        should.equal(
          (tx.casperTx.session.getArgByName('owner_1') as CLString).value(),
          new KeyPair({ pub: testData.ACCOUNT_2.publicKey }).getAddress(),
        );
        should.equal(
          (tx.casperTx.session.getArgByName('owner_2') as CLString).value(),
          new KeyPair({ pub: testData.ACCOUNT_3.publicKey }).getAddress(),
        );

        const builder2 = factory.getWalletInitializationBuilder();
        builder2.from(tx.toBroadcastFormat());
        const tx2 = (await builder2.build()) as Transaction;
        const tx2Json = tx2.toJson();

        should.equal((tx2.casperTx.session.getArgByName('deploy_type') as CLString).value(), 'WalletInitialization');
        should.equal(
          (tx2.casperTx.session.getArgByName('owner_0') as CLString).value(),
          new KeyPair({ pub: testData.ACCOUNT_1.publicKey }).getAddress(),
        );
        should.equal(
          (tx2.casperTx.session.getArgByName('owner_1') as CLString).value(),
          new KeyPair({ pub: testData.ACCOUNT_2.publicKey }).getAddress(),
        );
        should.equal(
          (tx2.casperTx.session.getArgByName('owner_2') as CLString).value(),
          new KeyPair({ pub: testData.ACCOUNT_3.publicKey }).getAddress(),
        );

        should.deepEqual(tx2Json, txJson, 'from implementation from factory should recreate original transaction');
        should.deepEqual(
          tx2.casperTx.approvals,
          tx.casperTx.approvals,
          'from implementation from factory should get approvals correctly',
        );
      });

      it('an offline multisig transfer transaction using one extended key', async () => {
        const builder = initUnsignedTxBuilder();
        builder.sign({ key: testData.ROOT_ACCOUNT.xPrivateKey });
        builder.sign({ key: testData.ACCOUNT_1.privateKey });
        const tx = (await builder.build()) as Transaction;
        const txJson = tx.toJson();

        should.equal((tx.casperTx.session.getArgByName('deploy_type') as CLString).value(), 'WalletInitialization');
        should.equal(
          (tx.casperTx.session.getArgByName('owner_0') as CLString).value(),
          new KeyPair({ pub: testData.ACCOUNT_1.publicKey }).getAddress(),
        );
        should.equal(
          (tx.casperTx.session.getArgByName('owner_1') as CLString).value(),
          new KeyPair({ pub: testData.ACCOUNT_2.publicKey }).getAddress(),
        );
        should.equal(
          (tx.casperTx.session.getArgByName('owner_2') as CLString).value(),
          new KeyPair({ pub: testData.ACCOUNT_3.publicKey }).getAddress(),
        );

        const builder2 = factory.getWalletInitializationBuilder();
        builder2.from(tx.toBroadcastFormat());
        const tx2 = (await builder2.build()) as Transaction;
        const tx2Json = tx2.toJson();

        should.equal((tx2.casperTx.session.getArgByName('deploy_type') as CLString).value(), 'WalletInitialization');
        should.equal(
          (tx2.casperTx.session.getArgByName('owner_0') as CLString).value(),
          new KeyPair({ pub: testData.ACCOUNT_1.publicKey }).getAddress(),
        );
        should.equal(
          (tx2.casperTx.session.getArgByName('owner_1') as CLString).value(),
          new KeyPair({ pub: testData.ACCOUNT_2.publicKey }).getAddress(),
        );
        should.equal(
          (tx2.casperTx.session.getArgByName('owner_2') as CLString).value(),
          new KeyPair({ pub: testData.ACCOUNT_3.publicKey }).getAddress(),
        );

        should.deepEqual(tx2Json, txJson, 'from implementation from factory should recreate original transaction');
        should.deepEqual(
          tx2.casperTx.approvals,
          tx.casperTx.approvals,
          'from implementation from factory should get approvals correctly',
        );
      });
    });
  });

  describe('txJson validation', () => {
    it('contains all required fields for Wallet Initialization', async () => {
      const txBuilder = initSignedTxBuilder();
      const tx = (await txBuilder.build()) as Transaction;
      const txJson = tx.toJson();
      should.deepEqual(txJson.fee, testData.FEE);
      should.equal(txJson.deployType, 'WalletInitialization');
      should.equal(txJson.from, '02' + testData.ROOT_ACCOUNT.publicKey);
      should.equal(txJson.hash, Buffer.from(tx.casperTx.hash).toString('hex'));

      should.equal(txJson.owner1, new KeyPair({ pub: testData.ACCOUNT_1.publicKey }).getAddress());
      should.equal(txJson.owner2, new KeyPair({ pub: testData.ACCOUNT_2.publicKey }).getAddress());
      should.equal(txJson.owner3, new KeyPair({ pub: testData.ACCOUNT_3.publicKey }).getAddress());
    });

    it('contains all required fields for Wallet Initialization using extended key to sign', async () => {
      const txBuilder = initSignedTxBuilderWithExtendedKey();
      const tx = (await txBuilder.build()) as Transaction;
      const txJson = tx.toJson();
      should.deepEqual(txJson.fee, testData.FEE);
      should.equal(txJson.deployType, 'WalletInitialization');
      should.equal(txJson.from, '02' + testData.ROOT_ACCOUNT.publicKey);
      should.equal(txJson.hash, Buffer.from(tx.casperTx.hash).toString('hex'));

      should.equal(txJson.owner1, new KeyPair({ pub: testData.ACCOUNT_1.publicKey }).getAddress());
      should.equal(txJson.owner2, new KeyPair({ pub: testData.ACCOUNT_2.publicKey }).getAddress());
      should.equal(txJson.owner3, new KeyPair({ pub: testData.ACCOUNT_3.publicKey }).getAddress());
    });
  });
});
