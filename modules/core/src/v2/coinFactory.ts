/**
 * @prettier
 */
import { coins, BaseCoin as StaticsBaseCoin, CoinNotDefinedError } from '@bitgo/statics';
import { BitGo } from '../bitgo';
import { BaseCoin } from './baseCoin';
import {
  Algo,
  AvaxC,
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
  Stx,
  Susd,
  Talgo,
  TavaxC,
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
  Tstx,
  Tsusd,
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
} from './coins';
import { tokens } from '../config';

import * as errors from '../errors';
import { Bcha } from './coins/bcha';
import { Tbcha } from './coins/tbcha';

export type CoinConstructor = (bitgo: BitGo, staticsCoin?: Readonly<StaticsBaseCoin>) => BaseCoin;

export class CoinFactory {
  // A hashmap that maps network names -> (A hashmap of names/contractAddresses -> CoinConstructor)
  private coinConstructors = new Map<string, Map<string, CoinConstructor>>();

  // A hashmap that maps coin/token contract addresses/names -> network names
  // This is used to support legacy calls like bitgo.coin('0x123') or bitgo.coin('terc')
  // For a call of this form to be valid, the coin at contract address 0x123 must be in this mapping
  // All existing tokens contract addresses that BitGo supports as of Oct 26/2021 are in here
  // No further tokens/coins need to be added to this mapping as in the future, coins will be
  // looked up using the coinConstructors dictionary above, and the caller will need to pass both an
  // identifier and a networkName i.e. bitgo.coin('0x123', 'Ethereum') or bitgo.coin('gusdt', 'Goerli')
  private legacyCoinIdentifiersToNetworks = new Map<string, string>();

  /**
   * Return an instance of a BaseCoin corresponding to a certain identifier (usually a name or contract address) and a network
   * the network may be undefined for "Legacy" coins which can be looked up unqiuely based on name/address directly. New tokens
   * will require both parameters to be found.
   * @param bitgo
   * @param identifier
   * @param networkName
   * @throws CoinNotDefinedError
   * @throws NotLegacyCoinError
   * @throws UnsupportedCoinError
   */
  public getInstance(bitgo: BitGo, identifier: string, networkName?: string): BaseCoin {
    let staticsCoin;
    try {
      staticsCoin = coins.get(identifier);
    } catch (e) {
      if (!(e instanceof CoinNotDefinedError)) {
        throw e;
      }
    }
    let coinNetworkName = networkName;
    if (coinNetworkName == null) {
      coinNetworkName = this.legacyCoinIdentifiersToNetworks.get(identifier);
    }

    if (coinNetworkName) {
      const coinsOnNetwork = this.coinConstructors.get(coinNetworkName);
      if (coinsOnNetwork) {
        const constructor = coinsOnNetwork.get(identifier);
        if (constructor) {
          return constructor(bitgo, staticsCoin);
        }
      }
    }

    const coinsOnEthereum = this.coinConstructors.get('Ethereum');
    if (coinsOnEthereum) {
      const ethConstructor = coinsOnEthereum.get('eth');
      if (ethConstructor) {
        const ethCoin = ethConstructor(bitgo, staticsCoin);
        if (ethCoin.isValidAddress(identifier)) {
          // requiresExplicitNetwork should really be a don't care here since it is only used for coinFactory logic
          const unknownTokenConstructor = Erc20Token.createTokenConstructor({
            type: 'unknown',
            coin: 'eth',
            network: 'Mainnet',
            networkName: 'Ethereum',
            requiresExplicitNetwork: true,
            name: 'Unknown',
            tokenContractAddress: identifier,
            decimalPlaces: 0,
          });
          return unknownTokenConstructor(bitgo);
        }
      }
    }

    if (networkName == null) {
      throw new errors.ExplicitNetworkRequiredError(identifier);
    }
    throw new errors.UnsupportedCoinError(identifier);
  }

  /**
   * Registers a "Legacy" coin constructor. All existing coins/tokens are registered using this legacy method.
   * NEW coins/tokens should be added using the registerCoinConstructor method.
   * @param identifier
   * @param networkName
   * @param constructor
   * @throws Error
   */
  public registerLegacyCoinConstructor(identifier: string, networkName: string, constructor: CoinConstructor) {
    if (this.legacyCoinIdentifiersToNetworks.has(identifier)) {
      throw new Error(`Coin/Token Identifier: '${identifier}' is already defined. Cannot add to legacy mapping.`);
    }
    this.legacyCoinIdentifiersToNetworks.set(identifier, networkName);
    this.registerCoinConstructor(identifier, networkName, constructor);
  }

  /**
   * Registers a post-"Legacy" coin constructor. This means that coins added with this method can have duplicate
   * identifiers (names, contract addresses) as long as those duplicates are on different networks.
   * @param identifier
   * @param networkName
   * @param constructor
   * @throws Error
   */
  public registerCoinConstructor(identifier: string, networkName: string, constructor: CoinConstructor) {
    const coinsOnNetwork = this.coinConstructors.get(networkName);
    if (coinsOnNetwork) {
      if (coinsOnNetwork.get(identifier)) {
        throw new Error(`Coin with identifier: '${identifier}' is already defined on the specified network.`);
      }
      coinsOnNetwork.set(identifier, constructor);
      this.coinConstructors.set(networkName, coinsOnNetwork);
    } else {
      this.coinConstructors.set(networkName, new Map([[identifier, constructor]]));
    }
  }
}

