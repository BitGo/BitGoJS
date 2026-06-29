import * as assert from 'assert';

import { InvalidAddressDerivationPropertyError, UnexpectedAddressError } from '@bitgo/sdk-core';
import { fixedScriptWallet } from '@bitgo/wasm-utxo';

import { assertFixedScriptWalletAddress, generateAddress } from '../../src';

import { getUtxoCoin, keychainsBase58 } from './util';

const keychains = keychainsBase58.map((k) => ({ pub: k.pub }));

// A chain code that no released SDK version has ever defined — simulates a future
// server-side address type unknown to an older client.
const unknownChainCode = 99;

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

    // Regression guard for T1-3386 / T1-3385: an unknown chain code must throw
    // immediately with a clear message rather than silently falling back to P2SH
    // and producing a confusing "expected <P2SH> but got <P2TR>" error.
    it('throws InvalidAddressDerivationPropertyError for an unknown chain code', function () {
      assert.ok(!fixedScriptWallet.ChainCode.is(unknownChainCode), 'test prerequisite: chain must be unknown');
      const serverAddress = generateAddress('btc', { keychains, chain: 40 });
      assert.throws(
        () =>
          assertFixedScriptWalletAddress('btc', {
            chain: unknownChainCode,
            index: 0,
            keychains,
            format: 'base58',
            address: serverAddress,
          }),
        (err: unknown) => {
          assert.ok(err instanceof InvalidAddressDerivationPropertyError);
          assert.ok(
            err.message.includes(String(unknownChainCode)),
            `expected error to name the unrecognised chain code, got: ${err.message}`
          );
          return true;
        }
      );
    });

    it('generateAddress throws InvalidAddressDerivationPropertyError for an unknown chain code', function () {
      assert.ok(!fixedScriptWallet.ChainCode.is(unknownChainCode), 'test prerequisite: chain must be unknown');
      assert.throws(
        () => generateAddress('btc', { keychains, chain: unknownChainCode }),
        InvalidAddressDerivationPropertyError
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

describe('AbstractUtxoCoin.deriveAddress', function () {
  const coin = getUtxoCoin('btc');

  // Bullish scope: legacy P2SH (chain 0) + bech32 P2WSH (chain 20).
  for (const { label, chain } of [
    { label: 'legacy P2SH', chain: 0 },
    { label: 'bech32 P2WSH', chain: 20 },
  ]) {
    it(`derives the ${label} address (chain ${chain}) matching generateAddress`, async function () {
      const result = await coin.deriveAddress({ keychains, chain, index: 0 });
      result.address.should.equal(generateAddress('btc', { keychains, chain, index: 0 }));
      result.chain!.should.equal(chain);
      result.index!.should.equal(0);
    });

    it(`round-trips with isWalletAddress for ${label} (chain ${chain})`, async function () {
      const { address } = await coin.deriveAddress({ keychains, chain, index: 3 });
      const verified = await coin.isWalletAddress({ address, keychains, chain, index: 3 });
      verified.should.equal(true);
    });
  }

  it('throws if keychains are missing', async function () {
    await assert.rejects(async () => coin.deriveAddress({ chain: 0, index: 0 }), /keychains/);
  });
});
