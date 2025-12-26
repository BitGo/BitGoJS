import { coins, FlareNetwork } from '@bitgo/statics';
import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import * as assert from 'assert';
import { TransactionBuilderFactory } from '../../../src/lib/transactionBuilderFactory';
import { EXPORT_IN_C as testData } from '../../resources/transactionData/exportInC';

describe('ExportInCTxBuilder', function () {
  const coinConfig = coins.get('tflrp');
  const factory = new TransactionBuilderFactory(coinConfig);
  const txBuilder = factory.getExportInCBuilder();
  const FIXED_FEE = (coinConfig.network as FlareNetwork).txFee;

  describe('utxos ExportInCTxBuilder', function () {
    it('should throw an error when utxos are used', async function () {
      assert.throws(() => {
        txBuilder.utxos([]);
      }, new BuildTransactionError('utxos are not required in Export Tx in C-Chain'));
    });
  });

  describe('amount ExportInCTxBuilder', function () {
    it('should accept valid amounts in different formats', function () {
      const validAmounts = [BigInt(1000), '1000'];

      validAmounts.forEach((amount) => {
        assert.doesNotThrow(() => {
          txBuilder.amount(amount);
        });
      });
    });

    it('should throw error for invalid amounts', function () {
      const invalidAmounts = ['0', '-1'];

      invalidAmounts.forEach((amount) => {
        assert.throws(() => {
          txBuilder.amount(amount);
        }, BuildTransactionError);
      });
    });
  });

  describe('nonce ExportInCTxBuilder', function () {
    it('should accept valid nonces in different formats', function () {
      const validNonces = ['1', 1, 0];

      validNonces.forEach((nonce) => {
        assert.doesNotThrow(() => {
          txBuilder.nonce(nonce);
        });
      });
    });

    it('should throw error for negative nonce', function () {
      assert.throws(() => {
        txBuilder.nonce('-1');
      }, new BuildTransactionError('Nonce must be greater or equal than 0'));
    });
  });

  describe('to ExportInCTxBuilder', function () {
    const txBuilder = factory.getExportInCBuilder();

    it('should accept multiple P-addresses', function () {
      const pAddresses = testData.pAddresses;

      assert.doesNotThrow(() => {
        txBuilder.to(pAddresses);
      });
    });

    it('should accept single P-address', function () {
      assert.doesNotThrow(() => {
        txBuilder.to(testData.pAddresses[0]);
      });
    });

    it('should accept tilde-separated P-addresses string', function () {
      const pAddresses = testData.pAddresses.join('~');

      assert.doesNotThrow(() => {
        txBuilder.to(pAddresses);
      });
    });
  });

  describe('should build a export txn from C to P', () => {
    const newTxBuilder = () =>
      factory
        .getExportInCBuilder()
        .fromPubKey(testData.cHexAddress)
        .nonce(testData.nonce)
        .amount(testData.amount)
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .to(testData.pAddresses)
        .feeRate(testData.fee);

    it('Should create export tx with correct properties', async () => {
      const txBuilder = newTxBuilder();

      const tx = await txBuilder.build();
      const json = tx.toJson();

      // Verify transaction properties
      json.type.should.equal(TransactionType.Export);
      json.outputs.length.should.equal(1);
      json.outputs[0].value.should.equal(testData.amount);
      json.sourceChain.should.equal('C');
      json.destinationChain.should.equal('P');

      // Verify total fee includes fixedFee (P-chain import fee)
      const expectedTotalFee = BigInt(testData.fee) + BigInt(FIXED_FEE);
      const inputValue = BigInt(json.inputs[0].value);
      const outputValue = BigInt(json.outputs[0].value);
      const actualFee = inputValue - outputValue;
      actualFee.should.equal(expectedTotalFee);

      // Verify the transaction can be serialized and has valid format
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.startWith('0x');
      rawTx.length.should.be.greaterThan(100);
    });

    it('Should recover export tx from raw tx', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tflrp')).from(testData.unsignedHex);

      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(testData.unsignedHex);
    });

    it('Should recover signed export from signed raw tx', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tflrp')).from(testData.signedHex);
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(testData.signedHex);
      tx.id.should.equal(testData.txhash);
    });

    it('Should sign a export tx from scratch with correct properties', async () => {
      const txBuilder = newTxBuilder();

      txBuilder.sign({ key: testData.privateKey });
      const tx = await txBuilder.build();

      // Verify signature exists
      tx.signature.length.should.be.greaterThan(0);
      tx.signature[0].should.startWith('0x');

      // Verify transaction properties after signing
      const json = tx.toJson();
      json.type.should.equal(TransactionType.Export);
      json.outputs[0].value.should.equal(testData.amount);
    });

    it('Should full sign a export tx from unsigned raw tx', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tflrp')).from(testData.unsignedHex);
      txBuilder.sign({ key: testData.privateKey });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(testData.signedHex);
      tx.id.should.equal(testData.txhash);
    });

    it('Key cannot sign the transaction', () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tflrp'))
        .from(testData.unsignedHex)
        .fromPubKey(testData.pAddresses);
      txBuilder.sign({ key: testData.privateKey });
      txBuilder
        .build()
        .then(() => assert.fail('it can sign'))
        .catch((err) => {
          err.message.should.be.equal('Private key cannot sign the transaction');
        });
    });

    it('should verify on-chain tx id for signed C-chain export', async () => {
      const signedExportHex =
        '0x0000000000010000007278db5c30bed04c05ce209179812850bbb3fe6d46d7eef3744d814c0da555247900000000000000000000000000000000000000000000000000000000000000000000000117dbd11b9dd1c9be337353db7c14f9fb3662e5b50000000002ff3d1658734f94af871c3d131b56131b6fb7a0291eacadd261e69dfb42a9cdf6f7fddd00000000000000050000000158734f94af871c3d131b56131b6fb7a0291eacadd261e69dfb42a9cdf6f7fddd000000070000000002faf080000000000000000000000002000000033329be7d01cd3ebaae6654d7327dd9f17a2e15817e918a5e8083ae4c9f2f0ed77055c24bf3665001c7324437c96c7c8a6a152da2385c1db5c3ab1f910000000100000009000000018d1ac79d2e26d1c9689ca93b3b191c077dced2f201bdda132e74c3fc5ab9b10b6c85fd318dd6c0a99b327145977ac6ea6ff54cb8e9b7093b6bbe3545b3cc126400';
      const txBuilder = new TransactionBuilderFactory(coins.get('tflrp')).from(signedExportHex);
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(signedExportHex);
      tx.id.should.equal('3kXUsHix1bZRQ9hqUc24cp7sXFiy2LbPn6Eh2HQCAaMUi75s9');
    });
  });
});
