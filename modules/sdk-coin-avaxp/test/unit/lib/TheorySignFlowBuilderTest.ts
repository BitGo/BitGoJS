import { BaseTransactionBuilder, BaseTransactionBuilderFactory } from '@bitgo/sdk-core';

export interface TheoryData {
  transactionType: string;
  newTxFactory: () => BaseTransactionBuilderFactory;
  newTxBuilder: () => BaseTransactionBuilder;
  unsignedTxHex: string;
  halfsigntxHex: string;
  fullsigntxHex: string;
  privKey: { prv1: string; prv2: string };
}

export default function signFlowTest(data: TheoryData): void {
  describe(`should sign ${data.transactionType} in full flow `, () => {
    it('Should create tx for same values', async () => {
      const txBuilder = data.newTxBuilder();
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.unsignedTxHex);
    });

    it('Should recovertx from raw tx', async () => {
      const txBuilder = data.newTxFactory().from(data.unsignedTxHex);
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.unsignedTxHex);
    });

    it('Should create half signedtx for same values', async () => {
      const txBuilder = data.newTxBuilder();

      txBuilder.sign({ key: data.privKey.prv1 });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.halfsigntxHex);
    });

    it('Should recover half signed tx from raw tx', async () => {
      const txBuilder = data.newTxFactory().from(data.halfsigntxHex);
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.halfsigntxHex);
    });

    it('Should half sign tx from unsigned raw tx', async () => {
      const txBuilder = data.newTxFactory().from(data.unsignedTxHex);
      txBuilder.sign({ key: data.privKey.prv1 });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.halfsigntxHex);
    });

    it('Should recover half signed tx from half signed raw tx', async () => {
      const txBuilder = data.newTxFactory().from(data.halfsigntxHex);
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.halfsigntxHex);
    });

    it('Should recover signed tx from signed raw tx', async () => {
      const txBuilder = data.newTxFactory().from(data.fullsigntxHex);
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.fullsigntxHex);
    });

    it('Should full sign a tx for same values', async () => {
      const txBuilder = data.newTxBuilder();

      txBuilder.sign({ key: data.privKey.prv1 });
      txBuilder.sign({ key: data.privKey.prv2 });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.fullsigntxHex);
    });

    it('Should full sign a tx from half signed raw tx', async () => {
      const txBuilder = data.newTxFactory().from(data.halfsigntxHex);
      txBuilder.sign({ key: data.privKey.prv2 });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.fullsigntxHex);
    });

    it('Should full sign a tx from unsigned raw tx', async () => {
      const txBuilder = data.newTxFactory().from(data.unsignedTxHex);
      txBuilder.sign({ key: data.privKey.prv1 });
      txBuilder.sign({ key: data.privKey.prv2 });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.fullsigntxHex);
    });
  });
}
