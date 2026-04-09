import assert from 'assert';

import { isExternalOutput, isInternalOutput, toDerivedDescriptorWalletOutput } from '../../src/descriptor/Output';
import { getDescriptor } from '../../src/testutil/descriptor';
import { createScriptPubKeyFromDescriptor } from '../../src/descriptor';

describe('decscriptor.Output', function () {
  const descriptor = getDescriptor('Wsh2Of3');

  it('isInternalOutput correctly identifies internal outputs', function () {
    const internalOutput = { value: 1n, descriptor };
    const externalOutput = { value: 1n };

    assert.strictEqual(isInternalOutput(internalOutput), true);
    assert.strictEqual(isInternalOutput(externalOutput), false);
  });

  it('isExternalOutput correctly identifies external outputs', function () {
    const internalOutput = { value: 1n, descriptor };
    const externalOutput = { value: 1n };

    assert.strictEqual(isExternalOutput(internalOutput), false);
    assert.strictEqual(isExternalOutput(externalOutput), true);
  });

  it('toDerivedDescriptorWalletOutput returns expected values', function () {
    const derivable = descriptor;
    const definite = derivable.atDerivationIndex(0);
    for (const descriptor of [derivable, definite]) {
      const descriptorIndex = descriptor === derivable ? 0 : undefined;
      const descriptorMap = new Map([['desc', descriptor]]);
      const descriptorWalletOutput = {
        hash: Buffer.alloc(32).toString('hex'),
        index: 0,
        witnessUtxo: {
          script: createScriptPubKeyFromDescriptor(descriptor, descriptorIndex),
          value: 1n,
        },
        descriptorName: 'desc',
        descriptorIndex,
      };
      assert.strictEqual(
        toDerivedDescriptorWalletOutput(descriptorWalletOutput, descriptorMap).descriptor.toString(),
        definite.toString()
      );
    }
  });
});
