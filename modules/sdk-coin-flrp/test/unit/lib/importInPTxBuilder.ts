import assert from 'assert';
import 'should';
import { IMPORT_IN_P as testData } from '../../resources/transactionData/importInP';
import { TransactionBuilderFactory } from '../../../src/lib';
import { coins } from '@bitgo/statics';
import signFlowTest from './signFlowTestSuit';

describe('Flrp Import In P Tx Builder', () => {
  const coinConfig = coins.get('tflrp');
  const factory = new TransactionBuilderFactory(coinConfig);

  describe('feeState requirement', () => {
    it('should throw if feeState is not set when building', async () => {
      const txBuilder = factory
        .getImportInPBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .fromPubKey(testData.corethAddresses)
        .externalChainId(testData.sourceChainId)
        .decodedUtxos(testData.utxos)
        .context(testData.context);

      await txBuilder.build().should.be.rejectedWith('Fee state is required');
    });

    it('should accept valid feeState', () => {
      const txBuilder = factory.getImportInPBuilder();
      (() => txBuilder.feeState(testData.feeState)).should.not.throw();
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

    it('should fail validate Utxos empty array', () => {
      assert.throws(
        () => {
          txBuilder.validateUtxos([]);
        },
        (e: any) => e.message === 'UTXOs array cannot be empty'
      );
    });

    it('should fail when utxos hex array is empty', () => {
      assert.throws(
        () => {
          txBuilder.decodedUtxos([]);
        },
        (e: any) => e.message === 'UTXOs array cannot be empty'
      );
    });

    it('should fail when context is not set when building', async () => {
      const builder = factory
        .getImportInPBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .fromPubKey(testData.corethAddresses)
        .externalChainId(testData.sourceChainId)
        .decodedUtxos(testData.utxos)
        .feeState(testData.feeState);
      // context is NOT set

      await builder.build().should.be.rejectedWith('context is required');
    });

    it('should fail when fromPubKey addresses are not set', async () => {
      const builder = factory
        .getImportInPBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .externalChainId(testData.sourceChainId)
        .decodedUtxos(testData.utxos)
        .feeState(testData.feeState)
        .context(testData.context);

      await builder.build().should.be.rejectedWith('fromAddresses are required');
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
        .fromPubKey(testData.corethAddresses)
        .to(testData.pAddresses)
        .externalChainId(testData.sourceChainId)
        .feeState(testData.feeState)
        .context(testData.context)
        .decodedUtxos(testData.utxos),
    unsignedTxHex: testData.unsignedHex,
    halfSignedTxHex: testData.halfSigntxHex,
    fullSignedTxHex: testData.signedHex,
    privateKey: {
      prv1: testData.privateKeys[2],
      prv2: testData.privateKeys[0],
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

  describe('on-chain verified transactions', () => {
    it('should verify on-chain tx id for signed P-chain import', async () => {
      const signedImportHex =
        '0x0000000000110000007200000000000000000000000000000000000000000000000000000000000000000000000158734f94af871c3d131b56131b6fb7a0291eacadd261e69dfb42a9cdf6f7fddd000000070000000002e79f04000000000000000000000002000000033329be7d01cd3ebaae6654d7327dd9f17a2e15817e918a5e8083ae4c9f2f0ed77055c24bf3665001c7324437c96c7c8a6a152da2385c1db5c3ab1f91000000000000000078db5c30bed04c05ce209179812850bbb3fe6d46d7eef3744d814c0da555247900000001063ec620d1892f802c8f0c124d05ce1e73a85686bea2b09380fc58f6d72497db0000000058734f94af871c3d131b56131b6fb7a0291eacadd261e69dfb42a9cdf6f7fddd000000050000000002faf0800000000200000000000000010000000100000009000000022ed4ebc2c81e38820cc7bd6e952d10bd30382fa0679c8a0ba5dc67990a09125656d47eadcc622af935fd5dad654f9b00d3b9563df38e875ef1964e1c9ded851100ec514ace26baefce3ffeab94e3580443abcc3cea669a87c7c26ef8ffa3fe79b330e4bdbacabfd1cce9f7b6a9f2515b4fdf627f7d2678e9532d861a7673444aa700';
      const txBuilder = new TransactionBuilderFactory(coins.get('tflrp')).from(signedImportHex);
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(signedImportHex);
      tx.id.should.equal('2vwvuXp47dsUmqb4vkaMk7UsukrZNapKXT2ruZhVibbjMDpqr9');
    });
  });

  describe('addressesIndex extraction and signature slot mapping', () => {
    it('should correctly parse half-signed tx and add second signature', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tflrp')).from(testData.halfSigntxHex);
      txBuilder.sign({ key: testData.privateKeys[0] });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(testData.signedHex);
      tx.id.should.equal(testData.txhash);
    });

    it('should preserve transaction structure when parsing unsigned tx', async () => {
      const freshBuilder = new TransactionBuilderFactory(coins.get('tflrp'))
        .getImportInPBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .fromPubKey(testData.corethAddresses)
        .to(testData.pAddresses)
        .externalChainId(testData.sourceChainId)
        .feeState(testData.feeState)
        .context(testData.context)
        .decodedUtxos(testData.utxos);

      const freshTx = await freshBuilder.build();
      const freshHex = freshTx.toBroadcastFormat();
      const parsedBuilder = new TransactionBuilderFactory(coins.get('tflrp')).from(freshHex);
      const parsedTx = await parsedBuilder.build();
      const parsedHex = parsedTx.toBroadcastFormat();
      parsedHex.should.equal(freshHex);
    });

    it('should sign parsed unsigned tx and produce same result as fresh sign', async () => {
      const freshBuilder = new TransactionBuilderFactory(coins.get('tflrp'))
        .getImportInPBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .fromPubKey(testData.corethAddresses)
        .to(testData.pAddresses)
        .externalChainId(testData.sourceChainId)
        .feeState(testData.feeState)
        .context(testData.context)
        .decodedUtxos(testData.utxos);

      freshBuilder.sign({ key: testData.privateKeys[2] });
      freshBuilder.sign({ key: testData.privateKeys[0] });

      const freshTx = await freshBuilder.build();
      const parsedBuilder = new TransactionBuilderFactory(coins.get('tflrp')).from(testData.unsignedHex);
      parsedBuilder.sign({ key: testData.privateKeys[2] });
      parsedBuilder.sign({ key: testData.privateKeys[0] });
      const parsedTx = await parsedBuilder.build();
      parsedTx.toBroadcastFormat().should.equal(freshTx.toBroadcastFormat());
      parsedTx.id.should.equal(freshTx.id);
    });

    it('should correctly handle signing flow: build -> parse -> sign -> parse -> sign', async () => {
      const builder1 = new TransactionBuilderFactory(coins.get('tflrp'))
        .getImportInPBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .fromPubKey(testData.corethAddresses)
        .to(testData.pAddresses)
        .externalChainId(testData.sourceChainId)
        .feeState(testData.feeState)
        .context(testData.context)
        .decodedUtxos(testData.utxos);

      const unsignedTx = await builder1.build();
      const unsignedHex = unsignedTx.toBroadcastFormat();
      const builder2 = new TransactionBuilderFactory(coins.get('tflrp')).from(unsignedHex);
      builder2.sign({ key: testData.privateKeys[2] });
      const halfSignedTx = await builder2.build();
      const halfSignedHex = halfSignedTx.toBroadcastFormat();
      const builder3 = new TransactionBuilderFactory(coins.get('tflrp')).from(halfSignedHex);
      builder3.sign({ key: testData.privateKeys[0] });
      const fullSignedTx = await builder3.build();
      fullSignedTx.toBroadcastFormat().should.equal(testData.signedHex);
      fullSignedTx.id.should.equal(testData.txhash);
    });

    it('should have correct number of signatures after full sign flow', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tflrp')).from(testData.signedHex);
      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      txJson.signatures.length.should.equal(2);
    });

    it('should have 1 signature after half sign', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tflrp')).from(testData.halfSigntxHex);
      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      txJson.signatures.length.should.equal(1);
    });

    it('should have 0 signatures for unsigned tx', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tflrp')).from(testData.unsignedHex);
      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      txJson.signatures.length.should.equal(0);
    });
  });

  describe('UTXO address sorting fix - addresses in non-sorted order', () => {
    /**
     * This test suite verifies the fix for the address ordering bug.
     *
     * The issue: When the API returns UTXO addresses in a different order than how they're
     * stored on-chain (lexicographically sorted by byte value), the sigIndices would be
     * computed incorrectly, causing signature verification to fail.
     *
     * The fix: Sort UTXO addresses before computing addressesIndex to match on-chain order.
     *
     * We use the existing testData addresses but create UTXOs with different address orderings
     * to simulate the failed transaction scenario.
     */

    // Create UTXOs with addresses in different orders to test sorting
    const createUtxoWithAddressOrder = (addresses: string[]) => ({
      outputID: 7,
      amount: '50000000',
      txid: testData.utxos[0].txid,
      threshold: 2,
      addresses: addresses,
      outputidx: '0',
      locktime: '0',
    });

    it('should correctly sort UTXO addresses when building transaction', async () => {
      // Create UTXO with addresses in reversed order (simulating API returning unsorted)
      const reversedAddresses = [...testData.utxos[0].addresses].reverse();
      const utxoWithReversedAddresses = [createUtxoWithAddressOrder(reversedAddresses)];

      const txBuilder = factory
        .getImportInPBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .fromPubKey(testData.corethAddresses)
        .to(testData.pAddresses)
        .externalChainId(testData.sourceChainId)
        .feeState(testData.feeState)
        .context(testData.context)
        .decodedUtxos(utxoWithReversedAddresses);

      // Should not throw - the fix ensures addresses are sorted before computing sigIndices
      const tx = await txBuilder.build();
      const txJson = tx.toJson();

      txJson.type.should.equal(23); // Import type
      txJson.threshold.should.equal(2);
    });

    it('should produce same transaction hex regardless of input UTXO address order', async () => {
      // Build with original address order
      const txBuilder1 = factory
        .getImportInPBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .fromPubKey(testData.corethAddresses)
        .to(testData.pAddresses)
        .externalChainId(testData.sourceChainId)
        .feeState(testData.feeState)
        .context(testData.context)
        .decodedUtxos(testData.utxos);

      const tx1 = await txBuilder1.build();
      const hex1 = tx1.toBroadcastFormat();

      // Build with reversed address order in UTXO
      const reversedAddresses = [...testData.utxos[0].addresses].reverse();
      const utxoWithReversedAddresses = [createUtxoWithAddressOrder(reversedAddresses)];

      const txBuilder2 = factory
        .getImportInPBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .fromPubKey(testData.corethAddresses)
        .to(testData.pAddresses)
        .externalChainId(testData.sourceChainId)
        .feeState(testData.feeState)
        .context(testData.context)
        .decodedUtxos(utxoWithReversedAddresses);

      const tx2 = await txBuilder2.build();
      const hex2 = tx2.toBroadcastFormat();

      // Both should produce the same hex since addresses get sorted
      hex1.should.equal(hex2);
    });

    it('should handle multiple UTXOs with different address orders', async () => {
      // Create multiple UTXOs with addresses in different orders
      const addresses = testData.utxos[0].addresses;
      const multipleUtxos = [
        {
          outputID: 7,
          amount: '30000000',
          txid: testData.utxos[0].txid,
          threshold: 2,
          addresses: [addresses[0], addresses[1], addresses[2]], // Original order
          outputidx: '0',
          locktime: '0',
        },
        {
          outputID: 7,
          amount: '20000000',
          txid: '2bK27hnZ8FaR33bRBs6wrb1PkjJfseZrn3nD4LckW9gCwTrmGX',
          threshold: 2,
          addresses: [addresses[2], addresses[0], addresses[1]], // Different order
          outputidx: '0',
          locktime: '0',
        },
      ];

      const txBuilder = factory
        .getImportInPBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .fromPubKey(testData.corethAddresses)
        .to(testData.pAddresses)
        .externalChainId(testData.sourceChainId)
        .feeState(testData.feeState)
        .context(testData.context)
        .decodedUtxos(multipleUtxos);

      const tx = await txBuilder.build();
      const txJson = tx.toJson();

      // Should have 2 inputs from the 2 UTXOs
      txJson.inputs.length.should.equal(2);
      txJson.type.should.equal(23);
    });

    it('should produce valid transaction that can be parsed and rebuilt with unsorted addresses', async () => {
      const reversedAddresses = [...testData.utxos[0].addresses].reverse();
      const utxoWithReversedAddresses = [createUtxoWithAddressOrder(reversedAddresses)];

      const txBuilder = factory
        .getImportInPBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .fromPubKey(testData.corethAddresses)
        .to(testData.pAddresses)
        .externalChainId(testData.sourceChainId)
        .feeState(testData.feeState)
        .context(testData.context)
        .decodedUtxos(utxoWithReversedAddresses);

      const tx = await txBuilder.build();
      const txHex = tx.toBroadcastFormat();

      // Parse the transaction
      const parsedBuilder = new TransactionBuilderFactory(coins.get('tflrp')).from(txHex);
      const parsedTx = await parsedBuilder.build();
      const parsedHex = parsedTx.toBroadcastFormat();

      // Should produce identical hex
      parsedHex.should.equal(txHex);
    });

    it('should handle signing correctly with unsorted UTXO addresses', async () => {
      const reversedAddresses = [...testData.utxos[0].addresses].reverse();
      const utxoWithReversedAddresses = [createUtxoWithAddressOrder(reversedAddresses)];

      const txBuilder = factory
        .getImportInPBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .fromPubKey(testData.corethAddresses)
        .to(testData.pAddresses)
        .externalChainId(testData.sourceChainId)
        .feeState(testData.feeState)
        .context(testData.context)
        .decodedUtxos(utxoWithReversedAddresses);

      txBuilder.sign({ key: testData.privateKeys[2] });
      txBuilder.sign({ key: testData.privateKeys[0] });

      const tx = await txBuilder.build();
      const txJson = tx.toJson();

      // Should have 2 signatures after signing
      txJson.signatures.length.should.equal(2);
    });

    it('should produce valid signed transaction matching original test data signing flow', async () => {
      // This test verifies that with unsorted UTXO addresses, we still get the expected signed tx
      const reversedAddresses = [...testData.utxos[0].addresses].reverse();
      const utxoWithReversedAddresses = [createUtxoWithAddressOrder(reversedAddresses)];

      const txBuilder = factory
        .getImportInPBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .fromPubKey(testData.corethAddresses)
        .to(testData.pAddresses)
        .externalChainId(testData.sourceChainId)
        .feeState(testData.feeState)
        .context(testData.context)
        .decodedUtxos(utxoWithReversedAddresses);

      txBuilder.sign({ key: testData.privateKeys[2] });
      txBuilder.sign({ key: testData.privateKeys[0] });

      const tx = await txBuilder.build();

      // The signed tx should match the expected signedHex from testData
      tx.toBroadcastFormat().should.equal(testData.signedHex);
      tx.id.should.equal(testData.txhash);
    });
  });

  describe('fresh build with different UTXO address order', () => {
    it('should correctly set up addressMaps when UTXO addresses differ from fromAddresses order', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tflrp'))
        .getImportInPBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .fromPubKey(testData.corethAddresses)
        .to(testData.pAddresses)
        .externalChainId(testData.sourceChainId)
        .feeState(testData.feeState)
        .context(testData.context)
        .decodedUtxos(testData.utxos);

      const tx = await txBuilder.build();
      const txJson = tx.toJson();

      txJson.type.should.equal(23);
      txJson.threshold.should.equal(2);
    });

    it('should produce correct signatures when signing fresh build with different address order', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tflrp'))
        .getImportInPBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .fromPubKey(testData.corethAddresses)
        .to(testData.pAddresses)
        .externalChainId(testData.sourceChainId)
        .feeState(testData.feeState)
        .context(testData.context)
        .decodedUtxos(testData.utxos);

      txBuilder.sign({ key: testData.privateKeys[2] });
      txBuilder.sign({ key: testData.privateKeys[0] });

      const tx = await txBuilder.build();
      const txJson = tx.toJson();

      txJson.signatures.length.should.equal(2);
    });

    it('should produce matching tx when fresh build is parsed and rebuilt', async () => {
      const freshBuilder = new TransactionBuilderFactory(coins.get('tflrp'))
        .getImportInPBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .fromPubKey(testData.corethAddresses)
        .to(testData.pAddresses)
        .externalChainId(testData.sourceChainId)
        .feeState(testData.feeState)
        .context(testData.context)
        .decodedUtxos(testData.utxos);

      const freshTx = await freshBuilder.build();
      const freshHex = freshTx.toBroadcastFormat();

      const parsedBuilder = new TransactionBuilderFactory(coins.get('tflrp')).from(freshHex);
      const parsedTx = await parsedBuilder.build();
      const parsedHex = parsedTx.toBroadcastFormat();

      parsedHex.should.equal(freshHex);
    });

    it('should correctly complete full sign flow with different UTXO address order', async () => {
      const builder1 = new TransactionBuilderFactory(coins.get('tflrp'))
        .getImportInPBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .fromPubKey(testData.corethAddresses)
        .to(testData.pAddresses)
        .externalChainId(testData.sourceChainId)
        .feeState(testData.feeState)
        .context(testData.context)
        .decodedUtxos(testData.utxos);

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

    it('should handle signing in different order and still produce valid tx', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tflrp'))
        .getImportInPBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .fromPubKey(testData.corethAddresses)
        .to(testData.pAddresses)
        .externalChainId(testData.sourceChainId)
        .feeState(testData.feeState)
        .context(testData.context)
        .decodedUtxos(testData.utxos);

      txBuilder.sign({ key: testData.privateKeys[0] });
      txBuilder.sign({ key: testData.privateKeys[2] });

      const tx = await txBuilder.build();
      const txJson = tx.toJson();

      txJson.signatures.length.should.equal(2);
    });
  });
});
