import should from 'should';
import { register } from '../../../../../src/index';
import { TransactionBuilderFactory } from '../../../../../src/coin/avaxc/transactionBuilderFactory';
import * as testData from '../../../../resources/avaxc/avaxc';

describe('AvaxC Transfer Builder', () => {
  const factory = register('tavaxc', TransactionBuilderFactory);
  it('get transfer builder', () => {
    should.throws(() => {
      factory.getTransferBuilder();
    });
  });

  describe('Not yet implemented functionality', () => {
    const initTxBuilder = () => {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.fee({ gasLimit: testData.FEE.gasLimit, gasPrice: testData.FEE.gasPrice });
      txBuilder.source({ address: testData.ACCOUNT_1.address });
      txBuilder.to(testData.ACCOUNT_2.address);
      txBuilder.amount('10');
      return txBuilder;
    };

    describe('should build ', () => {
      describe('non serialized transactions', () => {
        it('a signed transfer transaction', async () => {
          // TODO
        });

        it('a transfer transaction signed multiple times', async () => {
          // TODO
        });

        it('a transfer transaction with amount 0', async () => {
          // TODO
        });

        it('a non signed transfer transaction', async () => {
          // TODO
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
});
