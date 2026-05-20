import * as assert from 'assert';

import { InvalidAddressDerivationPropertyError, UnexpectedAddressError } from '@bitgo/sdk-core';
import { fixedScriptWallet } from '@bitgo/wasm-utxo';

import { assertFixedScriptWalletAddress, generateAddress } from '../../src';

import { keychainsBase58 } from './util';

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

    // Regression: an unknown chain code must never silently fall back to P2SH.
    // If the server returns a new chain code that this SDK version does not
    // recognise, the validation should fail loudly rather than derive a P2SH
    // address and produce a confusing mismatch error.
    //
    // Historical instance: bitgo@18.0.1 did not know chain=40 (p2trMusig2).
    // When the server returned { chain: 40, address: "tb1p..." }, the client
    // fell back to chain=0, derived a P2SH address, and threw
    // UnexpectedAddressError("expected 2NEU8... but got tb1p...") — hiding the
    // real cause entirely.
    it('throws UnexpectedAddressError for an unknown chain code, revealing the P2SH fallback', function () {
      assert.ok(!fixedScriptWallet.ChainCode.is(unknownChainCode), 'test prerequisite: chain must be unknown');

      // The server-side address for chain=40 (p2trMusig2) — what a newer server
      // would return when this older client does not know about chain=40 yet.
      const serverAddress = generateAddress('btc', { keychains, chain: 40 });
      const p2shFallbackAddress = generateAddress('btc', { keychains, chain: 0 });

      let err: unknown;
      try {
        assertFixedScriptWalletAddress('btc', {
          chain: unknownChainCode,
          index: 0,
          keychains,
          format: 'base58',
          address: serverAddress,
        });
      } catch (e) {
        err = e;
      }

      assert.ok(err instanceof UnexpectedAddressError);

      // The error message reveals the fallback: it mentions the P2SH address
      // rather than anything about the unrecognised chain code.
      assert.ok(
        err.message.includes(p2shFallbackAddress),
        `expected error to mention the P2SH fallback address (${p2shFallbackAddress}), got: ${err.message}`
      );
      assert.ok(
        err.message.includes(serverAddress),
        `expected error to mention the server address (${serverAddress}), got: ${err.message}`
      );
    });

    it('generateAddress silently produces a P2SH address for an unknown chain code', function () {
      assert.ok(!fixedScriptWallet.ChainCode.is(unknownChainCode), 'test prerequisite: chain must be unknown');
      const fallback = generateAddress('btc', { keychains, chain: unknownChainCode });
      const p2sh = generateAddress('btc', { keychains, chain: 0 });
      assert.strictEqual(fallback, p2sh);
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
