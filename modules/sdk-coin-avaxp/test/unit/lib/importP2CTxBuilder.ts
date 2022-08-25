import assert from 'assert';
import 'should';
import * as testData from '../../resources/avaxp';
import * as errorMessage from '../../resources/errors';
import { TransactionBuilderFactory, DecodedUtxoObj } from '../../../src/lib';
import { coins } from '@bitgo/statics';
import signFlowTest from './TheorySignFlowBuilderTest';

describe('AvaxP Import P2C Tx Builder', () => {
  const factory = new TransactionBuilderFactory(coins.get('tavaxp'));
  const data = testData.IMPORT_P;
  describe('validate txBuilder fields', () => {
    const txBuilder = factory.getImportBuilder();

    it('should fail target chain id length incorrect', () => {
      assert.throws(
        () => {
          txBuilder.externalChainId(Buffer.from(testData.INVALID_CHAIN_ID));
        },
        (e) => e.message === errorMessage.ERROR_CHAIN_ID_LENGTH
      );
    });

    it('should fail target chain id not a vaild base58 string', () => {
      assert.throws(
        () => {
          txBuilder.externalChainId(testData.INVALID_CHAIN_ID);
        },
        (e) => e.message === errorMessage.ERROR_CHAIN_ID_NOT_BASE58
      );
    });

    it('should fail target chain id cb58 invalid checksum', () => {
      assert.throws(
        () => {
          txBuilder.externalChainId(testData.VALID_C_CHAIN_ID.slice(2));
        },
        (e) => e.message === errorMessage.ERROR_CHAIN_ID_INVALID_CHECKSUM
      );
    });

    it('should fail validate Utxos empty string', () => {
      assert.throws(
        () => {
          txBuilder.validateUtxos([]);
        },
        (e) => e.message === errorMessage.ERROR_UTXOS_EMPTY
      );
    });

    it('should fail validate Utxos without amount field', () => {
      assert.throws(
        () => {
          txBuilder.validateUtxos([{ outputID: '' } as any as DecodedUtxoObj]);
        },
        (e) => e.message === errorMessage.ERROR_UTXOS_AMOUNT
      );
    });
  });

  signFlowTest({
    transactionType: 'Import P2C',
    newTxFactory: () => new TransactionBuilderFactory(coins.get('tavaxp')),
    newTxBuilder: () =>
      new TransactionBuilderFactory(coins.get('tavaxp'))
        .getImportBuilder()
        .threshold(data.threshold)
        .locktime(data.locktime)
        .fromPubKey(data.pAddresses)
        .externalChainId(data.targetChainId)
        .memo(data.memo)
        .utxos(data.outputs),
    unsignedTxHex: testData.IMPORT_P.unsignedTxHex,
    halfsigntxHex: testData.IMPORT_P.halfsigntxHex,
    fullsigntxHex: testData.IMPORT_P.fullsigntxHex,
    privKey: {
      prv1: testData.IMPORT_P.privKey.prv1,
      prv2: testData.IMPORT_P.privKey.prv2,
    },
  });

  signFlowTest({
    transactionType: 'Import P2C recovery',
    newTxFactory: () => new TransactionBuilderFactory(coins.get('tavaxp')),
    newTxBuilder: () =>
      new TransactionBuilderFactory(coins.get('tavaxp'))
        .getImportBuilder()
        .threshold(data.threshold)
        .locktime(data.locktime)
        .fromPubKey(data.pAddresses)
        .externalChainId(data.targetChainId)
        .memo(data.memo)
        .utxos(data.outputs)
        .recoverMode(),
    unsignedTxHex: testData.IMPORT_P.rUnsignedTxHex,
    halfsigntxHex: testData.IMPORT_P.rHalfsigntxHex,
    fullsigntxHex: testData.IMPORT_P.rFullsigntxHex,
    privKey: {
      prv1: testData.IMPORT_P.privKey.prv3,
      prv2: testData.IMPORT_P.privKey.prv2,
    },
  });

  describe('Key cannot sign the transaction ', () => {
    it('Should full sign a import tx from unsigned raw tx', () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(data.unsignedTxHex);
      txBuilder.sign({ key: data.privKey.prv2 });
      txBuilder
        .build()
        .then((ok) => assert.fail('it can sign'))
        .catch((err) => {
          err.message.should.be.equal(errorMessage.ERROR_KEY_CANNOT_SIGN);
        });
    });

    it('Should 2 full sign a import tx from unsigned raw tx', () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(data.rUnsignedTxHex);
      txBuilder.sign({ key: data.privKey.prv1 });
      txBuilder
        .build()
        .then((ok) => assert.fail('it can sign'))
        .catch((err) => {
          err.message.should.be.equal(errorMessage.ERROR_KEY_CANNOT_SIGN);
        });
    });
  });
});
