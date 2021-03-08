import * as _ from 'lodash';
import * as should from 'should';
import * as testData from '../../../../resources/cspr/cspr';
import { register } from '../../../../../src';
import { KeyPair, TransactionBuilderFactory } from '../../../../../src/coin/cspr/';
import { Transaction } from "../../../../../src/coin/cspr/transaction";
import { removeAlgoPrefixFromHexValue } from '../../../../../src/coin/cspr/utils';

describe('Casper Transaction Builder', () => {
  const factory = register('tcspr', TransactionBuilderFactory);

  const initTransferBuilder = () => {
    const txBuilder = factory.getTransferBuilder();
    txBuilder.fee({ gasLimit: testData.FEE.gasLimit, gasPrice: testData.FEE.gasPrice });
    txBuilder.source({ address: testData.ACCOUNT_1.publicKey });
    txBuilder.to(testData.ACCOUNT_2.publicKey);
    txBuilder.amount('10');
    return txBuilder;
  };

  const initWalletBuilder = () => {
    const txBuilder = factory.getWalletInitializationBuilder();
    txBuilder.fee(testData.FEE);
    txBuilder.owner(testData.ACCOUNT_1.publicKey);
    txBuilder.owner(testData.ACCOUNT_2.publicKey);
    txBuilder.owner(testData.ACCOUNT_3.publicKey);
    txBuilder.source({ address: testData.ROOT_ACCOUNT.publicKey });
    return txBuilder;
  };

  describe('should validate', () => {
    it('an empty raw transaction', () => {
      const txBuilder = factory.getTransferBuilder();
      should.throws(
        () => {
          txBuilder.validateRawTransaction('');
        },
        e => e.message === testData.ERROR_EMPTY_RAW_TRANSACTION,
      );
    });

    it('an invalid raw transfer transaction', () => {
      const txBuilder = factory.getTransferBuilder();
      should.throws(
        () => {
          txBuilder.validateRawTransaction(testData.INVALID_RAW_TRANSACTION);
        },
        e => e.message === testData.ERROR_JSON_PARSING,
      );
    });

    it('an invalid raw wallet init transaction', () => {
      const txBuilder = factory.getWalletInitializationBuilder();
      should.throws(
        () => {
          txBuilder.validateRawTransaction(testData.INVALID_RAW_TRANSACTION);
        },
        e => e.message === testData.ERROR_JSON_PARSING,
      );
    });

    it('a valid raw transfer transaction', async () => {
      const builder = initTransferBuilder();
      builder.sign({ key: testData.ACCOUNT_1.privateKey });
      builder.sign({ key: testData.ACCOUNT_2.privateKey });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.doesNotThrow(() => {
        builder.validateRawTransaction(JSON.stringify(txJson));
      });
    });

    it('a valid raw wallet init transaction', async () => {
      const builder = initWalletBuilder();
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.doesNotThrow(() => {
        builder.validateRawTransaction(JSON.stringify(txJson));
      });
    });

    it('an invalid expiration time', async () => {
      const builder = initWalletBuilder();
      should.throws(
        () => builder.expiration(testData.MAX_TRANSACTION_EXPIRATION + 1),
        e => e.message === testData.INVALID_TRANSACTION_EXPIRATION_MESSAGE,
      );
    });
  });

  describe('signatures', function() {
    it('should sign a transaction', async function() {
      const builder = initWalletBuilder();
      builder.sign({ key: testData.ROOT_ACCOUNT.privateKey });
      const tx = (await builder.build()) as Transaction;
      should.exists(tx.casperTx.approvals[0].signer);
      should.exists(tx.casperTx.approvals[0].signature);

      const txJson = tx.toJson();
      should.doesNotThrow(() => {
        builder.validateRawTransaction(JSON.stringify(txJson));
      });
    });

    it('should process signing only once per signer', async function() {
      const builder = initWalletBuilder();
      builder.sign({ key: testData.ROOT_ACCOUNT.privateKey });
      let tx = (await builder.build()) as Transaction;
      tx.casperTx.approvals.length.should.equal(1);

      tx = (await builder.build()) as Transaction;
      tx.casperTx.approvals.length.should.equal(1);
    });

    it('should add a signature to a transaction', async function() {
      const builder = initWalletBuilder();
      const sig = '0072f40621663fd03c5e13b413d5c354cdf4c7e76672aa61fd8ede0f1ac09f5de107d725eb40e1efb9037940d74ef9b2efaa1d66d0991a5322639481c2d4280775';
      const pub = '03dca7d5d68fba12a604e992a47504d10e6795cdc6db438abb741788c71c4b7428';
      const signingKeyPair = new KeyPair({ pub });
      builder.signature(sig, signingKeyPair);
      const tx = (await builder.build()) as Transaction;
      const signer = tx.casperTx.approvals[0].signer;
      const signature = tx.casperTx.approvals[0].signature;

      removeAlgoPrefixFromHexValue(signer).should.equal(pub);
      removeAlgoPrefixFromHexValue(signature).should.equal(_.toLower(sig));

      const txJson = tx.toJson();
      should.doesNotThrow(() => {
        builder.validateRawTransaction(JSON.stringify(txJson));
      });
    });

    it('should process signing only once per signature added', async function() {
      const builder = initWalletBuilder();
      const sig = '0072f40621663fd03c5e13b413d5c354cdf4c7e76672aa61fd8ede0f1ac09f5de107d725eb40e1efb9037940d74ef9b2efaa1d66d0991a5322639481c2d4280775';
      const pub = '03dca7d5d68fba12a604e992a47504d10e6795cdc6db438abb741788c71c4b7428';
      const signingKeyPair = new KeyPair({ pub });
      builder.signature(sig, signingKeyPair);
      let tx = (await builder.build()) as Transaction;
      tx.casperTx.approvals.length.should.equal(1);

      tx = (await builder.build()) as Transaction;
      tx.casperTx.approvals.length.should.equal(1);
    });
  });
});
