import * as assert from 'assert';

import { DescriptorTemplate, getDefaultXPubs, getDescriptor } from '../../../src/testutil/descriptor/descriptors';
import { findDescriptorForInput, findDescriptorForOutput } from '../../../src/descriptor/psbt/findDescriptors';
import { mockPsbt } from '../../../src/testutil/descriptor/mock.utils';

function describeWithTemplates(templateSelf: DescriptorTemplate, templateOther: DescriptorTemplate) {
  describe(`parsePsbt [${templateSelf},${templateOther}]`, function () {
    const descriptorA = getDescriptor(templateSelf, getDefaultXPubs('a'));
    const descriptorB = getDescriptor(templateOther, getDefaultXPubs('b'));
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
}

describeWithTemplates('Wsh2Of3', 'Wsh2Of3');
describeWithTemplates('Wsh2Of3', 'Tr2Of3-NoKeyPath');
describeWithTemplates('Tr2Of3-NoKeyPath', 'Tr2Of3-NoKeyPath');
