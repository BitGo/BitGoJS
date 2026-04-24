import assert from 'node:assert/strict';

import * as utxolib from '@bitgo/utxo-lib';
import { testutil } from '@bitgo/utxo-lib';
import { fixedScriptWallet, Triple } from '@bitgo/wasm-utxo';

import type { TransactionExplanation } from '../../../../src/transaction/fixedScript/explainTransaction';
import {
  explainPsbt,
  explainPsbtWasm,
  explainPsbtWasmBigInt,
  aggregateTransactionExplanations,
  type TransactionExplanationBigInt,
} from '../../../../src/transaction/fixedScript/index';
import { getCoinName } from '../../../../src/names';

function describeTransactionWith(acidTest: testutil.AcidTest) {
  describe(`${acidTest.name}`, function () {
    let psbt: utxolib.bitgo.UtxoPsbt;
    let psbtBytes: Buffer;
    let walletXpubs: Triple<string>;
    let customChangeWalletXpubs: Triple<string> | undefined;
    let wasmPsbt: fixedScriptWallet.BitGoPsbt;
    let refExplanation: TransactionExplanation;
    before('prepare', function () {
      psbt = acidTest.createPsbt();
      const coinName = getCoinName(acidTest.network);
      refExplanation = explainPsbt(psbt, { pubs: acidTest.rootWalletKeys }, coinName, {
        strict: true,
      });
      psbtBytes = psbt.toBuffer();
      const networkName = utxolib.getNetworkName(acidTest.network);
      assert(networkName);
      walletXpubs = acidTest.rootWalletKeys.triple.map((k) => k.neutered().toBase58()) as Triple<string>;
      customChangeWalletXpubs = acidTest.otherWalletKeys.triple.map((k) => k.neutered().toBase58()) as Triple<string>;
      wasmPsbt = fixedScriptWallet.BitGoPsbt.fromBytes(psbtBytes, networkName);
    });

    it('should match the expected values for explainPsbt', function () {
      // note: `outputs` means external outputs here
      assert.strictEqual(refExplanation.outputs.length, 3);
      assert.strictEqual(refExplanation.changeOutputs.length, acidTest.outputs.length - 3);
      assert.strictEqual(refExplanation.outputAmount, '1800');
      assert.strictEqual(refExplanation.changeOutputs.length, acidTest.outputs.length - 3);
      refExplanation.changeOutputs.forEach((change) => {
        assert.strictEqual(change.amount, '900');
        assert.strictEqual(typeof change.address, 'string');
      });
    });

    it('reference implementation should support custom change outputs', function () {
      const coinName = getCoinName(acidTest.network);
      const customChangeExplanation = explainPsbt(
        psbt,
        { pubs: acidTest.rootWalletKeys, customChangePubs: acidTest.otherWalletKeys },
        coinName,
        { strict: true }
      );
      assert.ok(customChangeExplanation.customChangeOutputs);
      assert.strictEqual(customChangeExplanation.changeOutputs.length, refExplanation.changeOutputs.length);
      assert.strictEqual(customChangeExplanation.outputs.length, refExplanation.outputs.length - 1);
      assert.strictEqual(customChangeExplanation.customChangeOutputs.length, 1);
      assert.strictEqual(customChangeExplanation.customChangeOutputs[0].amount, '900');
    });

    it('should match explainPsbtWasm', function () {
      const wasmExplanation = explainPsbtWasm(wasmPsbt, walletXpubs, {
        replayProtection: {
          publicKeys: [acidTest.getReplayProtectionPublicKey()],
        },
      });

      for (const key of Object.keys(refExplanation)) {
        const refValue = refExplanation[key];
        const wasmValue = wasmExplanation[key];
        switch (key) {
          case 'displayOrder':
          case 'inputSignatures':
          case 'signatures':
            // these are deprecated fields that we want to get rid of
            assert.deepStrictEqual(wasmValue, undefined);
            break;
          default:
            assert.deepStrictEqual(wasmValue, refValue, `mismatch for key ${key}`);
            break;
        }
      }

      // verify new fields are present and stringified
      assert.strictEqual(typeof wasmExplanation.inputAmount, 'string');
      assert.ok(Array.isArray(wasmExplanation.inputs));
      assert.ok(wasmExplanation.inputs.length > 0);
      for (const input of wasmExplanation.inputs) {
        assert.strictEqual(typeof input.address, 'string');
        assert.strictEqual(typeof input.value, 'string');
      }
    });

    if (acidTest.network !== utxolib.networks.bitcoin) {
      return;
    }

    it('explainPsbtWasmBigInt returns bigint amounts and inputs array', function () {
      const result = explainPsbtWasmBigInt(wasmPsbt, walletXpubs, {
        replayProtection: { publicKeys: [acidTest.getReplayProtectionPublicKey()] },
      });
      assert.strictEqual(typeof result.fee, 'bigint');
      assert.strictEqual(typeof result.outputAmount, 'bigint');
      assert.strictEqual(typeof result.changeAmount, 'bigint');
      assert.strictEqual(typeof result.inputAmount, 'bigint');
      assert.ok(result.inputs.length > 0);
      for (const input of result.inputs) {
        assert.strictEqual(typeof input.address, 'string');
        assert.strictEqual(typeof input.value, 'bigint');
      }
      const sumInputs = result.inputs.reduce((s, i) => s + i.value, 0n);
      assert.strictEqual(result.inputAmount, sumInputs);
      assert.strictEqual(
        result.fee,
        result.inputAmount - result.outputAmount - result.changeAmount - result.customChangeAmount
      );
    });

    // extended test suite for bitcoin

    it('returns custom change outputs when parameter is set', function () {
      const wasmExplanation = explainPsbtWasm(wasmPsbt, walletXpubs, {
        replayProtection: {
          publicKeys: [acidTest.getReplayProtectionPublicKey()],
        },
        customChangeWalletXpubs,
      });
      assert.ok(wasmExplanation.customChangeOutputs);
      assert.deepStrictEqual(wasmExplanation.outputs.length, 2);
      assert.deepStrictEqual(wasmExplanation.customChangeOutputs.length, 1);
      assert.deepStrictEqual(wasmExplanation.customChangeOutputs[0].amount, '900');
    });
  });
}

