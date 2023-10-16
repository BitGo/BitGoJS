import { BitGoAPI } from '@bitgo/sdk-api';
import { BaseCoin } from '@bitgo/sdk-core';

class CoinFactory {
  private coinCache: Map<string, BaseCoin>;

  constructor() {
    this.coinCache = new Map();
  }

  private cacheAndRegister(
    name: string,
    sdk: BitGoAPI,
    register: (sdk: BitGoAPI) => void,
  ) {
    register(sdk);
    const coin = sdk.coin(name);
    this.coinCache.set(name, coin);
    return coin;
  }

  async getCoin(name: string, sdk: BitGoAPI): Promise<BaseCoin | undefined> {
    const cachedCoin = this.coinCache.get(name);
    if (cachedCoin) {
      return cachedCoin;
    }
    switch (name) {
      case 'ada':
      case 'tada': {
        const { register } = await import('@bitgo/sdk-coin-ada');
        return this.cacheAndRegister(name, sdk, register);
      }
      case 'algo':
      case 'talgo': {
        const { register } = await import('@bitgo/sdk-coin-algo');
        return this.cacheAndRegister(name, sdk, register);
      }
      case 'avaxc':
      case 'tavaxc': {
        const { register } = await import('@bitgo/sdk-coin-avaxc');
        return this.cacheAndRegister(name, sdk, register);
      }
      case 'avaxp':
      case 'tavaxp': {
        const { register } = await import('@bitgo/sdk-coin-avaxp');
        return this.cacheAndRegister(name, sdk, register);
      }
      case 'bch':
      case 'tbch': {
        const { register } = await import('@bitgo/sdk-coin-bch');
        return this.cacheAndRegister(name, sdk, register);
      }
      case 'bcha':
      case 'tbcha': {
        const { register } = await import('@bitgo/sdk-coin-bcha');
        return this.cacheAndRegister(name, sdk, register);
      }
      case 'bsc':
      case 'tbsc': {
        const { register } = await import('@bitgo/sdk-coin-bsc');
        return this.cacheAndRegister(name, sdk, register);
      }
      case 'bsv':
      case 'tbsv': {
        const { register } = await import('@bitgo/sdk-coin-bsv');
        return this.cacheAndRegister(name, sdk, register);
      }
      case 'btc':
      case 'tbtc': {
        const { register } = await import('@bitgo/sdk-coin-btc');
        return this.cacheAndRegister(name, sdk, register);
      }
      case 'btg': {
        const { register } = await import('@bitgo/sdk-coin-btg');
        return this.cacheAndRegister(name, sdk, register);
      }
      case 'celo':
      case 'tcelo': {
        const { register } = await import('@bitgo/sdk-coin-celo');
        return this.cacheAndRegister(name, sdk, register);
      }
      case 'cspr':
      case 'tcspr': {
        const { register } = await import('@bitgo/sdk-coin-cspr');
        return this.cacheAndRegister(name, sdk, register);
      }
      case 'dash':
      case 'tdash': {
        const { register } = await import('@bitgo/sdk-coin-dash');
        return this.cacheAndRegister(name, sdk, register);
      }
      case 'doge':
      case 'tdoge': {
        const { register } = await import('@bitgo/sdk-coin-doge');
        return this.cacheAndRegister(name, sdk, register);
      }
      case 'dot':
      case 'tdot': {
        const { register } = await import('@bitgo/sdk-coin-dot');
        return this.cacheAndRegister(name, sdk, register);
      }
      case 'eos':
      case 'teos': {
        const { register } = await import('@bitgo/sdk-coin-eos');
        return this.cacheAndRegister(name, sdk, register);
      }
      case 'etc':
      case 'tetc': {
        const { register } = await import('@bitgo/sdk-coin-etc');
        return this.cacheAndRegister(name, sdk, register);
      }
      case 'eth':
      case 'teth':
      case 'gteth':
      case 'hteth': {
        const { register } = await import('@bitgo/sdk-coin-eth');
        return this.cacheAndRegister(name, sdk, register);
      }
      case 'eth2':
      case 'teth2': {
        const { register } = await import('@bitgo/sdk-coin-eth2');
        return this.cacheAndRegister(name, sdk, register);
      }
      case 'ethw': {
        const { register } = await import('@bitgo/sdk-coin-ethw');
        return this.cacheAndRegister(name, sdk, register);
      }
      case 'hbar':
      case 'thbar': {
        const { register } = await import('@bitgo/sdk-coin-hbar');
        return this.cacheAndRegister(name, sdk, register);
      }
      case 'ltc':
      case 'tltc': {
        const { register } = await import('@bitgo/sdk-coin-ltc');
        return this.cacheAndRegister(name, sdk, register);
      }
      case 'near':
      case 'tnear': {
        const { register } = await import('@bitgo/sdk-coin-near');
        return this.cacheAndRegister(name, sdk, register);
      }
      case 'polygon':
      case 'tpolygon': {
        const { register } = await import('@bitgo/sdk-coin-polygon');
        return this.cacheAndRegister(name, sdk, register);
      }
      case 'rbtc':
      case 'trbtc': {
        const { register } = await import('@bitgo/sdk-coin-rbtc');
        return this.cacheAndRegister(name, sdk, register);
      }
      case 'sol':
      case 'tsol': {
        const { register } = await import('@bitgo/sdk-coin-sol');
        return this.cacheAndRegister(name, sdk, register);
      }
      case 'stx':
      case 'tstx': {
        const { register } = await import('@bitgo/sdk-coin-stx');
        return this.cacheAndRegister(name, sdk, register);
      }
      case 'sui':
      case 'tsui': {
        const { register } = await import('@bitgo/sdk-coin-sui');
        return this.cacheAndRegister(name, sdk, register);
      }
      case 'trx':
      case 'ttrx': {
        const { register } = await import('@bitgo/sdk-coin-trx');
        return this.cacheAndRegister(name, sdk, register);
      }
      case 'txlm':
      case 'xlm': {
        const { register } = await import('@bitgo/sdk-coin-xlm');
        return this.cacheAndRegister(name, sdk, register);
      }
      case 'xrp':
      case 'txrp': {
        const { register } = await import('@bitgo/sdk-coin-xrp');
        return this.cacheAndRegister(name, sdk, register);
      }
      case 'xtz':
      case 'txtz': {
        const { register } = await import('@bitgo/sdk-coin-xtz');
        return this.cacheAndRegister(name, sdk, register);
      }
      case 'zec':
      case 'tzec': {
        const { register } = await import('@bitgo/sdk-coin-zec');
        return this.cacheAndRegister(name, sdk, register);
      }
    }
  }
}

export default new CoinFactory();
