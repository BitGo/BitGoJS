import should from 'should';
import { register } from '../../../../src/index';
import { KeyPair, TransactionBuilderFactory } from '../../../../src/coin/cspr/';
import * as testData from '../../../resources/cspr/cspr';
import { Transaction } from '../../../../src/coin/cspr/transaction';

const factory = register('tcspr', TransactionBuilderFactory);
const owner1Address = new KeyPair({ pub: testData.ACCOUNT_1.publicKey }).getAddress();
const owner2Address = new KeyPair({ pub: testData.ACCOUNT_2.publicKey }).getAddress();
const owner3Address = new KeyPair({ pub: testData.ACCOUNT_3.publicKey }).getAddress();
const sourceAddress = new KeyPair({ pub: testData.ROOT_ACCOUNT.publicKey }).getAddress();

const initTxWalletInitBuilder = () => {
  const txBuilder = factory.getWalletInitializationBuilder();
  txBuilder.fee({ gasLimit: testData.FEE.gasLimit, gasPrice: testData.FEE.gasPrice });
  txBuilder.owner(owner1Address);
  txBuilder.owner(owner2Address);
  txBuilder.owner(owner3Address);
  txBuilder.source({ address: sourceAddress });
  return txBuilder;
};

const initTransferTxBuilder = () => {
  const txBuilder = factory.getTransferBuilder();
  txBuilder.fee({ gasLimit: testData.FEE.gasLimit, gasPrice: testData.FEE.gasPrice });
  txBuilder.source({ address: owner1Address });
  txBuilder.to(owner2Address);
  txBuilder.amount(testData.MIN_MOTES_AMOUNT);
  txBuilder.transferId(255);
  return txBuilder;
};

