import assert from 'assert';
import 'should';
import * as errorMessage from '../../resources/errors';
import { TransactionBuilderFactory } from '../../../src/lib';
import { coins } from '@bitgo/statics';
import { EXPORT_C } from '../../resources/tx/exportC';
import { BN } from 'avalanche';

describe('AvaxP Export C2P Tx Builder', () => {
  const factory = new TransactionBuilderFactory(coins.get('tavaxp'));
  const data = EXPORT_C;
  describe('validate txBuilder fields', () => {
    const txBuilder = factory.getExportInCBuilder();
    it('should fail amount low or equal than zero', () => {
      for (const amount of [new BN(0), new BN(-1), '0', '-1']) {
        assert.throws(
          () => {
            txBuilder.amount(amount);
          },
          (e: any) => e.message === errorMessage.ERROR_AMOUNT
        );
      }
    });

    it('should fail nonce low than zero', () => {
      for (const nonce of [-1, '-1']) {
        assert.throws(
          () => {
            txBuilder.nonce(nonce);
          },
          (e: any) => e.message === errorMessage.ERROR_NONCE
        );
      }
    });
  });

  describe('should build ', () => {
    const newTxBuilder = () =>
      factory
        .getExportInCBuilder()
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
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(data.unsignedTxHex);

      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.unsignedTxHex);
    });

    it('Should recover signed export  from signed raw tx', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(data.fullsigntxHex);
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
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(data.unsignedTxHex);
      txBuilder.sign({ key: data.privKey });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.fullsigntxHex);
    });
  });

  // TODO(BG-56700):  Improve canSign by check in addresses in empty credentials match signer
  xdescribe('Key cannot sign the transaction ', () => {
    it('Should full sign a export  tx from unsigned raw tx', () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp'))
        .from(data.unsignedTxHex)
        .fromPubKey(data.pAddresses);
      txBuilder.sign({ key: data.privKey });
      txBuilder
        .build()
        .then(() => assert.fail('it can sign'))
        .catch((err) => {
          err.message.should.be.equal(errorMessage.ERROR_KEY_CANNOT_SIGN);
        });
    });
  });
});
