import assert from 'node:assert/strict';

import { testutil } from '@bitgo/utxo-lib';

import { explainPsbt } from '../../../../src/transaction/fixedScript';

function describeTransactionWith(acidTest: testutil.AcidTest) {
  describe(`explainPsbt ${acidTest.name}`, function () {
    it('should explain the transaction', function () {
      const psbt = acidTest.createPsbt();
      const explanation = explainPsbt(psbt, { pubs: acidTest.rootWalletKeys }, acidTest.network, { strict: true });
      assert.strictEqual(explanation.outputs.length, 3);
      assert.strictEqual(explanation.outputAmount, '2700');
      assert.strictEqual(explanation.changeOutputs.length, acidTest.outputs.length - 3);
      explanation.changeOutputs.forEach((change) => {
        assert.strictEqual(change.amount, '900');
        assert.strictEqual(typeof change.address, 'string');
      });
      assert.strictEqual(explanation.inputSignatures.length, acidTest.inputs.length);
      explanation.inputSignatures.forEach((signature, i) => {
        if (acidTest.inputs[i].scriptType === 'p2shP2pk') {
          return;
        }
        if (acidTest.signStage === 'unsigned') {
          assert.strictEqual(signature, 0);
        } else if (acidTest.signStage === 'halfsigned') {
          assert.strictEqual(signature, 1);
        } else if (acidTest.signStage === 'fullsigned') {
          assert.strictEqual(signature, 2);
        }
      });
    });
  });
}

testutil.AcidTest.suite().forEach((test) => describeTransactionWith(test));
