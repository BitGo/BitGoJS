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

  describe('UTXO address sorting fix - addresses in non-sorted order for ExportInP', () => {
    /**
     * This test suite verifies the fix for the address ordering bug in ExportInP.
     *
     * The issue: When the API returns UTXO addresses in a different order than how they're
     * stored on-chain (lexicographically sorted by byte value), the sigIndices would be
     * computed incorrectly, causing signature verification to fail.
     *
     * The fix: Sort UTXO addresses before computing addressesIndex to match on-chain order.
     */

    // Helper to create UTXO with specific address order
    const createUtxoWithAddressOrder = (utxo: (typeof testData.utxos)[0], addresses: string[]) => ({
      ...utxo,
      addresses: addresses,
    });

    it('should correctly sort UTXO addresses when building ExportInP transaction', async () => {
      // Create UTXOs with addresses in reversed order (simulating API returning unsorted)
      const reversedUtxos = testData.utxos.map((utxo) =>
        createUtxoWithAddressOrder(utxo, [...utxo.addresses].reverse())
      );

      const txBuilder = factory
        .getExportInPBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .fromPubKey(testData.pAddresses)
        .amount(testData.amount)
        .externalChainId(testData.sourceChainId)
        .feeState(testData.feeState)
        .context(testData.context)
        .decodedUtxos(reversedUtxos);

      // Should not throw - the fix ensures addresses are sorted before computing sigIndices
      const tx = await txBuilder.build();
      const txJson = tx.toJson();

      txJson.type.should.equal(22); // Export In P type
      txJson.threshold.should.equal(2);
    });

    it('should produce same transaction hex regardless of input UTXO address order for ExportInP', async () => {
      // Build with original address order
      const txBuilder1 = factory
        .getExportInPBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .fromPubKey(testData.pAddresses)
        .amount(testData.amount)
        .externalChainId(testData.sourceChainId)
        .feeState(testData.feeState)
        .context(testData.context)
        .decodedUtxos(testData.utxos);

      const tx1 = await txBuilder1.build();
      const hex1 = tx1.toBroadcastFormat();

      // Build with reversed address order in UTXOs
      const reversedUtxos = testData.utxos.map((utxo) =>
        createUtxoWithAddressOrder(utxo, [...utxo.addresses].reverse())
      );

      const txBuilder2 = factory
        .getExportInPBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .fromPubKey(testData.pAddresses)
        .amount(testData.amount)
        .externalChainId(testData.sourceChainId)
        .feeState(testData.feeState)
        .context(testData.context)
        .decodedUtxos(reversedUtxos);

      const tx2 = await txBuilder2.build();
      const hex2 = tx2.toBroadcastFormat();

      // Both should produce the same hex since addresses get sorted
      hex1.should.equal(hex2);
    });

    it('should handle signing correctly with unsorted UTXO addresses for ExportInP', async () => {
      const reversedUtxos = testData.utxos.map((utxo) =>
        createUtxoWithAddressOrder(utxo, [...utxo.addresses].reverse())
      );

      const txBuilder = factory
        .getExportInPBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .fromPubKey(testData.pAddresses)
        .amount(testData.amount)
        .externalChainId(testData.sourceChainId)
        .feeState(testData.feeState)
        .context(testData.context)
        .decodedUtxos(reversedUtxos);

      txBuilder.sign({ key: testData.privateKeys[2] });
      txBuilder.sign({ key: testData.privateKeys[0] });

      const tx = await txBuilder.build();
      const txJson = tx.toJson();

      // Should have signatures after signing (count depends on UTXO thresholds)
      txJson.signatures.length.should.be.greaterThan(0);
      tx.toBroadcastFormat().should.be.a.String();
    });

    it('should produce valid signed transaction matching expected output with unsorted addresses for ExportInP', async () => {
      const reversedUtxos = testData.utxos.map((utxo) =>
        createUtxoWithAddressOrder(utxo, [...utxo.addresses].reverse())
      );

      const txBuilder = factory
        .getExportInPBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .fromPubKey(testData.pAddresses)
        .amount(testData.amount)
        .externalChainId(testData.sourceChainId)
        .feeState(testData.feeState)
        .context(testData.context)
        .decodedUtxos(reversedUtxos);

      txBuilder.sign({ key: testData.privateKeys[2] });
      txBuilder.sign({ key: testData.privateKeys[0] });

      const tx = await txBuilder.build();

      // The signed tx should match the expected fullSigntxHex from testData
      tx.toBroadcastFormat().should.equal(testData.fullSigntxHex);
      tx.id.should.equal(testData.txhash);
    });
  });

  describe('addressesIndex extraction and signature ordering', () => {
    it('should extract addressesIndex from parsed transaction inputs', async () => {
      const txBuilder = factory.from(testData.halfSigntxHex);
      const tx = await txBuilder.build();
      const txJson = tx.toJson();

      txJson.type.should.equal(22);
      txJson.signatures.length.should.be.greaterThan(0);
    });

    it('should correctly handle fresh build with proper signature ordering', async () => {
      const txBuilder = factory
        .getExportInPBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .fromPubKey(testData.pAddresses)
        .amount(testData.amount)
        .externalChainId(testData.sourceChainId)
        .feeState(testData.feeState)
        .context(testData.context)
        .decodedUtxos(testData.utxos);

      txBuilder.sign({ key: testData.privateKeys[2] });
      const tx = await txBuilder.build();
      const txJson = tx.toJson();

      txJson.type.should.equal(22);
      tx.toBroadcastFormat().should.be.a.String();
    });

    it('should correctly build and sign with different UTXO address ordering', async () => {
      const reorderedUtxos = testData.utxos.map((utxo) => ({
        ...utxo,
        addresses: [testData.pAddresses[1], testData.pAddresses[2], testData.pAddresses[0]],
      }));

      const txBuilder = factory
        .getExportInPBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .fromPubKey(testData.pAddresses)
        .amount(testData.amount)
        .externalChainId(testData.sourceChainId)
        .feeState(testData.feeState)
        .context(testData.context)
        .decodedUtxos(reorderedUtxos);

      txBuilder.sign({ key: testData.privateKeys[2] });
      const tx = await txBuilder.build();
      const txJson = tx.toJson();

      txJson.type.should.equal(22);
      tx.toBroadcastFormat().should.be.a.String();
    });

    it('should handle parse-sign-parse-sign flow correctly', async () => {
      const txBuilder = factory
        .getExportInPBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .fromPubKey(testData.pAddresses)
        .amount(testData.amount)
        .externalChainId(testData.sourceChainId)
        .feeState(testData.feeState)
        .context(testData.context)
        .decodedUtxos(testData.utxos);

      txBuilder.sign({ key: testData.privateKeys[2] });
      const halfSignedTx = await txBuilder.build();
      const halfSignedHex = halfSignedTx.toBroadcastFormat();

      const txBuilder2 = factory.from(halfSignedHex);
      txBuilder2.sign({ key: testData.privateKeys[0] });
      const fullSignedTx = await txBuilder2.build();
      const fullSignedJson = fullSignedTx.toJson();

      fullSignedJson.type.should.equal(22);
      fullSignedJson.signatures.length.should.be.greaterThan(0);
      fullSignedTx.toBroadcastFormat().should.be.a.String();
    });
  });
});
