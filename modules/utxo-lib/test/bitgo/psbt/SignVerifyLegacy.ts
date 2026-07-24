import * as assert from 'assert';

import { getStrictSignatureCount, getStrictSignatureCounts } from '../../../src/bitgo';
import { constructTxnBuilder, TxnInput } from '../../../src/testutil';
import { AcidTest, SignStage } from '../../../src/testutil/psbt';
import { getNetworkName } from '../../../src';

function signCount(signStage: SignStage) {
  return signStage === 'unsigned' ? 0 : signStage === 'halfsigned' ? 1 : 2;
}

function runTx(acidTest: AcidTest) {
  const coin = getNetworkName(acidTest.network);
  const signatureCount = signCount(acidTest.signStage);
  describe(`tx build, sign and verify for ${coin} ${acidTest.signStage}`, function () {
    const inputs = acidTest.inputs.filter(
      (input): input is TxnInput<bigint> =>
        input.scriptType !== 'taprootKeyPathSpend' && input.scriptType !== 'p2trMusig2'
    );
    const outputs = acidTest.outputs.filter(
      (output) =>
        ('scriptType' in output && output.scriptType !== undefined) ||
        ('address' in output && output.address !== undefined)
    );
    it(`tx signature counts ${coin} ${acidTest.signStage}`, function () {
      const txb = constructTxnBuilder(inputs, outputs, acidTest.network, acidTest.rootWalletKeys, acidTest.signStage);
      const tx = acidTest.signStage === 'fullsigned' ? txb.build() : txb.buildIncomplete();

      const counts = getStrictSignatureCounts(tx);
      const countsFromIns = getStrictSignatureCounts(tx.ins);

      assert.strictEqual(counts.length, tx.ins.length);
      assert.strictEqual(countsFromIns.length, tx.ins.length);
      tx.ins.forEach((input, inputIndex) => {
        const expectedCount = inputs[inputIndex].scriptType === 'p2shP2pk' && signatureCount > 0 ? 1 : signatureCount;
        assert.strictEqual(
          getStrictSignatureCount(input),
          expectedCount,
          `input ${inputIndex} has ${getStrictSignatureCount(input)} signatures, expected ${expectedCount}`
        );
        assert.strictEqual(counts[inputIndex], expectedCount);
        assert.strictEqual(countsFromIns[inputIndex], expectedCount);
      });
    });
  });
}

AcidTest.suite()
  .filter((acidTest) => acidTest.txFormat === 'psbt')
  .forEach((acidTest) => {
    runTx(acidTest);
  });
