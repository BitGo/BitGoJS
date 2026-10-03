import should from 'should';
import { BIP44_COIN_TYPES, coins, getBip44CoinType, isBip44Derivable } from '../../src';
import { MAX_BIP44_COIN_TYPE } from '../../src/constants';

describe('bip44 coin types', function () {
  const values = Object.values(BIP44_COIN_TYPES);

  it('values should be valid coin types', function () {
    Object.entries(BIP44_COIN_TYPES).forEach(([family, coinType]) => {
      Number.isInteger(coinType).should.be.true(`${family} must be an integer`);
      coinType.should.be.within(0, MAX_BIP44_COIN_TYPE, `${family} must be a valid coin type`);
    });
  });

  it('values should be unique between families', function () {
    new Set(values).size.should.equal(values.length);
  });

  it('every coin should carry its family value', function () {
    coins.forEach((coin, name) => {
      should(coin.bip44CoinType).equal(getBip44CoinType(coin.family), `'${name}' must carry its family's value`);
    });
  });

  it('testnets and tokens should mirror their parent chain', function () {
    should(coins.get('btc').bip44CoinType).equal(0);
    should(coins.get('tbtc').bip44CoinType).equal(coins.get('btc').bip44CoinType);
    should(coins.get('usdc').bip44CoinType).equal(coins.get('eth').bip44CoinType);
  });

  it('every BIP44-derivable coin should have a bip44CoinType', function () {
    const missing = new Set<string>();
    coins.forEach((coin) => {
      if (isBip44Derivable(coin) && coin.bip44CoinType === undefined) {
        missing.add(coin.family);
      }
    });
    [...missing].sort().should.be.empty();
  });
});
