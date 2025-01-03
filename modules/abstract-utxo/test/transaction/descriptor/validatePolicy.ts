import assert from 'assert';

import { Descriptor } from '@bitgo/wasm-miniscript';
import { Triple } from '@bitgo/sdk-core';
import { BIP32Interface } from '@bitgo/utxo-lib';

import {
  assertDescriptorPolicy,
  DescriptorPolicyValidationError,
  DescriptorValidationPolicy,
  getPolicyForEnv,
  getValidatorDescriptorTemplate,
} from '../../../src/descriptor/validatePolicy';
import { getDescriptor } from '../../core/descriptor/descriptor.utils';
import { getKeyTriple } from '../../core/key.utils';

function testAssertDescriptorPolicy(
  d: Descriptor,
  p: DescriptorValidationPolicy,
  k: Triple<BIP32Interface>,
  expectedError: DescriptorPolicyValidationError | null
) {
  const f = () => assertDescriptorPolicy(d, p, k);
  if (expectedError) {
    assert.throws(f);
  } else {
    assert.doesNotThrow(f);
  }
}

describe('assertDescriptorPolicy', function () {
  it('has expected result', function () {
    const keys = getKeyTriple();
    testAssertDescriptorPolicy(getDescriptor('Wsh2Of3', keys), getValidatorDescriptorTemplate('Wsh2Of3'), keys, null);

    // prod does only allow Wsh2Of3-ish descriptors
    testAssertDescriptorPolicy(getDescriptor('Wsh2Of3', keys), getPolicyForEnv('prod'), keys, null);
    testAssertDescriptorPolicy(
      getDescriptor('Wsh2Of2', keys),
      getPolicyForEnv('prod'),
      keys,
      new DescriptorPolicyValidationError(getDescriptor('Wsh2Of2', keys), getPolicyForEnv('prod'))
    );

    // test is very permissive by default
    testAssertDescriptorPolicy(getDescriptor('Wsh2Of2', keys), getPolicyForEnv('test'), keys, null);
  });
});
