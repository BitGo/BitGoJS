import 'should';
import {
  BaseNetwork,
  BaseUnit,
  CoinFamily,
  CoinFeature,
  CoinMap,
  coins,
  Erc20Coin,
  EthereumNetwork,
  Networks,
  NetworkType,
  UnderlyingAsset,
  UtxoCoin,
} from '../../src';
import { utxo } from '../../src/utxo';

interface DuplicateCoinObject {
  name: string;
  network: BaseNetwork;
}

const custodyFeatures: Record<string, { features: CoinFeature[] }> = {
  algo: {
    features: [CoinFeature.CUSTODY_BITGO_SWITZERLAND, CoinFeature.CUSTODY_BITGO_GERMANY],
  },
  avaxc: { features: [CoinFeature.CUSTODY_BITGO_GERMANY] },
  avaxp: { features: [CoinFeature.CUSTODY_BITGO_GERMANY] },
  btc: {
    features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_NEW_YORK],
  },
  bch: {
    features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_NEW_YORK],
  },
  btg: { features: [CoinFeature.CUSTODY_BITGO_GERMANY] },
  cspr: { features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_SWITZERLAND] },
  celo: { features: [CoinFeature.CUSTODY_BITGO_GERMANY] },
  doge: { features: [CoinFeature.CUSTODY_BITGO_GERMANY] },
  eos: { features: [CoinFeature.CUSTODY_BITGO_GERMANY] },
  eth: {
    features: [
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_NEW_YORK,
      CoinFeature.CUSTODY_BITGO_SWITZERLAND,
    ],
  },
  etc: {
    features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_NEW_YORK],
  },
  hbar: { features: [CoinFeature.CUSTODY_BITGO_GERMANY] },
  ltc: {
    features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_NEW_YORK],
  },
  matic: { features: [CoinFeature.CUSTODY_BITGO_SWITZERLAND] },
  polygon: { features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_SWITZERLAND] },
  xrp: {
    features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_NEW_YORK],
  },
  rbtc: { features: [CoinFeature.CUSTODY_BITGO_GERMANY] },
  sol: { features: [CoinFeature.CUSTODY_BITGO_GERMANY] },
  stx: { features: [CoinFeature.CUSTODY_BITGO_GERMANY] },
  xlm: {
    features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_NEW_YORK],
  },
  trx: { features: [CoinFeature.CUSTODY_BITGO_GERMANY] },
  // Test Coins
  talgo: {
    features: [CoinFeature.CUSTODY_BITGO_SWITZERLAND, CoinFeature.CUSTODY_BITGO_GERMANY],
  },
  tavaxc: { features: [CoinFeature.CUSTODY_BITGO_GERMANY] },
  tavaxp: { features: [CoinFeature.CUSTODY_BITGO_GERMANY] },
  tbtc: {
    features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_NEW_YORK],
  },
  tbch: {
    features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_NEW_YORK],
  },
  tbtg: { features: [CoinFeature.CUSTODY_BITGO_GERMANY] },
  tcspr: { features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_SWITZERLAND] },
  tcelo: { features: [CoinFeature.CUSTODY_BITGO_GERMANY] },
  tdoge: { features: [CoinFeature.CUSTODY_BITGO_GERMANY] },
  teos: { features: [CoinFeature.CUSTODY_BITGO_GERMANY] },
  gteth: {
    features: [
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_NEW_YORK,
      CoinFeature.CUSTODY_BITGO_SWITZERLAND,
    ],
  },
  tetc: {
    features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_NEW_YORK],
  },
  thbar: { features: [CoinFeature.CUSTODY_BITGO_GERMANY] },
  tltc: {
    features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_NEW_YORK],
  },
  tmatic: { features: [CoinFeature.CUSTODY_BITGO_SWITZERLAND] },
  tpolygon: { features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_SWITZERLAND] },
  txrp: {
    features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_NEW_YORK],
  },
  trbtc: { features: [CoinFeature.CUSTODY_BITGO_GERMANY] },
  tsol: { features: [CoinFeature.CUSTODY_BITGO_GERMANY] },
  tstx: { features: [CoinFeature.CUSTODY_BITGO_GERMANY] },
  txlm: {
    features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_NEW_YORK],
  },
  ttrx: { features: [CoinFeature.CUSTODY_BITGO_GERMANY] },
};

