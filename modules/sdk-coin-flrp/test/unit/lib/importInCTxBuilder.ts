import assert from 'assert';
import 'should';
import { TransactionBuilderFactory } from '../../../src/lib';
import { coins } from '@bitgo/statics';
import { IMPORT_IN_C as testData } from '../../resources/transactionData/importInC';
import signFlowTest from './signFlowTestSuit';

describe('Flrp Import In C Tx Builder', () => {
  const factory = new TransactionBuilderFactory(coins.get('tflrp'));

  describe('validate txBuilder fields', () => {
    it('should fail validate Utxos empty array', () => {
      const txBuilder = factory.getImportInCBuilder();
      assert.throws(
        () => {
          txBuilder.validateUtxos([]);
        },
        (e: any) => e.message === 'UTXOs array cannot be empty'
      );
    });

    it('should throw if to address is not set', async () => {
      const txBuilder = factory
        .getImportInCBuilder()
        .threshold(testData.threshold)
        .fromPubKey(testData.pAddresses)
        .decodedUtxos(testData.utxos)
        .fee(testData.fee)
        .context(testData.context);
      // to is NOT set

      await txBuilder.build().should.be.rejectedWith('to is required');
    });

    it('should throw if context is not set', async () => {
      const txBuilder = factory
        .getImportInCBuilder()
        .threshold(testData.threshold)
        .fromPubKey(testData.pAddresses)
        .decodedUtxos(testData.utxos)
        .to(testData.to)
        .fee(testData.fee);
      // context is NOT set

      await txBuilder.build().should.be.rejectedWith('context is required');
    });

    it('should throw if fromAddresses is not set', async () => {
      const txBuilder = factory
        .getImportInCBuilder()
        .threshold(testData.threshold)
        .decodedUtxos(testData.utxos)
        .to(testData.to)
        .fee(testData.fee)
        .context(testData.context);
      // fromPubKey is NOT set

      await txBuilder.build().should.be.rejectedWith('fromAddresses are required');
    });

    it('should throw if UTXOs are not set', async () => {
      const txBuilder = factory
        .getImportInCBuilder()
        .threshold(testData.threshold)
        .fromPubKey(testData.pAddresses)
        .to(testData.to)
        .fee(testData.fee)
        .context(testData.context);
      // utxos is NOT set

      await txBuilder.build().should.be.rejectedWith('UTXOs are required');
    });

    it('should fail when utxos hex array is empty', () => {
      const txBuilder = factory.getImportInCBuilder();
      assert.throws(
        () => {
          txBuilder.decodedUtxos([]);
        },
        (e: any) => e.message === 'UTXOs array cannot be empty'
      );
    });

    it('should fail with invalid threshold value (0)', () => {
      const txBuilder = factory.getImportInCBuilder();
      assert.throws(
        () => {
          txBuilder.threshold(0);
        },
        (e: any) => e.message.includes('threshold') || e.message.includes('greater')
      );
    });

    it('should fail with invalid threshold value (negative)', () => {
      const txBuilder = factory.getImportInCBuilder();
      assert.throws(
        () => {
          txBuilder.threshold(-1);
        },
        (e: any) => e.message.includes('threshold') || e.message.includes('greater')
      );
    });

    it('should fail with invalid to address format', () => {
      const txBuilder = factory.getImportInCBuilder();
      assert.throws(
        () => {
          txBuilder.to('invalid-address');
        },
        (e: any) => e.message.includes('Invalid') || e.message.includes('address')
      );
    });

    it('should accept valid to address', () => {
      const txBuilder = factory.getImportInCBuilder();
      (() => txBuilder.to(testData.to)).should.not.throw();
    });

    it('should accept valid threshold', () => {
      const txBuilder = factory.getImportInCBuilder();
      (() => txBuilder.threshold(2)).should.not.throw();
    });

    it('should accept valid context', () => {
      const txBuilder = factory.getImportInCBuilder();
      (() => txBuilder.context(testData.context)).should.not.throw();
    });

    it('should accept valid fromPubKey addresses', () => {
      const txBuilder = factory.getImportInCBuilder();
      (() => txBuilder.fromPubKey(testData.pAddresses)).should.not.throw();
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
        .decodedUtxos(testData.utxos)
        .to(testData.to)
        .fee(testData.fee)
        .context(testData.context),
    unsignedTxHex: testData.unsignedHex,
    halfSignedTxHex: testData.halfSigntxHex,
    fullSignedTxHex: testData.fullSigntxHex,
    privateKey: {
      prv1: testData.privateKeys[2],
      prv2: testData.privateKeys[0],
    },
    txHash: testData.txhash,
  });
  describe('addressesIndex extraction and signature slot mapping for ImportInC', () => {
    it('should correctly parse half-signed ImportInC tx and add second signature', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tflrp')).from(testData.halfSigntxHex);
      txBuilder.sign({ key: testData.privateKeys[0] });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(testData.fullSigntxHex);
      tx.id.should.equal(testData.txhash);
    });

    it('should preserve transaction structure when parsing unsigned ImportInC tx', async () => {
      const parsedBuilder = new TransactionBuilderFactory(coins.get('tflrp')).from(testData.unsignedHex);
      const parsedTx = await parsedBuilder.build();
      const parsedHex = parsedTx.toBroadcastFormat();
      parsedHex.should.equal(testData.unsignedHex);
    });

    it('should correctly handle ImportInC signing flow: parse -> sign -> parse -> sign', async () => {
      // Step 1:  unsigned transaction
      const builder1 = new TransactionBuilderFactory(coins.get('tflrp')).from(testData.unsignedHex);
      const unsignedTx = await builder1.build();
      const unsignedHex = unsignedTx.toBroadcastFormat();
      unsignedHex.should.equal(testData.unsignedHex);
      const builder2 = new TransactionBuilderFactory(coins.get('tflrp')).from(unsignedHex);
      builder2.sign({ key: testData.privateKeys[2] });
      const halfSignedTx = await builder2.build();
      const halfSignedHex = halfSignedTx.toBroadcastFormat();
      const builder3 = new TransactionBuilderFactory(coins.get('tflrp')).from(halfSignedHex);
      builder3.sign({ key: testData.privateKeys[0] });
      const fullSignedTx = await builder3.build();
      fullSignedTx.toBroadcastFormat().should.equal(testData.fullSigntxHex);
      fullSignedTx.id.should.equal(testData.txhash);
    });

    it('should have correct number of signatures for ImportInC after full sign flow', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tflrp')).from(testData.fullSigntxHex);
      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      txJson.signatures.length.should.equal(2);
    });

    it('should have correct number of signatures for ImportInC half-signed tx', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tflrp')).from(testData.halfSigntxHex);
      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      txJson.signatures.length.should.equal(1);
    });

    it('should have 0 signatures for unsigned ImportInC tx', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tflrp')).from(testData.unsignedHex);
      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      txJson.signatures.length.should.equal(0);
    });
  });

  describe('UTXO address sorting fix - addresses in non-sorted order for ImportInC', () => {
    /**
     * This test suite verifies the fix for the address ordering bug in ImportInC.
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

    it('should correctly sort UTXO addresses when building ImportInC transaction', async () => {
      // Create UTXOs with addresses in reversed order (simulating API returning unsorted)
      const reversedUtxos = testData.utxos.map((utxo) =>
        createUtxoWithAddressOrder(utxo, [...utxo.addresses].reverse())
      );

      const txBuilder = factory
        .getImportInCBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .fromPubKey(testData.pAddresses)
        .to(testData.to)
        .externalChainId(testData.sourceChainId)
        .fee(testData.fee)
        .context(testData.context)
        .decodedUtxos(reversedUtxos);

      // Should not throw - the fix ensures addresses are sorted before computing sigIndices
      const tx = await txBuilder.build();
      const txJson = tx.toJson();

      // Verify transaction built successfully
      txJson.threshold.should.equal(2);
      tx.toBroadcastFormat().should.be.a.String();
    });

    it('should produce same transaction hex regardless of input UTXO address order for ImportInC', async () => {
      // Build with original address order
      const txBuilder1 = factory
        .getImportInCBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .fromPubKey(testData.pAddresses)
        .to(testData.to)
        .externalChainId(testData.sourceChainId)
        .fee(testData.fee)
        .context(testData.context)
        .decodedUtxos(testData.utxos);

      const tx1 = await txBuilder1.build();
      const hex1 = tx1.toBroadcastFormat();

      // Build with reversed address order in UTXOs
      const reversedUtxos = testData.utxos.map((utxo) =>
        createUtxoWithAddressOrder(utxo, [...utxo.addresses].reverse())
      );

      const txBuilder2 = factory
        .getImportInCBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .fromPubKey(testData.pAddresses)
        .to(testData.to)
        .externalChainId(testData.sourceChainId)
        .fee(testData.fee)
        .context(testData.context)
        .decodedUtxos(reversedUtxos);

      const tx2 = await txBuilder2.build();
      const hex2 = tx2.toBroadcastFormat();

      // Both should produce the same hex since addresses get sorted
      hex1.should.equal(hex2);
    });

    it('should handle signing correctly with unsorted UTXO addresses for ImportInC', async () => {
      const reversedUtxos = testData.utxos.map((utxo) =>
        createUtxoWithAddressOrder(utxo, [...utxo.addresses].reverse())
      );

      const txBuilder = factory
        .getImportInCBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .fromPubKey(testData.pAddresses)
        .to(testData.to)
        .externalChainId(testData.sourceChainId)
        .fee(testData.fee)
        .context(testData.context)
        .decodedUtxos(reversedUtxos);

      txBuilder.sign({ key: testData.privateKeys[2] });
      txBuilder.sign({ key: testData.privateKeys[0] });

      const tx = await txBuilder.build();
      const txJson = tx.toJson();

      // Should have 2 signatures after signing
      txJson.signatures.length.should.equal(2);
    });

    it('should produce valid signed transaction matching expected output with unsorted addresses for ImportInC', async () => {
      const reversedUtxos = testData.utxos.map((utxo) =>
        createUtxoWithAddressOrder(utxo, [...utxo.addresses].reverse())
      );

      const txBuilder = factory
        .getImportInCBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .fromPubKey(testData.pAddresses)
        .to(testData.to)
        .externalChainId(testData.sourceChainId)
        .fee(testData.fee)
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

  describe('fresh build with different UTXO address order for ImportInC', () => {
    it('should correctly complete full sign flow with different UTXO address order for ImportInC', async () => {
      const builder1 = new TransactionBuilderFactory(coins.get('tflrp')).from(testData.unsignedHex);
      const unsignedTx = await builder1.build();
      const unsignedHex = unsignedTx.toBroadcastFormat();

      const builder2 = new TransactionBuilderFactory(coins.get('tflrp')).from(unsignedHex);
      builder2.sign({ key: testData.privateKeys[2] });
      const halfSignedTx = await builder2.build();
      const halfSignedHex = halfSignedTx.toBroadcastFormat();

      halfSignedTx.toJson().signatures.length.should.equal(1);

      const builder3 = new TransactionBuilderFactory(coins.get('tflrp')).from(halfSignedHex);
      builder3.sign({ key: testData.privateKeys[0] });
      const fullSignedTx = await builder3.build();

      fullSignedTx.toJson().signatures.length.should.equal(2);

      const txId = fullSignedTx.id;
      txId.should.be.a.String();
      txId.length.should.be.greaterThan(0);
    });

    it('should handle ImportInC signing in different order and still produce valid tx', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tflrp')).from(testData.unsignedHex);

      txBuilder.sign({ key: testData.privateKeys[0] });
      txBuilder.sign({ key: testData.privateKeys[2] });

      const tx = await txBuilder.build();
      const txJson = tx.toJson();

      txJson.signatures.length.should.equal(2);
    });
  });
});
