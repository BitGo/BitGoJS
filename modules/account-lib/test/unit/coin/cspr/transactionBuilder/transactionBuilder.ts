import * as should from 'should';
import { register } from '../../../../../src';
import { TransactionBuilderFactory } from '../../../../../src/coin/cspr/';
import * as testData from '../../../../resources/cspr/cspr';

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
    txBuilder.sign({ key: testData.ROOT_ACCOUNT.privateKey });
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
});
