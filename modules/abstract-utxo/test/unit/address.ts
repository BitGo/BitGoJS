import * as assert from 'assert';

import * as sinon from 'sinon';
import { InvalidAddressDerivationPropertyError, Triple, UnexpectedAddressError } from '@bitgo/sdk-core';
import { BIP32 as WasmBIP32, fixedScriptWallet } from '@bitgo/wasm-utxo';

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

describe('bip44 derivation prefix', function () {
  // Vectors from the wallet-prefix definition: sha256("BitGo/utxo/wallet-prefix/v1" || K_user || K_backup || K_bitgo)
  // with K_x = compressed pubkey || chain code of the neutered root key.
  const user = WasmBIP32.fromSeedSha256('wcn3907-u').neutered().toBase58();
  const backup = WasmBIP32.fromSeedSha256('wcn3907-b').neutered().toBase58();
  const bitgo1 = WasmBIP32.fromSeedSha256('wcn3907-g1').neutered().toBase58();
  const bitgo2 = WasmBIP32.fromSeedSha256('wcn3907-g2').neutered().toBase58();
  const wallet1 = [user, backup, bitgo1].map((pub) => ({ pub }));
  const wallet2 = [user, backup, bitgo2].map((pub) => ({ pub }));
  const prefix1 = (coinType: number) => `44/${coinType}/1528449227/506574854`;
  const prefix2 = (coinType: number) => `44/${coinType}/1401193521/285195054`;

  function derive(
    coinName: 'btc' | 'ltc' | 'tbtcreg',
    wallet: { pub: string }[],
    prefix: string | undefined,
    chain: number,
    index: number
  ): string {
    const triple = wallet.map((k) => k.pub) as Triple<string>;
    return fixedScriptWallet.address(
      prefix === undefined ? triple : { triple, derivationPrefixes: [prefix, prefix, prefix] },
      chain as fixedScriptWallet.ChainCode,
      index,
      coinName
    );
  }

  const chains = [0, 10, 20, 40];

  describe('assertFixedScriptWalletAddress', function () {
    for (const chain of chains) {
      it(`verifies a bip44 address (chain ${chain})`, function () {
        const address = derive('btc', wallet1, prefix1(0), chain, 7);
        assertFixedScriptWalletAddress('btc', {
          chain,
          index: 7,
          keychains: wallet1,
          format: 'base58',
          address,
          derivationPrefix: prefix1(0),
          bip44CoinType: 0,
        });
      });

      it(`still verifies a legacy address without prefix (chain ${chain})`, function () {
        const address = derive('btc', wallet1, undefined, chain, 7);
        assertFixedScriptWalletAddress('btc', {
          chain,
          index: 7,
          keychains: wallet1,
          format: 'base58',
          address,
          bip44CoinType: 0,
        });
      });

      it(`rejects a bip44 address presented without prefix (chain ${chain})`, function () {
        const address = derive('btc', wallet1, prefix1(0), chain, 7);
        assert.throws(
          () =>
            assertFixedScriptWalletAddress('btc', {
              chain,
              index: 7,
              keychains: wallet1,
              format: 'base58',
              address,
              bip44CoinType: 0,
            }),
          UnexpectedAddressError
        );
      });

      it(`rejects a legacy address presented with the canonical prefix (chain ${chain})`, function () {
        const address = derive('btc', wallet1, undefined, chain, 7);
        assert.throws(
          () =>
            assertFixedScriptWalletAddress('btc', {
              chain,
              index: 7,
              keychains: wallet1,
              format: 'base58',
              address,
              derivationPrefix: prefix1(0),
              bip44CoinType: 0,
            }),
          UnexpectedAddressError
        );
      });
    }

    it('does not resolve the coin type from the wasm coin name (tbtcreg is not a statics coin)', function () {
      const address = derive('tbtcreg', wallet1, prefix1(0), 0, 1);
      assertFixedScriptWalletAddress('tbtcreg', {
        chain: 0,
        index: 1,
        keychains: wallet1,
        format: 'base58',
        address,
        derivationPrefix: prefix1(0),
        bip44CoinType: 0,
      });
    });

    it('uses the coin type of the coin: ltc verifies under 44/2/..', function () {
      const address = derive('ltc', wallet1, prefix1(2), 0, 1);
      assertFixedScriptWalletAddress('ltc', {
        chain: 0,
        index: 1,
        keychains: wallet1,
        format: 'base58',
        address,
        derivationPrefix: prefix1(2),
        bip44CoinType: 2,
      });
    });

    it('rejects a prefix computed for a different coin type', function () {
      const address = derive('ltc', wallet1, prefix1(0), 0, 1);
      assert.throws(
        () =>
          assertFixedScriptWalletAddress('ltc', {
            chain: 0,
            index: 1,
            keychains: wallet1,
            format: 'base58',
            address,
            derivationPrefix: prefix1(0),
            bip44CoinType: 2,
          }),
        UnexpectedAddressError
      );
    });

    it('rejects a prefix that belongs to another wallet (tag/keys mismatch), even if the address matches the prefix', function () {
      // the address really is derived under wallet2's canonical prefix, but verified against wallet1's keys
      const address = derive('btc', wallet1, prefix2(0), 0, 1);
      assert.throws(
        () =>
          assertFixedScriptWalletAddress('btc', {
            chain: 0,
            index: 1,
            keychains: wallet1,
            format: 'base58',
            address,
            derivationPrefix: prefix2(0),
            bip44CoinType: 0,
          }),
        UnexpectedAddressError
      );
    });

    it('rejects a non-bip44 prefix such as the legacy 0/0', function () {
      const address = derive('btc', wallet1, undefined, 0, 1);
      assert.throws(
        () =>
          assertFixedScriptWalletAddress('btc', {
            chain: 0,
            index: 1,
            keychains: wallet1,
            format: 'base58',
            address,
            derivationPrefix: '0/0',
            bip44CoinType: 0,
          }),
        UnexpectedAddressError
      );
    });

    it('throws (not skips) when a prefix is given but the coin has no bip44 coin type', function () {
      const address = derive('btc', wallet1, prefix1(0), 0, 1);
      assert.throws(
        () =>
          assertFixedScriptWalletAddress('btc', {
            chain: 0,
            index: 1,
            keychains: wallet1,
            format: 'base58',
            address,
            derivationPrefix: prefix1(0),
            bip44CoinType: undefined,
          }),
        /no bip44 coin type/
      );
    });
  });

  describe('AbstractUtxoCoin', function () {
    for (const coinName of ['btc', 'tbtc', 'tbtcsig', 'tbtcbgsig']) {
      it(`${coinName}: deriveAddress honours coinSpecific.derivationPrefix and isWalletAddress verifies it`, async function () {
        const coin = getUtxoCoin(coinName);
        const coinSpecific = { derivationPrefix: prefix1(0) };
        const derived = await coin.deriveAddress({ keychains: wallet1, chain: 20, index: 4, coinSpecific });
        const legacy = await coin.deriveAddress({ keychains: wallet1, chain: 20, index: 4 });
        assert.notStrictEqual(derived.address, legacy.address);

        assert.strictEqual(
          await coin.isWalletAddress({
            address: derived.address,
            keychains: wallet1,
            chain: 20,
            index: 4,
            coinSpecific,
          }),
          true
        );
        assert.strictEqual(
          await coin.isWalletAddress({ address: legacy.address, keychains: wallet1, chain: 20, index: 4 }),
          true
        );
        // strict in both directions
        await assert.rejects(
          coin.isWalletAddress({ address: derived.address, keychains: wallet1, chain: 20, index: 4 }),
          UnexpectedAddressError
        );
        await assert.rejects(
          coin.isWalletAddress({ address: legacy.address, keychains: wallet1, chain: 20, index: 4, coinSpecific }),
          UnexpectedAddressError
        );
      });
    }

    it('ltc derives under 44/2/..', async function () {
      const coin = getUtxoCoin('ltc');
      const derived = await coin.deriveAddress({
        keychains: wallet1,
        chain: 0,
        index: 0,
        coinSpecific: { derivationPrefix: prefix1(2) },
      });
      derived.address.should.equal(derive('ltc', wallet1, prefix1(2), 0, 0));
    });

    it('isWalletAddress and deriveAddress reject a prefix of another wallet', async function () {
      const coin = getUtxoCoin('btc');
      const coinSpecific = { derivationPrefix: prefix2(0) };
      await assert.rejects(
        coin.deriveAddress({ keychains: wallet1, chain: 0, index: 0, coinSpecific }),
        UnexpectedAddressError
      );
      await assert.rejects(
        coin.isWalletAddress({
          address: derive('btc', wallet1, prefix2(0), 0, 0),
          keychains: wallet1,
          chain: 0,
          index: 0,
          coinSpecific,
        }),
        UnexpectedAddressError
      );
    });

    it('throws when the coin has no bip44 coin type; allowSkipVerifyAddress cannot skip it', async function () {
      const coin = getUtxoCoin('btc');
      const config = coin.getConfig();
      const stub = sinon.stub(coin, 'getConfig').returns({ ...config, bip44CoinType: undefined } as typeof config);
      try {
        const coinSpecific = { derivationPrefix: prefix1(0) };
        await assert.rejects(
          coin.isWalletAddress({
            address: derive('btc', wallet1, prefix1(0), 0, 0),
            keychains: wallet1,
            chain: 0,
            index: 0,
            coinSpecific,
          }),
          /no bip44 coin type/
        );
        await assert.rejects(
          coin.deriveAddress({ keychains: wallet1, chain: 0, index: 0, coinSpecific }),
          /no bip44 coin type/
        );
      } finally {
        stub.restore();
      }
    });
  });
});
