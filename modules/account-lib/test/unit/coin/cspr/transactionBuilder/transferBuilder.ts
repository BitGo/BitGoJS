import should from 'should';
import { register } from '../../../../../src/index';
import { TransactionBuilderFactory } from '../../../../../src/coin/cspr/';
import * as testData from '../../../../resources/cspr/cspr';
import { TransactionType } from '../../../../../src/coin/baseCoin';
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
  }

  describe('should build ', () => {
    describe('non serialized transactions', () => {
      it('a signed transfer transaction', async () => {

        const builder = initTxBuilder();
        builder.sign({ key: testData.ACCOUNT_1.privateKey });
        const tx = await builder.build();
        const txJson = JSON.parse(tx.toJson());

        should.exist((tx as Transaction).casperTx.approvals, "There are no approvals");
        should.deepEqual((tx as Transaction).casperTx.approvals.length, 1, "Error in the number of signatures");
        should.deepEqual((tx as Transaction).casperTx.approvals[0].signer, testData.SECP256K1_PREFIX + testData.ACCOUNT_1.publicKey, "Error in the signature");
        should.exist((tx as Transaction).casperTx.hash, "There is no hash");
        should.exist(txJson.from, "There is no from");
        should.deepEqual(txJson.from, testData.ACCOUNT_1.publicKey, "The recipient does not match");
        should.exist((tx as Transaction).casperTx.header.gasPrice, "There is no gasPrice");
        //TODO (STLX-793) : Check the following fields. To, Amount, gasLimit. 
      });

      it('a transfer transaction signed multiple times', async () => {
        const builder = initTxBuilderMultisig();
        builder.sign({ key: testData.OWNER_1.privateKey });
        builder.sign({ key: testData.OWNER_2.privateKey });
        const tx = await builder.build();
        const txJson = JSON.parse(tx.toJson());

        should.exist((tx as Transaction).casperTx.approvals, "There are no approvals");
        should.deepEqual((tx as Transaction).casperTx.approvals.length, 2, "Error in the number of signatures");
        should.deepEqual((tx as Transaction).casperTx.approvals[0].signer, testData.SECP256K1_PREFIX + testData.OWNER_1.publicKey, "Error in the signature");
        should.deepEqual((tx as Transaction).casperTx.approvals[1].signer, testData.SECP256K1_PREFIX + testData.OWNER_2.publicKey, "Error in the signature");
        should.exist((tx as Transaction).casperTx.hash, "There is no hash");
        should.exist(txJson.from, "There is no from");
        should.deepEqual(txJson.from, testData.OWNER_2.publicKey, "The recipient does not match");
        should.exist((tx as Transaction).casperTx.header.gasPrice, "There is no gasPrice");
        //TODO (STLX-793) : Check the following fields. To, Amount, gasLimit. 
      });

      it('a transfer transaction with amount 0', async () => {
        const builder = initTxBuilder();
        builder.amount('0');
        builder.sign({ key: testData.ACCOUNT_1.privateKey });
        const tx = await builder.build();
        const txJson = JSON.parse(tx.toJson());

        should.exist((tx as Transaction).casperTx.approvals, "There are no approvals");
        should.deepEqual((tx as Transaction).casperTx.approvals.length, 1, "Error in the number of signatures");
        should.deepEqual((tx as Transaction).casperTx.approvals[0].signer, testData.SECP256K1_PREFIX + testData.ACCOUNT_1.publicKey, "Error in the signature");
        should.exist((tx as Transaction).casperTx.hash, "There is no hash");
        should.exist(txJson.from, "There is no from");
        should.deepEqual(txJson.from, testData.ACCOUNT_1.publicKey, "The recipient does not match");
        should.exist((tx as Transaction).casperTx.header.gasPrice, "There is no gasPrice");
        //TODO (STLX-793) : Check the following fields. To, Amount, gasLimit. 
      });

      it('a non signed transfer transaction', async () => {
        const builder = initTxBuilder();
        const tx = await builder.build();
        const txJson = JSON.parse(tx.toJson());

        should.deepEqual((tx as Transaction).casperTx.approvals.length, 0, "Error in the number of signatures");
        should.exist((tx as Transaction).casperTx.hash), "There is no hash";
        should.exist(txJson.from, "There is no from");
        should.deepEqual(txJson.from, testData.ACCOUNT_1.publicKey, "The recipient does not match");
        should.exist((tx as Transaction).casperTx.header.gasPrice, "There is no gasPrice");
        //TODO (STLX-793) : Check the following fields. To, Amount, gasLimit. 
      });
    });

    describe('serialized transactions', () => {
      it('a non signed transfer transaction from serialized', async () => {
        // TODO
      });

      it('a signed transfer transaction from serilaized', async () => {
        // TODO
      });

      it('an offline multisig transfer transaction', async () => {
        // TODO
      });
    });
  });

  describe('should fail', () => {
    it('a transfer transaction with an invalid key', () => {
      // TODO
    });

    it('a transfer transaction with more signatures than allowed', () => {
      // TODO
    });

    it('a transfer transaction with repeated sign', () => {
      // TODO
    });

    it('a transfer transaction with an invalid destination address', () => {
      // TODO
    });

    it('a transfer transaction with an invalid amount: text value', () => {
      // TODO
    });

    it('a transfer transaction with an invalid amount: negative value', () => {
      // TODO
    });

    it('a transfer transaction without destination param', async () => {
      // TODO
    });

    it('a transfer transaction without amount', async () => {
      // TODO
    });
  });

});
