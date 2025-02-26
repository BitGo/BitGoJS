import assert from 'assert';

import {
  getChangeOutputVSizesForDescriptor,
  getInputVSizesForDescriptors,
  getVirtualSize,
  getVirtualSizeEstimateForPsbt,
} from '../../../src/descriptor/VirtualSize';
import {
  DescriptorTemplate,
  getDefaultXPubs,
  getDescriptor,
  getDescriptorMap,
  mockPsbtDefault,
} from '../../../src/testutil/descriptor';
import { getKeyTriple } from '../../../src/testutil';
import { finalizePsbt } from '../../../src/descriptor';

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
              outputs: [{ script: Buffer.alloc(34) }],
            },
            getDescriptorMap(t)
          ),
          inputSize + outputSize + 11
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

    describe(`getVirtualSizeForPsbt ${t}`, function () {
      const keys = getKeyTriple('a');
      const descriptorSelf = getDescriptor(
        t,
        keys.map((k) => k.neutered().toBase58())
      );
      const descriptorOther = getDescriptor(t, getDefaultXPubs('b'));
      it('returns expected virtual size', function () {
        const psbt = mockPsbtDefault({ descriptorSelf, descriptorOther });
        const descriptorMap = new Map([['internal', descriptorSelf]]);
        const expectedVirtualSize = inputSize * 2 + outputSize * 2 + 11;
        assert.deepStrictEqual(getVirtualSizeEstimateForPsbt(psbt, descriptorMap), expectedVirtualSize);
        psbt.signAllInputsHD(keys[0]);
        psbt.signAllInputsHD(keys[1]);
        finalizePsbt(psbt);
        // TODO(BTC-1797): figure out why we overestimate by 1
        assert.strictEqual(psbt.extractTransaction().virtualSize(), expectedVirtualSize - 1);
      });
    });
  }

  describeWithTemplate('Wsh2Of3', 105, 43);
  describeWithTemplate('Tr2Of3-NoKeyPath', 109, 43);
});
