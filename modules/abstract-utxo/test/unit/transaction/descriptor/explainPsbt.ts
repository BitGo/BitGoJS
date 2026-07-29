import assert from 'assert';

import { descriptorWallet } from '@bitgo/wasm-utxo';
import * as testutils from '@bitgo/wasm-utxo/testutils';

import type { TransactionExplanation } from '../../../../src/transaction/fixedScript/explainTransaction';
import { explainPsbt } from '../../../../src/transaction/descriptor';

import { getFixtureRoot } from './fixtures.utils';

const { getDescriptorMap, mockPsbtDefaultWithDescriptorTemplate } = testutils.descriptor;
const { assertEqualFixture } = getFixtureRoot(__dirname + '/fixtures');

function assertSignatureCount(expl: TransactionExplanation, signatures: number, inputSignatures: number[]) {
  assert.ok('signatures' in expl);
  assert.ok('inputSignatures' in expl);
  assert.deepStrictEqual(expl.signatures, signatures);
  assert.deepStrictEqual(expl.inputSignatures, inputSignatures);
}

describe('explainPsbt', function () {
  it('has expected values', async function () {
    const psbt = mockPsbtDefaultWithDescriptorTemplate('Wsh2Of3');
    const keys = testutils.getKeyTriple('a');
    const descriptorMap = getDescriptorMap('Wsh2Of3', keys);
    await assertEqualFixture('explainPsbt.a.json', explainPsbt(psbt, descriptorMap, 'btc'));
    descriptorWallet.signWithKey(psbt, keys[0]);
    assertSignatureCount(explainPsbt(psbt, descriptorMap, 'btc'), 1, [1, 1]);
    descriptorWallet.signWithKey(psbt, keys[1]);
    assertSignatureCount(explainPsbt(psbt, descriptorMap, 'btc'), 2, [2, 2]);
  });
});
