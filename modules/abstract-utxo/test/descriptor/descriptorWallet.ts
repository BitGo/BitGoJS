import assert from 'assert';
import { getDescriptorMapFromWalletData, isDescriptorWalletData } from '../../src/descriptor';
import { AbstractUtxoCoinWalletData } from '../../src';
import { getDescriptorMap } from '../core/descriptor/descriptor.utils';

describe('isDescriptorWalletData', function () {
  const descriptorMap = getDescriptorMap('Wsh2Of3');
  it('should return true for valid DescriptorWalletData', function () {
    const walletData: AbstractUtxoCoinWalletData = {
      coinSpecific: {
        descriptors: [...descriptorMap.entries()].map(([name, descriptor]) => ({
          name,
          value: descriptor.toString(),
        })),
      },
    } as unknown as AbstractUtxoCoinWalletData;

    assert(isDescriptorWalletData(walletData));
    assert.strictEqual(getDescriptorMapFromWalletData(walletData).size, descriptorMap.size);
  });
});
