import assert from 'assert';

import { Triple } from '@bitgo/sdk-core';
import { pox5 } from '@bitgo/utxo-descriptors';
import { bip32, Descriptor } from '@bitgo/wasm-utxo';
import * as testutils from '@bitgo/wasm-utxo/testutils';

import {
  assertDescriptorPolicy,
  DescriptorPolicyValidationError,
  DescriptorValidationPolicy,
  getPolicyForEnv,
  getValidatorDescriptorTemplate,
  getValidatorPox5Lockup,
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

describe('PoX-5 lockup descriptor policy', function () {
  const keys = testutils.getKeyTriple('default');
  const stakerCommitment = Buffer.alloc(32, 0x42);
  const earlyExitKey = Buffer.from(keys[0].derive(9).publicKey);

  function getLockupDescriptor(stakerKeys: Triple<bip32.BIP32Interface> = keys): Descriptor {
    return pox5.createPox5LockupDescriptor({
      unlockHeight: 840_000,
      stakerCommitment,
      earlyExitKey,
      stakerKeys,
    });
  }

  function toNamed(value: string, name = 'descriptor'): NamedDescriptor {
    return { name, value };
  }

  const external = toNamed(getDescriptor('Wsh2Of3').toString(), 'external');
  const internal = toNamed(getDescriptor('Wsh2Of3').toString(), 'internal');
  const lockup = toNamed(getLockupDescriptor().toString(), 'pox5-lockup-u840000');
  const policy = getValidatorPox5Lockup(['Wsh2Of3', 'Wsh2Of3CltvDrop', 'SbtcDeposit']);

  function assertAccepts(ds: NamedDescriptor[]): void {
    assert.doesNotThrow(() =>
      assertDescriptorPolicy(
        ds.map((d) => toNamedDescriptorNative(d, 'derivable')),
        policy,
        keys
      )
    );
    assert.doesNotThrow(() =>
      assertDescriptorPolicy(
        ds.map((d) => toNamedDescriptorNative(d, 'derivable')),
        getPolicyForEnv('prod'),
        keys
      )
    );
  }

  function assertRejects(ds: NamedDescriptor[]): void {
    assert.throws(() =>
      assertDescriptorPolicy(
        ds.map((d) => toNamedDescriptorNative(d, 'derivable')),
        policy,
        keys
      )
    );
    assert.throws(() =>
      assertDescriptorPolicy(
        ds.map((d) => toNamedDescriptorNative(d, 'derivable')),
        getPolicyForEnv('prod'),
        keys
      )
    );
  }

  it('accepts wallet descriptors mixed with a canonical lockup', function () {
    assertAccepts([lockup]);
    assertAccepts([external, internal, lockup]);
  });

  it('requires at least one lockup', function () {
    // the template policy already accepts plain wallet descriptor groups
    assert.throws(() =>
      assertDescriptorPolicy(
        [external, internal].map((d) => toNamedDescriptorNative(d, 'derivable')),
        policy,
        keys
      )
    );
  });

  it('rejects lockups with foreign staker keys', function () {
    assertRejects([external, internal, toNamed(getLockupDescriptor(testutils.getKeyTriple('foreign')).toString())]);
  });

  it('rejects malformed and non-canonical lockups', function () {
    const malformed = getLockupDescriptor().toString().split('#')[0].replace('multi(2,', 'multi(3,');
    assertRejects([external, internal, toNamed(malformed)]);
    assertRejects([external, internal, toNamed(`wsh(pk(${keys[0].neutered().toBase58()}/*))`)]);
    assertRejects([toNamed(malformed)]);
  });

  it('returns false instead of throwing for descriptors it cannot parse', function () {
    const nativeLockup = toNamedDescriptorNative(lockup, 'derivable');
    assert.strictEqual(getValidatorDescriptorTemplate('Wsh2Of3').validate([nativeLockup], keys), false);
    assert.strictEqual(getValidatorDescriptorTemplate('Wsh2Of3CltvDrop').validate([nativeLockup], keys), false);
  });
});
