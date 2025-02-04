import assert from 'assert';

import { getDefaultXPubs, getDescriptorMap } from '@bitgo/utxo-core/testutil/descriptor';

import { getDescriptorMapFromWallet, isDescriptorWallet } from '../../src/descriptor';
import { UtxoWallet } from '../../src/wallet';
import { toBip32Triple } from '../../src/keychains';
import { policyAllowAll } from '../../src/descriptor/validatePolicy';

describe('isDescriptorWalletData', function () {
  const descriptorMap = getDescriptorMap('Wsh2Of3');
  it('should return true for valid DescriptorWalletData', function () {
    const wallet: UtxoWallet = {
      coinSpecific() {
        return {
          descriptors: [...descriptorMap.entries()].map(([name, descriptor]) => ({
            name,
            value: descriptor.toString(),
          })),
        };
      },
    } as unknown as UtxoWallet;

    assert(isDescriptorWallet(wallet));
    assert.strictEqual(
      getDescriptorMapFromWallet(wallet, toBip32Triple(getDefaultXPubs()), policyAllowAll).size,
      descriptorMap.size
    );
  });
});
