import assert from 'assert';
import 'should';
import * as errorMessage from '../../resources/errors';
import { TransactionBuilderFactory, DecodedUtxoObj } from '../../../src/lib';
import { coins } from '@bitgo/statics';
import { IMPORT_C } from '../../resources/tx/importC';
import signFlowTest from './signFlowTestSuit';

describe('AvaxP Import C2P Tx Builder', () => {
  const factory = new TransactionBuilderFactory(coins.get('tavaxp'));
  describe('validate txBuilder fields', () => {
    const txBuilder = factory.getImportInCBuilder();

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
    transactionType: 'Import C2P',
    newTxFactory: () => new TransactionBuilderFactory(coins.get('tavaxp')),
    newTxBuilder: () =>
      new TransactionBuilderFactory(coins.get('tavaxp'))
        .getImportInCBuilder()
        .threshold(IMPORT_C.threshold)
        .fromPubKey(IMPORT_C.pAddresses)
        .utxos(IMPORT_C.outputs)
        .to(IMPORT_C.to)
        .feeRate(IMPORT_C.fee),
    unsignedTxHex: IMPORT_C.unsignedTxHex,
    halfsigntxHex: IMPORT_C.halfsigntxHex,
    fullsigntxHex: IMPORT_C.fullsigntxHex,
    privKey: {
      prv1: IMPORT_C.privKey.prv1,
      prv2: IMPORT_C.privKey.prv2,
    },
  });

  signFlowTest({
    transactionType: 'Import C2P recovery',
    newTxFactory: () => new TransactionBuilderFactory(coins.get('tavaxp')),
    newTxBuilder: () =>
      new TransactionBuilderFactory(coins.get('tavaxp'))
        .getImportInCBuilder()
        .threshold(IMPORT_C.threshold)
        .fromPubKey(IMPORT_C.pAddresses)
        .utxos(IMPORT_C.outputs)
        .to(IMPORT_C.to)
        .feeRate(IMPORT_C.fee)
        .recoverMode(),
    unsignedTxHex: IMPORT_C.rUnsignedTxHex,
    halfsigntxHex: IMPORT_C.rHalfsigntxHex,
    fullsigntxHex: IMPORT_C.rFullsigntxHex,
    privKey: {
      prv1: IMPORT_C.privKey.prv3,
      prv2: IMPORT_C.privKey.prv2,
    },
  });
});
