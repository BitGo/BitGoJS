/**
 * @prettier
 */
import { BaseCoin } from '@bitgo/sdk-core';
import { coins, BaseCoin as StaticsBaseCoin, CoinNotDefinedError } from '@bitgo/statics';
import { BitGo } from '../bitgo';
import {
  Algo,
  AvaxC,
  AvaxP,
  Bch,
  Bsv,
  Btc,
  Btg,
  Celo,
  Cspr,
  Dash,
  Eos,
  Etc,
  Eth,
  Eth2,
  Hbar,
  Ltc,
  Ofc,
  Rbtc,
  Sol,
  Stx,
  Susd,
  FiatEur,
  FiatUsd,
  Talgo,
  TavaxC,
  TavaxP,
  Tbch,
  Tbsv,
  Tbtc,
  Tcelo,
  Tcspr,
  Tdash,
  Teos,
  Tetc,
  Teth,
  Teth2,
  Gteth,
  Thbar,
  Tltc,
  Trbtc,
  Trx,
  Tsol,
  Tstx,
  Tsusd,
  TfiatEur,
  TfiatUsd,
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
  AlgoToken,
  OfcToken,
  Zec,
  EosToken,
  AvaxCToken,
} from './coins';
import { tokens } from '../config';
import * as errors from '../errors';
import { Bcha } from './coins/bcha';
import { Tbcha } from './coins/tbcha';
import { Dot } from './coins/dot';
import { Tdot } from './coins/tdot';
import { Near } from './coins/near';
import { TNear } from './coins/tnear';

export type CoinConstructor = (bitgo: BitGo, staticsCoin?: Readonly<StaticsBaseCoin>) => BaseCoin;

function registerCoinConstructor(map: Map<string, CoinConstructor>, name: string, constructor: CoinConstructor): void {
  if (map.has(name)) {
    throw new Error(`coin '${name}' is already defined`);
  }
  map.set(name, constructor);
}

