import assert from 'assert';
import 'should';
import { TransactionBuilderFactory, DecodedUtxoObj } from '../../../src/lib';
import { coins } from '@bitgo/statics';
import { IMPORT_IN_C as testData } from '../../resources/transactionData/importInC';
import signFlowTest from './signFlowTestSuit';
import recoverModeTestSuit from './recoverModeTestSuit';

describe('Flrp Import In C Tx Builder', () => {
  const factory = new TransactionBuilderFactory(coins.get('tflrp'));
  describe('validate txBuilder fields', () => {
    const txBuilder = factory.getImportInCBuilder();

    it('should fail validate Utxos empty string', () => {
      assert.throws(
        () => {
          txBuilder.validateUtxos([]);
        },
        (e: any) => e.message === 'UTXOs array cannot be empty'
      );
    });

    it('should fail validate Utxos without amount field', () => {
      assert.throws(
        () => {
          txBuilder.validateUtxos([{ outputID: '' } as any as DecodedUtxoObj]);
        },
        (e: any) => e.message === 'UTXO missing required field: amount'
      );
    });
  });

  signFlowTest({
    transactionType: 'Import C2P',
    newTxFactory: () => new TransactionBuilderFactory(coins.get('tflrp')),
    newTxBuilder: () =>
      new TransactionBuilderFactory(coins.get('tflrp'))
        .getImportInCBuilder()
        .threshold(testData.threshold)
        .fromPubKey(testData.pAddresses)
        .utxos(testData.outputs)
        .to(testData.to)
        .feeRate(testData.fee),
    unsignedTxHex: testData.unsignedHex,
    halfSignedTxHex: testData.halfSigntxHex,
    fullSignedTxHex: testData.fullSigntxHex,
    privateKey: {
      prv1: testData.privateKeys[0],
      prv2: testData.privateKeys[1],
    },
    txHash: testData.txhash,
  });

  recoverModeTestSuit({
    transactionType: 'Import C (Recovery Mode)',
    newTxFactory: () => new TransactionBuilderFactory(coins.get('tflrp')),
    newTxBuilder: () =>
      new TransactionBuilderFactory(coins.get('tflrp'))
        .getImportInCBuilder()
        .threshold(testData.threshold)
        .fromPubKey(testData.pAddresses)
        .utxos(testData.outputs)
        .to(testData.to)
        .feeRate(testData.fee),
    privateKey: {
      prv1: testData.privateKeys[0],
      prv2: testData.privateKeys[1],
      prv3: testData.privateKeys[2],
    },
  });
});
