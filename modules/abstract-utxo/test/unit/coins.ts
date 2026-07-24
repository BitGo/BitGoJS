import * as assert from 'assert';

import * as utxolib from '@bitgo/utxo-lib';

import { getMainnetCoinName, utxoCoinsMainnet, utxoCoinsTestnet } from '../../src/names';

import { getNetworkForCoinName, getUtxoCoinForNetwork, getUtxoCoin, utxoCoins } from './util';

describe('utxoCoins', function () {
  it('has expected chain/network values for items', function () {
    assert.deepStrictEqual(
      utxoCoins.map((c) => [
        c.getChain(),
        c.getFamily(),
        c.getFullName(),
        utxolib.getNetworkName(getNetworkForCoinName(c.name)),
      ]),
      [
        ['btc', 'btc', 'Bitcoin', 'bitcoin'],
        ['tbtc', 'btc', 'Testnet Bitcoin', 'testnet'],
        ['tbtcsig', 'btc', 'Public Signet Bitcoin', 'bitcoinPublicSignet'],
        ['tbtc4', 'btc', 'Testnet4 Bitcoin', 'bitcoinTestnet4'],
        ['tbtcbgsig', 'btc', 'BitGo Signet Bitcoin', 'bitcoinBitGoSignet'],
        ['bch', 'bch', 'Bitcoin Cash', 'bitcoincash'],
        ['tbch', 'bch', 'Testnet Bitcoin Cash', 'bitcoincashTestnet'],
        ['btg', 'btg', 'Bitcoin Gold', 'bitcoingold'],
        ['bsv', 'bsv', 'Bitcoin SV', 'bitcoinsv'],
        ['tbsv', 'bsv', 'Testnet Bitcoin SV', 'bitcoinsvTestnet'],
        ['dash', 'dash', 'Dash', 'dash'],
        ['tdash', 'dash', 'Testnet Dash', 'dashTest'],
        ['doge', 'doge', 'Dogecoin', 'dogecoin'],
        ['tdoge', 'doge', 'Testnet Dogecoin', 'dogecoinTest'],
        ['bcha', 'bcha', 'Bitcoin ABC', 'ecash'],
        ['tbcha', 'bcha', 'Testnet Bitcoin ABC', 'ecashTest'],
        ['ltc', 'ltc', 'Litecoin', 'litecoin'],
        ['tltc', 'ltc', 'Testnet Litecoin', 'litecoinTest'],
        ['zec', 'zec', 'ZCash', 'zcash'],
        ['tzec', 'zec', 'Testnet ZCash', 'zcashTest'],
      ]
    );

    assert.deepStrictEqual(
      utxolib.getNetworkList().map((network): [string | undefined, string | undefined] => {
        let coin;
        try {
          coin = getUtxoCoinForNetwork(network);
        } catch (e) {
          // ignore
        }

        return [utxolib.getNetworkName(network), coin?.getChain()];
      }),
      [
        ['bitcoin', 'btc'],
        ['testnet', 'tbtc'],
        ['bitcoinPublicSignet', 'tbtcsig'],
        ['bitcoinTestnet4', 'tbtc4'],
        ['bitcoinBitGoSignet', 'tbtcbgsig'],
        ['bitcoincash', 'bch'],
        ['bitcoincashTestnet', 'tbch'],
        ['bitcoingold', 'btg'],
        ['bitcoingoldTestnet', undefined],
        ['bitcoinsv', 'bsv'],
        ['bitcoinsvTestnet', 'tbsv'],
        ['dash', 'dash'],
        ['dashTest', 'tdash'],
        ['dogecoin', 'doge'],
        ['dogecoinTest', 'tdoge'],
        ['ecash', 'bcha'],
        ['ecashTest', 'tbcha'],
        ['litecoin', 'ltc'],
        ['litecoinTest', 'tltc'],
        ['zcash', 'zec'],
        ['zcashTest', 'tzec'],
      ]
    );
  });

  describe('isValidAddress with allowLightning', function () {
    const btc = getUtxoCoin('btc');
    const tbtc = getUtxoCoin('tbtc');
    const bch = getUtxoCoin('bch');

    it('should reject node pubkeys and invoices without allowLightning', function () {
      assert.strictEqual(
        btc.isValidAddress('02eec7245d6b7d2ccb30380bfbe2a3648cd7a942653f5aa340edcea1f283686619'),
        false
      );
      assert.strictEqual(btc.isValidAddress('lnbc1500n1pj0ggavpp5example'), false);
    });

    it('should accept node pubkeys with allowLightning', function () {
      assert.strictEqual(
        btc.isValidAddress('02eec7245d6b7d2ccb30380bfbe2a3648cd7a942653f5aa340edcea1f283686619', {
          allowLightning: true,
        }),
        true
      );
      assert.strictEqual(
        tbtc.isValidAddress('03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad', {
          allowLightning: true,
        }),
        true
      );
    });

    it('should reject invalid node pubkeys even with allowLightning', function () {
      // wrong prefix
      assert.strictEqual(
        btc.isValidAddress('04eec7245d6b7d2ccb30380bfbe2a3648cd7a942653f5aa340edcea1f283686619', {
          allowLightning: true,
        }),
        false
      );
      // too short
      assert.strictEqual(
        btc.isValidAddress('02eec7245d6b7d2ccb30380bfbe2a3648cd7a942653f5aa340edcea1f28368', {
          allowLightning: true,
        }),
        false
      );
    });

    it('should accept bolt11 invoices with allowLightning', function () {
      assert.strictEqual(btc.isValidAddress('lnbc1500n1pj0ggavpp5example', { allowLightning: true }), true);
      assert.strictEqual(tbtc.isValidAddress('lntb1500n1pj0ggavpp5example', { allowLightning: true }), true);
    });

    it('should reject non-bolt11 strings with allowLightning', function () {
      assert.strictEqual(btc.isValidAddress('lnxyz1500n1pj0ggavpp5example', { allowLightning: true }), false);
      assert.strictEqual(btc.isValidAddress('not-an-address', { allowLightning: true }), false);
    });

    it('should still accept regular bitcoin addresses with allowLightning', function () {
      assert.strictEqual(btc.isValidAddress('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', { allowLightning: true }), true);
    });

    it('should not accept lightning addresses for non-btc coins without allowLightning', function () {
      assert.strictEqual(
        bch.isValidAddress('02eec7245d6b7d2ccb30380bfbe2a3648cd7a942653f5aa340edcea1f283686619'),
        false
      );
      assert.strictEqual(bch.isValidAddress('lnbc1500n1pj0ggavpp5example'), false);
    });
  });

  it('getMainnetCoinName returns correct mainnet coin name', function () {
    // Mainnet coins return themselves
    for (const coin of utxoCoinsMainnet) {
      assert.strictEqual(getMainnetCoinName(coin), coin);
    }

    // Testnet coins return their mainnet counterpart
    for (const coin of utxoCoinsTestnet) {
      const mainnet = getMainnetCoinName(coin);
      assert.ok(utxoCoinsMainnet.includes(mainnet), `${coin} -> ${mainnet} should be a mainnet coin`);
    }

    // Verify specific mappings for special Bitcoin testnet variants
    assert.strictEqual(getMainnetCoinName('tbtc'), 'btc');
    assert.strictEqual(getMainnetCoinName('tbtc4'), 'btc');
    assert.strictEqual(getMainnetCoinName('tbtcsig'), 'btc');
    assert.strictEqual(getMainnetCoinName('tbtcbgsig'), 'btc');
  });
});
