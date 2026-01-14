import assert from 'assert';
import 'should';
import { EXPORT_IN_P as testData } from '../../resources/transactionData/exportInP';
import { TransactionBuilderFactory } from '../../../src/lib';
import { coins } from '@bitgo/statics';
import signFlowTest from './signFlowTestSuit';

describe('Flrp Export In P Tx Builder', () => {
  const coinConfig = coins.get('tflrp');
  const factory = new TransactionBuilderFactory(coinConfig);

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

    it('should throw if feeState is not set', async () => {
      const txBuilder = factory
        .getExportInPBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .fromPubKey(testData.pAddresses)
        .amount('500000000')
        .externalChainId(testData.sourceChainId);

      await txBuilder.build().should.be.rejectedWith('Fee state is required');
    });

    it('should accept valid feeState', () => {
      const txBuilder = factory.getExportInPBuilder();
      (() => txBuilder.feeState(testData.feeState)).should.not.throw();
    });

    it('should throw if context is not set', async () => {
      const txBuilder = factory
        .getExportInPBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .fromPubKey(testData.pAddresses)
        .amount('500000000')
        .externalChainId(testData.sourceChainId)
        .feeState(testData.feeState)
        .decodedUtxos(testData.utxos);
      // context is NOT set

      await txBuilder.build().should.be.rejectedWith('context is required');
    });

    it('should fail when utxos hex array is empty', () => {
      const txBuilder = factory.getExportInPBuilder();
      assert.throws(
        () => {
          txBuilder.decodedUtxos([]);
        },
        (e: any) => e.message === 'UTXOs array cannot be empty'
      );
    });

    it('should throw if amount is not set', async () => {
      const txBuilder = factory
        .getExportInPBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .fromPubKey(testData.pAddresses)
        .externalChainId(testData.sourceChainId)
        .feeState(testData.feeState)
        .context(testData.context)
        .decodedUtxos(testData.utxos);
      // amount is NOT set

      await txBuilder.build().should.be.rejectedWith('amount is required');
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
        .feeState(testData.feeState)
        .context(testData.context)
        .decodedUtxos(testData.utxos),
    unsignedTxHex: testData.unsignedHex,
    halfSignedTxHex: testData.halfSigntxHex,
    fullSignedTxHex: testData.fullSigntxHex,
    privateKey: {
      prv1: testData.privateKeys[2],
      prv2: testData.privateKeys[0],
    },
    txHash: testData.txhash,
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
