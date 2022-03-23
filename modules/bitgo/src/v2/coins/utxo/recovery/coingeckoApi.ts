/**
 * @prettier
 */
import { BaseApi } from './baseApi';

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

export class CoingeckoApi extends BaseApi {
  constructor() {
    super('https://api.coingecko.com/api/v3');
  }

  async getUSDPrice(coinFamily: string): Promise<number> {
    const coinGeckoId = familyNamesToCoinGeckoIds.get(coinFamily.toUpperCase());
    if (!coinGeckoId) {
      throw new Error(`There is no CoinGecko id for family name ${coinFamily.toUpperCase()}.`);
    }
    const coinGeckoUrl = `/simple/price?ids=${coinGeckoId}&vs_currencies=USD`;
    const res = await this.get<any>(coinGeckoUrl, { retry: 2 });
    return res.map((body) => {
      // An example of response
      // {
      //   "ethereum": {
      //     "usd": 220.64
      //   }
      // }
      if (!body) {
        throw new Error('Unable to reach Coin Gecko API for price data');
      }
      if (!body[coinGeckoId]['usd'] || typeof body[coinGeckoId]['usd'] !== 'number') {
        throw new Error('Unexpected response from Coin Gecko API for price data');
      }

      return body[coinGeckoId]['usd'];
    });
  }
}
