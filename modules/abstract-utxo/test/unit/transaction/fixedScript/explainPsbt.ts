import assert from 'node:assert/strict';

import * as utxolib from '@bitgo/utxo-lib';
import { testutil } from '@bitgo/utxo-lib';
import { fixedScriptWallet, Triple } from '@bitgo/wasm-utxo';

import type { TransactionExplanation } from '../../../../src/transaction/fixedScript/explainTransaction';
import { explainPsbt, explainPsbtWasm } from '../../../../src/transaction/fixedScript';

function hasWasmUtxoSupport(network: utxolib.Network): boolean {
  return ![
    utxolib.networks.bitcoincash,
    utxolib.networks.bitcoingold,
    utxolib.networks.ecash,
    utxolib.networks.zcash,
  ].includes(utxolib.getMainnet(network));
}

function describeTransactionWith(acidTest: testutil.AcidTest) {
  describe(`${acidTest.name}`, function () {
    let psbtBytes: Buffer;
    let refExplanation: TransactionExplanation;
    before('prepare', function () {
      const psbt = acidTest.createPsbt();
      refExplanation = explainPsbt(psbt, { pubs: acidTest.rootWalletKeys }, acidTest.network, {
        strict: true,
      });
      psbtBytes = psbt.toBuffer();
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

    it('should match explainPsbtWasm', function () {
      if (!hasWasmUtxoSupport(acidTest.network)) {
        return this.skip();
      }

      const networkName = utxolib.getNetworkName(acidTest.network);
      assert(networkName);
      const wasmPsbt = fixedScriptWallet.BitGoPsbt.fromBytes(psbtBytes, networkName);
      const walletXpubs = acidTest.rootWalletKeys.triple.map((k) => k.neutered().toBase58()) as Triple<string>;
      const wasmExplanation = explainPsbtWasm(wasmPsbt, walletXpubs, {
        replayProtection: {
          outputScripts: [acidTest.getReplayProtectionOutputScript()],
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
    });
  });
}

describe('explainPsbt(Wasm)', function () {
  testutil.AcidTest.suite().forEach((test) => describeTransactionWith(test));
});
