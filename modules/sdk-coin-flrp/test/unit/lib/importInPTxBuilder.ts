import assert from 'assert';
import 'should';
import { IMPORT_IN_P as testData } from '../../resources/transactionData/importInP';
import { TransactionBuilderFactory, DecodedUtxoObj, Transaction } from '../../../src/lib';
import { coins, FlareNetwork } from '@bitgo/statics';
import signFlowTest from './signFlowTestSuit';
import recoverModeTestSuit from './recoverModeTestSuit';

describe('Flrp Import In P Tx Builder', () => {
  const coinConfig = coins.get('tflrp');
  const factory = new TransactionBuilderFactory(coinConfig);

  describe('default fee', () => {
    const FIXED_FEE = (coinConfig.network as FlareNetwork).txFee;

    it('should set fixedFee (1000000) by default in constructor', () => {
      const txBuilder = factory.getImportInPBuilder();
      // The fixedFee should be set from network.txFee = '1000000'
      const transaction = (txBuilder as any).transaction;
      transaction._fee.fee.should.equal(FIXED_FEE);
    });

    it('should use default fixedFee when fee is not explicitly set', async () => {
      // Create a UTXO with enough balance to cover the default fee
      const utxoAmount = '50000000'; // 0.05 FLR - enough to cover fee and have output

      const txBuilder = factory
        .getImportInPBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .fromPubKey(testData.pAddresses)
        .externalChainId(testData.sourceChainId)
        // NOTE: .fee() is NOT called - should use default fixedFee
        .utxos([
          {
            outputID: 0,
            amount: utxoAmount,
            txid: testData.outputs[0].txid,
            outputidx: '0',
            addresses: testData.outputs[0].addresses,
            threshold: testData.threshold,
          },
        ]);

      const tx = (await txBuilder.build()) as Transaction;

      // Verify the fee in the built transaction equals the fixedFee
      tx.fee.fee.should.equal(FIXED_FEE);
    });
  });

  describe('validate txBuilder fields', () => {
    const txBuilder = factory.getImportInPBuilder();

    it('should fail target chain id length incorrect', () => {
      assert.throws(
        () => {
          txBuilder.externalChainId(Buffer.from(testData.INVALID_CHAIN_ID));
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
    transactionType: 'Import P2C',
    newTxFactory: () => new TransactionBuilderFactory(coins.get('tflrp')),
    newTxBuilder: () =>
      new TransactionBuilderFactory(coins.get('tflrp'))
        .getImportInPBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .fromPubKey(testData.pAddresses)
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

  it('Should full sign a import tx from unsigned raw tx', () => {
    const txBuilder = new TransactionBuilderFactory(coins.get('tflrp')).from(testData.unsignedHex);
    txBuilder.sign({ key: testData.privateKeys[0] });
    txBuilder
      .build()
      .then(() => assert.fail('it can sign'))
      .catch((err) => {
        err.message.should.be.equal('Private key cannot sign the transaction');
      });
  });

  recoverModeTestSuit({
    transactionType: 'Import P (Recovery Mode)',
    newTxFactory: () => new TransactionBuilderFactory(coins.get('tflrp')),
    newTxBuilder: () =>
      new TransactionBuilderFactory(coins.get('tflrp'))
        .getImportInPBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .fromPubKey(testData.pAddresses)
        .externalChainId(testData.sourceChainId)
        .fee(testData.fee)
        .utxos(testData.outputs),
    privateKey: {
      prv1: testData.privateKeys[0],
      prv2: testData.privateKeys[1],
      prv3: testData.privateKeys[2],
    },
  });
});
