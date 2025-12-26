import assert from 'assert';
import 'should';
import {
  EXPORT_IN_P as testData,
  EXPORT_IN_P_TWO_UTXOS as twoUtxoTestData,
  EXPORT_IN_P_NO_CHANGE as noChangeTestData,
} from '../../resources/transactionData/exportInP';
import { TransactionBuilderFactory, DecodedUtxoObj, Transaction } from '../../../src/lib';
import { coins, FlareNetwork } from '@bitgo/statics';
import signFlowTest from './signFlowTestSuit';

describe('Flrp Export In P Tx Builder', () => {
  const coinConfig = coins.get('tflrp');
  const factory = new TransactionBuilderFactory(coinConfig);

  describe('default fee', () => {
    const FIXED_FEE = (coinConfig.network as FlareNetwork).txFee;

    it('should set fixedFee (1000000) by default in constructor', () => {
      const txBuilder = factory.getExportInPBuilder();
      // The fixedFee should be set from network.txFee = '1000000'
      const transaction = (txBuilder as any).transaction;
      transaction._fee.fee.should.equal(FIXED_FEE);
    });

    it('should use default fixedFee when fee is not explicitly set', async () => {
      // Create a UTXO with enough balance to cover amount + default fee
      const amount = '500000000'; // 0.5 FLR
      const utxoAmount = (BigInt(amount) + BigInt(FIXED_FEE)).toString(); // amount + fixedFee

      const txBuilder = factory
        .getExportInPBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .fromPubKey(testData.pAddresses)
        .amount(amount)
        .externalChainId(testData.sourceChainId)
        // NOTE: .fee() is NOT called - should use default fixedFee
        .utxos([
          {
            outputID: 0,
            amount: utxoAmount,
            txid: '21hcD64N9QzdayPjhKLsBQBa8FyXcsJGNStBZ3vCRdCCEsLru2',
            outputidx: '0',
            addresses: testData.outputs[0].addresses,
            threshold: testData.threshold,
          },
        ]);

      const tx = (await txBuilder.build()) as Transaction;

      // Verify the fee in the built transaction equals the fixedFee
      tx.fee.fee.should.equal(FIXED_FEE);
    });
  });

  describe('validate txBuilder fields', () => {
    const txBuilder = factory.getExportInPBuilder();
    it('should fail amount low than zero', () => {
      assert.throws(
        () => {
          txBuilder.amount('-1');
        },
        (e: any) => e.message === 'Amount must be greater than 0'
      );
    });
    it('should fail target chain id length incorrect', () => {
      assert.throws(
        () => {
          txBuilder.externalChainId(Buffer.from(testData.INVALID_CHAIN_ID.slice(2)));
        },
        (e: any) => e.message === 'Chain id are 32 byte size'
      );
    });

    it('should fail target chain id not a valid base58 string', () => {
      assert.throws(
        () => {
          txBuilder.externalChainId(testData.INVALID_CHAIN_ID);
        },
        (e: any) => e.message === 'Non-base58 character'
      );
    });

    it('should fail target chain id cb58 invalid checksum', () => {
      assert.throws(
        () => {
          txBuilder.externalChainId(testData.VALID_C_CHAIN_ID.slice(2));
        },
        (e: any) => e.message === 'Invalid checksum'
      );
    });

    it('should fail validate Utxos empty string', () => {
      assert.throws(
        () => {
          txBuilder.validateUtxos([]);
        },
        (e: any) => e.message === 'UTXOs array cannot be empty'
      );
    });

    it('should fail validate Utxos without amount field', () => {
      assert.throws(
        () => {
          txBuilder.validateUtxos([{ outputID: '' } as any as DecodedUtxoObj]);
        },
        (e: any) => e.message === 'UTXO missing required field: amount'
      );
    });
  });

  signFlowTest({
    transactionType: 'Export P2C with changeoutput',
    newTxFactory: () => new TransactionBuilderFactory(coins.get('tflrp')),
    newTxBuilder: () =>
      new TransactionBuilderFactory(coins.get('tflrp'))
        .getExportInPBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .fromPubKey(testData.pAddresses)
        .amount(testData.amount)
        .externalChainId(testData.sourceChainId)
        .fee(testData.fee)
        .utxos(testData.outputs),
    unsignedTxHex: testData.unsignedHex,
    halfSignedTxHex: testData.halfSigntxHex,
    fullSignedTxHex: testData.fullSigntxHex,
    privateKey: {
      prv1: testData.privateKeys[0],
      prv2: testData.privateKeys[1],
    },
    txHash: testData.txhash,
  });

  signFlowTest({
    transactionType: 'Export P2C with 2 UTXOs',
    newTxFactory: () => new TransactionBuilderFactory(coins.get('tflrp')),
    newTxBuilder: () =>
      new TransactionBuilderFactory(coins.get('tflrp'))
        .getExportInPBuilder()
        .threshold(twoUtxoTestData.threshold)
        .locktime(twoUtxoTestData.locktime)
        .fromPubKey(twoUtxoTestData.pAddresses)
        .amount(twoUtxoTestData.amount)
        .externalChainId(twoUtxoTestData.sourceChainId)
        .fee(twoUtxoTestData.fee)
        .utxos(twoUtxoTestData.outputs),
    unsignedTxHex: twoUtxoTestData.unsignedHex,
    halfSignedTxHex: twoUtxoTestData.halfSigntxHex,
    fullSignedTxHex: twoUtxoTestData.fullSigntxHex,
    privateKey: {
      prv1: twoUtxoTestData.privateKeys[0],
      prv2: twoUtxoTestData.privateKeys[1],
    },
    txHash: twoUtxoTestData.txhash,
  });

  signFlowTest({
    transactionType: 'Export P2C with no change output',
    newTxFactory: () => new TransactionBuilderFactory(coins.get('tflrp')),
    newTxBuilder: () =>
      new TransactionBuilderFactory(coins.get('tflrp'))
        .getExportInPBuilder()
        .threshold(noChangeTestData.threshold)
        .locktime(noChangeTestData.locktime)
        .fromPubKey(noChangeTestData.pAddresses)
        .amount(noChangeTestData.amount)
        .externalChainId(noChangeTestData.sourceChainId)
        .fee(noChangeTestData.fee)
        .utxos(noChangeTestData.outputs),
    unsignedTxHex: noChangeTestData.unsignedHex,
    halfSignedTxHex: noChangeTestData.halfSigntxHex,
    fullSignedTxHex: noChangeTestData.fullSigntxHex,
    privateKey: {
      prv1: noChangeTestData.privateKeys[0],
      prv2: noChangeTestData.privateKeys[1],
    },
    txHash: noChangeTestData.txhash,
  });

  it('Should full sign a export tx from unsigned raw tx', () => {
    const txBuilder = new TransactionBuilderFactory(coins.get('tflrp')).from(testData.unsignedHex);
    txBuilder.sign({ key: testData.privateKeys[0] });
    txBuilder
      .build()
      .then(() => assert.fail('it can sign'))
      .catch((err) => {
        err.message.should.be.equal('Private key cannot sign the transaction');
      });
  });

  describe('on-chain verified transactions', () => {
    it('should verify on-chain tx id for signed P-chain export', async () => {
      const signedExportHex =
        '0x0000000000120000007200000000000000000000000000000000000000000000000000000000000000000000000158734f94af871c3d131b56131b6fb7a0291eacadd261e69dfb42a9cdf6f7fddd00000007000000001ac6e558000000000000000000000001000000033329be7d01cd3ebaae6654d7327dd9f17a2e15817e918a5e8083ae4c9f2f0ed77055c24bf3665001c7324437c96c7c8a6a152da2385c1db5c3ab1f9100000003862ce86ba2e28884e8b83f5d6266d274b33632a1cc213d4c12996037fc21b2020000000058734f94af871c3d131b56131b6fb7a0291eacadd261e69dfb42a9cdf6f7fddd00000005000000001d6c96c60000000100000000a4891dfbd024a53b8e4512427d919910568989b9b4846026ac7bcb8290494c260000000058734f94af871c3d131b56131b6fb7a0291eacadd261e69dfb42a9cdf6f7fddd0000000500000000003ffabc0000000100000000c1fb3b438f8f49e1bb657a59106be9f5f91d2efce5e0259fcbbb9458e271f80d0000000058734f94af871c3d131b56131b6fb7a0291eacadd261e69dfb42a9cdf6f7fddd000000050000000000400e7000000001000000000000000078db5c30bed04c05ce209179812850bbb3fe6d46d7eef3744d814c0da55524790000000158734f94af871c3d131b56131b6fb7a0291eacadd261e69dfb42a9cdf6f7fddd000000070000000002faf080000000000000000000000002000000033329be7d01cd3ebaae6654d7327dd9f17a2e15817e918a5e8083ae4c9f2f0ed77055c24bf3665001c7324437c96c7c8a6a152da2385c1db5c3ab1f91000000030000000900000001afdf0ac2bdbfb1735081dd859f4d263e587d81ba81c6bd2cb345ee5a66cef4e97a634c740f35ef6ba600796a5add1d91e69a14cfcb22b65e6ae0bcdfbcebfaba000000000900000001afdf0ac2bdbfb1735081dd859f4d263e587d81ba81c6bd2cb345ee5a66cef4e97a634c740f35ef6ba600796a5add1d91e69a14cfcb22b65e6ae0bcdfbcebfaba000000000900000001afdf0ac2bdbfb1735081dd859f4d263e587d81ba81c6bd2cb345ee5a66cef4e97a634c740f35ef6ba600796a5add1d91e69a14cfcb22b65e6ae0bcdfbcebfaba00';
      const txBuilder = new TransactionBuilderFactory(coins.get('tflrp')).from(signedExportHex);
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(signedExportHex);
      tx.id.should.equal('ka8at5CinmpUc6QMVr33dyUJi156LKMdodrJM59kS6EWr3vHg');
    });
  });
});
