import * as assert from 'assert';

import { getDefaultXPubs, getDescriptor } from '../descriptor.utils';
import { findDescriptorForInput, findDescriptorForOutput } from '../../../../src/core/descriptor/psbt/findDescriptors';

import { mockPsbt } from './mock.utils';

describe('parsePsbt', function () {
  const descriptorA = getDescriptor('Wsh2Of3', getDefaultXPubs('a'));
  const descriptorB = getDescriptor('Wsh2Of3', getDefaultXPubs('b'));
  const descriptorMap = new Map([
    ['a', descriptorA],
    ['b', descriptorB],
  ]);

  it('finds descriptors for PSBT inputs/outputs', function () {
    const psbt = mockPsbt(
      [
        { descriptor: descriptorA, index: 0 },
        { descriptor: descriptorB, index: 1, id: { vout: 1 } },
      ],
      [{ descriptor: descriptorA, index: 2, value: BigInt(1e6) }]
    );

    assert.deepStrictEqual(findDescriptorForInput(psbt.data.inputs[0], descriptorMap), {
      descriptor: descriptorA,
      index: 0,
    });
    assert.deepStrictEqual(findDescriptorForInput(psbt.data.inputs[1], descriptorMap), {
      descriptor: descriptorB,
      index: 1,
    });
    assert.deepStrictEqual(findDescriptorForOutput(psbt.txOutputs[0].script, psbt.data.outputs[0], descriptorMap), {
      descriptor: descriptorA,
      index: 2,
    });
  });
});
