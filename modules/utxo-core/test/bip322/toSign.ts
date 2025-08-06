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
        const toSpendTx = bip322.buildToSpendTransaction(scriptPubKey, Buffer.from(message));
        const addressDetails = {
          scriptPubKey,
        };
        const result = bip322.buildToSignPsbt(toSpendTx, addressDetails);
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

    it('should fail when scriptPubKey of to_spend is different than to_sign', function () {
      const toSpendTx = bip322.buildToSpendTransaction(BIP322_PAYMENT_P2WPKH_FIXTURE.output as Buffer, 'Hello World');
      assert.throws(() => {
        bip322.buildToSignPsbtForChainAndIndex(toSpendTx, rootWalletKeys, 0, 0);
      }, /Output scriptPubKey does not match the expected output script for the chain and index./);
    });

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
        const toSignPsbt = bip322.buildToSignPsbtForChainAndIndex(toSpendTx, rootWalletKeys, chain, index);

        const derivedKeys = rootWalletKeys.deriveForChainAndIndex(chain, index);
        const prv1 = derivedKeys.triple[0];
        const prv2 = derivedKeys.triple[1];
        assert.ok(prv1);
        assert.ok(prv2);

        // Can sign the PSBT with the keys
        toSignPsbt.signAllInputs(prv1, [utxolib.Transaction.SIGHASH_ALL]);
        toSignPsbt.signAllInputs(prv2, [utxolib.Transaction.SIGHASH_ALL]);

        // Wrap the PSBT as a UtxoPsbt so that we can use the validateSignaturesOfInputCommon method
        const utxopsbt = utxolib.bitgo.createPsbtFromBuffer(toSignPsbt.toBuffer(), utxolib.networks.bitcoin);
        derivedKeys.publicKeys.forEach((pubkey, i) => {
          assert.deepStrictEqual(
            utxopsbt.validateSignaturesOfInputCommon(0, pubkey),
            i !== 2,
            `Signature validation failed for public key at index ${i}`
          );
        });

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
