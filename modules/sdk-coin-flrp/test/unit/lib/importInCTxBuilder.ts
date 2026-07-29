import assert from 'assert';
import 'should';
import { TransactionBuilderFactory, Transaction, Utils } from '../../../src/lib';
import { coins } from '@bitgo/statics';
import { IMPORT_IN_C as testData } from '../../resources/transactionData/importInC';
import { ON_CHAIN_TEST_WALLET } from '../../resources/account';
import signFlowTest from './signFlowTestSuit';
import { secp256k1, UnsignedTx, evm, evmSerial } from '@flarenetwork/flarejs';

describe('Flrp Import In C Tx Builder', () => {
  const factory = new TransactionBuilderFactory(coins.get('tflrp'));

  describe('validate txBuilder fields', () => {
    it('should fail validate Utxos empty array', () => {
      const txBuilder = factory.getImportInCBuilder();
      assert.throws(
        () => {
          txBuilder.validateUtxos([]);
        },
        (e: any) => e.message === 'UTXOs array cannot be empty'
      );
    });

    it('should throw if to address is not set', async () => {
      const txBuilder = factory
        .getImportInCBuilder()
        .threshold(testData.threshold)
        .fromPubKey(testData.pAddresses)
        .decodedUtxos(testData.utxos)
        .fee(testData.fee)
        .context(testData.context);
      // to is NOT set

      await txBuilder.build().should.be.rejectedWith('to is required');
    });

    it('should throw if context is not set', async () => {
      const txBuilder = factory
        .getImportInCBuilder()
        .threshold(testData.threshold)
        .fromPubKey(testData.pAddresses)
        .decodedUtxos(testData.utxos)
        .to(testData.to)
        .fee(testData.fee);
      // context is NOT set

      await txBuilder.build().should.be.rejectedWith('context is required');
    });

    it('should throw if fromAddresses is not set', async () => {
      const txBuilder = factory
        .getImportInCBuilder()
        .threshold(testData.threshold)
        .decodedUtxos(testData.utxos)
        .to(testData.to)
        .fee(testData.fee)
        .context(testData.context);
      // fromPubKey is NOT set

      await txBuilder.build().should.be.rejectedWith('fromAddresses are required');
    });

    it('should throw if UTXOs are not set', async () => {
      const txBuilder = factory
        .getImportInCBuilder()
        .threshold(testData.threshold)
        .fromPubKey(testData.pAddresses)
        .to(testData.to)
        .fee(testData.fee)
        .context(testData.context);
      // utxos is NOT set

      await txBuilder.build().should.be.rejectedWith('UTXOs are required');
    });

    it('should fail when utxos hex array is empty', () => {
      const txBuilder = factory.getImportInCBuilder();
      assert.throws(
        () => {
          txBuilder.decodedUtxos([]);
        },
        (e: any) => e.message === 'UTXOs array cannot be empty'
      );
    });

    it('should fail with invalid threshold value (0)', () => {
      const txBuilder = factory.getImportInCBuilder();
      assert.throws(
        () => {
          txBuilder.threshold(0);
        },
        (e: any) => e.message.includes('threshold') || e.message.includes('greater')
      );
    });

    it('should fail with invalid threshold value (negative)', () => {
      const txBuilder = factory.getImportInCBuilder();
      assert.throws(
        () => {
          txBuilder.threshold(-1);
        },
        (e: any) => e.message.includes('threshold') || e.message.includes('greater')
      );
    });

    it('should fail with invalid to address format', () => {
      const txBuilder = factory.getImportInCBuilder();
      assert.throws(
        () => {
          txBuilder.to('invalid-address');
        },
        (e: any) => e.message.includes('Invalid') || e.message.includes('address')
      );
    });

    it('should accept valid to address', () => {
      const txBuilder = factory.getImportInCBuilder();
      (() => txBuilder.to(testData.to)).should.not.throw();
    });

    it('should accept valid threshold', () => {
      const txBuilder = factory.getImportInCBuilder();
      (() => txBuilder.threshold(2)).should.not.throw();
    });

    it('should accept valid context', () => {
      const txBuilder = factory.getImportInCBuilder();
      (() => txBuilder.context(testData.context)).should.not.throw();
    });

    it('should accept valid fromPubKey addresses', () => {
      const txBuilder = factory.getImportInCBuilder();
      (() => txBuilder.fromPubKey(testData.pAddresses)).should.not.throw();
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
        .decodedUtxos(testData.utxos)
        .to(testData.to)
        .fee(testData.fee)
        .context(testData.context),
    unsignedTxHex: testData.unsignedHex,
    halfSignedTxHex: testData.halfSigntxHex,
    fullSignedTxHex: testData.fullSigntxHex,
    privateKey: {
      prv1: testData.privateKeys[2],
      prv2: testData.privateKeys[0],
    },
    txHash: testData.txhash,
  });

  describe('on-chain verified transactions', () => {
    it('should build and sign import to C-chain tx with correct sigIndices - on-chain verified', async () => {
      const utxo = {
        outputID: 7,
        amount: '30000000',
        txid: 'nSBwNcgfLbk5S425b1qaYaqTTCiMCV75KU4Fbnq8SPUUqLq2',
        threshold: 2,
        addresses: [
          ON_CHAIN_TEST_WALLET.bitgo.pChainAddress,
          ON_CHAIN_TEST_WALLET.backup.pChainAddress,
          ON_CHAIN_TEST_WALLET.user.pChainAddress,
        ],
        outputidx: '1',
        locktime: '0',
      };

      const senderPAddresses = [
        ON_CHAIN_TEST_WALLET.user.pChainAddress,
        ON_CHAIN_TEST_WALLET.bitgo.pChainAddress,
        ON_CHAIN_TEST_WALLET.backup.pChainAddress,
      ];

      const toAddress = '0x96993BAEb6AaE2e06BF95F144e2775D4f8efbD35';
      const importFee = '1000000';

      const txBuilder = factory
        .getImportInCBuilder()
        .threshold(2)
        .locktime(0)
        .fromPubKey(senderPAddresses)
        .to(toAddress)
        .fee(importFee)
        .externalChainId(testData.sourceChainId)
        .decodedUtxos([utxo])
        .context(testData.context);

      txBuilder.sign({ key: ON_CHAIN_TEST_WALLET.user.privateKey });
      txBuilder.sign({ key: ON_CHAIN_TEST_WALLET.bitgo.privateKey });

      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();

      tx.id.should.equal('2t4gxEAdPLiiy9HsbjaQun1mVFewMoixNS64eZ56C38L4mpP1j');

      const hex = rawTx.replace('0x', '');

      const amountHex = '0000000001c9c380';
      const amountPos = hex.indexOf(amountHex);
      amountPos.should.be.greaterThan(0);

      const inputSection = hex.substring(amountPos + 16, amountPos + 40);
      const numSigIndices = parseInt(inputSection.substring(0, 8), 16);
      const sigIdx0 = parseInt(inputSection.substring(8, 16), 16);
      const sigIdx1 = parseInt(inputSection.substring(16, 24), 16);

      numSigIndices.should.equal(2);
      sigIdx0.should.equal(0);
      sigIdx1.should.equal(2);

      const expectedOutput = parseInt(utxo.amount, 10) - parseInt(importFee, 10);
      const outputHex = expectedOutput.toString(16).padStart(16, '0');
      hex.should.containEql(outputHex);
    });
  });

  describe('base-fee driven gas estimation (CECHO-1821)', () => {
    const utxo = {
      outputID: 7,
      amount: '30000000',
      txid: 'nSBwNcgfLbk5S425b1qaYaqTTCiMCV75KU4Fbnq8SPUUqLq2',
      threshold: 1,
      addresses: [ON_CHAIN_TEST_WALLET.user.pChainAddress],
      outputidx: '1',
      locktime: '0',
    };

    it('should derive a fee that accounts for the AtomicTxBaseCost and exceeds a naive gas*baseFee estimate', async () => {
      const baseFeeWei = 500n; // base fee in wei/gas used in the reported failure
      const underpricedGasEstimate = 5700n; // naive/legacy gas estimate missing AtomicTxBaseCost
      const underpricedFee = baseFeeWei * underpricedGasEstimate;

      const txBuilder = factory
        .getImportInCBuilder()
        .threshold(1)
        .locktime(0)
        .fromPubKey([ON_CHAIN_TEST_WALLET.user.pChainAddress])
        .to('0x96993BAEb6AaE2e06BF95F144e2775D4f8efbD35')
        .baseFee(baseFeeWei)
        .decodedUtxos([utxo])
        .context(testData.context);

      const tx = (await txBuilder.build()) as Transaction;
      const actualFee = BigInt(tx.fee.fee);

      // The gas-aware fee (including the real AtomicTxBaseCost, ~10,000) must exceed
      // the underpriced legacy estimate that caused "insufficient funds" on broadcast.
      assert(
        actualFee > underpricedFee,
        `Expected actualFee (${actualFee}) to be above underpricedFee (${underpricedFee})`
      );
    });

    it('should pad the supplied base fee on top of the raw flarejs gas*baseFee estimate', async () => {
      const baseFeeWei = 500n;
      const fromAddress = ON_CHAIN_TEST_WALLET.user.pChainAddress;
      const toAddress = '0x96993BAEb6AaE2e06BF95F144e2775D4f8efbD35';

      const paddedTx = (await factory
        .getImportInCBuilder()
        .threshold(1)
        .locktime(0)
        .fromPubKey([fromAddress])
        .to(toAddress)
        .baseFee(baseFeeWei)
        .decodedUtxos([utxo])
        .context(testData.context)
        .build()) as Transaction;
      const paddedFee = BigInt(paddedTx.fee.fee);

      // Reconstruct the same import tx directly via flarejs using the *unpadded* base fee,
      // to recover the network's raw gas*baseFee requirement with no buffer applied.
      const assetId = (coins.get('tflrp').network as unknown as { assetId: string }).assetId;
      const nativeUtxos = Utils.decodedToUtxos([utxo], assetId);
      const rawImportTx = evm.newImportTxFromBaseFee(
        testData.context,
        Utils.parseAddress(toAddress),
        [Utils.parseAddress(fromAddress)],
        nativeUtxos,
        'P',
        baseFeeWei
      ) as UnsignedTx;
      const rawInnerTx = rawImportTx.getTx() as evmSerial.ImportTx;
      const rawTotalOutput = rawInnerTx.Outs.reduce((sum, out) => sum + out.amount.value(), BigInt(0));
      const rawFee = BigInt(utxo.amount) - rawTotalOutput;

      assert(paddedFee > rawFee, `Expected padded fee (${paddedFee}) to exceed the unpadded raw fee (${rawFee})`);
      // Padding is exactly the configured 10% buffer applied to the base fee before estimation.
      assert.strictEqual(paddedFee, (rawFee * 11000n) / 10000n);
    });
  });

  describe('MPC signing (threshold=1)', () => {
    const mpcUtxo = {
      outputID: 7,
      amount: '30000000',
      txid: 'nSBwNcgfLbk5S425b1qaYaqTTCiMCV75KU4Fbnq8SPUUqLq2',
      threshold: 1,
      addresses: [ON_CHAIN_TEST_WALLET.user.pChainAddress],
      outputidx: '1',
      locktime: '0',
    };

    it('should build and sign import to C-chain with threshold=1 using sign()', async () => {
      const txBuilder = factory
        .getImportInCBuilder()
        .threshold(1)
        .locktime(0)
        .fromPubKey([ON_CHAIN_TEST_WALLET.user.pChainAddress])
        .to('0x96993BAEb6AaE2e06BF95F144e2775D4f8efbD35')
        .fee('1000000')
        .decodedUtxos([mpcUtxo])
        .context(testData.context);

      txBuilder.sign({ key: ON_CHAIN_TEST_WALLET.user.privateKey });
      const tx = await txBuilder.build();

      tx.signature.length.should.equal(1);

      const json = tx.toJson();
      json.threshold.should.equal(1);
      json.sourceChain!.should.equal('P');
      json.destinationChain!.should.equal('C');
    });

    it('should build and sign import to C-chain with threshold=1 using addExternalSignature()', async () => {
      const txBuilder = factory
        .getImportInCBuilder()
        .threshold(1)
        .locktime(0)
        .fromPubKey([ON_CHAIN_TEST_WALLET.user.pChainAddress])
        .to('0x96993BAEb6AaE2e06BF95F144e2775D4f8efbD35')
        .fee('1000000')
        .decodedUtxos([mpcUtxo])
        .context(testData.context);

      const tx = (await txBuilder.build()) as Transaction;
      const unsignedHex = tx.toBroadcastFormat();

      // Simulate MPC signing
      const flareUnsignedTx = tx.getFlareTransaction() as UnsignedTx;
      const signature = await secp256k1.sign(
        flareUnsignedTx.toBytes(),
        Buffer.from(ON_CHAIN_TEST_WALLET.user.privateKey, 'hex')
      );

      tx.addExternalSignature(signature);
      const signedHex = tx.toBroadcastFormat();
      signedHex.should.not.equal(unsignedHex);

      // Verify roundtrip
      const parsedBuilder = factory.from(signedHex);
      const parsedTx = await parsedBuilder.build();
      parsedTx.toBroadcastFormat().should.equal(signedHex);

      tx.signature.length.should.equal(1);
    });

    it('should produce same signed tx via sign() and addExternalSignature()', async () => {
      const buildArgs = () =>
        factory
          .getImportInCBuilder()
          .threshold(1)
          .locktime(0)
          .fromPubKey([ON_CHAIN_TEST_WALLET.user.pChainAddress])
          .to('0x96993BAEb6AaE2e06BF95F144e2775D4f8efbD35')
          .fee('1000000')
          .decodedUtxos([mpcUtxo])
          .context(testData.context);

      // sign()
      const txBuilder1 = buildArgs();
      txBuilder1.sign({ key: ON_CHAIN_TEST_WALLET.user.privateKey });
      const tx1 = await txBuilder1.build();
      const signedHex1 = tx1.toBroadcastFormat();

      // addExternalSignature()
      const txBuilder2 = buildArgs();
      const tx2 = (await txBuilder2.build()) as Transaction;
      const flareUnsignedTx = tx2.getFlareTransaction() as UnsignedTx;
      const signature = await secp256k1.sign(
        flareUnsignedTx.toBytes(),
        Buffer.from(ON_CHAIN_TEST_WALLET.user.privateKey, 'hex')
      );
      tx2.addExternalSignature(signature);
      const signedHex2 = tx2.toBroadcastFormat();

      signedHex1.should.equal(signedHex2);
      tx1.id.should.equal(tx2.id);
    });

    it('should deserialize unsigned MPC tx and sign it', async () => {
      const txBuilder = factory
        .getImportInCBuilder()
        .threshold(1)
        .locktime(0)
        .fromPubKey([ON_CHAIN_TEST_WALLET.user.pChainAddress])
        .to('0x96993BAEb6AaE2e06BF95F144e2775D4f8efbD35')
        .fee('1000000')
        .decodedUtxos([mpcUtxo])
        .context(testData.context);

      const unsignedTx = await txBuilder.build();
      const unsignedHex = unsignedTx.toBroadcastFormat();

      // Deserialize and sign
      const txBuilder2 = factory.from(unsignedHex);
      txBuilder2.sign({ key: ON_CHAIN_TEST_WALLET.user.privateKey });
      const signedTx = await txBuilder2.build();

      signedTx.signature.length.should.equal(1);

      // Verify roundtrip
      const parsedTx = await factory.from(signedTx.toBroadcastFormat()).build();
      parsedTx.toBroadcastFormat().should.equal(signedTx.toBroadcastFormat());
      parsedTx.id.should.equal(signedTx.id);
    });
  });
});
