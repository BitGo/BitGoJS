import assert from 'node:assert/strict';

import * as utxolib from '@bitgo/utxo-lib';
import { testutil } from '@bitgo/utxo-lib';
import { fixedScriptWallet } from '@bitgo/wasm-utxo';

import {
  explainPsbtWasm,
  explainPsbtWasmBigInt,
  aggregateTransactionExplanations,
  type TransactionExplanationBigInt,
} from '../../../../src/transaction/fixedScript';

function describeTransactionWith(acidTest: testutil.AcidTest) {
  describe(`${acidTest.name}`, function () {
    let walletXpubs: fixedScriptWallet.RootWalletKeys;
    let customChangeWalletXpubs: fixedScriptWallet.RootWalletKeys | undefined;
    let wasmPsbt: fixedScriptWallet.BitGoPsbt;
    before('prepare', function () {
      const psbt = acidTest.createPsbt();
      const psbtBytes = psbt.toBuffer();
      const networkName = utxolib.getNetworkName(acidTest.network);
      assert(networkName);
      walletXpubs = fixedScriptWallet.RootWalletKeys.from(acidTest.rootWalletKeys);
      customChangeWalletXpubs = fixedScriptWallet.RootWalletKeys.from(acidTest.otherWalletKeys);
      wasmPsbt = fixedScriptWallet.BitGoPsbt.fromBytes(psbtBytes, networkName);
    });

    it('should return expected outputs from explainPsbtWasm', function () {
      const wasmExplanation = explainPsbtWasm(wasmPsbt, walletXpubs, {
        replayProtection: {
          publicKeys: [acidTest.getReplayProtectionPublicKey()],
        },
      });
      assert.strictEqual(wasmExplanation.outputs.length, 3);
      assert.strictEqual(wasmExplanation.changeOutputs.length, acidTest.outputs.length - 3);
      assert.strictEqual(wasmExplanation.outputAmount, '1800');
      wasmExplanation.changeOutputs.forEach((change) => {
        assert.strictEqual(change.amount, '900');
        assert.strictEqual(typeof change.address, 'string');
      });

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

  it('explainPsbtWasmBigInt throws when total output value exceeds total input value', function () {
    const network = utxolib.networks.bitcoin;
    const rootWalletKeys = testutil.getDefaultWalletKeys();
    // Valid PSBT: one p2wsh input (5000 sat), one internal p2wsh output (3000 sat), fee = 2000
    const psbt = testutil.constructPsbt(
      [{ scriptType: 'p2wsh', value: 5000n }],
      [{ scriptType: 'p2wsh', value: 3000n, isInternalAddress: true }],
      network,
      rootWalletKeys,
      'unsigned'
    );
    // Tamper: reduce the witnessUtxo.value so that inputs (1000) < outputs (3000).
    // Direct mutation avoids bip174's "duplicate data" guard on updateInput.
    psbt.data.inputs[0].witnessUtxo!.value = 1000n;

    const wasmPsbt = fixedScriptWallet.BitGoPsbt.fromBytes(psbt.toBuffer(), 'bitcoin');
    const walletXpubs = fixedScriptWallet.RootWalletKeys.from(rootWalletKeys);

    assert.throws(
      () =>
        explainPsbtWasmBigInt(wasmPsbt, walletXpubs, {
          replayProtection: { publicKeys: [] },
        }),
      /Fee calculation error: outputs exceed inputs/
    );
  });
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
          const walletXpubs = fixedScriptWallet.RootWalletKeys.from(acidTest.rootWalletKeys);
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
