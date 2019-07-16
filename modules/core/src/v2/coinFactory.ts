/**
 * @prettier
 */
import { coins, BaseCoin as StaticsBaseCoin, CoinNotDefinedError } from '@bitgo/statics';
import { BaseCoin } from './baseCoin';
import { Algo } from './coins/algo';
import { Bch } from './coins/bch';
import { Bsv } from './coins/bsv';
import { Btc } from './coins/btc';
import { Btg } from './coins/btg';
import { Dash } from './coins/dash';
import { Eos } from './coins/eos';
import { Eth } from './coins/eth';
import { Ltc } from './coins/ltc';
import { Ofc } from './coins/ofc';
import { Rmg } from './coins/rmg';
import { Susd } from './coins/susd';
import { Talgo } from './coins/talgo';
import { Tbch } from './coins/tbch';
import { Tbsv } from './coins/tbsv';
import { Tbtc } from './coins/tbtc';
import { Tbtg } from './coins/tbtg';
import { Tdash } from './coins/tdash';
import { Teos } from './coins/teos';
import { Teth } from './coins/teth';
import { Tltc } from './coins/tltc';
import { Trmg } from './coins/trmg';
import { Tsusd } from './coins/tsusd';
import { Txlm } from './coins/txlm';
import { Txrp } from './coins/txrp';
import { Tzec } from './coins/tzec';
import { Xlm } from './coins/xlm';
import { Xrp } from './coins/xrp';
import { Token } from './coins/token';
import { OfcToken } from './coins/ofcToken';
import { tokens } from '../config';
import { Zec } from './coins/zec';

import * as errors from '../errors';

export type CoinConstructor = (bitgo: any, staticsCoin: Readonly<StaticsBaseCoin>) => BaseCoin;

export class CoinFactory {
  private coinConstructors = new Map<string, CoinConstructor>();

  /**
   *
   * @param bitgo
   * @param name
   * @throws CoinNotDefinedError
   * @throws UnsupportedCoinError
   */
  public getInstance(bitgo: any, name: string): BaseCoin {
    let staticsCoin;
    try {
      staticsCoin = coins.get(name);
    } catch (e) {
      if (!(e instanceof CoinNotDefinedError)) {
        throw e;
      }
    }

    const constructor = this.coinConstructors.get(name);
    if (constructor) {
      return constructor(bitgo, staticsCoin);
    }

    const ethConstructor = this.coinConstructors.get('eth');
    if (ethConstructor) {
      const ethCoin = ethConstructor(bitgo, staticsCoin);
      if (ethCoin.isValidAddress(name)) {
        const unknownTokenConstructor = Token.createTokenConstructor({
          type: 'unknown',
          coin: 'eth',
          network: 'Mainnet',
          name: 'Unknown',
          tokenContractAddress: name,
          decimalPlaces: 0,
        });
        return unknownTokenConstructor(bitgo, null);
      }
    }

    throw new errors.UnsupportedCoinError(name);
  }

  public registerCoinConstructor(name: string, constructor: CoinConstructor) {
    if (this.coinConstructors.has(name)) {
      throw new Error(`coin '${name}' is already defined`);
    }
    this.coinConstructors.set(name, constructor);
  }
}

export const GlobalCoinFactory: CoinFactory = new CoinFactory();

GlobalCoinFactory.registerCoinConstructor('btc', Btc.createInstance);
GlobalCoinFactory.registerCoinConstructor('tbtc', Tbtc.createInstance);
GlobalCoinFactory.registerCoinConstructor('bch', Bch.createInstance);
GlobalCoinFactory.registerCoinConstructor('tbch', Tbch.createInstance);
GlobalCoinFactory.registerCoinConstructor('bsv', Bsv.createInstance);
GlobalCoinFactory.registerCoinConstructor('tbsv', Tbsv.createInstance);
GlobalCoinFactory.registerCoinConstructor('btg', Btg.createInstance);
GlobalCoinFactory.registerCoinConstructor('tbtg', Tbtg.createInstance);
GlobalCoinFactory.registerCoinConstructor('ltc', Ltc.createInstance);
GlobalCoinFactory.registerCoinConstructor('tltc', Tltc.createInstance);
GlobalCoinFactory.registerCoinConstructor('eos', Eos.createInstance);
GlobalCoinFactory.registerCoinConstructor('teos', Teos.createInstance);
GlobalCoinFactory.registerCoinConstructor('eth', Eth.createInstance);
GlobalCoinFactory.registerCoinConstructor('teth', Teth.createInstance);
GlobalCoinFactory.registerCoinConstructor('rmg', Rmg.createInstance);
GlobalCoinFactory.registerCoinConstructor('trmg', Trmg.createInstance);
GlobalCoinFactory.registerCoinConstructor('xrp', Xrp.createInstance);
GlobalCoinFactory.registerCoinConstructor('txrp', Txrp.createInstance);
GlobalCoinFactory.registerCoinConstructor('xlm', Xlm.createInstance);
GlobalCoinFactory.registerCoinConstructor('txlm', Txlm.createInstance);
GlobalCoinFactory.registerCoinConstructor('dash', Dash.createInstance);
GlobalCoinFactory.registerCoinConstructor('tdash', Tdash.createInstance);
GlobalCoinFactory.registerCoinConstructor('zec', Zec.createInstance);
GlobalCoinFactory.registerCoinConstructor('tzec', Tzec.createInstance);
GlobalCoinFactory.registerCoinConstructor('algo', Algo.createInstance);
GlobalCoinFactory.registerCoinConstructor('talgo', Talgo.createInstance);
GlobalCoinFactory.registerCoinConstructor('ofc', Ofc.createInstance);
GlobalCoinFactory.registerCoinConstructor('susd', Susd.createInstance);
GlobalCoinFactory.registerCoinConstructor('tsusd', Tsusd.createInstance);

for (const token of [...tokens.bitcoin.eth.tokens, ...tokens.testnet.eth.tokens]) {
  const tokenConstructor = Token.createTokenConstructor(token);
  GlobalCoinFactory.registerCoinConstructor(token.type, tokenConstructor);
  GlobalCoinFactory.registerCoinConstructor(token.tokenContractAddress, tokenConstructor);
}

for (const ofcToken of [...tokens.bitcoin.ofc.tokens, ...tokens.testnet.ofc.tokens]) {
  const tokenConstructor = OfcToken.createTokenConstructor(ofcToken);
  GlobalCoinFactory.registerCoinConstructor(ofcToken.type, tokenConstructor);
}
