import { BaseTransactionBuilder, BaseTransactionBuilderFactory } from '@bitgo/sdk-core';

export interface RecoverModeTestSuitArgs {
  transactionType: string;
  newTxFactory: () => BaseTransactionBuilderFactory;
  newTxBuilder: () => BaseTransactionBuilder;
  privateKey: { prv1: string; prv2: string; prv3: string };
}

/**
 * Test suite focusing on recovery mode signing.
 * In recovery mode, the backup key (prv3) is used instead of user key (prv1) along with BitGo key (prv2).
 * @param {RecoverModeTestSuitArgs} data with required info.
 */
export default function recoverModeTestSuit(data: RecoverModeTestSuitArgs): void {
  describe(`should test recovery mode for ${data.transactionType}`, () => {
    it('Should set recoverMode flag on builder', async () => {
      const txBuilder = data.newTxBuilder();
      // @ts-expect-error - accessing protected property for testing
      txBuilder.recoverSigner.should.equal(false);

      // @ts-expect-error - method exists on flrp TransactionBuilder
      txBuilder.recoverMode(true);
      // @ts-expect-error - accessing protected property for testing
      txBuilder.recoverSigner.should.equal(true);

      // @ts-expect-error - method exists on flrp TransactionBuilder
      txBuilder.recoverMode(false);
      // @ts-expect-error - accessing protected property for testing
      txBuilder.recoverSigner.should.equal(false);
    });

    it('Should default recoverMode to true when called without argument', async () => {
      const txBuilder = data.newTxBuilder();
      // @ts-expect-error - method exists on flrp TransactionBuilder
      txBuilder.recoverMode();
      // @ts-expect-error - accessing protected property for testing
      txBuilder.recoverSigner.should.equal(true);
    });

    it('Should build unsigned tx in recovery mode', async () => {
      const txBuilder = data.newTxBuilder();
      // @ts-expect-error - method exists on flrp TransactionBuilder
      txBuilder.recoverMode(true);
      const tx = await txBuilder.build();
      tx.toBroadcastFormat().should.be.a.String();
    });

    it('Should half sign tx in recovery mode using backup key (prv3)', async () => {
      const txBuilder = data.newTxBuilder();
      // @ts-expect-error - method exists on flrp TransactionBuilder
      txBuilder.recoverMode(true);

      // In recovery mode, sign with backup key (prv3) instead of user key (prv1)
      txBuilder.sign({ key: data.privateKey.prv3 });
      const tx = await txBuilder.build();
      const halfSignedHex = tx.toBroadcastFormat();
      halfSignedHex.should.be.a.String();
      halfSignedHex.length.should.be.greaterThan(0);
    });

    it('Should full sign tx in recovery mode using backup key (prv3) and bitgo key (prv2)', async () => {
      const txBuilder = data.newTxBuilder();
      // @ts-expect-error - method exists on flrp TransactionBuilder
      txBuilder.recoverMode(true);

      // In recovery mode: backup key (prv3) + bitgo key (prv2)
      txBuilder.sign({ key: data.privateKey.prv3 });
      txBuilder.sign({ key: data.privateKey.prv2 });
      const tx = await txBuilder.build();
      const fullSignedHex = tx.toBroadcastFormat();
      fullSignedHex.should.be.a.String();
      fullSignedHex.length.should.be.greaterThan(0);
    });

    it('Should produce different signed tx in recovery mode vs regular mode', async () => {
      // Build and sign in regular mode (user key prv1 + bitgo key prv2)
      const regularTxBuilder = data.newTxBuilder();
      // @ts-expect-error - method exists on flrp TransactionBuilder
      regularTxBuilder.recoverMode(false);
      regularTxBuilder.sign({ key: data.privateKey.prv1 });
      regularTxBuilder.sign({ key: data.privateKey.prv2 });
      const regularTx = await regularTxBuilder.build();
      const regularHex = regularTx.toBroadcastFormat();

      // Build and sign in recovery mode (backup key prv3 + bitgo key prv2)
      const recoveryTxBuilder = data.newTxBuilder();
      // @ts-expect-error - method exists on flrp TransactionBuilder
      recoveryTxBuilder.recoverMode(true);
      recoveryTxBuilder.sign({ key: data.privateKey.prv3 });
      recoveryTxBuilder.sign({ key: data.privateKey.prv2 });
      const recoveryTx = await recoveryTxBuilder.build();
      const recoveryHex = recoveryTx.toBroadcastFormat();

      // Both should be valid hex strings
      regularHex.should.be.a.String();
      recoveryHex.should.be.a.String();

      // The signed transactions should be different because different keys are used
      regularHex.should.not.equal(recoveryHex);

      // Signatures should also be different
      const regularSignatures = regularTx.signature;
      const recoverySignatures = recoveryTx.signature;
      regularSignatures.should.not.eql(recoverySignatures);
    });

    it('Should set recoverMode via factory and pass to builder from raw tx', async () => {
      // First build an unsigned transaction
      const txBuilder = data.newTxBuilder();
      const tx = await txBuilder.build();
      const unsignedHex = tx.toBroadcastFormat();

      // Parse from raw with recovery mode enabled on factory
      const factory = data.newTxFactory();
      // @ts-expect-error - accessing the method which may not be on base type
      if (typeof factory.recoverMode === 'function') {
        // @ts-expect-error - calling recoverMode on factory
        factory.recoverMode(true);
        const recoveredBuilder = factory.from(unsignedHex);
        // Cast to any to access protected property for testing
        (recoveredBuilder as any).recoverSigner.should.equal(true);
      }
    });
  });
}
