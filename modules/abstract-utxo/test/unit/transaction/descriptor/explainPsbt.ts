import assert from 'assert';

import { getKeyTriple } from '@bitgo/utxo-core/testutil';
import { getDescriptorMap, mockPsbtDefaultWithDescriptorTemplate } from '@bitgo/utxo-core/testutil/descriptor';
import { descriptorWallet } from '@bitgo/wasm-utxo';

import type { TransactionExplanation } from '../../../../src/transaction/fixedScript/explainTransaction';
import { explainPsbt } from '../../../../src/transaction/descriptor';
import { toWasmPsbt } from '../../../../src/wasmUtil';

import { getFixtureRoot } from './fixtures.utils';

const { assertEqualFixture } = getFixtureRoot(__dirname + '/fixtures');

function assertSignatureCount(expl: TransactionExplanation, signatures: number, inputSignatures: number[]) {
  assert.ok('signatures' in expl);
  assert.ok('inputSignatures' in expl);
  assert.deepStrictEqual(expl.signatures, signatures);
  assert.deepStrictEqual(expl.inputSignatures, inputSignatures);
}

describe('explainPsbt', function () {
  it('has expected values', async function () {
    const psbt = toWasmPsbt(mockPsbtDefaultWithDescriptorTemplate('Wsh2Of3'));
    const keys = getKeyTriple('a');
    const descriptorMap = getDescriptorMap('Wsh2Of3', keys);
    await assertEqualFixture('explainPsbt.a.json', explainPsbt(psbt, descriptorMap, 'btc'));
    descriptorWallet.signWithKey(psbt, keys[0]);
    assertSignatureCount(explainPsbt(psbt, descriptorMap, 'btc'), 1, [1, 1]);
    descriptorWallet.signWithKey(psbt, keys[1]);
    assertSignatureCount(explainPsbt(psbt, descriptorMap, 'btc'), 2, [2, 2]);
  });
});
