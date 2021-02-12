import should from 'should';
import { CLTypeHelper, CLValue, DeployUtil } from 'casper-client-sdk';
import { register } from '../../../../../src/index';
import { TransactionBuilderFactory } from '../../../../../src/coin/cspr/';
import * as testData from '../../../../resources/cspr/cspr';
import { Transaction } from '../../../../../src/coin/cspr/transaction';

describe('Casper Transfer Builder', () => {
  const factory = register('tcspr', TransactionBuilderFactory);

  const initTxTransferBuilder = () => {
    const txBuilder = factory.getTransferBuilder();
    txBuilder.fee({ gasLimit: testData.FEE.gasLimit, gasPrice: testData.FEE.gasPrice });
    txBuilder.source({ address: testData.ACCOUNT_1.publicKey });
    txBuilder.to(testData.ACCOUNT_2.publicKey);
    txBuilder.transferId(255);
    return txBuilder;
  };

  describe('should build ', () => {
    describe('non serialized transactions', () => {
      it('a signed transfer transaction', async () => {
        const builder = initTxTransferBuilder().amount('10');
        builder.sign({ key: testData.ACCOUNT_1.privateKey });
        const tx = (await builder.build()) as Transaction;
        const txJson = tx.toJson();

        should.exist(tx.casperTx.approvals, 'There are no approvals');
        should.deepEqual(tx.casperTx.approvals.length, 1, 'Error in the number of signatures');
        should.deepEqual(
          tx.casperTx.approvals[0].signer.toUpperCase(),
          testData.SECP256K1_PREFIX + testData.ACCOUNT_1.publicKey,
          'Error in the signature',
        );
        should.exist(tx.casperTx.hash, 'There is no hash');
        should.exist(txJson.from, 'There is no from');
        should.deepEqual(txJson.from.toUpperCase(), testData.ACCOUNT_1.publicKey, 'The recipient does not match');
        should.exist(tx.casperTx.header.gasPrice, 'There is no gasPrice');
        should.equal(
          tx.casperTx.header.gasPrice.toString(),
          testData.FEE.gasPrice,
          'Gas price does not match expected',
        );

        should.exist(txJson.fee.gasLimit, 'Gas Limit is not defined');
        should.equal(txJson.fee.gasLimit, testData.FEE.gasLimit);

        should.equal(txJson.to!.toUpperCase(), testData.ACCOUNT_2.accountHash, 'To address was not the expected one');
        should.equal(txJson.amount, '10', 'Amount was not as expected');
      });

      it('a transfer transaction signed multiple times', async () => {
        const builder = initTxTransferBuilder().amount('10');
        builder.sign({ key: testData.ACCOUNT_1.privateKey });
        builder.sign({ key: testData.ACCOUNT_2.privateKey });
        const tx = (await builder.build()) as Transaction;
        const txJson = tx.toJson();

        should.exist(tx.casperTx.approvals, 'There are no approvals');
        should.deepEqual(tx.casperTx.approvals.length, 2, 'Error in the number of signatures');
        should.deepEqual(
          tx.casperTx.approvals[0].signer.toUpperCase(),
          testData.SECP256K1_PREFIX + testData.ACCOUNT_1.publicKey,
          'Error in the signature',
        );
        should.deepEqual(
          tx.casperTx.approvals[1].signer.toUpperCase(),
          testData.SECP256K1_PREFIX + testData.ACCOUNT_2.publicKey,
          'Error in the signature',
        );
        should.exist(tx.casperTx.hash, 'There is no hash');
        should.exist(txJson.from, 'There is no from');
        should.deepEqual(txJson.from.toUpperCase(), testData.ACCOUNT_1.publicKey, 'The recipient does not match');

        should.exist(tx.casperTx.header.gasPrice, 'There is no gasPrice');
        should.equal(
          tx.casperTx.header.gasPrice.toString(),
          testData.FEE.gasPrice,
          'Gas price does not match expected',
        );

        should.exist(txJson.fee.gasLimit, 'Gas Limit is not defined');
        should.equal(txJson.fee.gasLimit, testData.FEE.gasLimit);

        should.equal(txJson.to!.toUpperCase(), testData.ACCOUNT_2.accountHash, 'To address was not the expected one');
        should.equal(txJson.amount, '10', 'Amount does not match expected');
      });

      it('a transfer transaction with amount 0', async () => {
        const builder = initTxTransferBuilder();
        builder.amount('0');
        builder.sign({ key: testData.ACCOUNT_1.privateKey });
        const tx = (await builder.build()) as Transaction;
        const txJson = tx.toJson();

        should.exist(tx.casperTx.approvals, 'There are no approvals');
        should.deepEqual(tx.casperTx.approvals.length, 1, 'Error in the number of signatures');
        should.deepEqual(
          tx.casperTx.approvals[0].signer.toUpperCase(),
          testData.SECP256K1_PREFIX + testData.ACCOUNT_1.publicKey,
          'Error in the signature',
        );
        should.exist(tx.casperTx.hash, 'There is no hash');
        should.exist(txJson.from, 'There is no from');
        should.deepEqual(txJson.from.toUpperCase(), testData.ACCOUNT_1.publicKey, 'The recipient does not match');
        should.exist(tx.casperTx.header.gasPrice, 'There is no gasPrice');

        should.exist(tx.casperTx.header.gasPrice, 'There is no gasPrice');
        should.equal(
          tx.casperTx.header.gasPrice.toString(),
          testData.FEE.gasPrice,
          'Gas price does not match expected',
        );

        should.exist(txJson.fee.gasLimit, 'Gas Limit is not defined');
        should.equal(txJson.fee.gasLimit, testData.FEE.gasLimit);

        should.equal(txJson.to!.toUpperCase(), testData.ACCOUNT_2.accountHash, 'To address was not the expected one');
        should.equal(txJson.amount, '0', 'Amount does not match expected');
      });

      it('a non signed transfer transaction', async () => {
        const builder = initTxTransferBuilder().amount('10');
        const tx = (await builder.build()) as Transaction;
        const txJson = tx.toJson();

        should.deepEqual(tx.casperTx.approvals.length, 0, 'Error in the number of signatures');
        should.exist(tx.casperTx.hash), 'There is no hash';
        should.exist(txJson.from, 'There is no from');
        should.deepEqual(txJson.from.toUpperCase(), testData.ACCOUNT_1.publicKey, 'The recipient does not match');
        should.exist(tx.casperTx.header.gasPrice, 'There is no gasPrice');

        should.exist(tx.casperTx.header.gasPrice, 'There is no gasPrice');
        should.equal(
          tx.casperTx.header.gasPrice.toString(),
          testData.FEE.gasPrice,
          'Gas price does not match expected',
        );

        should.exist(txJson.fee.gasLimit, 'Gas Limit is not defined');
        should.equal(txJson.fee.gasLimit, testData.FEE.gasLimit);

        should.equal(txJson.to!.toUpperCase(), testData.ACCOUNT_2.accountHash, 'To address was not the expected one');
        should.equal(txJson.amount, '10', 'Amount does not match expected');
      });
    });

    describe('should build from', () => {
      describe('serialized transactions', () => {
        it('a non signed transfer transaction from serialized', async () => {
          const builder = initTxTransferBuilder().amount('10');
          const tx = (await builder.build()) as Transaction;
          const txJson = tx.toJson();

          const builder2 = factory.getTransferBuilder();
          builder2.from(tx.toBroadcastFormat());
          const tx2 = (await builder2.build()) as Transaction;
          const tx2Json = tx2.toJson();

          should.deepEqual(tx2Json, txJson, 'from implementation from factory should recreate original transaction');
        });

        it('a signed transfer transaction from serialized', async () => {
          const builder = initTxTransferBuilder().amount('10');
          builder.sign({ key: testData.ROOT_ACCOUNT.privateKey });
          const tx = (await builder.build()) as Transaction;
          const txJson = tx.toJson();

          const builder2 = factory.getTransferBuilder();
          builder2.from(tx.toBroadcastFormat());
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
          const builder = initTxTransferBuilder().amount('10');
          builder.sign({ key: testData.ROOT_ACCOUNT.privateKey });
          builder.sign({ key: testData.ACCOUNT_1.privateKey });
          const tx = (await builder.build()) as Transaction;
          const txJson = tx.toJson();

          const builder2 = factory.getTransferBuilder();
          builder2.from(tx.toBroadcastFormat());
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
    });
  });

  describe('should fail rebuild from', () => {
    it('a serialized transaction with invalid destination address', async () => {
      const builder = initTxTransferBuilder().amount('10');
      const tx = (await builder.build()) as Transaction;

      tx.casperTx = DeployUtil.addArgToDeploy(tx.casperTx, 'to_address', CLValue.byteArray(Uint8Array.from([])));

      const builder2 = factory.getTransferBuilder();
      should.throws(
        () => {
          builder2.from(tx.toBroadcastFormat());
        },
        e => e.message === testData.ERROR_INVALID_DESTINATION_ADDRESS_ON_FROM,
      );
    });

    it('a serialized transaction with invalid transfer id type', async () => {
      const builder = initTxTransferBuilder().amount('10');
      const tx = (await builder.build()) as Transaction;

      tx.casperTx = DeployUtil.addArgToDeploy(tx.casperTx, 'id', CLValue.byteArray(Uint8Array.from([])));

      const builder2 = factory.getTransferBuilder();
      should.throws(
        () => {
          builder2.from(tx.toBroadcastFormat());
        },
        e => e.message === testData.ERROR_INVALID_TRANSFER_ID_ON_FROM,
      );
    });

    it('a serialized transaction with empty transfer id value', async () => {
      const builder = initTxTransferBuilder().amount('10');
      const tx = (await builder.build()) as Transaction;

      tx.casperTx = DeployUtil.addArgToDeploy(tx.casperTx, 'id', CLValue.option(null, CLTypeHelper.u64()));

      const builder2 = factory.getTransferBuilder();
      should.throws(
        () => {
          builder2.from(tx.toBroadcastFormat());
        },
        e => e.message === testData.ERROR_INVALID_TRANSFER_ID_ON_FROM,
      );
    });
  });

  describe('should fail', () => {
    it('a transfer transaction with an invalid source address', () => {
      should.throws(
        () => {
          initTxTransferBuilder().source({ address: testData.INVALID_ADDRESS });
        },
        e => e.message.startsWith(testData.ERROR_INVALID_ADDRESS),
      );
    });

    it('a transfer transaction with an invalid destination address', () => {
      should.throws(
        () => {
          initTxTransferBuilder().to(testData.INVALID_ADDRESS);
        },
        e => e.message === testData.ERROR_INVALID_ADDRESS,
      );
    });

    it('a transfer transaction with more signatures than allowed', () => {
      // TODO: This must be done after wallet initialization is finished
    });

    it('a transfer transaction with repeated sign', async () => {
      const txBuilder = await initTxTransferBuilder().amount('10');
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
          initTxTransferBuilder().amount('invalid_value');
        },
        e => e.message === testData.ERROR_INVALID_AMOUNT,
      );
    });

    it('a transfer transaction with an invalid amount: negative value', () => {
      should.throws(
        () => {
          initTxTransferBuilder().amount('-1');
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

    it('a transfer transaction with invalid destination param', () => {
      const txBuilder = factory.getTransferBuilder();
      should.throws(
        () => {
          txBuilder.to(testData.INVALID_ADDRESS);
        },
        e => e.message === testData.ERROR_INVALID_ADDRESS,
      );
    });

    it('a transfer transaction without amount', () => {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.fee(testData.FEE);
      txBuilder.source({ address: testData.ACCOUNT_1.publicKey });
      txBuilder.to(testData.ACCOUNT_2.publicKey);
      txBuilder.build().should.be.rejectedWith(testData.ERROR_MISSING_TRANSFER_AMOUNT);
    });

    it('a transfer transaction with invalid amount', async () => {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.fee(testData.FEE);
      txBuilder.source({ address: testData.ACCOUNT_1.publicKey });
      txBuilder.to(testData.ACCOUNT_2.publicKey);
      should.throws(
        () => {
          txBuilder.amount('');
        },
        e => e.message === testData.ERROR_INVALID_AMOUNT,
      );
    });

    it('a transfer transaction with invalid transfer id', () => {
      const txBuilder = factory.getTransferBuilder();
      should.throws(
        () => {
          txBuilder.transferId(-1);
        },
        e => e.message === testData.ERROR_INVALID_TRANSFER_ID,
      );
    });

    it('a transfer transaction with more than 3 signatures', () => {
      const builder = initTxTransferBuilder().amount('10');
      builder.sign({ key: testData.ROOT_ACCOUNT.privateKey });
      builder.sign({ key: testData.ACCOUNT_1.privateKey });
      builder.sign({ key: testData.ACCOUNT_2.privateKey });
      should.throws(
        () => {
          builder.sign({ key: testData.ACCOUNT_2.privateKey });
        },
        e => e.message === testData.ERROR_MAX_AMOUNT_OF_SIGNERS_REACHED,
      );
    });
  });
});