export const GlobalCoinFactory: CoinFactory = new CoinFactory();

// TODO: leverage statics instead of making 30 manual calls
GlobalCoinFactory.registerLegacyCoinConstructor('btc', 'Bitcoin', Btc.createInstance);
GlobalCoinFactory.registerLegacyCoinConstructor('tbtc', 'BitcoinTestnet', Tbtc.createInstance);
GlobalCoinFactory.registerLegacyCoinConstructor('bch', 'BitcoinCash', Bch.createInstance);
GlobalCoinFactory.registerLegacyCoinConstructor('tbch', 'BitcoinCashTestnet', Tbch.createInstance);
GlobalCoinFactory.registerLegacyCoinConstructor('bcha', 'BitcoinABC', Bcha.createInstance);
GlobalCoinFactory.registerLegacyCoinConstructor('tbcha', 'BitcoinABCTestnet', Tbcha.createInstance);
GlobalCoinFactory.registerLegacyCoinConstructor('bsv', 'BitcoinSV', Bsv.createInstance);
GlobalCoinFactory.registerLegacyCoinConstructor('tbsv', 'BitcoinSVTestnet', Tbsv.createInstance);
GlobalCoinFactory.registerLegacyCoinConstructor('btg', 'BitcoinGold', Btg.createInstance);
GlobalCoinFactory.registerLegacyCoinConstructor('ltc', 'Litecoin', Ltc.createInstance);
GlobalCoinFactory.registerLegacyCoinConstructor('tltc', 'LitecoinTestnet', Tltc.createInstance);
GlobalCoinFactory.registerLegacyCoinConstructor('eos', 'Eos', Eos.createInstance);
GlobalCoinFactory.registerLegacyCoinConstructor('teos', 'EosTestnet', Teos.createInstance);
GlobalCoinFactory.registerLegacyCoinConstructor('eth', 'Ethereum', Eth.createInstance);
GlobalCoinFactory.registerLegacyCoinConstructor('teth', 'Kovan', Teth.createInstance);
GlobalCoinFactory.registerLegacyCoinConstructor('gteth', 'Goerli', Gteth.createInstance);
GlobalCoinFactory.registerLegacyCoinConstructor('eth2', 'Ethereum2', Eth2.createInstance);
GlobalCoinFactory.registerLegacyCoinConstructor('teth2', 'Pyrmont', Teth2.createInstance);
GlobalCoinFactory.registerLegacyCoinConstructor('etc', 'EthereumClassic', Etc.createInstance);
GlobalCoinFactory.registerLegacyCoinConstructor('tetc', 'EthereumClassicTestnet', Tetc.createInstance);
GlobalCoinFactory.registerLegacyCoinConstructor('rbtc', 'Rbtc', Rbtc.createInstance);
GlobalCoinFactory.registerLegacyCoinConstructor('trbtc', 'RbtcTestnet', Trbtc.createInstance);
GlobalCoinFactory.registerLegacyCoinConstructor('celo', 'Celo', Celo.createInstance);
GlobalCoinFactory.registerLegacyCoinConstructor('tcelo', 'CeloTestnet', Tcelo.createInstance);
GlobalCoinFactory.registerLegacyCoinConstructor('avaxc', 'AvalancheC', AvaxC.createInstance);
GlobalCoinFactory.registerLegacyCoinConstructor('tavaxc', 'AvalancheCTestnet', TavaxC.createInstance);
GlobalCoinFactory.registerLegacyCoinConstructor('xrp', 'Xrp', Xrp.createInstance);
GlobalCoinFactory.registerLegacyCoinConstructor('txrp', 'XrpTestnet', Txrp.createInstance);
GlobalCoinFactory.registerLegacyCoinConstructor('xlm', 'Stellar', Xlm.createInstance);
GlobalCoinFactory.registerLegacyCoinConstructor('txlm', 'StellarTestnet', Txlm.createInstance);
GlobalCoinFactory.registerLegacyCoinConstructor('dash', 'Dash', Dash.createInstance);
GlobalCoinFactory.registerLegacyCoinConstructor('tdash', 'DashTestnet', Tdash.createInstance);
GlobalCoinFactory.registerLegacyCoinConstructor('zec', 'ZCash', Zec.createInstance);
GlobalCoinFactory.registerLegacyCoinConstructor('tzec', 'ZCashTestnet', Tzec.createInstance);
GlobalCoinFactory.registerLegacyCoinConstructor('algo', 'Algorand', Algo.createInstance);
GlobalCoinFactory.registerLegacyCoinConstructor('talgo', 'AlgorandTestnet', Talgo.createInstance);
GlobalCoinFactory.registerLegacyCoinConstructor('trx', 'Trx', Trx.createInstance);
GlobalCoinFactory.registerLegacyCoinConstructor('ttrx', 'TrxTestnet', Ttrx.createInstance);
GlobalCoinFactory.registerLegacyCoinConstructor('xtz', 'Xtz', Xtz.createInstance);
GlobalCoinFactory.registerLegacyCoinConstructor('txtz', 'XtzTestnet', Txtz.createInstance);
GlobalCoinFactory.registerLegacyCoinConstructor('hbar', 'Hedera', Hbar.createInstance);
GlobalCoinFactory.registerLegacyCoinConstructor('thbar', 'HederaTestnet', Thbar.createInstance);
GlobalCoinFactory.registerLegacyCoinConstructor('ofc', 'Ofc', Ofc.createInstance);
GlobalCoinFactory.registerLegacyCoinConstructor('susd', 'SUSD', Susd.createInstance);
GlobalCoinFactory.registerLegacyCoinConstructor('tsusd', 'SUSDTestnet', Tsusd.createInstance);
GlobalCoinFactory.registerLegacyCoinConstructor('cspr', 'Casper', Cspr.createInstance);
GlobalCoinFactory.registerLegacyCoinConstructor('tcspr', 'CasperTestnet', Tcspr.createInstance);
GlobalCoinFactory.registerLegacyCoinConstructor('stx', 'Stx', Stx.createInstance);
GlobalCoinFactory.registerLegacyCoinConstructor('tstx', 'StxTestnet', Tstx.createInstance);

