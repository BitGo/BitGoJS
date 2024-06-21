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
import { expectedColdFeatures } from './fixtures/expectedColdFeatures';

interface DuplicateCoinObject {
  name: string;
  network: BaseNetwork;
}

const custodyFeatures: Record<string, { features: CoinFeature[] }> = {
  algo: {
    features: [
      CoinFeature.CUSTODY_BITGO_SWITZERLAND,
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
    ],
  },
  avaxc: {
    features: [
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
      CoinFeature.CUSTODY_BITGO_SWITZERLAND,
    ],
  },
  avaxp: {
    features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_FRANKFURT],
  },
  btc: {
    features: [
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_NEW_YORK,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
      CoinFeature.CUSTODY_BITGO_SINGAPORE,
      CoinFeature.CUSTODY_BITGO_SISTER_TRUST_ONE,
      CoinFeature.CUSTODY_BITGO_SWITZERLAND,
    ],
  },
  bch: {
    features: [
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_NEW_YORK,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
      CoinFeature.CUSTODY_BITGO_SINGAPORE,
    ],
  },
  btg: { features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  cspr: {
    features: [
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_SWITZERLAND,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
    ],
  },
  celo: { features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  doge: { features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  eos: { features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  eth: {
    features: [
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_NEW_YORK,
      CoinFeature.CUSTODY_BITGO_SWITZERLAND,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
      CoinFeature.CUSTODY_BITGO_SINGAPORE,
    ],
  },
  etc: {
    features: [
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
      CoinFeature.CUSTODY_BITGO_NEW_YORK,
    ],
  },
  hbar: { features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  ltc: {
    features: [
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_NEW_YORK,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
      CoinFeature.CUSTODY_BITGO_SINGAPORE,
    ],
  },
  matic: { features: [CoinFeature.CUSTODY_BITGO_SWITZERLAND] },
  injective: { features: [CoinFeature.CUSTODY_BITGO_SWITZERLAND] },
  polygon: {
    features: [
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_SWITZERLAND,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
    ],
  },
  xrp: {
    features: [
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_NEW_YORK,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
      CoinFeature.CUSTODY_BITGO_SINGAPORE,
    ],
  },
  rbtc: { features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  sol: { features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  stx: { features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  xlm: {
    features: [
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_NEW_YORK,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
    ],
  },
  trx: { features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  usdt: { features: [CoinFeature.CUSTODY_BITGO_SWITZERLAND] },
  usdc: { features: [CoinFeature.CUSTODY_BITGO_SWITZERLAND] },
  injv2: { features: [CoinFeature.CUSTODY_BITGO_SWITZERLAND] },
  // Test Coins
  talgo: {
    features: [
      CoinFeature.CUSTODY_BITGO_SWITZERLAND,
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
    ],
  },
  tavaxc: {
    features: [
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
      CoinFeature.CUSTODY_BITGO_SWITZERLAND,
    ],
  },
  tavaxp: {
    features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_FRANKFURT],
  },
  tbtc: {
    features: [
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_NEW_YORK,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
      CoinFeature.CUSTODY_BITGO_SISTER_TRUST_ONE,
      CoinFeature.CUSTODY_BITGO_SINGAPORE,
      CoinFeature.CUSTODY_BITGO_SWITZERLAND,
    ],
  },
  tbch: {
    features: [
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_NEW_YORK,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
      CoinFeature.CUSTODY_BITGO_SINGAPORE,
    ],
  },
  tbtg: { features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  tcspr: {
    features: [
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_SWITZERLAND,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
    ],
  },
  tcelo: { features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  tdoge: { features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  teos: { features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  gteth: {
    features: [
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_NEW_YORK,
      CoinFeature.CUSTODY_BITGO_SWITZERLAND,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
      CoinFeature.CUSTODY_BITGO_SINGAPORE,
    ],
  },
  hteth: {
    features: [
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_NEW_YORK,
      CoinFeature.CUSTODY_BITGO_SWITZERLAND,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
      CoinFeature.CUSTODY_BITGO_SINGAPORE,
    ],
  },
  tetc: {
    features: [
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_NEW_YORK,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
    ],
  },
  thbar: { features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  tltc: {
    features: [
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_NEW_YORK,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
      CoinFeature.CUSTODY_BITGO_SINGAPORE,
    ],
  },
  tmatic: { features: [CoinFeature.CUSTODY_BITGO_SWITZERLAND] },
  tinjective: { features: [CoinFeature.CUSTODY_BITGO_SWITZERLAND] },
  tpolygon: {
    features: [
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_SWITZERLAND,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
    ],
  },
  txrp: {
    features: [
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_NEW_YORK,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
      CoinFeature.CUSTODY_BITGO_SINGAPORE,
    ],
  },
  trbtc: { features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  tsol: { features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  tstx: { features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  txlm: {
    features: [
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_NEW_YORK,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
    ],
  },
  ttrx: { features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  tia: { features: [CoinFeature.CUSTODY_BITGO_SWITZERLAND] },
  ttia: { features: [CoinFeature.CUSTODY_BITGO_SWITZERLAND] },
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
        coin.features.includes(CoinFeature.CUSTODY_BITGO_FRANKFURT).should.eql(false);
      });
    } else {
      it('should return true for CUSTODY and CUSTODY_BITGO_TRUST coin feature', () => {
        const coinSupportsCustody = coin.family !== CoinFamily.LNBTC;
        coin.features.includes(CoinFeature.CUSTODY).should.eql(coinSupportsCustody);
        coin.features.includes(CoinFeature.CUSTODY_BITGO_TRUST).should.eql(coinSupportsCustody);
      });

      it('should return false for all non-SD coin feature', () => {
        coin.features.includes(CoinFeature.CUSTODY_BITGO_NEW_YORK).should.eql(false);
        coin.features.includes(CoinFeature.CUSTODY_BITGO_GERMANY).should.eql(false);
        coin.features.includes(CoinFeature.CUSTODY_BITGO_SWITZERLAND).should.eql(false);
        coin.features.includes(CoinFeature.CUSTODY_BITGO_FRANKFURT).should.eql(false);
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

describe('Cold Wallet Features', () => {
  it('Coins that support both multisig & tss cold should have expected flags', () => {
    const both = coins
      .filter(
        (coin) =>
          !coin.isToken &&
          coin.features.includes(CoinFeature.MULTISIG_COLD) &&
          coin.features.includes(CoinFeature.TSS_COLD)
      )
      .map((coin) => coin.name)
      .sort();
    both.should.deepEqual(expectedColdFeatures.both.sort());
  });
  it('Coins that support just multisig cold should have expected flags', () => {
    const justMultiSig = coins
      .filter(
        (coin) =>
          !coin.isToken &&
          coin.features.includes(CoinFeature.MULTISIG_COLD) &&
          !coin.features.includes(CoinFeature.TSS_COLD)
      )
      .map((coin) => coin.name)
      .sort();
    justMultiSig.should.deepEqual(expectedColdFeatures.justMultiSig.sort());
  });
  it('Coins that support just tss cold should have expected flags', () => {
    const justTSS = coins
      .filter(
        (coin) =>
          !coin.isToken &&
          !coin.features.includes(CoinFeature.MULTISIG_COLD) &&
          coin.features.includes(CoinFeature.TSS_COLD)
      )
      .map((coin) => coin.name)
      .sort();
    justTSS.should.deepEqual(expectedColdFeatures.justTSS.sort());
  });
  it('Coins that dont support cold wallets at all should not have either flag', () => {
    const neither = coins
      .filter(
        (coin) =>
          !coin.isToken &&
          !coin.features.includes(CoinFeature.MULTISIG_COLD) &&
          !coin.features.includes(CoinFeature.TSS_COLD)
      )
      .map((coin) => coin.name)
      .sort();
    neither.should.deepEqual(expectedColdFeatures.neither.sort());
  });
});

describe('Distributed Custody Features', () => {
  it('btc and tbtc should have distributed custody feature', () => {
    const targetCoins = ['tbtc', 'btc'];
    targetCoins.forEach((coinName) => {
      const coin = coins.get(coinName);
      coin.features.includes(CoinFeature.DISTRIBUTED_CUSTODY).should.eql(true);
    });
  });
});
