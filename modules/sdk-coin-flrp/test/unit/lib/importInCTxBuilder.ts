import assert from 'assert';
import 'should';
import { TransactionBuilderFactory, DecodedUtxoObj } from '../../../src/lib';
import { coins } from '@bitgo/statics';
import { IMPORT_IN_C as testData } from '../../resources/transactionData/importInC';
import signFlowTest from './signFlowTestSuit';

describe('Flrp Import In C Tx Builder', () => {
  const factory = new TransactionBuilderFactory(coins.get('tflrp'));
  describe('validate txBuilder fields', () => {
    const txBuilder = factory.getImportInCBuilder();

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
    transactionType: 'Import C2P',
    newTxFactory: () => new TransactionBuilderFactory(coins.get('tflrp')),
    newTxBuilder: () =>
      new TransactionBuilderFactory(coins.get('tflrp'))
        .getImportInCBuilder()
        .threshold(testData.threshold)
        .fromPubKey(testData.pAddresses)
        .utxos(testData.outputs)
        .to(testData.to)
        .feeRate(testData.fee),
    unsignedTxHex: testData.unsignedHex,
    halfSignedTxHex: testData.halfSigntxHex,
    fullSignedTxHex: testData.fullSigntxHex,
    privateKey: {
      prv1: testData.privateKeys[0],
      prv2: testData.privateKeys[1],
    },
    txHash: testData.txhash,
  });

  describe('on-chain verified transactions', () => {
    it('should verify on-chain tx id for signed C-chain import', async () => {
      const signedImportHex =
        '0x0000000000000000007278db5c30bed04c05ce209179812850bbb3fe6d46d7eef3744d814c0da555247900000000000000000000000000000000000000000000000000000000000000000000000162ef0c8ced5668d1230c82e274f5c19357df8c005743367421e8a2b48c73989a0000000158734f94af871c3d131b56131b6fb7a0291eacadd261e69dfb42a9cdf6f7fddd000000050000000002faf0800000000200000000000000010000000117dbd11b9dd1c9be337353db7c14f9fb3662e5b50000000002aea54058734f94af871c3d131b56131b6fb7a0291eacadd261e69dfb42a9cdf6f7fddd000000010000000900000002ab32c15c75c763b24adf26eee85aa7d6a76b366e6b88e34b94f76baec91bae7336a32ed637fc232cccb2f772d3092eee66594070a2be92751148feffc76005b1013ee78fb11f3f9ffd90d970cd5c95e9dee611bb4feafaa0b0220cc641ef054c9f5701fde4fad2fe7f2594db9dafd858c62f9cf6fe6b58334d73da40a5a8412d4600';
      const txBuilder = new TransactionBuilderFactory(coins.get('tflrp')).from(signedImportHex);
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(signedImportHex);
      tx.id.should.equal('2ks9vW1SVWD4KsNPHgXnV5dpJaCcaxVNbQW4H7t9BMDxApGvfa');
    });
  });
});