describe('should build ', () => {
  describe('serialized wallet initialization transactions', () => {
    it('a non signed transaction from serialized', async () => {
      const builder = initTxWalletInitBuilder();
      const tx = (await builder.build()) as Transaction;
      const txJson = tx.toJson();

      const builder2 = factory.from(tx.toBroadcastFormat());
      const tx2 = (await builder2.build()) as Transaction;
      const tx2Json = tx2.toJson();

      should.deepEqual(tx2Json, txJson, 'from implementation from factory should recreate original transaction');
    });

    it('a signed transaction from serialized', async () => {
      const builder = initTxWalletInitBuilder();
      builder.sign({ key: testData.ROOT_ACCOUNT.privateKey });
      const tx = (await builder.build()) as Transaction;
      const txJson = tx.toJson();

      const builder2 = factory.from(tx.toBroadcastFormat());
      const tx2 = (await builder2.build()) as Transaction;
      const tx2Json = tx2.toJson();

      should.deepEqual(tx2Json, txJson, 'from implementation from factory should recreate original transaction');
      should.deepEqual(
        tx2.casperTx.approvals,
        tx.casperTx.approvals,
        'from implementation from factory should get approvals correctly',
      );
    });

    it('a signed transaction using extended key from serialized', async () => {
      const builder = initTxWalletInitBuilder();
      builder.sign({ key: testData.ROOT_ACCOUNT.xPrivateKey });
      const tx = (await builder.build()) as Transaction;
      const txJson = tx.toJson();

      const builder2 = factory.from(tx.toBroadcastFormat());
      const tx2 = (await builder2.build()) as Transaction;
      const tx2Json = tx2.toJson();

      should.deepEqual(tx2Json, txJson, 'from implementation from factory should recreate original transaction');
      should.deepEqual(
        tx2.casperTx.approvals,
        tx.casperTx.approvals,
        'from implementation from factory should get approvals correctly',
      );
    });

    it('an offline multisig transaction', async () => {
      const builder = initTxWalletInitBuilder();
      builder.sign({ key: testData.ROOT_ACCOUNT.privateKey });
      builder.sign({ key: testData.ACCOUNT_1.privateKey });
      const tx = (await builder.build()) as Transaction;
      const txJson = tx.toJson();

      const builder2 = factory.from(tx.toBroadcastFormat());
      const tx2 = (await builder2.build()) as Transaction;
      const tx2Json = tx2.toJson();

      should.deepEqual(tx2Json, txJson, 'from implementation from factory should recreate original transaction');
      should.deepEqual(
        tx2.casperTx.approvals,
        tx.casperTx.approvals,
        'from implementation from factory should get approvals correctly',
      );
    });

    it('an offline multisig transaction using extended keys', async () => {
      const builder = initTxWalletInitBuilder();
      builder.sign({ key: testData.ROOT_ACCOUNT.xPrivateKey });
      builder.sign({ key: testData.ACCOUNT_1.xPrivateKey });
      const tx = (await builder.build()) as Transaction;
      const txJson = tx.toJson();

      const builder2 = factory.from(tx.toBroadcastFormat());
      const tx2 = (await builder2.build()) as Transaction;
      const tx2Json = tx2.toJson();

      should.deepEqual(tx2Json, txJson, 'from implementation from factory should recreate original transaction');
      should.deepEqual(
        tx2.casperTx.approvals,
        tx.casperTx.approvals,
        'from implementation from factory should get approvals correctly',
      );
    });

    it('an offline multisig transaction using one extended key', async () => {
      const builder = initTxWalletInitBuilder();
      builder.sign({ key: testData.ROOT_ACCOUNT.xPrivateKey });
      builder.sign({ key: testData.ACCOUNT_1.privateKey });
      const tx = (await builder.build()) as Transaction;
      const txJson = tx.toJson();

      const builder2 = factory.from(tx.toBroadcastFormat());
      const tx2 = (await builder2.build()) as Transaction;
      const tx2Json = tx2.toJson();

      should.deepEqual(tx2Json, txJson, 'from implementation from factory should recreate original transaction');
      should.deepEqual(
        tx2.casperTx.approvals,
        tx.casperTx.approvals,
        'from implementation from factory should get approvals correctly',
      );
    });
  });

  describe('serialized transfer transactions', () => {
    it('a non signed transaction from serialized', async () => {
      const builder = initTransferTxBuilder();
      const tx = (await builder.build()) as Transaction;
      const txJson = tx.toJson();

      const builder2 = factory.from(tx.toBroadcastFormat());
      const tx2 = (await builder2.build()) as Transaction;
      const tx2Json = tx2.toJson();

      should.deepEqual(tx2Json, txJson, 'from implementation from factory should recreate original transaction');
    });

    it('a signed transaction from serialized', async () => {
      const builder = initTransferTxBuilder();
      builder.sign({ key: testData.ROOT_ACCOUNT.privateKey });
      const tx = (await builder.build()) as Transaction;
      const txJson = tx.toJson();

      const builder2 = factory.from(tx.toBroadcastFormat());
      const tx2 = (await builder2.build()) as Transaction;
      const tx2Json = tx2.toJson();

      should.deepEqual(tx2Json, txJson, 'from implementation from factory should recreate original transaction');
      should.deepEqual(
        tx2.casperTx.approvals,
        tx.casperTx.approvals,
        'from implementation from factory should get approvals correctly',
      );
    });

    it('a signed transaction with extended key from serialized', async () => {
      const builder = initTransferTxBuilder();
      builder.sign({ key: testData.ROOT_ACCOUNT.xPrivateKey });
      const tx = (await builder.build()) as Transaction;
      const txJson = tx.toJson();

      const builder2 = factory.from(tx.toBroadcastFormat());
      const tx2 = (await builder2.build()) as Transaction;
      const tx2Json = tx2.toJson();

      should.deepEqual(tx2Json, txJson, 'from implementation from factory should recreate original transaction');
      should.deepEqual(
        tx2.casperTx.approvals,
        tx.casperTx.approvals,
        'from implementation from factory should get approvals correctly',
      );
    });

    it('an offline multisig transaction', async () => {
      const builder = initTransferTxBuilder();
      builder.sign({ key: testData.ROOT_ACCOUNT.privateKey });
      builder.sign({ key: testData.ACCOUNT_1.privateKey });
      const tx = (await builder.build()) as Transaction;
      const txJson = tx.toJson();

      const builder2 = factory.from(tx.toBroadcastFormat());
      const tx2 = (await builder2.build()) as Transaction;
      const tx2Json = tx2.toJson();

      should.deepEqual(tx2Json, txJson, 'from implementation from factory should recreate original transaction');
      should.deepEqual(
        tx2.casperTx.approvals,
        tx.casperTx.approvals,
        'from implementation from factory should get approvals correctly',
      );
    });

    it('an offline multisig transaction using extended keys', async () => {
      const builder = initTransferTxBuilder();
      builder.sign({ key: testData.ROOT_ACCOUNT.xPrivateKey });
      builder.sign({ key: testData.ACCOUNT_1.xPrivateKey });
      const tx = (await builder.build()) as Transaction;
      const txJson = tx.toJson();

      const builder2 = factory.from(tx.toBroadcastFormat());
      const tx2 = (await builder2.build()) as Transaction;
      const tx2Json = tx2.toJson();

      should.deepEqual(tx2Json, txJson, 'from implementation from factory should recreate original transaction');
      should.deepEqual(
        tx2.casperTx.approvals,
        tx.casperTx.approvals,
        'from implementation from factory should get approvals correctly',
      );
    });

    it('an offline multisig transaction using one extended key', async () => {
      const builder = initTransferTxBuilder();
      builder.sign({ key: testData.ROOT_ACCOUNT.xPrivateKey });
      builder.sign({ key: testData.ACCOUNT_1.privateKey });
      const tx = (await builder.build()) as Transaction;
      const txJson = tx.toJson();

      const builder2 = factory.from(tx.toBroadcastFormat());
      const tx2 = (await builder2.build()) as Transaction;
      const tx2Json = tx2.toJson();

      should.deepEqual(tx2Json, txJson, 'from implementation from factory should recreate original transaction');
      should.deepEqual(
        tx2.casperTx.approvals,
        tx.casperTx.approvals,
        'from implementation from factory should get approvals correctly',
      );
    });
  });

  describe('should reject signing ', () => {
    const factory = register('tcspr', TransactionBuilderFactory);
    it('a wallet init transaction with modified signer', async () => {
      const builder = initTxWalletInitBuilder();
      builder.sign({ key: testData.ROOT_ACCOUNT.privateKey });
      const tx = (await builder.build()) as Transaction;

      const txJson = JSON.parse(tx.toBroadcastFormat());
      const signer = txJson['deploy']['approvals'][0]['signer'];
      txJson['deploy']['approvals'][0]['signer'] = '01' + signer.slice(2);

      const builder2 = factory.from(JSON.stringify(txJson));
      const tx2 = (await builder2.build()) as Transaction;
      const keypair = new KeyPair({ prv: testData.ROOT_ACCOUNT.privateKey });
      should.throws(
        () => tx2.sign(keypair),
        (e) => e.message === testData.ERROR_ALREADY_SIGNED_WITH_INVALID_KEY,
      );
    });

    it('a wallet init transaction with modified signer using extended key', async () => {
      const builder = initTxWalletInitBuilder();
      builder.sign({ key: testData.ROOT_ACCOUNT.xPrivateKey });
      const tx = (await builder.build()) as Transaction;

      const txJson = JSON.parse(tx.toBroadcastFormat());
      const signer = txJson['deploy']['approvals'][0]['signer'];
      txJson['deploy']['approvals'][0]['signer'] = '01' + signer.slice(2);

      const builder2 = factory.from(JSON.stringify(txJson));
      const tx2 = (await builder2.build()) as Transaction;
      const keypair = new KeyPair({ prv: testData.ROOT_ACCOUNT.privateKey });
      should.throws(
        () => tx2.sign(keypair),
        (e) => e.message === testData.ERROR_ALREADY_SIGNED_WITH_INVALID_KEY,
      );
    });

    it('a transfer transaction with modified signer', async () => {
      const builder = initTransferTxBuilder();
      builder.sign({ key: testData.ROOT_ACCOUNT.privateKey });
      const tx = (await builder.build()) as Transaction;

      const txJson = JSON.parse(tx.toBroadcastFormat());
      const signer = txJson['deploy']['approvals'][0]['signer'];
      txJson['deploy']['approvals'][0]['signer'] = '01' + signer.slice(2);

      const builder2 = factory.from(JSON.stringify(txJson));
      const tx2 = (await builder2.build()) as Transaction;
      const keypair = new KeyPair({ prv: testData.ROOT_ACCOUNT.privateKey });
      should.throws(
        () => tx2.sign(keypair),
        (e) => e.message === testData.ERROR_ALREADY_SIGNED_WITH_INVALID_KEY,
      );
    });

    it('a transfer transaction with modified signer with extended key', async () => {
      const builder = initTransferTxBuilder();
      builder.sign({ key: testData.ROOT_ACCOUNT.xPrivateKey });
      const tx = (await builder.build()) as Transaction;

      const txJson = JSON.parse(tx.toBroadcastFormat());
      const signer = txJson['deploy']['approvals'][0]['signer'];
      txJson['deploy']['approvals'][0]['signer'] = '01' + signer.slice(2);

      const builder2 = factory.from(JSON.stringify(txJson));
      const tx2 = (await builder2.build()) as Transaction;
      const keypair = new KeyPair({ prv: testData.ROOT_ACCOUNT.privateKey });
      should.throws(
        () => tx2.sign(keypair),
        (e) => e.message === testData.ERROR_ALREADY_SIGNED_WITH_INVALID_KEY,
      );
    });

    it('a transaction with invalid session data', async () => {
      const builder = initTransferTxBuilder();
      builder.sign({ key: testData.ROOT_ACCOUNT.privateKey });
      const tx = (await builder.build()) as Transaction;

      const txJson = JSON.parse(tx.toBroadcastFormat());
      txJson['deploy']['session'] = { OtherType: '' };

      should.throws(
        () => {
          factory.from(JSON.stringify(txJson));
        },
        (e) => e.message.startsWith(testData.INVALID_TRANSACTION_ERROR),
      );
    });

    it('a transaction with invalid session data using extended key', async () => {
      const builder = initTransferTxBuilder();
      builder.sign({ key: testData.ROOT_ACCOUNT.xPrivateKey });
      const tx = (await builder.build()) as Transaction;

      const txJson = JSON.parse(tx.toBroadcastFormat());
      txJson['deploy']['session'] = { OtherType: '' };

      should.throws(
        () => {
          factory.from(JSON.stringify(txJson));
        },
        (e) => e.message.startsWith(testData.INVALID_TRANSACTION_ERROR),
      );
    });

    it('a transaction with empty raw transaction', async () => {
      should.throws(
        () => {
          factory.from('{}');
        },
        (e) => e.message.startsWith(testData.INVALID_TRANSACTION_ERROR),
      );
    });

    it('a transaction with undefined as raw transaction', async () => {
      should.throws(
        () => {
          factory.from(undefined as unknown as string);
        },
        (e) => e.message.startsWith(testData.INVALID_RAW_TRANSACTION_ERROR),
      );
    });

    it('a transaction with invalid contract', async () => {
      const builder = initTxWalletInitBuilder();
      builder.sign({ key: testData.ROOT_ACCOUNT.privateKey });
      const tx = (await builder.build()) as Transaction;

      const txJson = JSON.parse(tx.toBroadcastFormat());
      txJson['deploy']['session']['ModuleBytes']['module_bytes'] = testData.INVALID_WALLET_INIT_CONTRACT;

      should.throws(
        () => {
          factory.from(JSON.stringify(txJson));
        },
        (e) => e.message.startsWith(testData.INVALID_TRANSACTION_ERROR),
      );
    });

    it('a transaction with invalid contract using extended key', async () => {
      const builder = initTxWalletInitBuilder();
      builder.sign({ key: testData.ROOT_ACCOUNT.xPrivateKey });
      const tx = (await builder.build()) as Transaction;

      const txJson = JSON.parse(tx.toBroadcastFormat());
      txJson['deploy']['session']['ModuleBytes']['module_bytes'] = testData.INVALID_WALLET_INIT_CONTRACT;

      should.throws(
        () => {
          factory.from(JSON.stringify(txJson));
        },
        (e) => e.message.startsWith(testData.INVALID_TRANSACTION_ERROR),
      );
    });

    it('a transaction with invalid session data', async () => {
      const builder = initTxWalletInitBuilder();
      builder.sign({ key: testData.ROOT_ACCOUNT.privateKey });
      const tx = (await builder.build()) as Transaction;

      const txJson = JSON.parse(tx.toBroadcastFormat());
      txJson['deploy']['session'] = { OtherType: '' };

      should.throws(
        () => {
          factory.from(JSON.stringify(txJson));
        },
        (e) => e.message.startsWith(testData.INVALID_TRANSACTION_ERROR),
      );
    });

    it('a transaction with invalid session data using extended key', async () => {
      const builder = initTxWalletInitBuilder();
      builder.sign({ key: testData.ROOT_ACCOUNT.xPrivateKey });
      const tx = (await builder.build()) as Transaction;

      const txJson = JSON.parse(tx.toBroadcastFormat());
      txJson['deploy']['session'] = { OtherType: '' };

      should.throws(
        () => {
          factory.from(JSON.stringify(txJson));
        },
        (e) => e.message.startsWith(testData.INVALID_TRANSACTION_ERROR),
      );
    });
  });
});
