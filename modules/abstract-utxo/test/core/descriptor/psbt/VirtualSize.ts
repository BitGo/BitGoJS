import assert from 'assert';

import {
  getChangeOutputVSizesForDescriptor,
  getInputVSizesForDescriptors,
  getVirtualSize,
} from '../../../../src/core/descriptor/VirtualSize';
import { DescriptorTemplate, getDescriptor, getDescriptorMap } from '../descriptor.utils';

describe('VirtualSize', function () {
  describe('getInputVSizesForDescriptorWallet', function () {
    it('returns the input virtual sizes for a descriptor wallet', function () {
      assert.deepStrictEqual(
        getInputVSizesForDescriptors(
          new Map([
            ['foo', getDescriptor('Wsh2Of2')],
            ['bar', getDescriptor('Wsh2Of2')],
          ])
        ),
        {
          foo: 96,
          bar: 96,
        }
      );
      assert.deepStrictEqual(getInputVSizesForDescriptors(getDescriptorMap('Wsh2Of3')), {
        external: 105,
        internal: 105,
      });
    });
  });

  describe('getChangeOutputVSizesForDescriptor', function () {
    it('returns the output virtual sizes for a descriptor', function () {
      assert.deepStrictEqual(getChangeOutputVSizesForDescriptor(getDescriptor('Wsh2Of2')), {
        inputVSize: 96,
        outputVSize: 34,
      });
    });
  });

  function describeWithTemplate(t: DescriptorTemplate, inputSize: number, outputSize: number) {
    describe(`getVirtualSize ${t}`, function () {
      it('returns expected virtual size', function () {
        assert.deepStrictEqual(
          getVirtualSize(
            {
              inputs: [{ descriptorName: 'internal' }],
              outputs: [{ script: Buffer.alloc(32) }],
            },
            getDescriptorMap(t)
          ),
          outputSize
        );

        const descriptor = getDescriptor(t);

        const nInputs = 10_000;
        assert.deepStrictEqual(
          getVirtualSize({
            /* as proof we can pass 10_000 inputs */
            inputs: Array.from({ length: nInputs }).map(() => descriptor),
            outputs: [],
          }),
          inputSize * nInputs + 11
        );
      });
    });
  }

  describeWithTemplate('Wsh2Of3', 105, 157);
  describeWithTemplate('Tr2Of3-NoKeyPath', 109, 161);
});