describe('explainPsbt(Wasm)', function () {
  testutil.AcidTest.suite().forEach((test) => describeTransactionWith(test));
});

describe('aggregateTransactionExplanations', function () {
  testutil.AcidTest.suite()
    .filter((t) => t.network === utxolib.networks.bitcoin)
    .forEach((acidTest) => {
      describe(acidTest.name, function () {
        let exp: TransactionExplanationBigInt;

        before('prepare', function () {
          const psbtBytes = acidTest.createPsbt().toBuffer();
          const networkName = utxolib.getNetworkName(acidTest.network);
          assert(networkName);
          const wasmPsbt = fixedScriptWallet.BitGoPsbt.fromBytes(psbtBytes, networkName);
          const walletXpubs = acidTest.rootWalletKeys.triple.map((k) => k.neutered().toBase58()) as Triple<string>;
          exp = explainPsbtWasmBigInt(wasmPsbt, walletXpubs, {
            replayProtection: { publicKeys: [acidTest.getReplayProtectionPublicKey()] },
          });
        });

        it('aggregating a single explanation is identity', function () {
          const agg = aggregateTransactionExplanations([exp]);
          assert.strictEqual(agg.inputCount, exp.inputs.length);
          assert.strictEqual(agg.outputCount, exp.outputs.length);
          assert.strictEqual(agg.changeOutputCount, exp.changeOutputs.length);
          assert.strictEqual(agg.inputAmount, exp.inputAmount);
          assert.strictEqual(agg.outputAmount, exp.outputAmount);
          assert.strictEqual(agg.changeAmount, exp.changeAmount);
          assert.strictEqual(agg.fee, exp.fee);
        });

        it('aggregating two identical explanations doubles all counts and amounts', function () {
          const agg = aggregateTransactionExplanations([exp, exp]);
          assert.strictEqual(agg.inputCount, exp.inputs.length * 2);
          assert.strictEqual(agg.outputCount, exp.outputs.length * 2);
          assert.strictEqual(agg.changeOutputCount, exp.changeOutputs.length * 2);
          assert.strictEqual(agg.inputAmount, exp.inputAmount * 2n);
          assert.strictEqual(agg.outputAmount, exp.outputAmount * 2n);
          assert.strictEqual(agg.changeAmount, exp.changeAmount * 2n);
          assert.strictEqual(agg.fee, exp.fee * 2n);
        });
      });
    });
});