for (const token of [...tokens.bitcoin.eth.tokens, ...tokens.testnet.eth.tokens]) {
  const tokenConstructor = Erc20Token.createTokenConstructor(token);
  if (!token.requiresExplicitNetwork) {
    GlobalCoinFactory.registerLegacyCoinConstructor(token.type, token.networkName, tokenConstructor);
    GlobalCoinFactory.registerLegacyCoinConstructor(token.tokenContractAddress, token.networkName, tokenConstructor);
  } else {
    GlobalCoinFactory.registerCoinConstructor(token.type, token.networkName, tokenConstructor);
    GlobalCoinFactory.registerCoinConstructor(token.tokenContractAddress, token.networkName, tokenConstructor);
  }
}

for (const token of [...tokens.bitcoin.xlm.tokens, ...tokens.testnet.xlm.tokens]) {
  const tokenConstructor = StellarToken.createTokenConstructor(token);
  if (!token.requiresExplicitNetwork) {
    GlobalCoinFactory.registerLegacyCoinConstructor(token.type, token.networkName, tokenConstructor);
  } else {
    GlobalCoinFactory.registerCoinConstructor(token.type, token.networkName, tokenConstructor);
  }
}

for (const ofcToken of [...tokens.bitcoin.ofc.tokens, ...tokens.testnet.ofc.tokens]) {
  const tokenConstructor = OfcToken.createTokenConstructor(ofcToken);
  if (!ofcToken.requiresExplicitNetwork) {
    GlobalCoinFactory.registerLegacyCoinConstructor(ofcToken.type, ofcToken.networkName, tokenConstructor);
  } else {
    GlobalCoinFactory.registerCoinConstructor(ofcToken.type, ofcToken.networkName, tokenConstructor);
  }
}

for (const token of [...tokens.bitcoin.celo.tokens, ...tokens.testnet.celo.tokens]) {
  const tokenConstructor = CeloToken.createTokenConstructor(token);
  if (!token.requiresExplicitNetwork) {
    GlobalCoinFactory.registerLegacyCoinConstructor(token.type, token.networkName, tokenConstructor);
    GlobalCoinFactory.registerLegacyCoinConstructor(token.tokenContractAddress, token.networkName, tokenConstructor);
  } else {
    GlobalCoinFactory.registerCoinConstructor(token.type, token.networkName, tokenConstructor);
    GlobalCoinFactory.registerCoinConstructor(token.tokenContractAddress, token.networkName, tokenConstructor);
  }
}

for (const token of [...tokens.bitcoin.eos.tokens, ...tokens.testnet.eos.tokens]) {
  const tokenConstructor = EosToken.createTokenConstructor(token);
  if (!token.requiresExplicitNetwork) {
    GlobalCoinFactory.registerLegacyCoinConstructor(token.type, token.networkName, tokenConstructor);
    GlobalCoinFactory.registerLegacyCoinConstructor(token.tokenContractAddress, token.networkName, tokenConstructor);
  } else {
    GlobalCoinFactory.registerCoinConstructor(token.type, token.networkName, tokenConstructor);
    GlobalCoinFactory.registerCoinConstructor(token.tokenContractAddress, token.networkName, tokenConstructor);
  }
}

for (const token of [...tokens.bitcoin.algo.tokens, ...tokens.testnet.algo.tokens]) {
  const tokenConstructor = AlgoToken.createTokenConstructor(token);
  if (!token.requiresExplicitNetwork) {
    GlobalCoinFactory.registerLegacyCoinConstructor(token.type, token.networkName, tokenConstructor);
  } else {
    GlobalCoinFactory.registerCoinConstructor(token.type, token.networkName, tokenConstructor);
  }
}
