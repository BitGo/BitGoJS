/**
 * prettier
 */
import 'should';
import * as utxolib from '@bitgo/utxo-lib';
import { getUtxoCoinForNetwork, utxoCoins } from './util';

describe('utxoCoins', function () {
  it('has expected chain/network values for items', function () {
    utxoCoins.map(c => [c.getChain(), utxolib.getNetworkName(c.network)]).should.eql([
      ['btc', 'bitcoin'],
      ['tbtc', 'testnet'],
      ['bch', 'bitcoincash'],
      ['tbch', 'bitcoincashTestnet'],
      ['btg', 'bitcoingold'],
      ['bsv', 'bitcoinsv'],
      ['tbsv', 'bitcoinsvTestnet'],
      ['dash', 'dash'],
      ['tdash', 'dashTest'],
      ['ltc', 'litecoin'],
      ['tltc', 'litecoinTest'],
      ['zec', 'zcash'],
      ['tzec', 'zcashTest'],
    ]);

    utxolib.getNetworkList().map((network): [string | undefined, string | undefined] => {
      let coin;
      try {
        coin = getUtxoCoinForNetwork(network);
      } catch (e) {
        // ignore
      }

      return [utxolib.getNetworkName(network), coin?.getChain()];
    }).should.eql([
      ['bitcoin', 'btc'],
      ['testnet', 'tbtc'],
      ['bitcoincash', 'bch'],
      ['bitcoincashTestnet', 'tbch'],
      ['bitcoingold', 'btg'],
      ['bitcoingoldTestnet', undefined],
      ['bitcoinsv', 'bsv'],
      ['bitcoinsvTestnet', 'tbsv'],
      ['dash', 'dash'],
      ['dashTest', 'tdash'],
      ['litecoin', 'ltc'],
      ['litecoinTest', 'tltc'],
      ['zcash', 'zec'],
      ['zcashTest', 'tzec'],
    ]);
  });
});
