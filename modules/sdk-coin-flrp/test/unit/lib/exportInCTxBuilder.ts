import { coins } from '@bitgo/statics';
import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import * as assert from 'assert';
import { TransactionBuilderFactory, Transaction } from '../../../src/lib';
import { EXPORT_IN_C as testData } from '../../resources/transactionData/exportInC';
import { CONTEXT, ON_CHAIN_TEST_WALLET } from '../../resources/account';
import { FlrpContext } from '@bitgo/public-types';
import { secp256k1, UnsignedTx } from '@flarenetwork/flarejs';

describe('ExportInCTxBuilder', function () {
  const coinConfig = coins.get('tflrp');
  const factory = new TransactionBuilderFactory(coinConfig);
  const txBuilder = factory.getExportInCBuilder();

  describe('utxos validation', function () {
    it('should reject UTXOs since C-chain exports do not use UTXOs', async function () {
      assert.throws(() => {
        txBuilder.decodedUtxos([]);
      }, new BuildTransactionError('UTXOs are not required for Export Tx from C-Chain'));
    });
  });

  describe('amount validation', function () {
    it('should accept bigint and string amount formats', function () {
      const validAmounts = [BigInt(1000), '1000', '1000000000000000000'];

      validAmounts.forEach((amount) => {
        assert.doesNotThrow(() => {
          txBuilder.amount(amount);
        });
      });
    });

    it('should reject zero and negative amounts', function () {
      const invalidAmounts = ['0', '-1'];

      invalidAmounts.forEach((amount) => {
        assert.throws(() => {
          txBuilder.amount(amount);
        }, BuildTransactionError);
      });
    });
  });

  describe('nonce validation', function () {
    it('should accept string and number nonce formats including zero', function () {
      const validNonces = ['1', 1, 0];

      validNonces.forEach((nonce) => {
        assert.doesNotThrow(() => {
          txBuilder.nonce(nonce);
        });
      });
    });

    it('should reject negative nonce values', function () {
      assert.throws(() => {
        txBuilder.nonce('-1');
      }, new BuildTransactionError('Nonce must be greater or equal than 0'));
    });
  });

  describe('destination address (to) validation', function () {
    const txBuilder = factory.getExportInCBuilder();

    it('should accept array of P-chain addresses for multisig', function () {
      const pAddresses = testData.pAddresses;

      assert.doesNotThrow(() => {
        txBuilder.to(pAddresses);
      });
    });

    it('should accept single P-chain address string', function () {
      assert.doesNotThrow(() => {
        txBuilder.to(testData.pAddresses[0]);
      });
    });

    it('should accept tilde-separated P-chain addresses for multisig', function () {
      const pAddresses = testData.pAddresses.join('~');

      assert.doesNotThrow(() => {
        txBuilder.to(pAddresses);
      });
    });
  });

  describe('build C-chain to P-chain export transaction', () => {
    const newTxBuilder = () =>
      factory
        .getExportInCBuilder()
        .fromPubKey(testData.cHexAddress)
        .nonce(testData.nonce)
        .amount(testData.amount)
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .to(testData.pAddresses)
        .fee(testData.fee)
        .context(CONTEXT as FlrpContext);

    it('should build export tx with correct type, chains, amount, and fee deduction', async () => {
      const txBuilder = newTxBuilder();

      const tx = await txBuilder.build();
      const json = tx.toJson();

      json.type.should.equal(TransactionType.Export);
      json.outputs.length.should.equal(1);
      json.outputs[0].value.should.equal(testData.amount);
      json.sourceChain.should.equal('C');
      json.destinationChain.should.equal('P');

      // Verify fee is calculated correctly: actualFee = baseFee_adjusted × gasUnits
      // baseFee_adjusted = testData.fee / 1e9 = 25
      // gasUnits varies but fee should be > 0 and input > output
      const inputValue = BigInt(json.inputs[0].value);
      const outputValue = BigInt(json.outputs[0].value);
      const actualFee = inputValue - outputValue;
      (actualFee > 0n).should.be.true();
      (inputValue > outputValue).should.be.true();

      const rawTx = tx.toBroadcastFormat();
      rawTx.should.startWith('0x');
      rawTx.length.should.be.greaterThan(100);
    });

    it('should deserialize unsigned export tx from raw hex', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tflrp')).from(testData.unsignedHex);

      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(testData.unsignedHex);
    });

    it('should deserialize signed export tx and preserve tx id', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tflrp')).from(testData.signedHex);
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(testData.signedHex);
      tx.id.should.equal(testData.txhash);
    });

    it('should sign export tx built from scratch and produce valid signature', async () => {
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

    it('should sign unsigned raw tx and match expected signed hex and tx id', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tflrp')).from(testData.unsignedHex);
      txBuilder.sign({ key: testData.privateKey });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(testData.signedHex);
      tx.id.should.equal(testData.txhash);
    });

    it('should reject signing with key that does not match from address', () => {
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

    it('should compute correct tx id for on-chain verified signed export', async () => {
      const signedExportHex =
        '0x0000000000010000007278db5c30bed04c05ce209179812850bbb3fe6d46d7eef3744d814c0da555247900000000000000000000000000000000000000000000000000000000000000000000000117dbd11b9dd1c9be337353db7c14f9fb3662e5b50000000002ff3d1658734f94af871c3d131b56131b6fb7a0291eacadd261e69dfb42a9cdf6f7fddd00000000000000050000000158734f94af871c3d131b56131b6fb7a0291eacadd261e69dfb42a9cdf6f7fddd000000070000000002faf080000000000000000000000002000000033329be7d01cd3ebaae6654d7327dd9f17a2e15817e918a5e8083ae4c9f2f0ed77055c24bf3665001c7324437c96c7c8a6a152da2385c1db5c3ab1f910000000100000009000000018d1ac79d2e26d1c9689ca93b3b191c077dced2f201bdda132e74c3fc5ab9b10b6c85fd318dd6c0a99b327145977ac6ea6ff54cb8e9b7093b6bbe3545b3cc126400';
      const txBuilder = new TransactionBuilderFactory(coins.get('tflrp')).from(signedExportHex);
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(signedExportHex);
      tx.id.should.equal('3kXUsHix1bZRQ9hqUc24cp7sXFiy2LbPn6Eh2HQCAaMUi75s9');
    });
  });

  describe('MPC signing (threshold=1)', () => {
    it('should build and sign export from C-chain with threshold=1 using sign()', async () => {
      const mpcAddress = ON_CHAIN_TEST_WALLET.user.pChainAddress;

      const txBuilder = factory
        .getExportInCBuilder()
        .fromPubKey(testData.cHexAddress)
        .nonce(testData.nonce)
        .amount(testData.amount)
        .threshold(1)
        .locktime(0)
        .to(mpcAddress)
        .fee(testData.fee)
        .context(CONTEXT as FlrpContext);

      txBuilder.sign({ key: ON_CHAIN_TEST_WALLET.user.privateKey });
      const tx = await txBuilder.build();

      tx.signature.length.should.equal(1);
      tx.signature[0].should.startWith('0x');

      const json = tx.toJson();
      json.type.should.equal(TransactionType.Export);
      json.threshold.should.equal(1);
      json.sourceChain!.should.equal('C');
      json.destinationChain!.should.equal('P');
    });

    it('should build and sign export from C-chain with threshold=1 using addExternalSignature()', async () => {
      const mpcAddress = ON_CHAIN_TEST_WALLET.user.pChainAddress;

      const txBuilder = factory
        .getExportInCBuilder()
        .fromPubKey(testData.cHexAddress)
        .nonce(testData.nonce)
        .amount(testData.amount)
        .threshold(1)
        .locktime(0)
        .to(mpcAddress)
        .fee(testData.fee)
        .context(CONTEXT as FlrpContext);

      // Build unsigned
      const tx = (await txBuilder.build()) as Transaction;
      const unsignedHex = tx.toBroadcastFormat();

      // Simulate MPC: sign the unsigned bytes externally
      const unsignedTx = tx.getFlareTransaction() as UnsignedTx;
      const unsignedBytes = unsignedTx.toBytes();
      const signature = await secp256k1.sign(unsignedBytes, Buffer.from(ON_CHAIN_TEST_WALLET.user.privateKey, 'hex'));

      tx.addExternalSignature(signature);
      const signedHex = tx.toBroadcastFormat();
      signedHex.should.not.equal(unsignedHex);

      // Verify roundtrip
      const parsedBuilder = factory.from(signedHex);
      const parsedTx = await parsedBuilder.build();
      parsedTx.toBroadcastFormat().should.equal(signedHex);

      // Verify signature
      tx.signature.length.should.equal(1);
    });

    it('should produce same signed tx via sign() and addExternalSignature()', async () => {
      const mpcAddress = ON_CHAIN_TEST_WALLET.user.pChainAddress;
      const mpcPrivateKey = ON_CHAIN_TEST_WALLET.user.privateKey;

      // Build and sign via sign()
      const txBuilder1 = factory
        .getExportInCBuilder()
        .fromPubKey(testData.cHexAddress)
        .nonce(testData.nonce)
        .amount(testData.amount)
        .threshold(1)
        .locktime(0)
        .to(mpcAddress)
        .fee(testData.fee)
        .context(CONTEXT as FlrpContext);

      txBuilder1.sign({ key: mpcPrivateKey });
      const tx1 = await txBuilder1.build();
      const signedHex1 = tx1.toBroadcastFormat();

      // Build and sign via addExternalSignature()
      const txBuilder2 = factory
        .getExportInCBuilder()
        .fromPubKey(testData.cHexAddress)
        .nonce(testData.nonce)
        .amount(testData.amount)
        .threshold(1)
        .locktime(0)
        .to(mpcAddress)
        .fee(testData.fee)
        .context(CONTEXT as FlrpContext);

      const tx2 = (await txBuilder2.build()) as Transaction;
      const unsignedTx = tx2.getFlareTransaction() as UnsignedTx;
      const signature = await secp256k1.sign(unsignedTx.toBytes(), Buffer.from(mpcPrivateKey, 'hex'));
      tx2.addExternalSignature(signature);
      const signedHex2 = tx2.toBroadcastFormat();

      signedHex1.should.equal(signedHex2);
      tx1.id.should.equal(tx2.id);
    });

    it('should deserialize unsigned MPC tx and sign it', async () => {
      const mpcAddress = ON_CHAIN_TEST_WALLET.user.pChainAddress;

      const txBuilder = factory
        .getExportInCBuilder()
        .fromPubKey(testData.cHexAddress)
        .nonce(testData.nonce)
        .amount(testData.amount)
        .threshold(1)
        .locktime(0)
        .to(mpcAddress)
        .fee(testData.fee)
        .context(CONTEXT as FlrpContext);

      const unsignedTx = await txBuilder.build();
      const unsignedHex = unsignedTx.toBroadcastFormat();

      // Deserialize and sign
      const txBuilder2 = factory.from(unsignedHex);
      txBuilder2.sign({ key: ON_CHAIN_TEST_WALLET.user.privateKey });
      const signedTx = await txBuilder2.build();

      signedTx.signature.length.should.equal(1);

      // Verify roundtrip of signed tx
      const txBuilder3 = factory.from(signedTx.toBroadcastFormat());
      const parsedTx = await txBuilder3.build();
      parsedTx.toBroadcastFormat().should.equal(signedTx.toBroadcastFormat());
      parsedTx.id.should.equal(signedTx.id);
    });
  });
});
