import assert from 'assert';
import 'should';
import {
  EXPORT_IN_P as testData,
  EXPORT_IN_P_TWO_UTXOS as twoUtxoTestData,
  EXPORT_IN_P_NO_CHANGE as noChangeTestData,
} from '../../resources/transactionData/exportInP';
import { TransactionBuilderFactory, DecodedUtxoObj } from '../../../src/lib';
import { coins } from '@bitgo/statics';
import signFlowTest from './signFlowTestSuit';

describe('Flrp Export In P Tx Builder', () => {
  const factory = new TransactionBuilderFactory(coins.get('tflrp'));

  describe('validate txBuilder fields', () => {
    const txBuilder = factory.getExportInPBuilder();
    it('should fail amount low than zero', () => {
      assert.throws(
        () => {
          txBuilder.amount('-1');
        },
        (e: any) => e.message === 'Amount must be greater than 0'
      );
    });
    it('should fail target chain id length incorrect', () => {
      assert.throws(
        () => {
          txBuilder.externalChainId(Buffer.from(testData.INVALID_CHAIN_ID.slice(2)));
        },
        (e: any) => e.message === 'Chain id are 32 byte size'
      );
    });

    it('should fail target chain id not a valid base58 string', () => {
      assert.throws(
        () => {
          txBuilder.externalChainId(testData.INVALID_CHAIN_ID);
        },
        (e: any) => e.message === 'Non-base58 character'
      );
    });

    it('should fail target chain id cb58 invalid checksum', () => {
      assert.throws(
        () => {
          txBuilder.externalChainId(testData.VALID_C_CHAIN_ID.slice(2));
        },
        (e: any) => e.message === 'Invalid checksum'
      );
    });

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
    transactionType: 'Export P2C with changeoutput',
    newTxFactory: () => new TransactionBuilderFactory(coins.get('tflrp')),
    newTxBuilder: () =>
      new TransactionBuilderFactory(coins.get('tflrp'))
        .getExportInPBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .fromPubKey(testData.pAddresses)
        .amount(testData.amount)
        .externalChainId(testData.sourceChainId)
        .fee(testData.fee)
        .utxos(testData.outputs),
    unsignedTxHex: testData.unsignedHex,
    halfSignedTxHex: testData.halfSigntxHex,
    fullSignedTxHex: testData.fullSigntxHex,
    privateKey: {
      prv1: testData.privateKeys[0],
      prv2: testData.privateKeys[1],
    },
    txHash: testData.txhash,
  });

  signFlowTest({
    transactionType: 'Export P2C with 2 UTXOs',
    newTxFactory: () => new TransactionBuilderFactory(coins.get('tflrp')),
    newTxBuilder: () =>
      new TransactionBuilderFactory(coins.get('tflrp'))
        .getExportInPBuilder()
        .threshold(twoUtxoTestData.threshold)
        .locktime(twoUtxoTestData.locktime)
        .fromPubKey(twoUtxoTestData.pAddresses)
        .amount(twoUtxoTestData.amount)
        .externalChainId(twoUtxoTestData.sourceChainId)
        .fee(twoUtxoTestData.fee)
        .utxos(twoUtxoTestData.outputs),
    unsignedTxHex: twoUtxoTestData.unsignedHex,
    halfSignedTxHex: twoUtxoTestData.halfSigntxHex,
    fullSignedTxHex: twoUtxoTestData.fullSigntxHex,
    privateKey: {
      prv1: twoUtxoTestData.privateKeys[0],
      prv2: twoUtxoTestData.privateKeys[1],
    },
    txHash: twoUtxoTestData.txhash,
  });

  signFlowTest({
    transactionType: 'Export P2C with no change output',
    newTxFactory: () => new TransactionBuilderFactory(coins.get('tflrp')),
    newTxBuilder: () =>
      new TransactionBuilderFactory(coins.get('tflrp'))
        .getExportInPBuilder()
        .threshold(noChangeTestData.threshold)
        .locktime(noChangeTestData.locktime)
        .fromPubKey(noChangeTestData.pAddresses)
        .amount(noChangeTestData.amount)
        .externalChainId(noChangeTestData.sourceChainId)
        .fee(noChangeTestData.fee)
        .utxos(noChangeTestData.outputs),
    unsignedTxHex: noChangeTestData.unsignedHex,
    halfSignedTxHex: noChangeTestData.halfSigntxHex,
    fullSignedTxHex: noChangeTestData.fullSigntxHex,
    privateKey: {
      prv1: noChangeTestData.privateKeys[0],
      prv2: noChangeTestData.privateKeys[1],
    },
    txHash: noChangeTestData.txhash,
  });

  it('Should full sign a export tx from unsigned raw tx', () => {
    const txBuilder = new TransactionBuilderFactory(coins.get('tflrp')).from(testData.unsignedHex);
    txBuilder.sign({ key: testData.privateKeys[0] });
    txBuilder
      .build()
      .then(() => assert.fail('it can sign'))
      .catch((err) => {
        err.message.should.be.equal('Private key cannot sign the transaction');
      });
  });
});
