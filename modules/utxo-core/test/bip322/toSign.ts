import assert from 'assert';

import * as utxolib from '@bitgo/utxo-lib';

import * as bip322 from '../../src/bip322';

import { BIP322_PAYMENT_P2WPKH_FIXTURE, BIP322_PRV_FIXTURE as prv } from './bip322.utils';

describe('BIP322 toSign', function () {
  describe('buildToSignPsbt', function () {
    const scriptPubKey = BIP322_PAYMENT_P2WPKH_FIXTURE.output as Buffer;
    // Source: https://github.com/bitcoin/bips/blob/master/bip-0322.mediawiki#transaction-hashes
    const fixtures = [
      {
        message: '',
        txid: '1e9654e951a5ba44c8604c4de6c67fd78a27e81dcadcfe1edf638ba3aaebaed6',
      },
      {
        message: 'Hello World',
        txid: '88737ae86f2077145f93cc4b153ae9a1cb8d56afa511988c149c5c8c9d93bddf',
      },
    ];

    fixtures.forEach(({ message, txid }) => {
      it(`should build a to_sign PSBT for message "${message}"`, function () {
        const result = bip322.createBaseToSignPsbt();
        bip322.addBip322Input(result, message, {
          scriptPubKey,
        });
        const computedTxid = result
          .signAllInputs(prv, [utxolib.Transaction.SIGHASH_ALL])
          .finalizeAllInputs()
          .extractTransaction()
          .getId();
        assert.strictEqual(computedTxid, txid, `Transaction ID for message "${message}" does not match expected value`);
      });
    });
  });

  describe('buildToSignPsbtForChainAndIndex', function () {
    const rootWalletKeys = utxolib.testutil.getDefaultWalletKeys();

    function run(chain: utxolib.bitgo.ChainCode, shouldFail: boolean, index: number) {
      it(`should${
        shouldFail ? ' fail to' : ''
      } build and sign a to_sign PSBT for chain ${chain}, index ${index}`, function () {
        const message = 'I can believe it is not butter';
        if (shouldFail) {
          assert.throws(() => {
            bip322.buildToSpendTransactionFromChainAndIndex(rootWalletKeys, chain, index, message);
          }, /BIP322 is not supported for Taproot script types./);
          return;
        }
        const toSpendTx = bip322.buildToSpendTransactionFromChainAndIndex(rootWalletKeys, chain, index, message);
        const toSignPsbt = bip322.createBaseToSignPsbt(rootWalletKeys);
        bip322.addBip322InputWithChainAndIndex(toSignPsbt, message, rootWalletKeys, chain, index);

        // Can sign the PSBT with the keys
        // Should be able to use HD because we have the bip32Derivation information
        toSignPsbt.signAllInputsHD(rootWalletKeys.triple[0]);
        toSignPsbt.signAllInputsHD(rootWalletKeys.triple[1]);

        // Wrap the PSBT as a UtxoPsbt so that we can use the validateSignaturesOfInputCommon method
        const utxopsbt = utxolib.bitgo.createPsbtFromBuffer(toSignPsbt.toBuffer(), utxolib.networks.bitcoin);
        utxopsbt.validateSignaturesOfAllInputs();

        // finalize and extract
        const tx = toSignPsbt.finalizeAllInputs().extractTransaction();
        assert.ok(tx);

        // Check that the transaction matches the full BIP322 format
        // Source: https://github.com/bitcoin/bips/blob/master/bip-0322.mediawiki#full
        // For the to_spend transaction, verify that all of the properties are set correctly,
        // then get the txid and make sure that it matches the value in the `to_sign` tx
        assert.deepStrictEqual(toSpendTx.version, 0, 'version must be 0');
        assert.deepStrictEqual(toSpendTx.locktime, 0, 'locktime must be 0');
        assert.deepStrictEqual(
          toSpendTx.ins[0].hash.toString('hex'),
          '0000000000000000000000000000000000000000000000000000000000000000',
          'input hash must be a 32 byte zero buffer'
        );
        assert.deepStrictEqual(toSpendTx.ins[0].index, 0xffffffff, 'input index must be 0xFFFFFFFF');
        assert.deepStrictEqual(toSpendTx.ins[0].sequence, 0, 'input sequence must be 0');
        assert.deepStrictEqual(
          toSpendTx.ins[0].script.toString('hex'),
          Buffer.concat([Buffer.from([0x00, 0x20]), bip322.hashMessageWithTag(message)]).toString('hex'),
          'input script must be OP_0 PUSH32[ message_hash ]'
        );
        assert.ok(Array.isArray(toSpendTx.ins[0].witness), 'input witness must be an array');
        assert.deepStrictEqual(toSpendTx.ins[0].witness.length, 0, 'input witness must be empty');
        assert.deepStrictEqual(toSpendTx.ins.length, 1, 'to_spend transaction must have one input');
        assert.deepStrictEqual(toSpendTx.outs.length, 1, 'to_spend transaction must have one output');
        assert.deepStrictEqual(toSpendTx.outs[0].value, BigInt(0), 'output value must be 0');
        const derivedKeys = rootWalletKeys.deriveForChainAndIndex(chain, index);
        assert.deepStrictEqual(
          toSpendTx.outs[0].script.toString('hex'),
          utxolib.bitgo.outputScripts
            .createOutputScript2of3(
              derivedKeys.publicKeys,
              utxolib.bitgo.scriptTypeForChain(chain),
              utxolib.networks.bitcoin
            )
            .scriptPubKey.toString('hex'),
          'the script pubkey of the to_spend output must be the scriptPubKey of the address we are proving ownership of'
        );
        assert.deepStrictEqual(tx.ins.length, 1, 'to_sign transaction must have one input');
        assert.deepStrictEqual(tx.version, 0, 'to_sign transaction version must be 0');
        assert.deepStrictEqual(tx.locktime, 0, 'to_sign transaction locktime must be 0');
        assert.deepStrictEqual(
          utxolib.bitgo.getOutputIdForInput(tx.ins[0]).txid,
          toSpendTx.getId(),
          'to_sign transaction input must reference the to_spend transaction'
        );
        assert.deepStrictEqual(tx.ins[0].index, 0, 'to_sign transaction input index must be 0');
        assert.deepStrictEqual(tx.ins[0].sequence, 0, 'to_sign transaction input sequence must be 0');
        // We are not going to explicitly check the script witness on this transaction because we already verified the
        // signatures on the PSBT for the respective public keys. All that would be verified here is that we can assemble
        // the script witness correctly, which must be true orelse we would have a much bigger problem.
        assert.deepStrictEqual(tx.outs.length, 1, 'to_sign transaction must have one output');
        assert.deepStrictEqual(tx.outs[0].value, BigInt(0), 'to_sign transaction output value must be 0');
        assert.deepStrictEqual(
          tx.outs[0].script.toString('hex'),
          '6a',
          'to_sign transaction output script must be OP_RETURN'
        );
      });
    }

    utxolib.bitgo.chainCodes.forEach((chain, i) => {
      run(chain, bip322.isTaprootChain(chain), i);
    });
  });
});
