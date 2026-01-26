/**
 * Comprehensive test suite for signature index handling in FLRP atomic transactions.
 *
 * This tests the alignment with AVAX P implementation for:
 * 1. addressesIndex computation (mapping sender addresses to UTXO positions)
 * 2. Signature slot ordering (based on UTXO address positions)
 * 3. Two-phase signing flow (build -> parse -> sign -> parse -> sign)
 * 4. Different UTXO address orderings
 * 5. Mixed threshold UTXOs (threshold=1 and threshold=2)
 * 6. Recovery signing scenarios
 */
import 'should';
import { TransactionBuilderFactory } from '../../../src/lib';
import { coins } from '@bitgo/statics';
import { IMPORT_IN_P as importPTestData } from '../../resources/transactionData/importInP';
import { IMPORT_IN_C as importCTestData } from '../../resources/transactionData/importInC';
import { EXPORT_IN_P as exportPTestData } from '../../resources/transactionData/exportInP';

describe('Signature Index Handling - AVAX P Alignment', () => {
  const coinConfig = coins.get('tflrp');
  const newFactory = () => new TransactionBuilderFactory(coinConfig);

  describe('addressesIndex Computation', () => {
    describe('Import In P - addressesIndex scenarios', () => {
      it('should compute addressesIndex correctly when UTXO addresses differ from sender order', async () => {
        const txBuilder = newFactory()
          .getImportInPBuilder()
          .threshold(importPTestData.threshold)
          .locktime(importPTestData.locktime)
          .fromPubKey(importPTestData.corethAddresses)
          .to(importPTestData.pAddresses)
          .externalChainId(importPTestData.sourceChainId)
          .feeState(importPTestData.feeState)
          .context(importPTestData.context)
          .decodedUtxos(importPTestData.utxos);

        const tx = await txBuilder.build();
        const txJson = tx.toJson();

        txJson.type.should.equal(23);
        txJson.threshold.should.equal(2);
      });

      it('should handle UTXO where addresses match sender order exactly', async () => {
        const utxosMatchingOrder = [
          {
            ...importPTestData.utxos[0],
            addresses: [importPTestData.pAddresses[0], importPTestData.pAddresses[1], importPTestData.pAddresses[2]],
          },
        ];

        const txBuilder = newFactory()
          .getImportInPBuilder()
          .threshold(importPTestData.threshold)
          .locktime(importPTestData.locktime)
          .fromPubKey(importPTestData.corethAddresses)
          .to(importPTestData.pAddresses)
          .externalChainId(importPTestData.sourceChainId)
          .feeState(importPTestData.feeState)
          .context(importPTestData.context)
          .decodedUtxos(utxosMatchingOrder);

        txBuilder.sign({ key: importPTestData.privateKeys[2] });
        txBuilder.sign({ key: importPTestData.privateKeys[0] });

        const tx = await txBuilder.build();
        const txJson = tx.toJson();

        txJson.signatures.length.should.equal(2);
      });

      it('should handle UTXO where bitgo address comes before user in UTXO list', async () => {
        const utxosBitgoFirst = [
          {
            ...importPTestData.utxos[0],
            addresses: [importPTestData.pAddresses[1], importPTestData.pAddresses[0], importPTestData.pAddresses[2]],
          },
        ];

        const txBuilder = newFactory()
          .getImportInPBuilder()
          .threshold(importPTestData.threshold)
          .locktime(importPTestData.locktime)
          .fromPubKey(importPTestData.corethAddresses)
          .to(importPTestData.pAddresses)
          .externalChainId(importPTestData.sourceChainId)
          .feeState(importPTestData.feeState)
          .context(importPTestData.context)
          .decodedUtxos(utxosBitgoFirst);

        txBuilder.sign({ key: importPTestData.privateKeys[2] });
        txBuilder.sign({ key: importPTestData.privateKeys[0] });

        const tx = await txBuilder.build();
        const txJson = tx.toJson();

        txJson.signatures.length.should.equal(2);
        tx.toBroadcastFormat().should.be.a.String();
      });

      it('should handle UTXO where user address comes before bitgo in UTXO list', async () => {
        const utxosUserFirst = [
          {
            ...importPTestData.utxos[0],
            addresses: [importPTestData.pAddresses[0], importPTestData.pAddresses[1], importPTestData.pAddresses[2]],
          },
        ];

        const txBuilder = newFactory()
          .getImportInPBuilder()
          .threshold(importPTestData.threshold)
          .locktime(importPTestData.locktime)
          .fromPubKey(importPTestData.corethAddresses)
          .to(importPTestData.pAddresses)
          .externalChainId(importPTestData.sourceChainId)
          .feeState(importPTestData.feeState)
          .context(importPTestData.context)
          .decodedUtxos(utxosUserFirst);

        txBuilder.sign({ key: importPTestData.privateKeys[2] });
        txBuilder.sign({ key: importPTestData.privateKeys[0] });

        const tx = await txBuilder.build();
        const txJson = tx.toJson();

        txJson.signatures.length.should.equal(2);
        tx.toBroadcastFormat().should.be.a.String();
      });
    });

    describe('Import In C - addressesIndex scenarios', () => {
      it('should compute addressesIndex correctly for C-chain import with multiple UTXOs', async () => {
        const txBuilder = newFactory()
          .getImportInCBuilder()
          .threshold(importCTestData.threshold)
          .fromPubKey(importCTestData.pAddresses)
          .decodedUtxos(importCTestData.utxos)
          .to(importCTestData.to)
          .fee(importCTestData.fee)
          .context(importCTestData.context);

        const tx = await txBuilder.build();
        const txJson = tx.toJson();

        txJson.type.should.equal(23);
      });

      it('should handle multiple UTXOs with same address ordering', async () => {
        const txBuilder = newFactory()
          .getImportInCBuilder()
          .threshold(importCTestData.threshold)
          .fromPubKey(importCTestData.pAddresses)
          .decodedUtxos(importCTestData.utxos)
          .to(importCTestData.to)
          .fee(importCTestData.fee)
          .context(importCTestData.context);

        txBuilder.sign({ key: importCTestData.privateKeys[2] });
        txBuilder.sign({ key: importCTestData.privateKeys[0] });

        const tx = await txBuilder.build();
        const txJson = tx.toJson();

        txJson.signatures.length.should.equal(2);
      });
    });

    describe('Export In P - addressesIndex scenarios with mixed thresholds', () => {
      it('should handle UTXOs with different thresholds (threshold=1 and threshold=2)', async () => {
        const txBuilder = newFactory()
          .getExportInPBuilder()
          .threshold(exportPTestData.threshold)
          .locktime(exportPTestData.locktime)
          .fromPubKey(exportPTestData.pAddresses)
          .amount(exportPTestData.amount)
          .externalChainId(exportPTestData.sourceChainId)
          .feeState(exportPTestData.feeState)
          .context(exportPTestData.context)
          .decodedUtxos(exportPTestData.utxos);

        const tx = await txBuilder.build();
        const txJson = tx.toJson();

        txJson.type.should.equal(22);
      });

      it('should correctly sign threshold=1 UTXOs with single signature slot', async () => {
        const threshold1Utxos = exportPTestData.utxos
          .filter((u) => u.threshold === 1)
          .map((u) => ({
            ...u,
            amount: (BigInt(u.amount) * 2n).toString(),
          }));

        if (threshold1Utxos.length > 0) {
          const txBuilder = newFactory()
            .getExportInPBuilder()
            .threshold(exportPTestData.threshold)
            .locktime(exportPTestData.locktime)
            .fromPubKey(exportPTestData.pAddresses)
            .amount('20000000')
            .externalChainId(exportPTestData.sourceChainId)
            .feeState(exportPTestData.feeState)
            .context(exportPTestData.context)
            .decodedUtxos(threshold1Utxos);

          txBuilder.sign({ key: exportPTestData.privateKeys[2] });

          const tx = await txBuilder.build();
          tx.toBroadcastFormat().should.be.a.String();
        }
      });
    });
  });

  describe('Two-Phase Signing Flow', () => {
    describe('Import In P - Two-phase signing', () => {
      it('should correctly preserve addressesIndex through parse-sign-parse-sign flow', async () => {
        const builder1 = newFactory()
          .getImportInPBuilder()
          .threshold(importPTestData.threshold)
          .locktime(importPTestData.locktime)
          .fromPubKey(importPTestData.corethAddresses)
          .to(importPTestData.pAddresses)
          .externalChainId(importPTestData.sourceChainId)
          .feeState(importPTestData.feeState)
          .context(importPTestData.context)
          .decodedUtxos(importPTestData.utxos);

        const unsignedTx = await builder1.build();
        const unsignedHex = unsignedTx.toBroadcastFormat();
        unsignedTx.toJson().signatures.length.should.equal(0);

        const builder2 = newFactory().from(unsignedHex);
        builder2.sign({ key: importPTestData.privateKeys[2] });
        const halfSignedTx = await builder2.build();
        const halfSignedHex = halfSignedTx.toBroadcastFormat();
        halfSignedTx.toJson().signatures.length.should.equal(1);

        const builder3 = newFactory().from(halfSignedHex);
        builder3.sign({ key: importPTestData.privateKeys[0] });
        const fullSignedTx = await builder3.build();
        fullSignedTx.toJson().signatures.length.should.equal(2);

        fullSignedTx.toBroadcastFormat().should.equal(importPTestData.signedHex);
        fullSignedTx.id.should.equal(importPTestData.txhash);
      });

      it('should produce same result when signing in single phase vs two phases', async () => {
        const singlePhaseBuilder = newFactory()
          .getImportInPBuilder()
          .threshold(importPTestData.threshold)
          .locktime(importPTestData.locktime)
          .fromPubKey(importPTestData.corethAddresses)
          .to(importPTestData.pAddresses)
          .externalChainId(importPTestData.sourceChainId)
          .feeState(importPTestData.feeState)
          .context(importPTestData.context)
          .decodedUtxos(importPTestData.utxos);

        singlePhaseBuilder.sign({ key: importPTestData.privateKeys[2] });
        singlePhaseBuilder.sign({ key: importPTestData.privateKeys[0] });
        const singlePhaseTx = await singlePhaseBuilder.build();

        const builder1 = newFactory()
          .getImportInPBuilder()
          .threshold(importPTestData.threshold)
          .locktime(importPTestData.locktime)
          .fromPubKey(importPTestData.corethAddresses)
          .to(importPTestData.pAddresses)
          .externalChainId(importPTestData.sourceChainId)
          .feeState(importPTestData.feeState)
          .context(importPTestData.context)
          .decodedUtxos(importPTestData.utxos);

        const unsignedTx = await builder1.build();
        const builder2 = newFactory().from(unsignedTx.toBroadcastFormat());
        builder2.sign({ key: importPTestData.privateKeys[2] });
        const halfSignedTx = await builder2.build();
        const builder3 = newFactory().from(halfSignedTx.toBroadcastFormat());
        builder3.sign({ key: importPTestData.privateKeys[0] });
        const twoPhasesTx = await builder3.build();

        singlePhaseTx.toBroadcastFormat().should.equal(twoPhasesTx.toBroadcastFormat());
        singlePhaseTx.id.should.equal(twoPhasesTx.id);
      });

      it('should handle signing from parsed unsigned tx directly', async () => {
        const builder = newFactory().from(importPTestData.unsignedHex);
        builder.sign({ key: importPTestData.privateKeys[2] });
        builder.sign({ key: importPTestData.privateKeys[0] });
        const tx = await builder.build();

        tx.toBroadcastFormat().should.equal(importPTestData.signedHex);
        tx.id.should.equal(importPTestData.txhash);
      });

      it('should handle signing from parsed half-signed tx', async () => {
        const builder = newFactory().from(importPTestData.halfSigntxHex);
        builder.sign({ key: importPTestData.privateKeys[0] });
        const tx = await builder.build();

        tx.toBroadcastFormat().should.equal(importPTestData.signedHex);
        tx.id.should.equal(importPTestData.txhash);
      });
    });

    describe('Import In C - Two-phase signing', () => {
      it('should correctly handle two-phase signing for C-chain import', async () => {
        const builder1 = newFactory()
          .getImportInCBuilder()
          .threshold(importCTestData.threshold)
          .fromPubKey(importCTestData.pAddresses)
          .decodedUtxos(importCTestData.utxos)
          .to(importCTestData.to)
          .fee(importCTestData.fee)
          .context(importCTestData.context);

        const unsignedTx = await builder1.build();
        const unsignedHex = unsignedTx.toBroadcastFormat();

        const builder2 = newFactory().from(unsignedHex);
        builder2.sign({ key: importCTestData.privateKeys[2] });
        const halfSignedTx = await builder2.build();
        const halfSignedHex = halfSignedTx.toBroadcastFormat();

        const builder3 = newFactory().from(halfSignedHex);
        builder3.sign({ key: importCTestData.privateKeys[0] });
        const fullSignedTx = await builder3.build();

        fullSignedTx.toBroadcastFormat().should.equal(importCTestData.fullSigntxHex);
        fullSignedTx.id.should.equal(importCTestData.txhash);
      });

      it('should handle multiple UTXOs in two-phase signing', async () => {
        const builder1 = newFactory().from(importCTestData.unsignedHex);
        const unsignedTx = await builder1.build();
        unsignedTx.toJson().signatures.length.should.equal(0);

        const builder2 = newFactory().from(unsignedTx.toBroadcastFormat());
        builder2.sign({ key: importCTestData.privateKeys[2] });
        const halfSignedTx = await builder2.build();
        halfSignedTx.toJson().signatures.length.should.equal(1);

        const builder3 = newFactory().from(halfSignedTx.toBroadcastFormat());
        builder3.sign({ key: importCTestData.privateKeys[0] });
        const fullSignedTx = await builder3.build();
        fullSignedTx.toJson().signatures.length.should.equal(2);
      });
    });

    describe('Export In P - Two-phase signing with mixed thresholds', () => {
      it('should correctly handle two-phase signing with threshold=1 and threshold=2 UTXOs', async () => {
        const builder1 = newFactory()
          .getExportInPBuilder()
          .threshold(exportPTestData.threshold)
          .locktime(exportPTestData.locktime)
          .fromPubKey(exportPTestData.pAddresses)
          .amount(exportPTestData.amount)
          .externalChainId(exportPTestData.sourceChainId)
          .feeState(exportPTestData.feeState)
          .context(exportPTestData.context)
          .decodedUtxos(exportPTestData.utxos);

        const unsignedTx = await builder1.build();
        const unsignedHex = unsignedTx.toBroadcastFormat();

        const builder2 = newFactory().from(unsignedHex);
        builder2.sign({ key: exportPTestData.privateKeys[2] });
        const halfSignedTx = await builder2.build();
        const halfSignedHex = halfSignedTx.toBroadcastFormat();

        const builder3 = newFactory().from(halfSignedHex);
        builder3.sign({ key: exportPTestData.privateKeys[0] });
        const fullSignedTx = await builder3.build();

        fullSignedTx.toBroadcastFormat().should.equal(exportPTestData.fullSigntxHex);
        fullSignedTx.id.should.equal(exportPTestData.txhash);
      });
    });
  });

  describe('Signature Slot Ordering', () => {
    describe('Credential creation with embedded addresses', () => {
      it('should embed correct address in unsigned tx signature slots', async () => {
        const builder = newFactory()
          .getImportInPBuilder()
          .threshold(importPTestData.threshold)
          .locktime(importPTestData.locktime)
          .fromPubKey(importPTestData.corethAddresses)
          .to(importPTestData.pAddresses)
          .externalChainId(importPTestData.sourceChainId)
          .feeState(importPTestData.feeState)
          .context(importPTestData.context)
          .decodedUtxos(importPTestData.utxos);

        const tx = await builder.build();
        const hex = tx.toBroadcastFormat();

        hex.should.equal(importPTestData.unsignedHex);
      });

      it('should replace embedded address with actual signature after signing', async () => {
        const builder1 = newFactory().from(importPTestData.unsignedHex);
        builder1.sign({ key: importPTestData.privateKeys[2] });
        const halfSignedTx = await builder1.build();

        halfSignedTx.toBroadcastFormat().should.equal(importPTestData.halfSigntxHex);

        const builder2 = newFactory().from(halfSignedTx.toBroadcastFormat());
        builder2.sign({ key: importPTestData.privateKeys[0] });
        const fullSignedTx = await builder2.build();

        fullSignedTx.toBroadcastFormat().should.equal(importPTestData.signedHex);
      });
    });

    describe('Signing order independence', () => {
      it('should produce valid signatures regardless of which key signs first (fresh build)', async () => {
        const builder1 = newFactory()
          .getImportInPBuilder()
          .threshold(importPTestData.threshold)
          .locktime(importPTestData.locktime)
          .fromPubKey(importPTestData.corethAddresses)
          .to(importPTestData.pAddresses)
          .externalChainId(importPTestData.sourceChainId)
          .feeState(importPTestData.feeState)
          .context(importPTestData.context)
          .decodedUtxos(importPTestData.utxos);

        builder1.sign({ key: importPTestData.privateKeys[2] });
        builder1.sign({ key: importPTestData.privateKeys[0] });
        const tx1 = await builder1.build();

        const builder2 = newFactory()
          .getImportInPBuilder()
          .threshold(importPTestData.threshold)
          .locktime(importPTestData.locktime)
          .fromPubKey(importPTestData.corethAddresses)
          .to(importPTestData.pAddresses)
          .externalChainId(importPTestData.sourceChainId)
          .feeState(importPTestData.feeState)
          .context(importPTestData.context)
          .decodedUtxos(importPTestData.utxos);

        builder2.sign({ key: importPTestData.privateKeys[0] });
        builder2.sign({ key: importPTestData.privateKeys[2] });
        const tx2 = await builder2.build();

        tx1.toJson().signatures.length.should.equal(2);
        tx2.toJson().signatures.length.should.equal(2);

        tx1.id.should.be.a.String();
        tx1.id.length.should.be.greaterThan(0);
        tx2.id.should.be.a.String();
        tx2.id.length.should.be.greaterThan(0);
      });

      it('should produce identical tx when signing in expected slot order', async () => {
        const builder1 = newFactory()
          .getImportInPBuilder()
          .threshold(importPTestData.threshold)
          .locktime(importPTestData.locktime)
          .fromPubKey(importPTestData.corethAddresses)
          .to(importPTestData.pAddresses)
          .externalChainId(importPTestData.sourceChainId)
          .feeState(importPTestData.feeState)
          .context(importPTestData.context)
          .decodedUtxos(importPTestData.utxos);

        builder1.sign({ key: importPTestData.privateKeys[2] });
        builder1.sign({ key: importPTestData.privateKeys[0] });
        const tx1 = await builder1.build();

        const builder2 = newFactory()
          .getImportInPBuilder()
          .threshold(importPTestData.threshold)
          .locktime(importPTestData.locktime)
          .fromPubKey(importPTestData.corethAddresses)
          .to(importPTestData.pAddresses)
          .externalChainId(importPTestData.sourceChainId)
          .feeState(importPTestData.feeState)
          .context(importPTestData.context)
          .decodedUtxos(importPTestData.utxos);

        builder2.sign({ key: importPTestData.privateKeys[2] });
        builder2.sign({ key: importPTestData.privateKeys[0] });
        const tx2 = await builder2.build();

        tx1.toBroadcastFormat().should.equal(tx2.toBroadcastFormat());
        tx1.id.should.equal(tx2.id);
      });
    });
  });

  describe('Edge Cases', () => {
    describe('Transaction recovery and rebuild', () => {
      it('should preserve transaction structure when parsing and rebuilding unsigned tx', async () => {
        const builder = newFactory().from(importPTestData.unsignedHex);
        const tx = await builder.build();
        tx.toBroadcastFormat().should.equal(importPTestData.unsignedHex);
      });

      it('should preserve transaction structure when parsing and rebuilding half-signed tx', async () => {
        const builder = newFactory().from(importPTestData.halfSigntxHex);
        const tx = await builder.build();
        tx.toBroadcastFormat().should.equal(importPTestData.halfSigntxHex);
      });

      it('should preserve transaction structure when parsing and rebuilding fully-signed tx', async () => {
        const builder = newFactory().from(importPTestData.signedHex);
        const tx = await builder.build();
        tx.toBroadcastFormat().should.equal(importPTestData.signedHex);
        tx.id.should.equal(importPTestData.txhash);
      });
    });

    describe('Signature count validation', () => {
      it('should have 0 signatures for unsigned tx', async () => {
        const builder = newFactory().from(importPTestData.unsignedHex);
        const tx = await builder.build();
        tx.toJson().signatures.length.should.equal(0);
      });

      it('should have 1 signature for half-signed tx', async () => {
        const builder = newFactory().from(importPTestData.halfSigntxHex);
        const tx = await builder.build();
        tx.toJson().signatures.length.should.equal(1);
      });

      it('should have 2 signatures for fully-signed tx', async () => {
        const builder = newFactory().from(importPTestData.signedHex);
        const tx = await builder.build();
        tx.toJson().signatures.length.should.equal(2);
      });
    });

    describe('Multiple UTXOs with different address orderings', () => {
      it('should handle multiple UTXOs where each has different address order', async () => {
        const mixedOrderUtxos = [
          {
            ...importCTestData.utxos[0],
            addresses: [importCTestData.pAddresses[2], importCTestData.pAddresses[0], importCTestData.pAddresses[1]],
          },
          {
            ...importCTestData.utxos[1],
            addresses: [importCTestData.pAddresses[0], importCTestData.pAddresses[1], importCTestData.pAddresses[2]],
          },
          {
            ...importCTestData.utxos[2],
            addresses: [importCTestData.pAddresses[1], importCTestData.pAddresses[2], importCTestData.pAddresses[0]],
          },
        ];

        const txBuilder = newFactory()
          .getImportInCBuilder()
          .threshold(importCTestData.threshold)
          .fromPubKey(importCTestData.pAddresses)
          .decodedUtxos(mixedOrderUtxos)
          .to(importCTestData.to)
          .fee(importCTestData.fee)
          .context(importCTestData.context);

        txBuilder.sign({ key: importCTestData.privateKeys[2] });
        txBuilder.sign({ key: importCTestData.privateKeys[0] });

        const tx = await txBuilder.build();
        const txJson = tx.toJson();

        txJson.signatures.length.should.equal(2);
        tx.toBroadcastFormat().should.be.a.String();
      });
    });

    describe('Cross-builder consistency', () => {
      it('should use same addressesIndex logic across all atomic builders', async () => {
        const utxoAddresses = [
          importPTestData.pAddresses[2],
          importPTestData.pAddresses[0],
          importPTestData.pAddresses[1],
        ];

        // ImportInP
        const importPBuilder = newFactory()
          .getImportInPBuilder()
          .threshold(importPTestData.threshold)
          .locktime(importPTestData.locktime)
          .fromPubKey(importPTestData.corethAddresses)
          .to(importPTestData.pAddresses)
          .externalChainId(importPTestData.sourceChainId)
          .feeState(importPTestData.feeState)
          .context(importPTestData.context)
          .decodedUtxos([{ ...importPTestData.utxos[0], addresses: utxoAddresses }]);

        importPBuilder.sign({ key: importPTestData.privateKeys[2] });
        const importPTx = await importPBuilder.build();
        importPTx.toJson().signatures.length.should.equal(1);

        const importCBuilder = newFactory()
          .getImportInCBuilder()
          .threshold(importCTestData.threshold)
          .fromPubKey(importCTestData.pAddresses)
          .decodedUtxos([{ ...importCTestData.utxos[0], addresses: utxoAddresses }])
          .to(importCTestData.to)
          .fee(importCTestData.fee)
          .context(importCTestData.context);

        importCBuilder.sign({ key: importCTestData.privateKeys[2] });
        const importCTx = await importCBuilder.build();
        importCTx.toJson().signatures.length.should.equal(1);

        const exportPBuilder = newFactory()
          .getExportInPBuilder()
          .threshold(exportPTestData.threshold)
          .locktime(exportPTestData.locktime)
          .fromPubKey(exportPTestData.pAddresses)
          .amount('20000000')
          .externalChainId(exportPTestData.sourceChainId)
          .feeState(exportPTestData.feeState)
          .context(exportPTestData.context)
          .decodedUtxos([{ ...exportPTestData.utxos[1], addresses: utxoAddresses }]);

        exportPBuilder.sign({ key: exportPTestData.privateKeys[2] });
        const exportPTx = await exportPBuilder.build();
        exportPTx.toJson().signatures.length.should.equal(1);
      });
    });
  });

  describe('Real-world Scenario: Failed Transaction Fix Verification', () => {
    it('should correctly sign when UTXO addresses are in IMS order (not BitGo order)', async () => {
      const imsOrderUtxos = [
        {
          ...importPTestData.utxos[0],
          addresses: [importPTestData.pAddresses[1], importPTestData.pAddresses[2], importPTestData.pAddresses[0]],
        },
      ];

      const wpBuilder = newFactory()
        .getImportInPBuilder()
        .threshold(importPTestData.threshold)
        .locktime(importPTestData.locktime)
        .fromPubKey(importPTestData.corethAddresses)
        .to(importPTestData.pAddresses)
        .externalChainId(importPTestData.sourceChainId)
        .feeState(importPTestData.feeState)
        .context(importPTestData.context)
        .decodedUtxos(imsOrderUtxos);

      const unsignedTx = await wpBuilder.build();
      const unsignedHex = unsignedTx.toBroadcastFormat();

      const ovc1Builder = newFactory().from(unsignedHex);
      ovc1Builder.sign({ key: importPTestData.privateKeys[2] });
      const halfSignedTx = await ovc1Builder.build();
      const halfSignedHex = halfSignedTx.toBroadcastFormat();

      halfSignedTx.toJson().signatures.length.should.equal(1);

      const ovc2Builder = newFactory().from(halfSignedHex);
      ovc2Builder.sign({ key: importPTestData.privateKeys[0] });
      const fullSignedTx = await ovc2Builder.build();

      fullSignedTx.toJson().signatures.length.should.equal(2);

      const txId = fullSignedTx.id;
      txId.should.be.a.String();
      txId.length.should.be.greaterThan(0);
    });

    it('should handle the exact UTXO configuration from the failed production transaction', async () => {
      const builder1 = newFactory()
        .getImportInPBuilder()
        .threshold(importPTestData.threshold)
        .locktime(importPTestData.locktime)
        .fromPubKey(importPTestData.corethAddresses)
        .to(importPTestData.pAddresses)
        .externalChainId(importPTestData.sourceChainId)
        .feeState(importPTestData.feeState)
        .context(importPTestData.context)
        .decodedUtxos(importPTestData.utxos);

      const unsignedTx = await builder1.build();

      const builder2 = newFactory().from(unsignedTx.toBroadcastFormat());
      builder2.sign({ key: importPTestData.privateKeys[2] });
      const halfSignedTx = await builder2.build();

      const builder3 = newFactory().from(halfSignedTx.toBroadcastFormat());
      builder3.sign({ key: importPTestData.privateKeys[0] });
      const fullSignedTx = await builder3.build();

      fullSignedTx.toBroadcastFormat().should.equal(importPTestData.signedHex);
      fullSignedTx.id.should.equal(importPTestData.txhash);
    });
  });

  /**
   * Test suite for UTXO reordering fix.
   *
   * FlareJS's newImportTx/newExportTx functions sort inputs by UTXO ID (txid + outputidx)
   * for deterministic transaction building. The SDK must match inputs back to UTXOs
   * by UTXO ID, not by array index, to ensure credentials are created for the correct inputs.
   *
   * These tests verify that transactions with multiple UTXOs work correctly regardless
   * of the order in which UTXOs are provided.
   */
  describe('UTXO Reordering Fix - Multiple UTXOs with Different txids', () => {
    describe('ImportInC with reordered UTXOs', () => {
      it('should correctly handle multiple UTXOs that may get reordered by FlareJS', async () => {
        const reorderedUtxos = [importCTestData.utxos[4], importCTestData.utxos[0]];

        const txBuilder = newFactory()
          .getImportInCBuilder()
          .threshold(importCTestData.threshold)
          .fromPubKey(importCTestData.pAddresses)
          .decodedUtxos(reorderedUtxos)
          .to(importCTestData.to)
          .fee(importCTestData.fee)
          .context(importCTestData.context);

        txBuilder.sign({ key: importCTestData.privateKeys[2] });
        txBuilder.sign({ key: importCTestData.privateKeys[0] });

        const tx = await txBuilder.build();
        const txJson = tx.toJson();

        txJson.signatures.length.should.equal(2);
        tx.toBroadcastFormat().should.be.a.String();
        txJson.inputs.length.should.equal(2);
      });

      it('should correctly sign in parse-sign-parse-sign flow with multiple UTXOs', async () => {
        const reorderedUtxos = [importCTestData.utxos[3], importCTestData.utxos[1]];

        const builder1 = newFactory()
          .getImportInCBuilder()
          .threshold(importCTestData.threshold)
          .fromPubKey(importCTestData.pAddresses)
          .decodedUtxos(reorderedUtxos)
          .to(importCTestData.to)
          .fee(importCTestData.fee)
          .context(importCTestData.context);

        const unsignedTx = await builder1.build();
        unsignedTx.toJson().signatures.length.should.equal(0);

        const builder2 = newFactory().from(unsignedTx.toBroadcastFormat());
        builder2.sign({ key: importCTestData.privateKeys[2] });
        const halfSignedTx = await builder2.build();
        halfSignedTx.toJson().signatures.length.should.equal(1);

        const builder3 = newFactory().from(halfSignedTx.toBroadcastFormat());
        builder3.sign({ key: importCTestData.privateKeys[0] });
        const fullSignedTx = await builder3.build();
        fullSignedTx.toJson().signatures.length.should.equal(2);

        fullSignedTx.toBroadcastFormat().should.be.a.String();
        fullSignedTx.id.should.be.a.String();
      });

      it('should handle 3+ UTXOs with different ordering', async () => {
        const mixedUtxos = [importCTestData.utxos[2], importCTestData.utxos[4], importCTestData.utxos[0]];

        const txBuilder = newFactory()
          .getImportInCBuilder()
          .threshold(importCTestData.threshold)
          .fromPubKey(importCTestData.pAddresses)
          .decodedUtxos(mixedUtxos)
          .to(importCTestData.to)
          .fee(importCTestData.fee)
          .context(importCTestData.context);

        txBuilder.sign({ key: importCTestData.privateKeys[2] });
        txBuilder.sign({ key: importCTestData.privateKeys[0] });

        const tx = await txBuilder.build();
        tx.toJson().signatures.length.should.equal(2);
        tx.toJson().inputs.length.should.equal(3);
      });

      it('should handle all 5 UTXOs from test data', async () => {
        const allUtxosReversed = [...importCTestData.utxos].reverse();

        const txBuilder = newFactory()
          .getImportInCBuilder()
          .threshold(importCTestData.threshold)
          .fromPubKey(importCTestData.pAddresses)
          .decodedUtxos(allUtxosReversed)
          .to(importCTestData.to)
          .fee(importCTestData.fee)
          .context(importCTestData.context);

        txBuilder.sign({ key: importCTestData.privateKeys[2] });
        txBuilder.sign({ key: importCTestData.privateKeys[0] });

        const tx = await txBuilder.build();
        tx.toJson().signatures.length.should.equal(2);
        tx.toJson().inputs.length.should.equal(5);
      });
    });

    describe('ImportInP with multiple UTXOs', () => {
      it('should correctly handle multiple UTXOs with different outputidx', async () => {
        const multipleUtxos = [
          {
            ...importPTestData.utxos[0],
            outputidx: '1',
            amount: '25000000',
          },
          {
            ...importPTestData.utxos[0],
            outputidx: '0',
            amount: '25000000',
          },
        ];

        const txBuilder = newFactory()
          .getImportInPBuilder()
          .threshold(importPTestData.threshold)
          .locktime(importPTestData.locktime)
          .fromPubKey(importPTestData.corethAddresses)
          .to(importPTestData.pAddresses)
          .externalChainId(importPTestData.sourceChainId)
          .feeState(importPTestData.feeState)
          .context(importPTestData.context)
          .decodedUtxos(multipleUtxos);

        txBuilder.sign({ key: importPTestData.privateKeys[2] });
        txBuilder.sign({ key: importPTestData.privateKeys[0] });

        const tx = await txBuilder.build();
        tx.toJson().signatures.length.should.equal(2);
        tx.toJson().inputs.length.should.equal(2);
      });

      it('should correctly sign in parse-sign-parse-sign flow with multiple UTXOs', async () => {
        const multipleUtxos = [
          {
            ...importPTestData.utxos[0],
            outputidx: '1',
            amount: '25000000',
          },
          {
            ...importPTestData.utxos[0],
            outputidx: '0',
            amount: '25000000',
          },
        ];

        const builder1 = newFactory()
          .getImportInPBuilder()
          .threshold(importPTestData.threshold)
          .locktime(importPTestData.locktime)
          .fromPubKey(importPTestData.corethAddresses)
          .to(importPTestData.pAddresses)
          .externalChainId(importPTestData.sourceChainId)
          .feeState(importPTestData.feeState)
          .context(importPTestData.context)
          .decodedUtxos(multipleUtxos);

        const unsignedTx = await builder1.build();

        const builder2 = newFactory().from(unsignedTx.toBroadcastFormat());
        builder2.sign({ key: importPTestData.privateKeys[2] });
        const halfSignedTx = await builder2.build();

        const builder3 = newFactory().from(halfSignedTx.toBroadcastFormat());
        builder3.sign({ key: importPTestData.privateKeys[0] });
        const fullSignedTx = await builder3.build();

        fullSignedTx.toJson().signatures.length.should.equal(2);
        fullSignedTx.toBroadcastFormat().should.be.a.String();
      });
    });

    describe('ExportInP with multiple UTXOs', () => {
      it('should correctly handle multiple UTXOs that may get reordered', async () => {
        const reorderedUtxos = [
          {
            ...exportPTestData.utxos[1],
            outputidx: '1',
          },
          {
            ...exportPTestData.utxos[1],
            outputidx: '0',
          },
        ];

        const txBuilder = newFactory()
          .getExportInPBuilder()
          .threshold(exportPTestData.threshold)
          .locktime(exportPTestData.locktime)
          .fromPubKey(exportPTestData.pAddresses)
          .amount('20000000')
          .externalChainId(exportPTestData.sourceChainId)
          .feeState(exportPTestData.feeState)
          .context(exportPTestData.context)
          .decodedUtxos(reorderedUtxos);

        txBuilder.sign({ key: exportPTestData.privateKeys[2] });
        txBuilder.sign({ key: exportPTestData.privateKeys[0] });

        const tx = await txBuilder.build();
        tx.toJson().signatures.length.should.equal(2);
      });

      it('should correctly sign in parse-sign-parse-sign flow with multiple UTXOs', async () => {
        const reorderedUtxos = [
          {
            ...exportPTestData.utxos[1],
            outputidx: '1',
          },
          {
            ...exportPTestData.utxos[1],
            outputidx: '0',
          },
        ];

        const builder1 = newFactory()
          .getExportInPBuilder()
          .threshold(exportPTestData.threshold)
          .locktime(exportPTestData.locktime)
          .fromPubKey(exportPTestData.pAddresses)
          .amount('20000000')
          .externalChainId(exportPTestData.sourceChainId)
          .feeState(exportPTestData.feeState)
          .context(exportPTestData.context)
          .decodedUtxos(reorderedUtxos);

        const unsignedTx = await builder1.build();

        const builder2 = newFactory().from(unsignedTx.toBroadcastFormat());
        builder2.sign({ key: exportPTestData.privateKeys[2] });
        const halfSignedTx = await builder2.build();

        const builder3 = newFactory().from(halfSignedTx.toBroadcastFormat());
        builder3.sign({ key: exportPTestData.privateKeys[0] });
        const fullSignedTx = await builder3.build();

        fullSignedTx.toJson().signatures.length.should.equal(2);
        fullSignedTx.toBroadcastFormat().should.be.a.String();
      });
    });

    describe('Edge cases for UTXO matching', () => {
      it('should match UTXOs by both txid AND outputidx', async () => {
        const sameIdUtxos = [
          {
            ...importCTestData.utxos[0],
            outputidx: '2',
          },
          {
            ...importCTestData.utxos[0],
            outputidx: '0',
          },
        ];

        const txBuilder = newFactory()
          .getImportInCBuilder()
          .threshold(importCTestData.threshold)
          .fromPubKey(importCTestData.pAddresses)
          .decodedUtxos(sameIdUtxos)
          .to(importCTestData.to)
          .fee(importCTestData.fee)
          .context(importCTestData.context);

        txBuilder.sign({ key: importCTestData.privateKeys[2] });
        txBuilder.sign({ key: importCTestData.privateKeys[0] });

        const tx = await txBuilder.build();
        tx.toJson().signatures.length.should.equal(2);
        tx.toJson().inputs.length.should.equal(2);
      });

      it('should work correctly when UTXOs are already in sorted order', async () => {
        const sortedUtxos = [importCTestData.utxos[0], importCTestData.utxos[1]];

        const txBuilder = newFactory()
          .getImportInCBuilder()
          .threshold(importCTestData.threshold)
          .fromPubKey(importCTestData.pAddresses)
          .decodedUtxos(sortedUtxos)
          .to(importCTestData.to)
          .fee(importCTestData.fee)
          .context(importCTestData.context);

        txBuilder.sign({ key: importCTestData.privateKeys[2] });
        txBuilder.sign({ key: importCTestData.privateKeys[0] });

        const tx = await txBuilder.build();
        tx.toJson().signatures.length.should.equal(2);
      });
    });
  });
});
