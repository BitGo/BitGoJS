/**
 * prettier
 */
import 'should';
import * as utxolib from '@bitgo/utxo-lib';
import { utxoCoins } from './util';

describe('coins', function () {
  it('getUtxoCoins', function () {
    utxoCoins.map(c => [c.getChain(), utxolib.coins.getNetworkName(c.network)]).should.eql([
      ['bch', 'bitcoincash'],
      ['bsv', 'bitcoinsv'],
      ['btc', 'bitcoin'],
      ['btg', 'bitcoingold'],
      ['dash', 'dash'],
      ['ltc', 'litecoin'],
      ['tbch', 'bitcoincashTestnet'],
      ['tbsv', 'bitcoinsvTestnet'],
      ['tbtc', 'testnet'],
      ['tdash', 'dashTest'],
      ['tltc', 'litecoinTest'],
      ['tzec', 'zcashTest'],
      ['zec', 'zcash'],
    ]);
  });
});
