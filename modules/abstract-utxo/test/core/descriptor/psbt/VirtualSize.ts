import * as assert from 'assert';

import {
  getChangeOutputVSizesForDescriptor,
  getInputVSizesForDescriptors,
  getVirtualSize,
} from '../../../../src/core/descriptor/VirtualSize';
import { getDescriptor, getDescriptorMap } from '../descriptor.utils';

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

  describe('getVirtualSize', function () {
    it('returns expected virtual size', function () {
      assert.deepStrictEqual(
        getVirtualSize(
          {
            inputs: [{ descriptorName: 'internal' }],
            outputs: [{ script: Buffer.alloc(32) }],
          },
          getDescriptorMap('Wsh2Of3')
        ),
        157
      );

      const descriptor = getDescriptor('Wsh2Of3');

      assert.deepStrictEqual(
        getVirtualSize({
          /* as proof we can pass 10_000 inputs */
          inputs: Array.from({ length: 10_000 }).map(() => descriptor),
          outputs: [{ script: Buffer.alloc(32) }],
        }),
        1_050_052
      );
    });
  });
});
