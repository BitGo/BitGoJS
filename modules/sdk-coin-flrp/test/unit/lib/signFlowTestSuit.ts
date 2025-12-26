import { BaseTransactionBuilder, BaseTransactionBuilderFactory } from '@bitgo/sdk-core';

export interface signFlowTestSuitArgs {
  transactionType: string;
  newTxFactory: () => BaseTransactionBuilderFactory;
  newTxBuilder: () => BaseTransactionBuilder;
  unsignedTxHex: string;
  halfSignedTxHex: string;
  fullSignedTxHex: string;
  privateKey: { prv1: string; prv2: string };
  txHash: string;
}

/**
 * Test suit focus in raw tx signing changes.
 * @param {signFlowTestSuitArgs} data with require info.
 */
export default function signFlowTestSuit(data: signFlowTestSuitArgs): void {
  describe(`should sign ${data.transactionType} in full flow `, () => {
    it('Should create tx for same values', async () => {
      const txBuilder = data.newTxBuilder();
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.unsignedTxHex);
    });

    it('Should recover tx from raw tx', async () => {
      const txBuilder = data.newTxFactory().from(data.unsignedTxHex);
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.unsignedTxHex);
    });

    it('Should create half signed tx for same values', async () => {
      const txBuilder = data.newTxBuilder();

      txBuilder.sign({ key: data.privateKey.prv1 });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.halfSignedTxHex);
    });

    it('Should recover half signed tx from raw tx', async () => {
      const txBuilder = data.newTxFactory().from(data.halfSignedTxHex);
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.halfSignedTxHex);
    });

    it('Should half sign tx from unsigned raw tx', async () => {
      const txBuilder = data.newTxFactory().from(data.unsignedTxHex);
      txBuilder.sign({ key: data.privateKey.prv1 });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.halfSignedTxHex);
    });

    it('Should recover half signed tx from half signed raw tx', async () => {
      const txBuilder = data.newTxFactory().from(data.halfSignedTxHex);
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.halfSignedTxHex);
    });

    it('Should recover signed tx from signed raw tx', async () => {
      const txBuilder = data.newTxFactory().from(data.fullSignedTxHex);
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.fullSignedTxHex);
      tx.id.should.equal(data.txHash);
    });

    it('Should full sign a tx for same values', async () => {
      const txBuilder = data.newTxBuilder();

      txBuilder.sign({ key: data.privateKey.prv1 });
      txBuilder.sign({ key: data.privateKey.prv2 });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.fullSignedTxHex);
      tx.id.should.equal(data.txHash);
    });

    it('Should full sign a tx from half signed raw tx', async () => {
      const txBuilder = data.newTxFactory().from(data.halfSignedTxHex);
      txBuilder.sign({ key: data.privateKey.prv2 });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.fullSignedTxHex);
      tx.id.should.equal(data.txHash);
    });

    it('Should full sign a tx from unsigned raw tx', async () => {
      const txBuilder = data.newTxFactory().from(data.unsignedTxHex);
      txBuilder.sign({ key: data.privateKey.prv1 });
      txBuilder.sign({ key: data.privateKey.prv2 });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.fullSignedTxHex);
      tx.id.should.equal(data.txHash);
    });
  });
}
