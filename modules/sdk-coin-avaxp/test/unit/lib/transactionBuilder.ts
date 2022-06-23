import assert from 'assert';
import * as testData from '../../resources/avaxp';
import * as errorMessage from '../../resources/errors';
import { register, TransactionBuilderFactory } from '../../../src/lib';

describe('AvaxP Transaction Builder', () => {
  const factory = register('tavaxp', TransactionBuilderFactory);

  describe('should validate', () => {
    it('an empty raw transaction', () => {
      const txBuilder = factory.getTransferBuilder();
      assert.throws(
        () => {
          txBuilder.validateRawTransaction('');
        },
        (e) => e.message === errorMessage.ERROR_EMPTY_RAW_TRANSACTION
      );
    });

    it('an invalid raw transfer transaction', () => {
      const txBuilder = factory.getTransferBuilder();
      assert.throws(
        () => {
          txBuilder.validateRawTransaction(testData.INVALID_RAW_TRANSACTION);
        },
        (e) => e.message === errorMessage.ERROR_RAW_PARSING
      );
    });

    it('Should validate a correct raw tx', () => {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.validateRawTransaction(testData.ADDVALIDATOR_SAMPLES.unsignedTxHex);
      // should not throw a error!
    });

    it("Shouldn't get a wallet initialization builder", () => {
      assert.throws(
        () => {
          factory.getWalletInitializationBuilder();
        },
        (e) => e.message === errorMessage.ERROR_WALLET_INITIALIZATION
      );
    });
  });
});
