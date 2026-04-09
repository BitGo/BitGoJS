import assert from 'assert';

import { Triple } from '@bitgo/sdk-core';
import { bip32 } from '@bitgo/wasm-utxo';
import * as testutils from '@bitgo/wasm-utxo/testutils';

import {
  assertDescriptorPolicy,
  DescriptorPolicyValidationError,
  DescriptorValidationPolicy,
  getPolicyForEnv,
  getValidatorDescriptorTemplate,
} from '../../../../src/descriptor/validatePolicy';
import {
  NamedDescriptor,
  createNamedDescriptorWithSignature,
  toNamedDescriptorNative,
} from '../../../../src/descriptor';

type DescriptorTemplate = testutils.descriptor.DescriptorTemplate;
const { getDescriptor } = testutils.descriptor;

function testAssertDescriptorPolicy(
  ds: NamedDescriptor<string>[],
  p: DescriptorValidationPolicy,
  k: Triple<bip32.BIP32Interface>,
  expectedError: DescriptorPolicyValidationError | null
) {
  const f = () =>
    assertDescriptorPolicy(
      ds.map((d) => toNamedDescriptorNative(d, 'derivable')),
      p,
      k
    );
  if (expectedError) {
    assert.throws(f);
  } else {
    assert.doesNotThrow(f);
  }
}

describe('assertDescriptorPolicy', function () {
  const keys = testutils.getKeyTriple('default');
  function getNamedDescriptorSigned(name: DescriptorTemplate): NamedDescriptor {
    return createNamedDescriptorWithSignature(name, getDescriptor(name), keys[0]);
  }
  function getNamedDescriptor(name: DescriptorTemplate): NamedDescriptor {
    return stripSignature(getNamedDescriptorSigned(name));
  }

  function stripSignature(d: NamedDescriptor): NamedDescriptor {
    return { ...d, signatures: undefined };
  }

  it('has expected result', function () {
    testAssertDescriptorPolicy([getNamedDescriptor('Wsh2Of3')], getValidatorDescriptorTemplate('Wsh2Of3'), keys, null);

    // prod does only allow Wsh2Of3-ish descriptors
    testAssertDescriptorPolicy([getNamedDescriptor('Wsh2Of3')], getPolicyForEnv('prod'), keys, null);
    testAssertDescriptorPolicy([getNamedDescriptor('Wsh2Of3CltvDrop')], getPolicyForEnv('prod'), keys, null);

    // does not allow mixed descriptors
    testAssertDescriptorPolicy(
      [getNamedDescriptor('Wsh2Of3'), getNamedDescriptor('Wsh2Of3CltvDrop')],
      getPolicyForEnv('prod'),
      keys,
      new DescriptorPolicyValidationError(
        [
          toNamedDescriptorNative(getNamedDescriptor('Wsh2Of3'), 'derivable'),
          toNamedDescriptorNative(getNamedDescriptor('Wsh2Of3CltvDrop'), 'derivable'),
        ],
        getPolicyForEnv('prod')
      )
    );

    // prod only allows other descriptors if they are signed by the user key
    testAssertDescriptorPolicy([getNamedDescriptorSigned('Wsh2Of2')], getPolicyForEnv('prod'), keys, null);
    testAssertDescriptorPolicy(
      [getNamedDescriptor('Wsh2Of2')],
      getPolicyForEnv('prod'),
      keys,
      new DescriptorPolicyValidationError(
        [toNamedDescriptorNative(getNamedDescriptor('Wsh2Of2'), 'derivable')],
        getPolicyForEnv('prod')
      )
    );

    // test is very permissive by default
    testAssertDescriptorPolicy([stripSignature(getNamedDescriptor('Wsh2Of2'))], getPolicyForEnv('test'), keys, null);
  });
});
