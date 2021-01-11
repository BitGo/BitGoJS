/**
 * @prettier
 */
import { coins, BaseCoin as StaticsBaseCoin, CoinNotDefinedError } from '@bitgo/statics';
import { BitGo } from '../bitgo';
import { BaseCoin } from './baseCoin';
import {
  Algo,
  Bch,
  Bsv,
  Btc,
  Btg,
  Celo,
  Dash,
  Eos,
  Etc,
  Eth,
  Eth2,
  Hbar,
  Ltc,
  Ofc,
  Rbtc,
  Rmg,
  Susd,
  Talgo,
  Tbch,
  Tbsv,
  Tbtc,
  Tbtg,
  Tcelo,
  Tdash,
  Teos,
  Tetc,
  Teth,
  Teth2,
  Gteth,
  Thbar,
  Tltc,
  Trbtc,
  Trmg,
  Tsusd,
  Trx,
  Ttrx,
  Xtz,
  Txtz,
  Txlm,
  Txrp,
  Tzec,
  Xlm,
  Xrp,
  Erc20Token,
  CeloToken,
  StellarToken,
  OfcToken,
  Zec,
} from './coins';
import { tokens } from '../config';

import * as errors from '../errors';
import { Bcha } from './coins/bcha';
import { Tbcha } from './coins/tbcha';

export type CoinConstructor = (bitgo: BitGo, staticsCoin?: Readonly<StaticsBaseCoin>) => BaseCoin;

export class CoinFactory {
  private coinConstructors = new Map<string, CoinConstructor>();

  /**
   *
   * @param bitgo
   * @param name
   * @throws CoinNotDefinedError
   * @throws UnsupportedCoinError
   */
  public getInstance(bitgo: BitGo, name: string): BaseCoin {
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
        const unknownTokenConstructor = Erc20Token.createTokenConstructor({
          type: 'unknown',
          coin: 'eth',
          network: 'Mainnet',
          name: 'Unknown',
          tokenContractAddress: name,
          decimalPlaces: 0,
        });
        return unknownTokenConstructor(bitgo);
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
GlobalCoinFactory.registerCoinConstructor('bcha', Bcha.createInstance);
GlobalCoinFactory.registerCoinConstructor('tbcha', Tbcha.createInstance);
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
GlobalCoinFactory.registerCoinConstructor('gteth', Gteth.createInstance);
GlobalCoinFactory.registerCoinConstructor('eth2', Eth2.createInstance);
GlobalCoinFactory.registerCoinConstructor('teth2', Teth2.createInstance);
GlobalCoinFactory.registerCoinConstructor('etc', Etc.createInstance);
GlobalCoinFactory.registerCoinConstructor('tetc', Tetc.createInstance);
GlobalCoinFactory.registerCoinConstructor('rbtc', Rbtc.createInstance);
GlobalCoinFactory.registerCoinConstructor('trbtc', Trbtc.createInstance);
GlobalCoinFactory.registerCoinConstructor('celo', Celo.createInstance);
GlobalCoinFactory.registerCoinConstructor('tcelo', Tcelo.createInstance);
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
GlobalCoinFactory.registerCoinConstructor('trx', Trx.createInstance);
GlobalCoinFactory.registerCoinConstructor('ttrx', Ttrx.createInstance);
GlobalCoinFactory.registerCoinConstructor('xtz', Xtz.createInstance);
GlobalCoinFactory.registerCoinConstructor('txtz', Txtz.createInstance);
GlobalCoinFactory.registerCoinConstructor('hbar', Hbar.createInstance);
GlobalCoinFactory.registerCoinConstructor('thbar', Thbar.createInstance);
GlobalCoinFactory.registerCoinConstructor('ofc', Ofc.createInstance);
GlobalCoinFactory.registerCoinConstructor('susd', Susd.createInstance);
GlobalCoinFactory.registerCoinConstructor('tsusd', Tsusd.createInstance);

for (const token of [...tokens.bitcoin.eth.tokens, ...tokens.testnet.eth.tokens]) {
  const tokenConstructor = Erc20Token.createTokenConstructor(token);
  GlobalCoinFactory.registerCoinConstructor(token.type, tokenConstructor);
  GlobalCoinFactory.registerCoinConstructor(token.tokenContractAddress, tokenConstructor);
}

for (const token of [...tokens.bitcoin.xlm.tokens, ...tokens.testnet.xlm.tokens]) {
  const tokenConstructor = StellarToken.createTokenConstructor(token);
  GlobalCoinFactory.registerCoinConstructor(token.type, tokenConstructor);
}

for (const ofcToken of [...tokens.bitcoin.ofc.tokens, ...tokens.testnet.ofc.tokens]) {
  const tokenConstructor = OfcToken.createTokenConstructor(ofcToken);
  GlobalCoinFactory.registerCoinConstructor(ofcToken.type, tokenConstructor);
}

for (const token of [...tokens.bitcoin.celo.tokens, ...tokens.testnet.celo.tokens]) {
  const tokenConstructor = CeloToken.createTokenConstructor(token);
  GlobalCoinFactory.registerCoinConstructor(token.type, tokenConstructor);
  GlobalCoinFactory.registerCoinConstructor(token.tokenContractAddress, tokenConstructor);
}
