import assert from 'node:assert/strict';

import { testutil } from '@bitgo/utxo-lib';

import type { TransactionExplanation } from '../../../../src/transaction/fixedScript/explainTransaction';
import { explainPsbt } from '../../../../src/transaction/fixedScript';

function describeTransactionWith(acidTest: testutil.AcidTest) {
  describe(`${acidTest.name}`, function () {
    let refExplanation: TransactionExplanation;
    before('prepare', function () {
      const psbt = acidTest.createPsbt();
      refExplanation = explainPsbt(psbt, { pubs: acidTest.rootWalletKeys }, acidTest.network, {
        strict: true,
      });
    });

    it('should match the expected values for explainPsbt', function () {
      // note: `outputs` means external outputs here
      assert.strictEqual(refExplanation.outputs.length, 3);
      assert.strictEqual(refExplanation.changeOutputs.length, acidTest.outputs.length - 3);
      assert.strictEqual(refExplanation.outputAmount, '2700');
      assert.strictEqual(refExplanation.changeOutputs.length, acidTest.outputs.length - 3);
      refExplanation.changeOutputs.forEach((change) => {
        assert.strictEqual(change.amount, '900');
        assert.strictEqual(typeof change.address, 'string');
      });
    });
  });
}

describe('explainPsbt', function () {
  testutil.AcidTest.suite().forEach((test) => describeTransactionWith(test));
});
