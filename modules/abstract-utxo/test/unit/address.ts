import * as assert from 'assert';

import { InvalidAddressDerivationPropertyError, UnexpectedAddressError } from '@bitgo/sdk-core';

import { assertFixedScriptWalletAddress, generateAddress } from '../../src';

import { keychainsBase58 } from './util';

const keychains = keychainsBase58.map((k) => ({ pub: k.pub }));

describe('assertFixedScriptWalletAddress', function () {
  describe('input validation', function () {
    it('throws InvalidAddressDerivationPropertyError when both chain and index are undefined', function () {
      assert.throws(
        () =>
          assertFixedScriptWalletAddress('btc', {
            chain: undefined,
            index: undefined as unknown as number,
            keychains,
            format: 'base58',
            address: 'anything',
          }),
        InvalidAddressDerivationPropertyError
      );
    });

    it('throws InvalidAddressDerivationPropertyError when chain is non-finite', function () {
      assert.throws(
        () =>
          assertFixedScriptWalletAddress('btc', {
            chain: Infinity,
            index: 0,
            keychains,
            format: 'base58',
            address: 'anything',
          }),
        InvalidAddressDerivationPropertyError
      );
    });

    it('throws InvalidAddressDerivationPropertyError when index is non-finite', function () {
      assert.throws(
        () =>
          assertFixedScriptWalletAddress('btc', {
            chain: 0,
            index: NaN,
            keychains,
            format: 'base58',
            address: 'anything',
          }),
        InvalidAddressDerivationPropertyError
      );
    });

    it('throws when keychains is missing', function () {
      assert.throws(
        () =>
          assertFixedScriptWalletAddress('btc', {
            chain: 0,
            index: 0,
            keychains: undefined as unknown as { pub: string }[],
            format: 'base58',
            address: 'anything',
          }),
        /missing required param keychains/
      );
    });
  });

  describe('address matching', function () {
    it('throws UnexpectedAddressError when address does not match derived address', function () {
      assert.throws(
        () =>
          assertFixedScriptWalletAddress('btc', {
            chain: 0,
            index: 0,
            keychains,
            format: 'base58',
            address: '3AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          }),
        UnexpectedAddressError
      );
    });

    it('succeeds for btc p2sh (chain 0)', function () {
      const address = generateAddress('btc', { keychains, chain: 0 });
      assert.doesNotThrow(() =>
        assertFixedScriptWalletAddress('btc', {
          chain: 0,
          index: 0,
          keychains,
          format: 'base58',
          address,
        })
      );
    });

    it('succeeds for btc p2wsh (chain 20)', function () {
      const address = generateAddress('btc', { keychains, chain: 20 });
      assert.doesNotThrow(() =>
        assertFixedScriptWalletAddress('btc', {
          chain: 20,
          index: 0,
          keychains,
          format: 'base58',
          address,
        })
      );
    });

    it('succeeds for btc p2tr (chain 40)', function () {
      const address = generateAddress('btc', { keychains, chain: 40 });
      assert.doesNotThrow(() =>
        assertFixedScriptWalletAddress('btc', {
          chain: 40,
          index: 0,
          keychains,
          format: 'base58',
          address,
        })
      );
    });

    it('succeeds for bch cashaddr (chain 0)', function () {
      const address = generateAddress('bch', { keychains, chain: 0, format: 'cashaddr' });
      assert.doesNotThrow(() =>
        assertFixedScriptWalletAddress('bch', {
          chain: 0,
          index: 0,
          keychains,
          format: 'cashaddr',
          address,
        })
      );
    });

    it('succeeds for a non-zero index', function () {
      const address = generateAddress('btc', { keychains, chain: 0, index: 5 });
      assert.doesNotThrow(() =>
        assertFixedScriptWalletAddress('btc', {
          chain: 0,
          index: 5,
          keychains,
          format: 'base58',
          address,
        })
      );
    });

    it('throws UnexpectedAddressError when index does not match', function () {
      const address = generateAddress('btc', { keychains, chain: 0, index: 0 });
      assert.throws(
        () =>
          assertFixedScriptWalletAddress('btc', {
            chain: 0,
            index: 1,
            keychains,
            format: 'base58',
            address,
          }),
        UnexpectedAddressError
      );
    });
  });
});
