import 'should';
import { TransactionBuilder } from '../../../src/lib';
import { coins } from '@bitgo/statics';
import { EXPORT_C } from '../../resources/exportC';

describe('AvaxC Export C2P Tx Builder', () => {
  const data = EXPORT_C;

  describe('should build ', () => {
    const newTxBuilder = () =>
      new TransactionBuilder(coins.get('tavaxc'))
        .export()
        .fromPubKey(data.cHexAddress)
        .nonce(data.nonce)
        .amount(data.amount)
        .threshold(data.threshold)
        .locktime(0)
        .to(data.pAddresses)
        .feeRate(data.fee);

    it('Should create export tx for same values', async () => {
      const txBuilder = newTxBuilder();

      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.unsignedTxHex);
    });

    it('Should recover export tx from raw tx', async () => {
      const txBuilder = new TransactionBuilder(coins.get('tavaxc'));
      txBuilder.from(data.unsignedTxHex);

      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.unsignedTxHex);
    });

    it('Should recover signed export  from signed raw tx', async () => {
      const txBuilder = new TransactionBuilder(coins.get('tavaxc'));
      txBuilder.from(data.fullsigntxHex);
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.fullsigntxHex);
    });

    it('Should full sign a export tx for same values', async () => {
      const txBuilder = newTxBuilder();

      txBuilder.sign({ key: data.privKey });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.fullsigntxHex);
    });

    it('Should full sign a export tx from unsigned raw tx', async () => {
      const txBuilder = new TransactionBuilder(coins.get('tavaxc'));
      txBuilder.from(data.unsignedTxHex);
      txBuilder.sign({ key: data.privKey });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.fullsigntxHex);
    });
  });
});
