import * as assert from 'assert';

import { InvalidAddressDerivationPropertyError } from '@bitgo/sdk-core';

import { assertFixedScriptWalletAddress, generateAddress } from '../../src';

const keychains = [
  {
    pub: 'xpub661MyMwAqRbcGiQhVk1J7cD1YodF9tc5Y1B8vpTjjB1pcB1J1m1QX8fMtYP2sYqFmW6J2ra69tNoARKjvTGo9cGUrbPbJdjwrSzGGzPzWWS',
  },
  {
    pub: 'xpub661MyMwAqRbcFzLXuganogQvd7MrefQQqCcJP2ZDumnCdQecf5cw1P1nD5qBz8SNS1yCLSC9VqpNUWnQU3V6qmnPt2r21oXhicQFzPA6Lby',
  },
  {
    pub: 'xpub661MyMwAqRbcFHpwWrzPB61U2CgBmdD21WNVM1JKUn9rEExkoGE4yafUVFbPSd78vdX8tWcEUQWaALFkU9fUbUM4Cc49DKEJSCYGRnbzCym',
  },
];

describe('fixedScript address index edge cases', function () {
  const chain = 20;

  for (const invalidIndex of [-1, 1.5]) {
    it(`rejects invalid derivation index ${invalidIndex}`, function () {
      assert.throws(
        () =>
          generateAddress('btc', {
            keychains,
            chain,
            index: invalidIndex,
          }),
        InvalidAddressDerivationPropertyError
      );
    });

    it(`rejects index ${invalidIndex} during address validation`, function () {
      const address0 = generateAddress('btc', {
        keychains,
        chain,
        index: 0,
      });

      assert.throws(
        () =>
          assertFixedScriptWalletAddress('btc', {
            chain,
            index: invalidIndex,
            keychains,
            format: 'base58',
            address: address0,
          }),
        InvalidAddressDerivationPropertyError
      );
    });
  }

  it('rejects a non-integer derivation chain', function () {
    assert.throws(
      () =>
        generateAddress('btc', {
          keychains,
          chain: 1.5,
          index: 0,
        }),
      InvalidAddressDerivationPropertyError
    );
  });

  it('rejects a non-integer chain during address validation', function () {
    const address = generateAddress('btc', {
      keychains,
      chain: 0,
      index: 0,
    });

    assert.throws(
      () =>
        assertFixedScriptWalletAddress('btc', {
          chain: 1.5,
          index: 0,
          keychains,
          format: 'base58',
          address,
        }),
      InvalidAddressDerivationPropertyError
    );
  });

  it('still accepts index 0', function () {
    const address0 = generateAddress('btc', {
      keychains,
      chain,
      index: 0,
    });

    assert.doesNotThrow(() =>
      assertFixedScriptWalletAddress('btc', {
        chain,
        index: 0,
        keychains,
        format: 'base58',
        address: address0,
      })
    );
  });
});
