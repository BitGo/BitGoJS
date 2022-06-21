import assert from 'assert';
import should from 'should';
import { DeployUtil, CLOption, CLString, CLU512, CLU64, CLValueBuilder } from 'casper-js-sdk';
import BigNumber from 'bignumber.js';
import { KeyPair, TransactionBuilderFactory } from '../../../../src/lib';
import * as testData from '../../../fixtures/resources';
import { Transaction } from '../../../../src/lib/transaction';
import { DEFAULT_CHAIN_NAMES } from '../../../../src/lib/constants';
import { coins } from '@bitgo/statics';

describe('Casper Transfer Builder', () => {
  const factory = new TransactionBuilderFactory(coins.get('tcspr'));
  const factoryProd = new TransactionBuilderFactory(coins.get('cspr'));
  const owner1Address = new KeyPair({ pub: testData.ACCOUNT_1.publicKey }).getAddress();
  const owner2Address = new KeyPair({ pub: testData.ACCOUNT_2.publicKey }).getAddress();

  const initTxTransferBuilder = () => {
    const txBuilder = factory.getTransferBuilder();
    txBuilder.fee({ gasLimit: testData.FEE.gasLimit, gasPrice: testData.FEE.gasPrice });
    txBuilder.source({ address: owner1Address });
    txBuilder.to(owner2Address);
    txBuilder.transferId(255);
    return txBuilder;
  };

  describe('transfer builder environment', function () {
    it('should select the right chain name', function () {
      should.equal(factory.getTransferBuilder().coinName(), 'tcspr');
      should.equal(factoryProd.getTransferBuilder().coinName(), 'cspr');

      should.equal(factory.getTransferBuilder().chainName, DEFAULT_CHAIN_NAMES.testnet);
      should.equal(factoryProd.getTransferBuilder().chainName, DEFAULT_CHAIN_NAMES.mainnet);
    });
  });

  describe('should build ', () => {
    describe('non serialized transactions', () => {
      it('should build a transaction without transferId', async function () {
        const txBuilder = factory.getTransferBuilder();
        txBuilder.fee({ gasLimit: testData.FEE.gasLimit, gasPrice: testData.FEE.gasPrice });
        txBuilder.source({ address: owner1Address });
        txBuilder.to(owner2Address);
        txBuilder.amount(testData.MIN_MOTES_AMOUNT);
        txBuilder.sign({ key: testData.ACCOUNT_1.privateKey });
        const tx = (await txBuilder.build()) as Transaction;
        const txJson = tx.toJson();

        should.exist(tx.casperTx.approvals, 'There are no approvals');
        should.deepEqual(tx.casperTx.approvals.length, 1, 'Error in the number of signatures');
        should.deepEqual(tx.casperTx.approvals[0].signer, owner1Address, 'Error in the signature');
        should.exist(tx.casperTx.hash, 'There is no hash');
        should.exist(txJson.from, 'There is no from');
        should.deepEqual(txJson.from, owner1Address, 'The recipient does not match');
        should.exist(tx.casperTx.header.gasPrice, 'There is no gasPrice');
        should.equal(
          tx.casperTx.header.gasPrice.toString(),
          testData.FEE.gasPrice,
          'Gas price does not match expected'
        );
        should.exist(txJson.fee.gasLimit, 'Gas Limit is not defined');
        should.equal(txJson.fee.gasLimit, testData.FEE.gasLimit);
        should.equal(txJson.to, owner2Address, 'To address was not the expected one');
        should.equal(txJson.amount, testData.MIN_MOTES_AMOUNT, 'Amount was not as expected');
        should.equal(txJson.transferId, undefined);
      });

      it('should build a transaction to an address from an ed25519 key', async function () {
        const ed25519Address = '01513fa90c1a74c34a8958dd86055e9736edb1ead918bd4d4d750ca851946be7aa';
        const builder = initTxTransferBuilder().amount(testData.MIN_MOTES_AMOUNT);
        builder.to(ed25519Address);
        const tx = (await builder.build()) as Transaction;
        const txJson = tx.toJson();

        should.equal(txJson.to, ed25519Address);
      });

      it('should build a transaction with transferId of type string', async function () {
        const builder = initTxTransferBuilder().amount(testData.MIN_MOTES_AMOUNT).transferId('26794144639134510');
        const tx = (await builder.build()) as Transaction;
        const txJson = tx.toJson();

        should.equal(txJson.transferId, '26794144639134510');
      });

      it('should build a transaction with large numeric transfer id value', async function () {
        const builder = initTxTransferBuilder().amount(testData.MIN_MOTES_AMOUNT).transferId(26794144639134510);
        const tx = (await builder.build()) as Transaction;
        const txJson = tx.toJson();

        should.equal(txJson.transferId, '26794144639134510');
      });

      it('a signed transfer transaction', async () => {
        const builder = initTxTransferBuilder().amount(testData.MIN_MOTES_AMOUNT);
        builder.sign({ key: testData.ACCOUNT_1.privateKey });
        const tx = (await builder.build()) as Transaction;
        const txJson = tx.toJson();

        should.exist(tx.casperTx.approvals, 'There are no approvals');
        should.deepEqual(tx.casperTx.approvals.length, 1, 'Error in the number of signatures');
        should.deepEqual(tx.casperTx.approvals[0].signer, owner1Address, 'Error in the signature');
        should.exist(tx.casperTx.hash, 'There is no hash');
        should.exist(txJson.from, 'There is no from');
        should.deepEqual(txJson.from, owner1Address, 'The recipient does not match');
        should.exist(tx.casperTx.header.gasPrice, 'There is no gasPrice');
        should.equal(
          tx.casperTx.header.gasPrice.toString(),
          testData.FEE.gasPrice,
          'Gas price does not match expected'
        );
        should.exist(txJson.fee.gasLimit, 'Gas Limit is not defined');
        should.equal(txJson.fee.gasLimit, testData.FEE.gasLimit);

        should.equal(txJson.to, owner2Address, 'To address was not the expected one');
        should.equal(txJson.amount, testData.MIN_MOTES_AMOUNT, 'Amount was not as expected');
      });

      it('a signed transfer transaction using extended key', async () => {
        const builder = initTxTransferBuilder().amount(testData.MIN_MOTES_AMOUNT);
        builder.sign({ key: testData.ACCOUNT_1.xPrivateKey });
        const tx = (await builder.build()) as Transaction;
        const txJson = tx.toJson();

        should.exist(tx.casperTx.approvals, 'There are no approvals');
        should.deepEqual(tx.casperTx.approvals.length, 1, 'Error in the number of signatures');
        should.deepEqual(tx.casperTx.approvals[0].signer, owner1Address, 'Error in the signature');
        should.exist(tx.casperTx.hash, 'There is no hash');
        should.exist(txJson.from, 'There is no from');
        should.deepEqual(txJson.from, owner1Address, 'The recipient does not match');
        should.exist(tx.casperTx.header.gasPrice, 'There is no gasPrice');
        should.equal(
          tx.casperTx.header.gasPrice.toString(),
          testData.FEE.gasPrice,
          'Gas price does not match expected'
        );

        should.exist(txJson.fee.gasLimit, 'Gas Limit is not defined');
        should.equal(txJson.fee.gasLimit, testData.FEE.gasLimit);

        should.equal(txJson.to, owner2Address, 'To address was not the expected one');
        should.equal(txJson.amount, testData.MIN_MOTES_AMOUNT, 'Amount was not as expected');
      });

      it('a transfer transaction signed multiple times', async () => {
        const builder = initTxTransferBuilder().amount(testData.MIN_MOTES_AMOUNT);
        builder.sign({ key: testData.ACCOUNT_1.privateKey });
        builder.sign({ key: testData.ACCOUNT_2.privateKey });
        const tx = (await builder.build()) as Transaction;
        const txJson = tx.toJson();

        should.exist(tx.casperTx.approvals, 'There are no approvals');
        should.deepEqual(tx.casperTx.approvals.length, 2, 'Error in the number of signatures');
        should.deepEqual(tx.casperTx.approvals[0].signer, owner1Address, 'Error in the signature');
        should.deepEqual(tx.casperTx.approvals[1].signer, owner2Address, 'Error in the signature');
        should.exist(tx.casperTx.hash, 'There is no hash');
        should.exist(txJson.from, 'There is no from');
        should.deepEqual(txJson.from, owner1Address, 'The recipient does not match');

        should.exist(tx.casperTx.header.gasPrice, 'There is no gasPrice');
        should.equal(
          tx.casperTx.header.gasPrice.toString(),
          testData.FEE.gasPrice,
          'Gas price does not match expected'
        );

        should.exist(txJson.fee.gasLimit, 'Gas Limit is not defined');
        should.equal(txJson.fee.gasLimit, testData.FEE.gasLimit);

        should.equal(txJson.to, owner2Address, 'To address was not the expected one');
        should.equal(txJson.amount, testData.MIN_MOTES_AMOUNT, 'Amount does not match expected');
      });

      it('a transfer transaction signed multiple times using extended keys', async () => {
        const builder = initTxTransferBuilder().amount(testData.MIN_MOTES_AMOUNT);
        builder.sign({ key: testData.ACCOUNT_1.xPrivateKey });
        builder.sign({ key: testData.ACCOUNT_2.xPrivateKey });
        const tx = (await builder.build()) as Transaction;
        const txJson = tx.toJson();

        should.exist(tx.casperTx.approvals, 'There are no approvals');
        should.deepEqual(tx.casperTx.approvals.length, 2, 'Error in the number of signatures');
        should.deepEqual(tx.casperTx.approvals[0].signer, owner1Address, 'Error in the signature');
        should.deepEqual(tx.casperTx.approvals[1].signer, owner2Address, 'Error in the signature');
        should.exist(tx.casperTx.hash, 'There is no hash');
        should.exist(txJson.from, 'There is no from');
        should.deepEqual(txJson.from, owner1Address, 'The recipient does not match');

        should.exist(tx.casperTx.header.gasPrice, 'There is no gasPrice');
        should.equal(
          tx.casperTx.header.gasPrice.toString(),
          testData.FEE.gasPrice,
          'Gas price does not match expected'
        );

        should.exist(txJson.fee.gasLimit, 'Gas Limit is not defined');
        should.equal(txJson.fee.gasLimit, testData.FEE.gasLimit);

        should.equal(txJson.to, owner2Address, 'To address was not the expected one');
        should.equal(txJson.amount, testData.MIN_MOTES_AMOUNT, 'Amount does not match expected');
      });

      it('a transfer transaction signed multiple times using one extended key', async () => {
        const builder = initTxTransferBuilder().amount(testData.MIN_MOTES_AMOUNT);
        builder.sign({ key: testData.ACCOUNT_1.xPrivateKey });
        builder.sign({ key: testData.ACCOUNT_2.privateKey });
        const tx = (await builder.build()) as Transaction;
        const txJson = tx.toJson();

        should.exist(tx.casperTx.approvals, 'There are no approvals');
        should.deepEqual(tx.casperTx.approvals.length, 2, 'Error in the number of signatures');
        should.deepEqual(tx.casperTx.approvals[0].signer, owner1Address, 'Error in the signature');
        should.deepEqual(tx.casperTx.approvals[1].signer, owner2Address, 'Error in the signature');
        should.exist(tx.casperTx.hash, 'There is no hash');
        should.exist(txJson.from, 'There is no from');
        should.deepEqual(txJson.from, owner1Address, 'The recipient does not match');

        should.exist(tx.casperTx.header.gasPrice, 'There is no gasPrice');
        should.equal(
          tx.casperTx.header.gasPrice.toString(),
          testData.FEE.gasPrice,
          'Gas price does not match expected'
        );

        should.exist(txJson.fee.gasLimit, 'Gas Limit is not defined');
        should.equal(txJson.fee.gasLimit, testData.FEE.gasLimit);

        should.equal(txJson.to, owner2Address, 'To address was not the expected one');
        should.equal(txJson.amount, testData.MIN_MOTES_AMOUNT, 'Amount does not match expected');
      });

      it('a non signed transfer transaction', async () => {
        const builder = initTxTransferBuilder().amount(testData.MIN_MOTES_AMOUNT);
        const tx = (await builder.build()) as Transaction;
        const txJson = tx.toJson();

        should.deepEqual(tx.casperTx.approvals.length, 0, 'Error in the number of signatures');
        should.exist(tx.casperTx.hash, 'There is no hash');
        should.exist(txJson.from, 'There is no from');
        should.deepEqual(txJson.from, owner1Address, 'The recipient does not match');
        should.exist(tx.casperTx.header.gasPrice, 'There is no gasPrice');

        should.exist(tx.casperTx.header.gasPrice, 'There is no gasPrice');
        should.equal(
          tx.casperTx.header.gasPrice.toString(),
          testData.FEE.gasPrice,
          'Gas price does not match expected'
        );

        should.exist(txJson.fee.gasLimit, 'Gas Limit is not defined');
        should.equal(txJson.fee.gasLimit, testData.FEE.gasLimit);

        should.equal(txJson.to, owner2Address, 'To address was not the expected one');
        should.equal(txJson.amount, testData.MIN_MOTES_AMOUNT, 'Amount does not match expected');
      });
    });

    describe('should build from', () => {
      describe('serialized transactions', () => {
        it('a non signed transfer transaction from serialized', async () => {
          const builder = initTxTransferBuilder().amount(testData.MIN_MOTES_AMOUNT);
          const tx = (await builder.build()) as Transaction;
          const txJson = tx.toJson();
          const txId = tx.casperTx.session.getArgByName('id') as CLOption<CLU64>;
          should.equal((tx.casperTx.session.getArgByName('deploy_type') as CLString).value(), 'Send');
          should.equal((tx.casperTx.session.getArgByName('to_address') as CLString).value(), owner2Address);
          should.equal(txId.isSome(), true);
          should.equal(txId.value().unwrap().value().toNumber(), 255);
          should.equal(
            (tx.casperTx.session.getArgByName('amount') as CLU512).value().toString(),
            testData.MIN_MOTES_AMOUNT
          );

          const builder2 = factory.getTransferBuilder();
          builder2.from(tx.toBroadcastFormat());
          const tx2 = (await builder2.build()) as Transaction;
          const tx2Json = tx2.toJson();

          const txId2 = tx2.casperTx.session.getArgByName('id') as CLOption<CLU64>;
          should.equal((tx2.casperTx.session.getArgByName('deploy_type') as CLString).value(), 'Send');
          should.equal((tx2.casperTx.session.getArgByName('to_address') as CLString).value(), owner2Address);
          should.equal(txId2.isSome(), true);
          should.equal(txId2.value().unwrap().value().toNumber(), 255);
          should.equal(
            (tx2.casperTx.session.getArgByName('amount') as CLU512).value().toString(),
            testData.MIN_MOTES_AMOUNT
          );

          should.deepEqual(tx2Json, txJson, 'from implementation from factory should recreate original transaction');
        });

        it('a signed transfer transaction from serialized', async () => {
          const builder = initTxTransferBuilder().amount(testData.MIN_MOTES_AMOUNT);
          builder.sign({ key: testData.ROOT_ACCOUNT.privateKey });
          const tx = (await builder.build()) as Transaction;
          const txJson = tx.toJson();

          const txId = tx.casperTx.session.getArgByName('id') as CLOption<CLU64>;
          should.equal((tx.casperTx.session.getArgByName('deploy_type') as CLString).value(), 'Send');
          should.equal((tx.casperTx.session.getArgByName('to_address') as CLString).value(), owner2Address);
          should.equal(txId.isSome(), true);
          should.equal(txId.value().unwrap().value().toNumber(), 255);
          should.equal(
            (tx.casperTx.session.getArgByName('amount') as CLU512).value().toString(),
            testData.MIN_MOTES_AMOUNT
          );

          const builder2 = factory.getTransferBuilder();
          builder2.from(tx.toBroadcastFormat());
          const tx2 = (await builder2.build()) as Transaction;
          const tx2Json = tx2.toJson();

          const txId2 = tx2.casperTx.session.getArgByName('id') as CLOption<CLU64>;
          should.equal((tx2.casperTx.session.getArgByName('deploy_type') as CLString).value(), 'Send');
          should.equal((tx2.casperTx.session.getArgByName('to_address') as CLString).value(), owner2Address);
          should.equal(txId2.isSome(), true);
          should.equal(txId2.value().unwrap().value().toNumber(), 255);
          should.equal(
            (tx2.casperTx.session.getArgByName('amount') as CLU512).value().toString(),
            testData.MIN_MOTES_AMOUNT
          );

          should.deepEqual(tx2Json, txJson, 'from implementation from factory should recreate original transaction');
          should.deepEqual(
            tx2.casperTx.approvals,
            tx.casperTx.approvals,
            'from implementation from factory should get approvals correctly'
          );
        });

        it('a signed transfer transaction from serialized with extended key ', async () => {
          const builder = initTxTransferBuilder().amount(testData.MIN_MOTES_AMOUNT);
          builder.sign({ key: testData.ROOT_ACCOUNT.xPrivateKey });
          const tx = (await builder.build()) as Transaction;
          const txJson = tx.toJson();

          const txId = tx.casperTx.session.getArgByName('id') as CLOption<CLU64>;
          should.equal((tx.casperTx.session.getArgByName('deploy_type') as CLString).value(), 'Send');
          should.equal((tx.casperTx.session.getArgByName('to_address') as CLString).value(), owner2Address);
          should.equal(txId.isSome(), true);
          should.equal(txId.value().unwrap().value().toNumber(), 255);
          should.equal(
            (tx.casperTx.session.getArgByName('amount') as CLU512).value().toString(),
            testData.MIN_MOTES_AMOUNT
          );

          const builder2 = factory.getTransferBuilder();
          builder2.from(tx.toBroadcastFormat());
          const tx2 = (await builder2.build()) as Transaction;
          const tx2Json = tx2.toJson();

          const txId2 = tx2.casperTx.session.getArgByName('id') as CLOption<CLU64>;
          should.equal((tx2.casperTx.session.getArgByName('deploy_type') as CLString).value(), 'Send');
          should.equal((tx2.casperTx.session.getArgByName('to_address') as CLString).value(), owner2Address);
          should.equal(txId2.isSome(), true);
          should.equal(txId2.value().unwrap().value().toNumber(), 255);
          should.equal(
            (tx2.casperTx.session.getArgByName('amount') as CLU512).value().toString(),
            testData.MIN_MOTES_AMOUNT
          );

          should.deepEqual(tx2Json, txJson, 'from implementation from factory should recreate original transaction');
          should.deepEqual(
            tx2.casperTx.approvals,
            tx.casperTx.approvals,
            'from implementation from factory should get approvals correctly'
          );
        });

        it('an offline multisig transfer transaction', async () => {
          const builder = initTxTransferBuilder().amount(testData.MIN_MOTES_AMOUNT);
          builder.sign({ key: testData.ROOT_ACCOUNT.privateKey });
          builder.sign({ key: testData.ACCOUNT_1.privateKey });
          const tx = (await builder.build()) as Transaction;
          const txJson = tx.toJson();

          const txId = tx.casperTx.session.getArgByName('id') as CLOption<CLU64>;
          should.equal((tx.casperTx.session.getArgByName('deploy_type') as CLString).value(), 'Send');
          should.equal((tx.casperTx.session.getArgByName('to_address') as CLString).value(), owner2Address);
          should.equal(txId.isSome(), true);
          should.equal(txId.value().unwrap().value().toNumber(), 255);
          should.equal(
            (tx.casperTx.session.getArgByName('amount') as CLU512).value().toString(),
            testData.MIN_MOTES_AMOUNT
          );

          const builder2 = factory.getTransferBuilder();
          builder2.from(tx.toBroadcastFormat());
          const tx2 = (await builder2.build()) as Transaction;
          const tx2Json = tx2.toJson();

          const txId2 = tx2.casperTx.session.getArgByName('id') as CLOption<CLU64>;
          should.equal((tx2.casperTx.session.getArgByName('deploy_type') as CLString).value(), 'Send');
          should.equal((tx2.casperTx.session.getArgByName('to_address') as CLString).value(), owner2Address);
          should.equal(txId2.isSome(), true);
          should.equal(txId2.value().unwrap().value().toNumber(), 255);
          should.equal(
            (tx2.casperTx.session.getArgByName('amount') as CLU512).value().toString(),
            testData.MIN_MOTES_AMOUNT
          );

          should.deepEqual(tx2Json, txJson, 'from implementation from factory should recreate original transaction');
          should.deepEqual(
            tx2.casperTx.approvals,
            tx.casperTx.approvals,
            'from implementation from factory should get approvals correctly'
          );
        });

        it('an offline multisig transfer transaction with one extended key', async () => {
          const builder = initTxTransferBuilder().amount(testData.MIN_MOTES_AMOUNT);
          builder.sign({ key: testData.ROOT_ACCOUNT.xPrivateKey });
          builder.sign({ key: testData.ACCOUNT_1.privateKey });
          const tx = (await builder.build()) as Transaction;
          const txJson = tx.toJson();

          const txId = tx.casperTx.session.getArgByName('id') as CLOption<CLU64>;
          should.equal((tx.casperTx.session.getArgByName('deploy_type') as CLString).value(), 'Send');
          should.equal((tx.casperTx.session.getArgByName('to_address') as CLString).value(), owner2Address);
          should.equal(txId.isSome(), true);
          should.equal(txId.value().unwrap().value().toNumber(), 255);
          should.equal(
            (tx.casperTx.session.getArgByName('amount') as CLU512).value().toString(),
            testData.MIN_MOTES_AMOUNT
          );

          const builder2 = factory.getTransferBuilder();
          builder2.from(tx.toBroadcastFormat());
          const tx2 = (await builder2.build()) as Transaction;
          const tx2Json = tx2.toJson();

          const txId2 = tx2.casperTx.session.getArgByName('id') as CLOption<CLU64>;
          should.equal((tx2.casperTx.session.getArgByName('deploy_type') as CLString).value(), 'Send');
          should.equal((tx2.casperTx.session.getArgByName('to_address') as CLString).value(), owner2Address);
          should.equal(txId2.isSome(), true);
          should.equal(txId2.value().unwrap().value().toNumber(), 255);
          should.equal(
            (tx2.casperTx.session.getArgByName('amount') as CLU512).value().toString(),
            testData.MIN_MOTES_AMOUNT
          );

          should.deepEqual(tx2Json, txJson, 'from implementation from factory should recreate original transaction');
          should.deepEqual(
            tx2.casperTx.approvals,
            tx.casperTx.approvals,
            'from implementation from factory should get approvals correctly'
          );
        });

        it('an offline multisig transfer transaction with extended keys', async () => {
          const builder = initTxTransferBuilder().amount(testData.MIN_MOTES_AMOUNT);
          builder.sign({ key: testData.ROOT_ACCOUNT.xPrivateKey });
          builder.sign({ key: testData.ACCOUNT_1.xPrivateKey });
          const tx = (await builder.build()) as Transaction;
          const txJson = tx.toJson();

          const txId = tx.casperTx.session.getArgByName('id') as CLOption<CLU64>;
          should.equal((tx.casperTx.session.getArgByName('deploy_type') as CLString).value(), 'Send');
          should.equal((tx.casperTx.session.getArgByName('to_address') as CLString).value(), owner2Address);
          should.equal(txId.isSome(), true);
          should.equal(txId.value().unwrap().value().toNumber(), 255);
          should.equal(
            (tx.casperTx.session.getArgByName('amount') as CLU512).value().toString(),
            testData.MIN_MOTES_AMOUNT
          );

          const builder2 = factory.getTransferBuilder();
          builder2.from(tx.toBroadcastFormat());
          const tx2 = (await builder2.build()) as Transaction;
          const tx2Json = tx2.toJson();

          const txId2 = tx2.casperTx.session.getArgByName('id') as CLOption<CLU64>;
          should.equal((tx2.casperTx.session.getArgByName('deploy_type') as CLString).value(), 'Send');
          should.equal((tx2.casperTx.session.getArgByName('to_address') as CLString).value(), owner2Address);
          should.equal(txId2.isSome(), true);
          should.equal(txId2.value().unwrap().value().toNumber(), 255);
          should.equal(
            (tx2.casperTx.session.getArgByName('amount') as CLU512).value().toString(),
            testData.MIN_MOTES_AMOUNT
          );

          should.deepEqual(tx2Json, txJson, 'from implementation from factory should recreate original transaction');
          should.deepEqual(
            tx2.casperTx.approvals,
            tx.casperTx.approvals,
            'from implementation from factory should get approvals correctly'
          );
        });
      });
    });
  });

  describe('should fail rebuild from', () => {
    it('a serialized transaction with invalid destination address', async () => {
      const builder = initTxTransferBuilder().amount(testData.MIN_MOTES_AMOUNT);
      const tx = (await builder.build()) as Transaction;

      tx.casperTx = DeployUtil.addArgToDeploy(tx.casperTx, 'to_address', CLValueBuilder.byteArray(Uint8Array.from([])));

      const builder2 = factory.getTransferBuilder();
      assert.throws(() => {
        builder2.from(tx.toBroadcastFormat());
      }, new RegExp(testData.ERROR_INVALID_DESTINATION_ADDRESS_ON_FROM));
    });
  });

  describe('should fail', () => {
    it('a transfer transaction with an invalid source address', () => {
      assert.throws(() => {
        initTxTransferBuilder().source({ address: testData.INVALID_ADDRESS });
      }, new RegExp(testData.ERROR_INVALID_ADDRESS));
    });

    it('a transfer transaction with an invalid destination address', () => {
      assert.throws(() => {
        initTxTransferBuilder().to(testData.INVALID_ADDRESS);
      }, new RegExp(testData.ERROR_INVALID_ADDRESS));
    });

    it('a transfer transaction with repeated sign', async () => {
      const txBuilder = await initTxTransferBuilder().amount(testData.MIN_MOTES_AMOUNT);
      assert.throws(() => {
        txBuilder.sign({ key: testData.ACCOUNT_3.privateKey });
        txBuilder.sign({ key: testData.ACCOUNT_3.privateKey });
      }, new RegExp(testData.ERROR_REPEATED_SIGNATURE));
    });

    it('a transfer transaction with repeated sign using extended keys', async () => {
      const txBuilder = await initTxTransferBuilder().amount(testData.MIN_MOTES_AMOUNT);
      assert.throws(() => {
        txBuilder.sign({ key: testData.ACCOUNT_3.xPrivateKey });
        txBuilder.sign({ key: testData.ACCOUNT_3.xPrivateKey });
      }, new RegExp(testData.ERROR_REPEATED_SIGNATURE));
    });

    it('a transfer transaction with an invalid amount: text value', () => {
      assert.throws(() => {
        initTxTransferBuilder().amount('invalid_value');
      }, new RegExp(testData.ERROR_INVALID_AMOUNT));
    });

    it('a transfer transaction with an invalid amount: negative value', () => {
      assert.throws(() => {
        initTxTransferBuilder().amount('-1');
      }, new RegExp(testData.ERROR_INVALID_AMOUNT));
    });

    it('a transfer transaction with an invalid amount: zero', () => {
      assert.throws(() => {
        initTxTransferBuilder().amount('0');
      }, new RegExp(testData.ERROR_INVALID_AMOUNT));
    });

    it('a transfer transaction with an invalid amount: minAmount - 1', () => {
      const maxInvalidAmount = new BigNumber(testData.MIN_MOTES_AMOUNT).minus(1).toString();
      assert.throws(() => {
        initTxTransferBuilder().amount(maxInvalidAmount);
      }, new RegExp(testData.ERROR_INVALID_AMOUNT));
    });

    it('a transfer transaction without destination param', () => {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.fee(testData.FEE);
      txBuilder.source({ address: owner1Address });
      txBuilder.amount(testData.MIN_MOTES_AMOUNT);
      txBuilder.build().should.be.rejectedWith(testData.ERROR_MISSING_TRANSFER_TARGET);
    });

    it('a transfer transaction with invalid destination param', () => {
      const txBuilder = factory.getTransferBuilder();
      assert.throws(() => {
        txBuilder.to(testData.INVALID_ADDRESS);
      }, new RegExp(testData.ERROR_INVALID_ADDRESS));
    });

    it('a transfer transaction without amount', () => {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.fee(testData.FEE);
      txBuilder.source({ address: owner1Address });
      // txBuilder.to(owner2Address);
      txBuilder.to('01513fa90c1a74c34a8958dd86055e9736edb1ead918bd4d4d750ca851946be7aa');
      txBuilder.build().should.be.rejectedWith(testData.ERROR_MISSING_TRANSFER_AMOUNT);
    });

    it('a transfer transaction with invalid amount', async () => {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.fee(testData.FEE);
      txBuilder.source({ address: owner1Address });
      txBuilder.to(owner2Address);
      assert.throws(() => {
        txBuilder.amount('');
      }, new RegExp(testData.ERROR_INVALID_AMOUNT));
    });

    it('a transfer transaction with invalid transfer id', () => {
      const txBuilder = factory.getTransferBuilder();
      assert.throws(() => {
        txBuilder.transferId(-1);
      }, new RegExp(testData.ERROR_INVALID_TRANSFER_ID));
    });

    it('a transfer transaction with more than 3 signatures', () => {
      const builder = initTxTransferBuilder().amount(testData.MIN_MOTES_AMOUNT);
      builder.sign({ key: testData.ROOT_ACCOUNT.privateKey });
      builder.sign({ key: testData.ACCOUNT_1.privateKey });
      builder.sign({ key: testData.ACCOUNT_2.privateKey });
      assert.throws(() => {
        builder.sign({ key: testData.ACCOUNT_2.privateKey });
      }, new RegExp(testData.ERROR_MAX_AMOUNT_OF_SIGNERS_REACHED));
    });

    it('a transfer transaction with more than 3 signatures with extended keys', () => {
      const builder = initTxTransferBuilder().amount(testData.MIN_MOTES_AMOUNT);
      builder.sign({ key: testData.ROOT_ACCOUNT.xPrivateKey });
      builder.sign({ key: testData.ACCOUNT_1.xPrivateKey });
      builder.sign({ key: testData.ACCOUNT_2.xPrivateKey });
      assert.throws(() => {
        builder.sign({ key: testData.ACCOUNT_2.xPrivateKey });
      }, new RegExp(testData.ERROR_MAX_AMOUNT_OF_SIGNERS_REACHED));
    });
  });

  describe('txJson validation', () => {
    it('contains all required fields for Transfer', async () => {
      const txBuilder = initTxTransferBuilder();
      txBuilder.amount(testData.MIN_MOTES_AMOUNT);
      txBuilder.sign({ key: testData.ACCOUNT_1.privateKey });

      const tx = (await txBuilder.build()) as Transaction;
      const txJson = tx.toJson();
      should.deepEqual(txJson.fee, testData.FEE);
      should.equal(txJson.deployType, 'Send');
      should.equal(txJson.from, owner1Address);
      should.equal(txJson.hash, Buffer.from(tx.casperTx.hash).toString('hex'));

      should.equal(txJson.amount, testData.MIN_MOTES_AMOUNT);
      should.equal(txJson.to, owner2Address);
      should.equal(txJson.transferId, 255);
    });

    it('contains all required fields for Transfer signed with extended key', async () => {
      const txBuilder = initTxTransferBuilder();
      txBuilder.amount(testData.MIN_MOTES_AMOUNT);
      txBuilder.sign({ key: testData.ACCOUNT_1.xPrivateKey });

      const tx = (await txBuilder.build()) as Transaction;
      const txJson = tx.toJson();
      should.deepEqual(txJson.fee, testData.FEE);
      should.equal(txJson.deployType, 'Send');
      should.equal(txJson.from, owner1Address);
      should.equal(txJson.hash, Buffer.from(tx.casperTx.hash).toString('hex'));

      should.equal(txJson.amount, testData.MIN_MOTES_AMOUNT);
      should.equal(txJson.to, owner2Address);
      should.equal(txJson.transferId, 255);
    });
  });
});
