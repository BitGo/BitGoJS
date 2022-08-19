import assert from 'assert';
import 'should';
import * as testData from '../../resources/avaxp';
import * as errorMessage from '../../resources/errors';
import { TransactionBuilderFactory, DecodedUtxoObj } from '../../../src/lib';
import { coins } from '@bitgo/statics';

describe('AvaxP Export P2C Tx Builder', () => {
  const factory = new TransactionBuilderFactory(coins.get('tavaxp'));
  const data = testData.EXPORT_P_2_C;
  describe('validate txBuilder fields', () => {
    const txBuilder = factory.getExportBuilder();
    it('should fail amount low than zero', () => {
      assert.throws(
        () => {
          txBuilder.amount('-1');
        },
        (e) => e.message === errorMessage.ERROR_AMOUNT
      );
    });
    it('should fail target chain id length incorrect', () => {
      assert.throws(
        () => {
          txBuilder.targetChainId(Buffer.from(testData.INVALID_CHAIN_ID));
        },
        (e) => e.message === errorMessage.ERROR_CHAIN_ID_LENGTH
      );
    });

    it('should fail target chain id not a vaild base58 string', () => {
      assert.throws(
        () => {
          txBuilder.targetChainId(testData.INVALID_CHAIN_ID);
        },
        (e) => e.message === errorMessage.ERROR_CHAIN_ID_NOT_BASE58
      );
    });

    it('should fail target chain id cb58 invalid checksum', () => {
      assert.throws(
        () => {
          txBuilder.targetChainId(testData.VALID_C_CHAIN_ID.slice(2));
        },
        (e) => e.message === errorMessage.ERROR_CHAIN_ID_INVALID_CHECKSUM
      );
    });

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
        .getExportBuilder()
        .threshold(data.threshold)
        .locktime(data.locktime)
        .fromPubKey(data.pAddresses)
        .amount(data.amount)
        .targetChainId(data.targetChainId)
        .memo(data.memo)
        .utxos(data.outputs);

    it('Should create Export tx for same values', async () => {
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

    it('Should create half signed export tx for same values', async () => {
      const txBuilder = newTxBuilder();

      txBuilder.sign({ key: data.privKey.prv1 });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.halfsigntxHex);
    });

    it('Should recover half signed export from raw tx', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(data.halfsigntxHex);
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.halfsigntxHex);
    });

    it('Should half sign a export tx from unsigned raw tx', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(data.unsignedTxHex);
      txBuilder.sign({ key: data.privKey.prv1 });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.halfsigntxHex);
    });

    it('Should recover half signed export from half signed raw tx', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(data.halfsigntxHex);
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.halfsigntxHex);
    });

    it('Should recover signed export from signed raw tx', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(data.fullsigntxHex);
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.fullsigntxHex);
    });

    it('Should full sign a export tx for same values', async () => {
      const txBuilder = newTxBuilder();

      txBuilder.sign({ key: data.privKey.prv1 });
      txBuilder.sign({ key: data.privKey.prv2 });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.fullsigntxHex);
    });

    it('Should full sign a export tx from half signed raw tx', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(data.halfsigntxHex);
      txBuilder.sign({ key: data.privKey.prv2 });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.fullsigntxHex);
    });

    it('Should full sign a export tx from unsigned raw tx', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(data.unsignedTxHex);
      txBuilder.sign({ key: data.privKey.prv1 });
      txBuilder.sign({ key: data.privKey.prv2 });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.fullsigntxHex);
    });

    it('Should full sign a export tx with recovery key for same values', async () => {
      const txBuilder = newTxBuilder().recoverMode(true);

      txBuilder.sign({ key: data.privKey.prv3 });
      txBuilder.sign({ key: data.privKey.prv2 });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.rFullsigntxHex);
    });

    it('Should recover half sign a export tx with recovery key from half signed raw tx', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(data.rHalfsigntxHex);
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.rHalfsigntxHex);
    });

    it('Should full sign a export tx with recovery key from half signed raw tx', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(data.rHalfsigntxHex);
      txBuilder.sign({ key: data.privKey.prv2 });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.rFullsigntxHex);
    });

    it('Should full sign a export tx with recovery key from unsigned raw tx', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(data.rUnsignedTxHex);
      // txBuilder.recoverMode()
      txBuilder.sign({ key: data.privKey.prv3 });
      txBuilder.sign({ key: data.privKey.prv2 });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(data.rFullsigntxHex);
    });

    xit('Compare size and location of signatures in credentials for halfsign', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(data.unsignedTxHex);
      txBuilder.sign({ key: data.privKey.prv1 });
      // look into credentials make sure that index 0 is signed with user key
    });
    xit('Compare size and location of signatures in credentials for full sign', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(data.unsignedTxHex);
      txBuilder.sign({ key: data.privKey.prv1 });
      txBuilder.sign({ key: data.privKey.prv1 });
      // look into credentials make sure that index 0 and 2 is signed
    });
  });
  describe('Key cannot sign the transaction ', () => {
    it('Should full sign a export tx from unsigned raw tx', () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(data.unsignedTxHex);
      txBuilder.sign({ key: data.privKey.prv2 });
      txBuilder
        .build()
        .then((ok) => assert.fail('it can sign'))
        .catch((err) => {
          err.message.should.be.equal(errorMessage.ERROR_KEY_CANNOT_SIGN);
        });
    });

    it('Should 2 full sign a export tx from unsigned raw tx', () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(data.rUnsignedTxHex);
      txBuilder.sign({ key: data.privKey.prv1 });
      txBuilder
        .build()
        .then((ok) => assert.fail('it can sign'))
        .catch((err) => {
          err.message.should.be.equal(errorMessage.ERROR_KEY_CANNOT_SIGN);
        });
    });

    // HSM expected empty credential, we cannot verify if the next signature is the correct.
    xit('Should full sign a export tx from unsigned raw tx', () => {
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
    xit('Should full sign a export tx from unsigned raw tx', () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(data.rHalfsigntxHex);
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
