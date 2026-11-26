import should from 'should';
import { BIP44_COIN_TYPES, coins, getBip44CoinType, isBip44Derivable } from '../../src';
import { MAX_BIP32_INDEX } from '../../src/constants';

describe('bip44 coin types', function () {
  const values = Object.values(BIP44_COIN_TYPES);

  it('values should be valid coin types', function () {
    Object.entries(BIP44_COIN_TYPES).forEach(([family, coinType]) => {
      Number.isInteger(coinType).should.be.true(`${family} must be an integer`);
      coinType.should.be.within(0, MAX_BIP32_INDEX, `${family} must be a valid coin type`);
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

  // Pinned values: the UTXO per-wallet derivation prefix (`44/<coinType>/<h1>/<h2>`) embeds these, and
  // recovery scans only the canonical prefix, so a change here would make existing bip44 addresses unrecoverable.
  describe('UTXO coin types are pinned', function () {
    const pinned: Record<string, number> = {
      btc: 0,
      tbtc: 0,
      tbtc4: 0,
      tbtcsig: 0,
      tbtcbgsig: 0,
      tbtcstx: 0,
      tbtcstxprivate1: 0,
      tbtcstxsignet: 0,
      ltc: 2,
      tltc: 2,
      doge: 3,
      tdoge: 3,
      dash: 5,
      tdash: 5,
      zec: 133,
      tzec: 133,
      bch: 145,
      tbch: 145,
      btg: 156,
      tbtg: 156,
      bsv: 236,
      tbsv: 236,
      bcha: 899,
      tbcha: 899,
    };

    Object.entries(pinned).forEach(([name, coinType]) => {
      it(`${name} should be ${coinType}`, function () {
        should(coins.get(name).bip44CoinType).equal(coinType);
      });
    });
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
