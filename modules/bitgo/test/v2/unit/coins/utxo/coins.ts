import * as assert from 'assert';
import * as utxolib from '@bitgo/utxo-lib';

import { getUtxoCoinForNetwork, utxoCoins } from './util';

describe('utxoCoins', function () {
  it('has expected chain/network values for items', function () {
    assert.deepStrictEqual(
      utxoCoins.map((c) => [c.getChain(), c.getFamily(), c.getFullName(), utxolib.getNetworkName(c.network)]),
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
        ['tdash', 'tdash', 'Testnet Dash', 'dashTest'],
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
});
