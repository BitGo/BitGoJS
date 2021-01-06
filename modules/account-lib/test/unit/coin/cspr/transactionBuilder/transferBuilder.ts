import should from 'should';
import { register } from '../../../../../src/index';
import { TransactionBuilderFactory } from '../../../../../src/coin/cspr/';
import * as testData from '../../../../resources/cspr/cspr';

describe('Casper Transfer Builder', () => {
  const factory = register('tcspr', TransactionBuilderFactory);

  describe('Not yet implemented functionality', () => {
    const initTxBuilder = () => {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.fee({ gasLimit: testData.GAS_LIMIT });
      txBuilder.source({ address: testData.ACCOUNT_1.accountHash });
      txBuilder.to(testData.ACCOUNT_2.accountHash);
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
