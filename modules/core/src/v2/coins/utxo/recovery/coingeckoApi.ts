/**
 * @prettier
 */
import * as request from 'superagent';
import { toBitgoRequest } from '../../../../api';

const familyNamesToCoinGeckoIds = new Map()
  .set('BTC', 'bitcoin')
  .set('LTC', 'litecoin')
  .set('BCH', 'bitcoin-cash')
  .set('ZEC', 'zcash')
  .set('DASH', 'dash')
  // note: we don't have a source for price data of BCHA and BSV, but we will use BCH as a proxy. We will substitute
  // it out for a better source when it becomes available.  TODO BG-26359.
  .set('BCHA', 'bitcoin-cash')
  .set('BSV', 'bitcoin-cash');

export class CoingeckoApi {
  baseUrl = 'https://api.coingecko.com/api/v3/';

  async getUSDPrice(coinFamily: string): Promise<number> {
    const coinGeckoId = familyNamesToCoinGeckoIds.get(coinFamily.toUpperCase());
    if (!coinGeckoId) {
      throw new Error(`There is no CoinGecko id for family name ${coinFamily.toUpperCase()}.`);
    }
    const coinGeckoUrl = this.baseUrl + `simple/price?ids=${coinGeckoId}&vs_currencies=USD`;
    const response = await toBitgoRequest(request.get(coinGeckoUrl).retry(2)).result();

    // An example of response
    // {
    //   "ethereum": {
    //     "usd": 220.64
    //   }
    // }
    if (!response) {
      throw new Error('Unable to reach Coin Gecko API for price data');
    }
    if (!response[coinGeckoId]['usd'] || typeof response[coinGeckoId]['usd'] !== 'number') {
      throw new Error('Unexpected response from Coin Gecko API for price data');
    }

    return response[coinGeckoId]['usd'];
  }
}
