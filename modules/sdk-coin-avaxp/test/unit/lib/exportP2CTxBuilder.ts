import assert from 'assert';
import 'should';
import * as testData from '../../resources/avaxp';
import * as errorMessage from '../../resources/errors';
import { TransactionBuilderFactory, DecodedUtxoObj } from '../../../src/lib';
import { coins } from '@bitgo/statics';
import signFlowTest from './signFlowTestSuit';

describe('AvaxP Export P2C Tx Builder', () => {
  const factory = new TransactionBuilderFactory(coins.get('tavaxp'));

  describe('validate txBuilder fields', () => {
    const txBuilder = factory.getExportBuilder();
    it('should fail amount low than zero', () => {
      assert.throws(
        () => {
          txBuilder.amount('-1');
        },
        (e: any) => e.message === errorMessage.ERROR_AMOUNT
      );
    });
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
    transactionType: 'Export P2C with changeoutput',
    newTxFactory: () => new TransactionBuilderFactory(coins.get('tavaxp')),
    newTxBuilder: () =>
      new TransactionBuilderFactory(coins.get('tavaxp'))
        .getExportBuilder()
        .threshold(testData.EXPORT_P_2_C.threshold)
        .locktime(testData.EXPORT_P_2_C.locktime)
        .fromPubKey(testData.EXPORT_P_2_C.pAddresses)
        .amount(testData.EXPORT_P_2_C.amount)
        .externalChainId(testData.EXPORT_P_2_C.targetChainId)
        .memo(testData.EXPORT_P_2_C.memo)
        .utxos(testData.EXPORT_P_2_C.outputs),
    unsignedTxHex: testData.EXPORT_P_2_C.unsignedTxHex,
    halfsigntxHex: testData.EXPORT_P_2_C.halfsigntxHex,
    fullsigntxHex: testData.EXPORT_P_2_C.fullsigntxHex,
    privKey: {
      prv1: testData.EXPORT_P_2_C.privKey.prv1,
      prv2: testData.EXPORT_P_2_C.privKey.prv2,
    },
  });

  signFlowTest({
    transactionType: 'Export P2C recovery with changeoutput',
    newTxFactory: () => new TransactionBuilderFactory(coins.get('tavaxp')),
    newTxBuilder: () =>
      new TransactionBuilderFactory(coins.get('tavaxp'))
        .getExportBuilder()
        .threshold(testData.EXPORT_P_2_C.threshold)
        .locktime(testData.EXPORT_P_2_C.locktime)
        .fromPubKey(testData.EXPORT_P_2_C.pAddresses)
        .amount(testData.EXPORT_P_2_C.amount)
        .externalChainId(testData.EXPORT_P_2_C.targetChainId)
        .memo(testData.EXPORT_P_2_C.memo)
        .utxos(testData.EXPORT_P_2_C.outputs)
        .recoverMode(),
    unsignedTxHex: testData.EXPORT_P_2_C.rUnsignedTxHex,
    halfsigntxHex: testData.EXPORT_P_2_C.rHalfsigntxHex,
    fullsigntxHex: testData.EXPORT_P_2_C.rFullsigntxHex,
    privKey: {
      prv1: testData.EXPORT_P_2_C.privKey.prv3,
      prv2: testData.EXPORT_P_2_C.privKey.prv2,
    },
  });

  signFlowTest({
    transactionType: 'Export P2C without changeoutput',
    newTxFactory: () => new TransactionBuilderFactory(coins.get('tavaxp')),
    newTxBuilder: () =>
      new TransactionBuilderFactory(coins.get('tavaxp'))
        .getExportBuilder()
        .threshold(testData.EXPORT_P_2_C_WITHOUT_CHANGEOUTPUT.threshold)
        .locktime(testData.EXPORT_P_2_C_WITHOUT_CHANGEOUTPUT.locktime)
        .fromPubKey(testData.EXPORT_P_2_C_WITHOUT_CHANGEOUTPUT.pAddresses)
        .amount(testData.EXPORT_P_2_C_WITHOUT_CHANGEOUTPUT.amount)
        .externalChainId(testData.EXPORT_P_2_C_WITHOUT_CHANGEOUTPUT.targetChainId)
        .memo(testData.EXPORT_P_2_C_WITHOUT_CHANGEOUTPUT.memo)
        .utxos(testData.EXPORT_P_2_C_WITHOUT_CHANGEOUTPUT.outputs),
    unsignedTxHex: testData.EXPORT_P_2_C_WITHOUT_CHANGEOUTPUT.unsignedTxHex,
    halfsigntxHex: testData.EXPORT_P_2_C_WITHOUT_CHANGEOUTPUT.halfsigntxHex,
    fullsigntxHex: testData.EXPORT_P_2_C_WITHOUT_CHANGEOUTPUT.fullsigntxHex,
    privKey: {
      prv1: testData.EXPORT_P_2_C_WITHOUT_CHANGEOUTPUT.privKey.prv1,
      prv2: testData.EXPORT_P_2_C_WITHOUT_CHANGEOUTPUT.privKey.prv2,
    },
  });

  signFlowTest({
    transactionType: 'Export P2C recovery without changeoutput',
    newTxFactory: () => new TransactionBuilderFactory(coins.get('tavaxp')),
    newTxBuilder: () =>
      new TransactionBuilderFactory(coins.get('tavaxp'))
        .getExportBuilder()
        .threshold(testData.EXPORT_P_2_C_WITHOUT_CHANGEOUTPUT.threshold)
        .locktime(testData.EXPORT_P_2_C_WITHOUT_CHANGEOUTPUT.locktime)
        .fromPubKey(testData.EXPORT_P_2_C_WITHOUT_CHANGEOUTPUT.pAddresses)
        .amount(testData.EXPORT_P_2_C_WITHOUT_CHANGEOUTPUT.amount)
        .externalChainId(testData.EXPORT_P_2_C_WITHOUT_CHANGEOUTPUT.targetChainId)
        .memo(testData.EXPORT_P_2_C_WITHOUT_CHANGEOUTPUT.memo)
        .utxos(testData.EXPORT_P_2_C_WITHOUT_CHANGEOUTPUT.outputs)
        .recoverMode(),
    unsignedTxHex: testData.EXPORT_P_2_C_WITHOUT_CHANGEOUTPUT.rUnsignedTxHex,
    halfsigntxHex: testData.EXPORT_P_2_C_WITHOUT_CHANGEOUTPUT.rHalfsigntxHex,
    fullsigntxHex: testData.EXPORT_P_2_C_WITHOUT_CHANGEOUTPUT.rFullsigntxHex,
    privKey: {
      prv1: testData.EXPORT_P_2_C_WITHOUT_CHANGEOUTPUT.privKey.prv3,
      prv2: testData.EXPORT_P_2_C_WITHOUT_CHANGEOUTPUT.privKey.prv2,
    },
  });

  describe('Key cannot sign the transaction ', () => {
    const data = testData.EXPORT_P_2_C;
    it('Should full sign a export tx from unsigned raw tx', () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(data.unsignedTxHex);
      txBuilder.sign({ key: data.privKey.prv2 });
      txBuilder
        .build()
        .then(() => assert.fail('it can sign'))
        .catch((err) => {
          err.message.should.be.equal(errorMessage.ERROR_KEY_CANNOT_SIGN);
        });
    });

    it('Should 2 full sign a export tx from unsigned raw tx', () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(data.rUnsignedTxHex);
      txBuilder.sign({ key: data.privKey.prv1 });
      txBuilder
        .build()
        .then(() => assert.fail('it can sign'))
        .catch((err) => {
          err.message.should.be.equal(errorMessage.ERROR_KEY_CANNOT_SIGN);
        });
    });
  });
});