function getCoinConstructors(): Map<string, CoinConstructor> {
  const m = new Map();
  registerCoinConstructor(m, 'btc', Btc.createInstance);
  registerCoinConstructor(m, 'tbtc', Tbtc.createInstance);
  registerCoinConstructor(m, 'bch', Bch.createInstance);
  registerCoinConstructor(m, 'tbch', Tbch.createInstance);
  registerCoinConstructor(m, 'bcha', Bcha.createInstance);
  registerCoinConstructor(m, 'tbcha', Tbcha.createInstance);
  registerCoinConstructor(m, 'bsv', Bsv.createInstance);
  registerCoinConstructor(m, 'tbsv', Tbsv.createInstance);
  registerCoinConstructor(m, 'btg', Btg.createInstance);
  registerCoinConstructor(m, 'dot', Dot.createInstance);
  registerCoinConstructor(m, 'tdot', Tdot.createInstance);
  registerCoinConstructor(m, 'ltc', Ltc.createInstance);
  registerCoinConstructor(m, 'tltc', Tltc.createInstance);
  registerCoinConstructor(m, 'eos', Eos.createInstance);
  registerCoinConstructor(m, 'teos', Teos.createInstance);
  registerCoinConstructor(m, 'eth', Eth.createInstance);
  registerCoinConstructor(m, 'teth', Teth.createInstance);
  registerCoinConstructor(m, 'gteth', Gteth.createInstance);
  registerCoinConstructor(m, 'eth2', Eth2.createInstance);
  registerCoinConstructor(m, 'teth2', Teth2.createInstance);
  registerCoinConstructor(m, 'etc', Etc.createInstance);
  registerCoinConstructor(m, 'tetc', Tetc.createInstance);
  registerCoinConstructor(m, 'rbtc', Rbtc.createInstance);
  registerCoinConstructor(m, 'trbtc', Trbtc.createInstance);
  registerCoinConstructor(m, 'celo', Celo.createInstance);
  registerCoinConstructor(m, 'tcelo', Tcelo.createInstance);
  registerCoinConstructor(m, 'avaxc', AvaxC.createInstance);
  registerCoinConstructor(m, 'tavaxc', TavaxC.createInstance);
  registerCoinConstructor(m, 'avaxp', AvaxP.createInstance);
  registerCoinConstructor(m, 'tavaxp', TavaxP.createInstance);
  registerCoinConstructor(m, 'xrp', Xrp.createInstance);
  registerCoinConstructor(m, 'txrp', Txrp.createInstance);
  registerCoinConstructor(m, 'xlm', Xlm.createInstance);
  registerCoinConstructor(m, 'txlm', Txlm.createInstance);
  registerCoinConstructor(m, 'dash', Dash.createInstance);
  registerCoinConstructor(m, 'tdash', Tdash.createInstance);
  registerCoinConstructor(m, 'zec', Zec.createInstance);
  registerCoinConstructor(m, 'tzec', Tzec.createInstance);
  registerCoinConstructor(m, 'algo', Algo.createInstance);
  registerCoinConstructor(m, 'talgo', Talgo.createInstance);
  registerCoinConstructor(m, 'trx', Trx.createInstance);
  registerCoinConstructor(m, 'ttrx', Ttrx.createInstance);
  registerCoinConstructor(m, 'xtz', Xtz.createInstance);
  registerCoinConstructor(m, 'txtz', Txtz.createInstance);
  registerCoinConstructor(m, 'hbar', Hbar.createInstance);
  registerCoinConstructor(m, 'thbar', Thbar.createInstance);
  registerCoinConstructor(m, 'ofc', Ofc.createInstance);
  registerCoinConstructor(m, 'susd', Susd.createInstance);
  registerCoinConstructor(m, 'tsusd', Tsusd.createInstance);
  registerCoinConstructor(m, 'fiatusd', FiatUsd.createInstance);
  registerCoinConstructor(m, 'tfiatusd', TfiatUsd.createInstance);
  registerCoinConstructor(m, 'fiateur', FiatEur.createInstance);
  registerCoinConstructor(m, 'tfiateur', TfiatEur.createInstance);
  registerCoinConstructor(m, 'cspr', Cspr.createInstance);
  registerCoinConstructor(m, 'tcspr', Tcspr.createInstance);
  registerCoinConstructor(m, 'stx', Stx.createInstance);
  registerCoinConstructor(m, 'tstx', Tstx.createInstance);
  registerCoinConstructor(m, 'sol', Sol.createInstance);
  registerCoinConstructor(m, 'tsol', Tsol.createInstance);
  registerCoinConstructor(m, 'near', Near.createInstance);
  registerCoinConstructor(m, 'tnear', TNear.createInstance);

  for (const token of [...tokens.bitcoin.eth.tokens, ...tokens.testnet.eth.tokens]) {
    const tokenConstructor = Erc20Token.createTokenConstructor(token);
    registerCoinConstructor(m, token.type, tokenConstructor);
    registerCoinConstructor(m, token.tokenContractAddress, tokenConstructor);
  }

  for (const token of [...tokens.bitcoin.xlm.tokens, ...tokens.testnet.xlm.tokens]) {
    const tokenConstructor = StellarToken.createTokenConstructor(token);
    registerCoinConstructor(m, token.type, tokenConstructor);
  }

  for (const ofcToken of [...tokens.bitcoin.ofc.tokens, ...tokens.testnet.ofc.tokens]) {
    const tokenConstructor = OfcToken.createTokenConstructor(ofcToken);
    registerCoinConstructor(m, ofcToken.type, tokenConstructor);
  }

  for (const token of [...tokens.bitcoin.celo.tokens, ...tokens.testnet.celo.tokens]) {
    const tokenConstructor = CeloToken.createTokenConstructor(token);
    registerCoinConstructor(m, token.type, tokenConstructor);
    registerCoinConstructor(m, token.tokenContractAddress, tokenConstructor);
  }

  for (const token of [...tokens.bitcoin.eos.tokens, ...tokens.testnet.eos.tokens]) {
    const tokenConstructor = EosToken.createTokenConstructor(token);
    registerCoinConstructor(m, token.type, tokenConstructor);
    registerCoinConstructor(m, token.tokenContractAddress, tokenConstructor);
  }

  for (const token of [...tokens.bitcoin.algo.tokens, ...tokens.testnet.algo.tokens]) {
    const tokenConstructor = AlgoToken.createTokenConstructor(token);
    registerCoinConstructor(m, token.type, tokenConstructor);
    if (token.alias) {
      registerCoinConstructor(m, token.alias, tokenConstructor);
    }
  }

  for (const token of [...tokens.bitcoin.avaxc.tokens, ...tokens.testnet.avaxc.tokens]) {
    const tokenConstructor = AvaxCToken.createTokenConstructor(token);
    registerCoinConstructor(m, token.type, tokenConstructor);
    registerCoinConstructor(m, token.tokenContractAddress, tokenConstructor);
  }

  return m;
}

export class CoinFactory {
  private coinConstructors?: Map<string, CoinConstructor>;

  private getCoinConstructor(name: string): CoinConstructor | undefined {
    if (this.coinConstructors === undefined) {
      this.coinConstructors = getCoinConstructors();
    }
    return this.coinConstructors.get(name);
  }

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

    const constructor = this.getCoinConstructor(name);
    if (constructor) {
      return constructor(bitgo, staticsCoin);
    }

    const ethConstructor = this.getCoinConstructor('eth');
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
}

export const GlobalCoinFactory: CoinFactory = new CoinFactory();
