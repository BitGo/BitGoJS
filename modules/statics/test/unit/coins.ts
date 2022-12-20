import 'should';
import {
  BaseNetwork,
  OfcCoin,
  CoinFamily,
  CoinFeature,
  coins,
  Erc20Coin,
  EthereumNetwork,
  NetworkType,
  CoinKind,
} from '../../src';

interface DuplicateCoinObject {
  name: string;
  network: BaseNetwork;
}

describe('CoinMap', function () {
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
});

coins.forEach((coin, coinName) => {
  describe(`Coin ${coinName}`, function () {
    it('has expected name', function () {
      coin.name.should.eql(coinName);
    });

    if (!coin.isToken && coin.family !== CoinFamily.FIAT) {
      it(`has expected network type`, function () {
        coin.network.type.should.eql(coin.name === coin.family ? NetworkType.MAINNET : NetworkType.TESTNET);
      });
    }

    it('expect base unit', function () {
      coin.baseUnit.should.be.not.empty();
    });

    // OfcCoin names are 'ofc' + 'basecoin' so for all OfcCoins we are checking that there is a corresponding basecoin
    if (coin instanceof OfcCoin && coin.kind !== CoinKind.FIAT) {
      it('requires on-chain definition', () => {
        const ofcCoinName = coin.name;
        const baseCoinName = ofcCoinName.slice(3);
        coins.has(baseCoinName).should.eql(true);
      });
    }

    if (coin.family === CoinFamily.ETH) {
      it('requires custody', () => {
        coin.features.includes(CoinFeature.CUSTODY).should.eql(true);
      });
    } else if (coin.family === CoinFamily.XTZ) {
      it('does not support custody', () => {
        coin.features.includes(CoinFeature.CUSTODY).should.eql(false);
      });
    } else if (coin.family === CoinFamily.AVAXP || coin.features.includes(CoinFeature.GENERIC_TOKEN)) {
      it('does not require custody', () => {
        coin.features.includes(CoinFeature.CUSTODY).should.eql(false);
      });
    } else {
      it('does support custody', () => {
        coin.features.includes(CoinFeature.CUSTODY).should.eql(true);
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
