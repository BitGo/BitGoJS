import should from 'should';
import { register } from '../../../../../src/index';
import { TransactionBuilderFactory } from '../../../../../src/coin/cspr/';
import * as testData from '../../../../resources/cspr/cspr';
import { Transaction } from '../../../../../src/coin/cspr/transaction';

describe('Casper Transfer Builder', () => {
  const factory = register('tcspr', TransactionBuilderFactory);

  const initTxBuilder = () => {
    const txBuilder = factory.getTransferBuilder();
    txBuilder.fee({ gasLimit: testData.FEE.gasLimit, gasPrice: testData.FEE.gasPrice });
    txBuilder.source({ address: testData.ACCOUNT_1.publicKey });
    txBuilder.to(testData.ACCOUNT_2.publicKey);
    txBuilder.amount('10');
    return txBuilder;
  };

  const initTxBuilderMultisig = () => {
    const txBuilder = factory.getTransferBuilder();
    txBuilder.fee({ gasLimit: testData.FEE.gasLimit, gasPrice: testData.FEE.gasPrice });
    txBuilder.source({ address: testData.OWNER_2.publicKey });
    txBuilder.to(testData.ACCOUNT_2.publicKey);
    txBuilder.amount('10');
    return txBuilder;
  };

  describe('should build ', () => {
    describe('non serialized transactions', () => {
      it('a signed transfer transaction', async () => {
        const builder = initTxBuilder();
        builder.sign({ key: testData.ACCOUNT_1.privateKey });
        const tx = await builder.build();
        const txJson = tx.toJson();

        should.exist((tx as Transaction).casperTx.approvals, 'There are no approvals');
        should.deepEqual((tx as Transaction).casperTx.approvals.length, 1, 'Error in the number of signatures');
        should.deepEqual(
          (tx as Transaction).casperTx.approvals[0].signer.toUpperCase(),
          testData.SECP256K1_PREFIX + testData.ACCOUNT_1.publicKey,
          'Error in the signature',
        );
        should.exist((tx as Transaction).casperTx.hash, 'There is no hash');
        should.exist(txJson.from, 'There is no from');
        should.deepEqual(txJson.from.toUpperCase(), testData.ACCOUNT_1.publicKey, 'The recipient does not match');
        should.exist((tx as Transaction).casperTx.header.gasPrice, 'There is no gasPrice');
        // TODO (STLX-793) : Check the following fields. To, Amount, gasLimit.
      });

      it('a transfer transaction signed multiple times', async () => {
        const builder = initTxBuilderMultisig();
        builder.sign({ key: testData.OWNER_1.privateKey });
        builder.sign({ key: testData.OWNER_2.privateKey });
        const tx = await builder.build();
        const txJson = tx.toJson();

        should.exist((tx as Transaction).casperTx.approvals, 'There are no approvals');
        should.deepEqual((tx as Transaction).casperTx.approvals.length, 2, 'Error in the number of signatures');
        should.deepEqual(
          (tx as Transaction).casperTx.approvals[0].signer,
          testData.SECP256K1_PREFIX + testData.OWNER_1.publicKey,
          'Error in the signature',
        );
        should.deepEqual(
          (tx as Transaction).casperTx.approvals[1].signer,
          testData.SECP256K1_PREFIX + testData.OWNER_2.publicKey,
          'Error in the signature',
        );
        should.exist((tx as Transaction).casperTx.hash, 'There is no hash');
        should.exist(txJson.from, 'There is no from');
        should.deepEqual(txJson.from, testData.OWNER_2.publicKey, 'The recipient does not match');
        should.exist((tx as Transaction).casperTx.header.gasPrice, 'There is no gasPrice');
        // TODO (STLX-793) : Check the following fields. To, Amount, gasLimit.
      });

      it('a transfer transaction with amount 0', async () => {
        const builder = initTxBuilder();
        builder.amount('0');
        builder.sign({ key: testData.ACCOUNT_1.privateKey });
        const tx = await builder.build();
        const txJson = tx.toJson();

        should.exist((tx as Transaction).casperTx.approvals, 'There are no approvals');
        should.deepEqual((tx as Transaction).casperTx.approvals.length, 1, 'Error in the number of signatures');
        should.deepEqual(
          (tx as Transaction).casperTx.approvals[0].signer.toUpperCase(),
          testData.SECP256K1_PREFIX + testData.ACCOUNT_1.publicKey,
          'Error in the signature',
        );
        should.exist((tx as Transaction).casperTx.hash, 'There is no hash');
        should.exist(txJson.from, 'There is no from');
        should.deepEqual(txJson.from.toUpperCase(), testData.ACCOUNT_1.publicKey, 'The recipient does not match');
        should.exist((tx as Transaction).casperTx.header.gasPrice, 'There is no gasPrice');
        // TODO (STLX-793) : Check the following fields. To, Amount, gasLimit.
      });

      it('a non signed transfer transaction', async () => {
        const builder = initTxBuilder();
        const tx = await builder.build();
        const txJson = tx.toJson();

        should.deepEqual((tx as Transaction).casperTx.approvals.length, 0, 'Error in the number of signatures');
        should.exist((tx as Transaction).casperTx.hash), 'There is no hash';
        should.exist(txJson.from, 'There is no from');
        should.deepEqual(txJson.from.toUpperCase(), testData.ACCOUNT_1.publicKey, 'The recipient does not match');
        should.exist((tx as Transaction).casperTx.header.gasPrice, 'There is no gasPrice');
        // TODO (STLX-793) : Check the following fields. To, Amount, gasLimit.
      });
    });

    describe('serialized transactions', () => {
      it('a non signed transfer transaction from serialized', async () => {
        // TODO(STLX-793): this will be done when fromImplementation is implemented
      });

      it('a signed transfer transaction from serilaized', async () => {
        // TODO(STLX-793): this will be done when fromImplementation is implemented
      });

      it('an offline multisig transfer transaction', async () => {
        // TODO(STLX-793): this will be done when fromImplementation is implemented
      });
    });
  });

  describe('should fail', () => {
    it('a transfer transaction with an invalid source address', () => {
      should.throws(
        () => {
          initTxBuilder().source({ address: testData.INVALID_ADDRESS });
        },
        e => e.message.startsWith(testData.ERROR_INVALID_ADDRESS),
      );
    });

    it('a transfer transaction with an invalid destination address', () => {
      should.throws(
        () => {
          initTxBuilder().to(testData.INVALID_ADDRESS);
        },
        e => e.message === testData.ERROR_INVALID_ADDRESS,
      );
    });

    it('a transfer transaction with more signatures than allowed', () => {
      // TODO: This must be done after wallet initialization is finished
    });

    it('a transfer transaction with repeated sign', async () => {
      const txBuilder = await initTxBuilder().amount('10');
      should.throws(
        () => {
          txBuilder.sign({ key: testData.ACCOUNT_3.privateKey });
          txBuilder.sign({ key: testData.ACCOUNT_3.privateKey });
        },
        e => e.message.startsWith(testData.ERROR_REPEATED_SIGNATURE),
      );
    });

    it('a transfer transaction with an invalid amount: text value', () => {
      should.throws(
        () => {
          initTxBuilder().amount('invalid_value');
        },
        e => e.message === testData.ERROR_INVALID_AMOUNT,
      );
    });

    it('a transfer transaction with an invalid amount: negative value', () => {
      should.throws(
        () => {
          initTxBuilder().amount('-1');
        },
        e => e.message === testData.ERROR_INVALID_AMOUNT,
      );
    });

    it('a transfer transaction without destination param', () => {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.fee(testData.FEE);
      txBuilder.source({ address: testData.ACCOUNT_1.publicKey });
      txBuilder.amount('10');
      txBuilder.build().should.be.rejectedWith(testData.ERROR_MISSING_TRANSFER_TARGET);
    });

    it('a transfer transaction without amount', () => {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.fee(testData.FEE);
      txBuilder.source({ address: testData.ACCOUNT_1.publicKey });
      txBuilder.to(testData.ACCOUNT_2.publicKey);
      txBuilder.build().should.be.rejectedWith(testData.ERROR_INVALID_AMOUNT);
    });
  });
});
