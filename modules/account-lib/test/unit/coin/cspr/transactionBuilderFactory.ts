import should from 'should';
import { register } from '../../../../src/index';
import { KeyPair, TransactionBuilderFactory } from '../../../../src/coin/cspr/';
import * as testData from '../../../resources/cspr/cspr';
import { Transaction } from '../../../../src/coin/cspr/transaction';

const factory = register('tcspr', TransactionBuilderFactory);

const initTxWalletInitBuilder = () => {
  const txBuilder = factory.getWalletInitializationBuilder();
  txBuilder.fee({ gasLimit: testData.FEE.gasLimit, gasPrice: testData.FEE.gasPrice });
  txBuilder.source({ address: testData.ROOT_ACCOUNT.publicKey });
  txBuilder.owner(testData.ACCOUNT_1.publicKey);
  txBuilder.owner(testData.ACCOUNT_2.publicKey);
  txBuilder.owner(testData.ACCOUNT_3.publicKey);
  return txBuilder;
};

describe('should build ', () => {
  describe('serialized transactions', () => {
    it('a non signed transfer transaction from serialized', async () => {
      const builder = initTxWalletInitBuilder();
      const tx = (await builder.build()) as Transaction;
      const txJson = tx.toJson();

      const builder2 = factory.from(tx.toBroadcastFormat());
      const tx2 = (await builder2.build()) as Transaction;
      const tx2Json = tx2.toJson();

      should.deepEqual(tx2Json, txJson, 'from implementation from factory should recreate original transaction');
    });

    it('a signed transfer transaction from serialized', async () => {
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

    it('an offline multisig transfer transaction', async () => {
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
  });
  describe('should reject signing ', () => {
    const factory = register('tcspr', TransactionBuilderFactory);
    it('a transaction with modified signer', async () => {
      const builder = initTxWalletInitBuilder();
      builder.sign({ key: testData.ROOT_ACCOUNT.privateKey });
      const tx = (await builder.build()) as Transaction;

      const txJson = JSON.parse(tx.toBroadcastFormat());
      const signer = txJson['deploy']['approvals'][0]['signer'];
      txJson['deploy']['approvals'][0]['signer'] = '01' + signer.slice(2);

      const builder2 = factory.from(JSON.stringify(txJson));
      const tx2 = (await builder2.build()) as Transaction;
      await tx2.sign(new KeyPair({ prv: testData.ROOT_ACCOUNT.privateKey })).should.be.rejected();
    });

    it('a transaction with empty raw transaction', async () => {
      should.throws(
        () => {
          factory.from('{}');
        },
        e => e.message.startsWith(testData.INVALID_TRANSACTION_ERROR),
      );
    });

    it('a transaction with undefined as raw transaction', async () => {
      should.throws(
        () => {
          factory.from((undefined as unknown) as string);
        },
        e => e.message.startsWith(testData.INVALID_RAW_TRANSACTION_ERROR),
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
        e => e.message.startsWith(testData.INVALID_TRANSACTION_ERROR),
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
        e => e.message.startsWith(testData.INVALID_TRANSACTION_ERROR),
      );
    });
  });
});
