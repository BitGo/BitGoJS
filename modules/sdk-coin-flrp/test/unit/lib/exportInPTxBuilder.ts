import assert from 'assert';
import 'should';
import { EXPORT_IN_P as testData } from '../../resources/transactionData/exportInP';
import { ON_CHAIN_TEST_WALLET } from '../../resources/account';
import { TransactionBuilderFactory } from '../../../src/lib';
import utils from '../../../src/lib/utils';
import { coins } from '@bitgo/statics';
import signFlowTest from './signFlowTestSuit';
import { pvmSerial, UnsignedTx, TransferOutput } from '@flarenetwork/flarejs';

describe('Flrp Export In P Tx Builder', () => {
  const coinConfig = coins.get('tflrp');
  const factory = new TransactionBuilderFactory(coinConfig);

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

    it('should throw if feeState is not set', async () => {
      const txBuilder = factory
        .getExportInPBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .fromPubKey(testData.pAddresses)
        .amount('500000000')
        .externalChainId(testData.sourceChainId);

      await txBuilder.build().should.be.rejectedWith('Fee state is required');
    });

    it('should accept valid feeState', () => {
      const txBuilder = factory.getExportInPBuilder();
      (() => txBuilder.feeState(testData.feeState)).should.not.throw();
    });

    it('should throw if context is not set', async () => {
      const txBuilder = factory
        .getExportInPBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .fromPubKey(testData.pAddresses)
        .amount('500000000')
        .externalChainId(testData.sourceChainId)
        .feeState(testData.feeState)
        .decodedUtxos(testData.utxos);
      // context is NOT set

      await txBuilder.build().should.be.rejectedWith('context is required');
    });

    it('should fail when utxos hex array is empty', () => {
      const txBuilder = factory.getExportInPBuilder();
      assert.throws(
        () => {
          txBuilder.decodedUtxos([]);
        },
        (e: any) => e.message === 'UTXOs array cannot be empty'
      );
    });

    it('should throw if amount is not set', async () => {
      const txBuilder = factory
        .getExportInPBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .fromPubKey(testData.pAddresses)
        .externalChainId(testData.sourceChainId)
        .feeState(testData.feeState)
        .context(testData.context)
        .decodedUtxos(testData.utxos);
      // amount is NOT set

      await txBuilder.build().should.be.rejectedWith('amount is required');
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
        .feeState(testData.feeState)
        .context(testData.context)
        .decodedUtxos(testData.utxos),
    unsignedTxHex: testData.unsignedHex,
    halfSignedTxHex: testData.halfSigntxHex,
    fullSignedTxHex: testData.fullSigntxHex,
    privateKey: {
      prv1: testData.privateKeys[2],
      prv2: testData.privateKeys[0],
    },
    txHash: testData.txhash,
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

  describe('Change output threshold fix', () => {
    /**
     * This test suite verifies the fix for the change output threshold bug.
     *
     * The issue: FlareJS's pvm.e.newExportTx() defaults change outputs to threshold=1,
     * but for multisig wallets we need threshold=2 to maintain proper security.
     *
     * The fix: After building the transaction, we correct the change outputs to use
     * the wallet's threshold (typically 2 for multisig).
     */

    it('should create change output with threshold=2 for multisig wallets', async () => {
      const txBuilder = factory
        .getExportInPBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .fromPubKey(testData.pAddresses)
        .amount(testData.amount)
        .externalChainId(testData.sourceChainId)
        .feeState(testData.feeState)
        .context(testData.context)
        .decodedUtxos(testData.utxos);

      const tx = await txBuilder.build();

      const flareTransaction = (tx as any)._flareTransaction as UnsignedTx;
      const innerTx = flareTransaction.getTx() as pvmSerial.ExportTx;
      const changeOutputs = innerTx.baseTx.outputs;

      changeOutputs.length.should.be.greaterThan(0);

      changeOutputs.forEach((output, index) => {
        const transferOut = output.output as TransferOutput;
        const threshold = transferOut.outputOwners.threshold.value();

        threshold.should.equal(
          testData.threshold,
          `Change output ${index} should have threshold=${testData.threshold}, but has threshold=${threshold}`
        );
      });
    });

    it('should create change output with correct locktime for multisig wallets', async () => {
      const txBuilder = factory
        .getExportInPBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .fromPubKey(testData.pAddresses)
        .amount(testData.amount)
        .externalChainId(testData.sourceChainId)
        .feeState(testData.feeState)
        .context(testData.context)
        .decodedUtxos(testData.utxos);

      const tx = await txBuilder.build();

      const flareTransaction = (tx as any)._flareTransaction as UnsignedTx;
      const innerTx = flareTransaction.getTx() as pvmSerial.ExportTx;
      const changeOutputs = innerTx.baseTx.outputs;

      changeOutputs.length.should.be.greaterThan(0);

      changeOutputs.forEach((output, index) => {
        const transferOut = output.output as TransferOutput;
        const locktime = transferOut.outputOwners.locktime.value();

        locktime.should.equal(
          BigInt(testData.locktime),
          `Change output ${index} should have locktime=${testData.locktime}, but has locktime=${locktime}`
        );
      });
    });

    it('should maintain threshold=2 after parsing and rebuilding', async () => {
      const txBuilder = factory
        .getExportInPBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .fromPubKey(testData.pAddresses)
        .amount(testData.amount)
        .externalChainId(testData.sourceChainId)
        .feeState(testData.feeState)
        .context(testData.context)
        .decodedUtxos(testData.utxos);

      const tx = await txBuilder.build();
      const txHex = tx.toBroadcastFormat();

      const parsedTxBuilder = factory.from(txHex);
      const parsedTx = await parsedTxBuilder.build();

      const flareTransaction = (parsedTx as any)._flareTransaction as UnsignedTx;
      const innerTx = flareTransaction.getTx() as pvmSerial.ExportTx;
      const changeOutputs = innerTx.baseTx.outputs;

      changeOutputs.length.should.be.greaterThan(0);

      changeOutputs.forEach((output, index) => {
        const transferOut = output.output as TransferOutput;
        const threshold = transferOut.outputOwners.threshold.value();

        threshold.should.equal(
          testData.threshold,
          `After parsing, change output ${index} should have threshold=${testData.threshold}, but has threshold=${threshold}`
        );
      });
    });

    it('should have change output addresses matching wallet addresses', async () => {
      const txBuilder = factory
        .getExportInPBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .fromPubKey(testData.pAddresses)
        .amount(testData.amount)
        .externalChainId(testData.sourceChainId)
        .feeState(testData.feeState)
        .context(testData.context)
        .decodedUtxos(testData.utxos);

      const tx = await txBuilder.build();

      const flareTransaction = (tx as any)._flareTransaction as UnsignedTx;
      const innerTx = flareTransaction.getTx() as pvmSerial.ExportTx;
      const changeOutputs = innerTx.baseTx.outputs;

      changeOutputs.length.should.be.greaterThan(0);

      changeOutputs.forEach((output) => {
        const transferOut = output.output as TransferOutput;
        const addresses = transferOut.outputOwners.addrs;

        addresses.length.should.equal(3, 'Change output should have 3 addresses for multisig wallet');
      });
    });
  });

  describe('on-chain verified transactions', () => {
    it('should build and sign export tx with correct sigIndices - on-chain verified', async () => {
      const utxos = [
        {
          outputID: 7,
          amount: '50000000',
          txid: 'bgHnEJ64td8u31aZrGDaWcDqxZ8vDV5qGd7bmSifgvUnUW8v2',
          threshold: 2,
          addresses: [
            ON_CHAIN_TEST_WALLET.bitgo.pChainAddress,
            ON_CHAIN_TEST_WALLET.backup.pChainAddress,
            ON_CHAIN_TEST_WALLET.user.pChainAddress,
          ],
          outputidx: '0',
          locktime: '0',
        },
        {
          outputID: 7,
          amount: '50000000',
          txid: 'KdrKz1SHM11dpDGHUthRc9sgS1hnb48pfvnmZDtJu7dRFF2Ha',
          threshold: 2,
          addresses: [
            ON_CHAIN_TEST_WALLET.bitgo.pChainAddress,
            ON_CHAIN_TEST_WALLET.backup.pChainAddress,
            ON_CHAIN_TEST_WALLET.user.pChainAddress,
          ],
          outputidx: '0',
          locktime: '0',
        },
      ];

      const senderPAddresses = [
        ON_CHAIN_TEST_WALLET.user.pChainAddress,
        ON_CHAIN_TEST_WALLET.bitgo.pChainAddress,
        ON_CHAIN_TEST_WALLET.backup.pChainAddress,
      ];

      const exportAmount = '30000000';

      const txBuilder = factory
        .getExportInPBuilder()
        .threshold(2)
        .locktime(0)
        .fromPubKey(senderPAddresses)
        .amount(exportAmount)
        .externalChainId(testData.sourceChainId)
        .decodedUtxos(utxos)
        .context(testData.context)
        .feeState(testData.feeState);

      txBuilder.sign({ key: ON_CHAIN_TEST_WALLET.user.privateKey });
      txBuilder.sign({ key: ON_CHAIN_TEST_WALLET.bitgo.privateKey });

      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();

      tx.id!.should.equal('nSBwNcgfLbk5S425b1qaYaqTTCiMCV75KU4Fbnq8SPUUqLq2');

      const hex = rawTx.replace('0x', '');

      const amountHex = '0000000002faf080';
      const amountPos = hex.indexOf(amountHex);
      amountPos.should.be.greaterThan(0);

      const inputSection = hex.substring(amountPos + 16, amountPos + 40);
      const numSigIndices = parseInt(inputSection.substring(0, 8), 16);
      const sigIdx0 = parseInt(inputSection.substring(8, 16), 16);
      const sigIdx1 = parseInt(inputSection.substring(16, 24), 16);

      numSigIndices.should.equal(2);
      sigIdx0.should.equal(0);
      sigIdx1.should.equal(2);

      const flareTransaction = (tx as any)._flareTransaction as UnsignedTx;
      const innerTx = flareTransaction.getTx() as pvmSerial.ExportTx;
      const changeOutputs = innerTx.baseTx.outputs;
      changeOutputs.length.should.be.greaterThan(0, 'Should have change output');

      const changeOutput = changeOutputs[0].output as TransferOutput;
      changeOutput.outputOwners.threshold.value().should.equal(2);
      changeOutput.outputOwners.addrs.length.should.equal(3);

      const expectedAddressBytes = senderPAddresses.map((addr) => utils.parseAddress(addr));
      const expectedAddressHexes = expectedAddressBytes.map((buf) => buf.toString('hex')).sort();
      const actualAddressHexes = changeOutput.outputOwners.addrs.map((addr) => addr.toHex().replace('0x', '')).sort();

      actualAddressHexes.should.deepEqual(expectedAddressHexes);
    });
  });
});
