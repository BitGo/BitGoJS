import assert from 'assert';

import { getKeyTriple } from '@bitgo/utxo-core/testutil';
import { getDescriptorMap, mockPsbtDefaultWithDescriptorTemplate } from '@bitgo/utxo-core/testutil/descriptor';

import { TransactionExplanation } from '../../../src';
import { explainPsbt } from '../../../src/transaction/descriptor';

import { getFixtureRoot } from './fixtures.utils';

const { assertEqualFixture } = getFixtureRoot(__dirname + '/fixtures');

function assertSignatureCount(expl: TransactionExplanation, signatures: number, inputSignatures: number[]) {
  assert.deepStrictEqual(expl.signatures, signatures);
  assert.deepStrictEqual(expl.inputSignatures, inputSignatures);
}

describe('explainPsbt', function () {
  it('has expected values', async function () {
    const psbt = mockPsbtDefaultWithDescriptorTemplate('Wsh2Of3');
    const keys = getKeyTriple('a');
    const descriptorMap = getDescriptorMap('Wsh2Of3', keys);
    await assertEqualFixture('explainPsbt.a.json', explainPsbt(psbt, descriptorMap));
    psbt.signAllInputsHD(keys[0]);
    assertSignatureCount(explainPsbt(psbt, descriptorMap), 1, [1, 1]);
    psbt.signAllInputsHD(keys[1]);
    assertSignatureCount(explainPsbt(psbt, descriptorMap), 2, [2, 2]);
  });
});
