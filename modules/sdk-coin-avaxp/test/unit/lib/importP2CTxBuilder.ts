import assert from 'assert';
import 'should';
import * as testData from '../../resources/avaxp';
import * as errorMessage from '../../resources/errors';
import { TransactionBuilderFactory, DecodedUtxoObj } from '../../../src/lib';
import { coins } from '@bitgo/statics';
import signFlowTest from './signFlowTestSuit';
import { IMPORT_P } from '../../resources/tx/importP';

describe('AvaxP Import P2C Tx Builder', () => {
  const factory = new TransactionBuilderFactory(coins.get('tavaxp'));
  describe('validate txBuilder fields', () => {
    const txBuilder = factory.getImportBuilder();

    it('should fail target chain id length incorrect', () => {
      assert.throws(
        () => {
          txBuilder.externalChainId(Buffer.from(testData.INVALID_CHAIN_ID));
        },
        (e: any) => e.message === errorMessage.ERROR_CHAIN_ID_LENGTH
      );
    });

    it('should fail target chain id not a vaild base58 string', () => {
      assert.throws(
        () => {
          txBuilder.externalChainId(testData.INVALID_CHAIN_ID);
        },
        (e: any) => e.message === errorMessage.ERROR_CHAIN_ID_NOT_BASE58
      );
    });

    it('should fail target chain id cb58 invalid checksum', () => {
      assert.throws(
        () => {
          txBuilder.externalChainId(testData.VALID_C_CHAIN_ID.slice(2));
        },
        (e: any) => e.message === errorMessage.ERROR_CHAIN_ID_INVALID_CHECKSUM
      );
    });

    it('should fail validate Utxos empty string', () => {
      assert.throws(
        () => {
          txBuilder.validateUtxos([]);
        },
        (e: any) => e.message === errorMessage.ERROR_UTXOS_EMPTY
      );
    });

    it('should fail validate Utxos without amount field', () => {
      assert.throws(
        () => {
          txBuilder.validateUtxos([{ outputID: '' } as any as DecodedUtxoObj]);
        },
        (e: any) => e.message === errorMessage.ERROR_UTXOS_AMOUNT
      );
    });
  });

  signFlowTest({
    transactionType: 'Import P2C',
    newTxFactory: () => new TransactionBuilderFactory(coins.get('tavaxp')),
    newTxBuilder: () =>
      new TransactionBuilderFactory(coins.get('tavaxp'))
        .getImportBuilder()
        .threshold(IMPORT_P.threshold)
        .locktime(IMPORT_P.locktime)
        .fromPubKey(IMPORT_P.pAddresses)
        .externalChainId(IMPORT_P.targetChainId)
        .memo(IMPORT_P.memo)
        .utxos(IMPORT_P.outputs),
    unsignedTxHex: IMPORT_P.unsignedTxHex,
    halfsigntxHex: IMPORT_P.halfsigntxHex,
    fullsigntxHex: IMPORT_P.fullsigntxHex,
    privKey: {
      prv1: IMPORT_P.privKey.prv1,
      prv2: IMPORT_P.privKey.prv2,
    },
  });

  signFlowTest({
    transactionType: 'Import P2C recovery',
    newTxFactory: () => new TransactionBuilderFactory(coins.get('tavaxp')),
    newTxBuilder: () =>
      new TransactionBuilderFactory(coins.get('tavaxp'))
        .getImportBuilder()
        .threshold(IMPORT_P.threshold)
        .locktime(IMPORT_P.locktime)
        .fromPubKey(IMPORT_P.pAddresses)
        .externalChainId(IMPORT_P.targetChainId)
        .memo(IMPORT_P.memo)
        .utxos(IMPORT_P.outputs)
        .recoverMode(),
    unsignedTxHex: IMPORT_P.rUnsignedTxHex,
    halfsigntxHex: IMPORT_P.rHalfsigntxHex,
    fullsigntxHex: IMPORT_P.rFullsigntxHex,
    privKey: {
      prv1: IMPORT_P.privKey.prv3,
      prv2: IMPORT_P.privKey.prv2,
    },
  });

  describe('Key cannot sign the transaction ', () => {
    it('Should full sign a import tx from unsigned raw tx', () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(IMPORT_P.unsignedTxHex);
      txBuilder.sign({ key: IMPORT_P.privKey.prv2 });
      txBuilder
        .build()
        .then(() => assert.fail('it can sign'))
        .catch((err) => {
          err.message.should.be.equal(errorMessage.ERROR_KEY_CANNOT_SIGN);
        });
    });

    it('Should 2 full sign a import tx from unsigned raw tx', () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(IMPORT_P.rUnsignedTxHex);
      txBuilder.sign({ key: IMPORT_P.privKey.prv1 });
      txBuilder
        .build()
        .then(() => assert.fail('it can sign'))
        .catch((err) => {
          err.message.should.be.equal(errorMessage.ERROR_KEY_CANNOT_SIGN);
        });
    });
  });
});