describe('CoinMap', function () {
  const btc = utxo(
    '5c1691c5-c9cc-49ed-abe0-c433dab2edaa',
    'btc',
    'Bitcoin',
    Networks.main.bitcoin,
    UnderlyingAsset.BTC,
    BaseUnit.BTC,
    [...UtxoCoin.DEFAULT_FEATURES]
  );

  it('should fail to map a coin with duplicated name', () => {
    (() => CoinMap.fromCoins([btc, btc])).should.throw(`coin '${btc.name}' is already defined`);
  });

  it('should fail to map a coin with duplicated id', () => {
    const btc2 = { ...btc, name: 'btc2' };
    (() => CoinMap.fromCoins([btc, btc2])).should.throw(`coin with id '${btc.id}' is already defined`);
  });

  it('should have iterator', function () {
    [...coins].length.should.be.greaterThan(100);
  });

  it('should report if it contains coin', () => {
    coins.forEach((coin) => {
      coins.has(coin.name).should.be.true();
    });
  });

  it('should report if it does not contain coin', () => {
    coins.has('zzzz:TBD:232332').should.be.false();
  });

  it('should fail if asset ids are not unique', () => {
    const assetIds = new Set();
    coins.forEach((coin) => {
      assetIds.has(coin.id).should.be.false();
      assetIds.add(coin.id);
    });
  });

  it('should get coin by id', () => {
    const btc = coins.get('btc');
    const btcById = coins.get(btc.id);
    btcById.should.deepEqual(btc);
  });

  it('should find coin by id', () => {
    coins.has(btc.id).should.be.true();
  });
});

coins.forEach((coin, coinName) => {
  describe(`Coin ${coinName}`, function () {
    const featureList = custodyFeatures[coin.name];

    it('has expected name', function () {
      coin.name.should.eql(coinName);
    });

    it('should have id', function () {
      coin.id.should.be.not.empty();
    });

    if (!coin.isToken && coin.family !== CoinFamily.FIAT) {
      it(`has expected network type`, function () {
        coin.network.type.should.eql(coin.name === coin.family ? NetworkType.MAINNET : NetworkType.TESTNET);
      });
    }

    it('expect base unit', function () {
      coin.baseUnit.should.be.not.empty();
    });

    if (featureList) {
      featureList.features.forEach((feature: CoinFeature) => {
        it(`should return true for ${feature} ${coin.family} coin feature`, () => {
          coin.features.includes(feature).should.eql(true);
        });
      });

      it(`should return true for CUSTODY_BITGO_TRUST ${coin.family} coin feature`, () => {
        coin.features.includes(CoinFeature.CUSTODY_BITGO_TRUST).should.eql(true);
      });
    } else if (coin.family === CoinFamily.XTZ || coin.features.includes(CoinFeature.GENERIC_TOKEN)) {
      it(`should return false for all custody ${coin.family} coin feature`, () => {
        coin.features.includes(CoinFeature.CUSTODY).should.eql(false);
        coin.features.includes(CoinFeature.CUSTODY_BITGO_TRUST).should.eql(false);
        coin.features.includes(CoinFeature.CUSTODY_BITGO_NEW_YORK).should.eql(false);
        coin.features.includes(CoinFeature.CUSTODY_BITGO_GERMANY).should.eql(false);
        coin.features.includes(CoinFeature.CUSTODY_BITGO_SWITZERLAND).should.eql(false);
      });
    } else {
      it('should return true for CUSTODY and CUSTODY_BITGO_TRUST coin feature', () => {
        coin.features.includes(CoinFeature.CUSTODY).should.eql(true);
        coin.features.includes(CoinFeature.CUSTODY_BITGO_TRUST).should.eql(true);
      });

      it('should return false for all non-SD coin feature', () => {
        coin.features.includes(CoinFeature.CUSTODY_BITGO_NEW_YORK).should.eql(false);
        coin.features.includes(CoinFeature.CUSTODY_BITGO_GERMANY).should.eql(false);
        coin.features.includes(CoinFeature.CUSTODY_BITGO_SWITZERLAND).should.eql(false);
      });
    }
  });
});

describe('ERC20 Coins', () => {
  it('should have no duplicate contract addresses', () => {
    coins
      .filter((coin) => coin instanceof Erc20Coin)
      .reduce((acc: { [index: string]: DuplicateCoinObject }, token) => {
        const address = (token as Readonly<Erc20Coin>).contractAddress.toString();

        // If not ETH, should never have duplicates
        if (acc[address] && token.network.family !== CoinFamily.ETH) {
          throw new Error(
            `ERC20 tokens '${acc[address].name}' and '${token.name}' have identical contract address '${address}'`
          );
        }

        // If ETH, must check if chainId is different for the tokens before concluding they are duplicates
        if (acc[address] && token.network.family === CoinFamily.ETH) {
          const network = token.network as EthereumNetwork;
          const accEntry = acc[address].network as EthereumNetwork;
          if (network.chainId === accEntry.chainId) {
            throw new Error(
              `ERC20 tokens '${acc[address]}' and '${token.name}' have identical contract address '${address}'`
            );
          }
        }
        acc[address] = { name: token.name, network: token.network };
        return acc;
      }, {});
  });
});
