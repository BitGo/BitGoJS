import assert from 'assert';

import { explainPsbt } from '../../../src/transaction/descriptor';
import { mockPsbtDefaultWithDescriptorTemplate } from '../../core/descriptor/psbt/mock.utils';
import { getDescriptorMap } from '../../core/descriptor/descriptor.utils';
import { getFixture } from '../../core/fixtures.utils';
import { getKeyTriple } from '../../core/key.utils';
import { TransactionExplanation } from '../../../src';

async function assertEqualFixture(name: string, v: unknown) {
  assert.deepStrictEqual(v, await getFixture(__dirname + '/fixtures/' + name, v));
}

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
