import assert from 'assert';
import 'should';
import * as testData from '../../resources/avaxp';
import * as errorMessage from '../../resources/errors';
import { TransactionBuilderFactory, DecodedUtxoObj } from '../../../src/lib';
import { coins } from '@bitgo/statics';

describe('AvaxP Import C2P Tx Builder', () => {
  const factory = new TransactionBuilderFactory(coins.get('tavaxp'));
  const data = testData.IMPORT_C;
  describe('validate txBuilder fields', () => {
    const txBuilder = factory.getImportInCBuilder();

    it('should fail validate Utxos empty string', () => {
      assert.throws(
        () => {
          txBuilder.validateUtxos([]);
        },
        (e) => e.message === errorMessage.ERROR_UTXOS_EMPTY
      );
    });

    it('should fail validate Utxos without amount field', () => {
      assert.throws(
        () => {
          txBuilder.validateUtxos([{ outputID: '' } as any as DecodedUtxoObj]);
        },
        (e) => e.message === errorMessage.ERROR_UTXOS_AMOUNT
      );
    });
  });

  describe('should build ', () => {
    const newTxBuilder = () =>
      new TransactionBuilderFactory(coins.get('tavaxp'))
        .getImportInCBuilder()
        .threshold(data.threshold)
        .locktime(0)
        .fromPubKey(data.pAddresses)
        .utxos(data.outputs)
        .to(data.to)
        .fee(data.fee);

    it('Should create import tx for same values', async () => {
      const txBuilder = newTxBuilder();

      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.unsignedTxHex);
    });

    it('Should recover import tx from raw tx', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(data.unsignedTxHex);

      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.unsignedTxHex);
    });

    it('Should create half signed import tx for same values', async () => {
      const txBuilder = newTxBuilder();

      txBuilder.sign({ key: data.privKey.prv1 });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.halfsigntxHex);
    });

    it('Should recover half signed import from raw tx', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp'))
        .from(data.halfsigntxHex)
        .fromPubKey(data.pAddresses);
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.halfsigntxHex);
    });

    it('Should half sign a import tx from unsigned raw tx', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp'))
        .from(data.unsignedTxHex)
        .fromPubKey(data.pAddresses);
      txBuilder.sign({ key: data.privKey.prv1 });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.halfsigntxHex);
    });

    it('Should recover half signed import from half signed raw tx', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp'))
        .from(data.halfsigntxHex)
        .fromPubKey(data.pAddresses);
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.halfsigntxHex);
    });

    it('Should recover signed import from signed raw tx', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp'))
        .from(data.fullsigntxHex)
        .fromPubKey(data.pAddresses);
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.fullsigntxHex);
    });

    it('Should full sign a import tx for same values', async () => {
      const txBuilder = newTxBuilder();

      txBuilder.sign({ key: data.privKey.prv1 });
      txBuilder.sign({ key: data.privKey.prv2 });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.fullsigntxHex);
    });

    it('Should full sign a import tx from half signed raw tx', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp'))
        .from(data.halfsigntxHex)
        .fromPubKey(data.pAddresses);
      txBuilder.sign({ key: data.privKey.prv2 });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.fullsigntxHex);
    });

    it('Should full sign a import tx from unsigned raw tx', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp'))
        .from(data.unsignedTxHex)
        .fromPubKey(data.pAddresses);
      txBuilder.sign({ key: data.privKey.prv1 });
      txBuilder.sign({ key: data.privKey.prv2 });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.fullsigntxHex);
    });

    it('Should full sign a import tx with recovery key for same values', async () => {
      const txBuilder = newTxBuilder().recoverMode(true);

      txBuilder.sign({ key: data.privKey.prv3 });
      txBuilder.sign({ key: data.privKey.prv2 });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.rFullsigntxHex);
    });

    it('Should recover half sign a import tx with recovery key from half signed raw tx', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp'))
        .from(data.rHalfsigntxHex)
        .fromPubKey(data.pAddresses);
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.rHalfsigntxHex);
    });

    it('Should full sign a import tx with recovery key from half signed raw tx', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp'))
        .from(data.rHalfsigntxHex)
        .fromPubKey(data.pAddresses);
      txBuilder.sign({ key: data.privKey.prv2 });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.rFullsigntxHex);
    });

    it('Should full sign a import tx with recovery key from unsigned raw tx', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp'))
        .from(data.rUnsignedTxHex)
        .fromPubKey(data.pAddresses);
      // txBuilder.recoverMode()
      txBuilder.sign({ key: data.privKey.prv3 });
      txBuilder.sign({ key: data.privKey.prv2 });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.rFullsigntxHex);
    });

    xit('Compare size and location of signatures in credentials for halfsign', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp'))
        .from(data.unsignedTxHex)
        .fromPubKey(data.pAddresses);
      txBuilder.sign({ key: data.privKey.prv1 });
      // look into credentials make sure that index 0 is signed with user key
    });
    xit('Compare size and location of signatures in credentials for full sign', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp'))
        .from(data.unsignedTxHex)
        .fromPubKey(data.pAddresses);
      txBuilder.sign({ key: data.privKey.prv1 });
      txBuilder.sign({ key: data.privKey.prv1 });
      // look into credentials make sure that index 0 and 2 is signed
    });
  });
  describe('Key cannot sign the transaction ', () => {
    it('Should full sign a import tx from unsigned raw tx', () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp'))
        .from(data.unsignedTxHex)
        .fromPubKey(data.pAddresses);
      txBuilder.sign({ key: data.privKey.prv2 });
      txBuilder
        .build()
        .then((ok) => assert.fail('it can sign'))
        .catch((err) => {
          err.message.should.be.equal(errorMessage.ERROR_KEY_CANNOT_SIGN);
        });
    });

    it('Should 2 full sign a import tx from unsigned raw tx', () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp'))
        .from(data.rUnsignedTxHex)
        .fromPubKey(data.pAddresses);
      txBuilder.sign({ key: data.privKey.prv1 });
      txBuilder
        .build()
        .then((ok) => assert.fail('it can sign'))
        .catch((err) => {
          err.message.should.be.equal(errorMessage.ERROR_KEY_CANNOT_SIGN);
        });
    });

    // HSM expected empty credential, we cannot verify if the next signature is the correct.
    xit('Should full sign a import tx from unsigned raw tx', () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(data.halfsigntxHex);
      txBuilder.sign({ key: data.privKey.prv2 });

      txBuilder
        .build()
        .then((ok) => assert.fail('it can sign'))
        .catch((err) => {
          err.message.should.be.equal(errorMessage.ERROR_KEY_CANNOT_SIGN);
        });
    });

    // HSM expected empty credential, we cannot verify if the next signature is the correct.
    xit('Should full sign a import tx from unsigned raw tx', () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp'))
        .from(data.rHalfsigntxHex)
        .fromPubKey(data.pAddresses);
      txBuilder.sign({ key: data.privKey.prv1 });
      txBuilder
        .build()
        .then((ok) => assert.fail('it can sign'))
        .catch((err) => {
          err.message.should.be.equal(errorMessage.ERROR_KEY_CANNOT_SIGN);
        });
    });
  });
});
