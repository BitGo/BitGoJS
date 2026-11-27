import 'should';
import * as sinon from 'sinon';
import { BaseCoin as StaticsBaseCoin, coins, CoinFeature, KeyCurve } from '@bitgo/statics';
import { krsProviders } from '../../../src/bitgo/config';
import { getKrsProvider } from '../../../src/bitgo/recovery/initiate';
import type { BaseCoin } from '../../../src/bitgo/baseCoin';

function coinOfFamily(family: string): BaseCoin {
  return { getFamily: () => family } as unknown as BaseCoin;
}

describe('krsProviders', function () {
  describe('coincover', function () {
    const { supportedCoins } = krsProviders.coincover;

    it('covers every family a safe can mint under a multisig root slot', function () {
      // Independent of the slot helper: a multisig coin on a secp256k1 or ed25519 primary curve.
      const expected = new Set<string>();
      coins.forEach((coin) => {
        if (
          !coin.isToken &&
          coin.features.includes(CoinFeature.MULTISIG) &&
          (coin.primaryKeyCurve === KeyCurve.Secp256k1 || coin.primaryKeyCurve === KeyCurve.Ed25519)
        ) {
          expected.add(coin.family);
        }
      });
      supportedCoins.should.deepEqual([...expected].sort());
    });

    it('includes multisig-safe families the legacy dai list omits', function () {
      supportedCoins.should.containDeep(['doge', 'algo', 'hbar']);
    });

    it('excludes families that only mint under an MPC slot', function () {
      supportedCoins.should.not.containEql('eth');
      supportedCoins.should.not.containEql('sol');
    });

    it('resolves through getKrsProvider for a sample of supported families', function () {
      for (const family of ['btc', 'doge', 'xrp', 'trx', 'xlm', 'algo', 'hbar']) {
        getKrsProvider(coinOfFamily(family), 'coincover').should.equal(krsProviders.coincover);
      }
    });

    it('rejects a family outside the multisig safe set', function () {
      (() => getKrsProvider(coinOfFamily('sol'), 'coincover')).should.throw(
        'specified key recovery service does not support recoveries for this coin'
      );
    });

    it('charges no on-chain fee', function () {
      krsProviders.coincover.feeType.should.equal('flatUsd');
      krsProviders.coincover.feeAmount.should.equal(0);
    });

    it('skips coins the slot lookup cannot place', function () {
      // A coin known to statics but not to sdk-lib-safes makes safeSlotsForCoin throw; module load must skip it.
      const skewCoin = {
        name: 'skewcoin',
        family: 'skewfamily',
        isToken: false,
        features: [CoinFeature.MULTISIG],
        primaryKeyCurve: KeyCurve.Secp256k1,
      } as unknown as Readonly<StaticsBaseCoin>;
      const forEach = coins.forEach.bind(coins);
      const forEachStub = sinon.stub(coins, 'forEach').callsFake((callback) => {
        forEach(callback);
        callback(skewCoin, skewCoin.name);
      });
      const configPath = require.resolve('../../../src/bitgo/config');
      delete require.cache[configPath];
      try {
        const reloaded: { krsProviders: typeof krsProviders } = require(configPath);
        reloaded.krsProviders.coincover.supportedCoins.should.not.containEql('skewfamily');
        reloaded.krsProviders.coincover.supportedCoins.should.deepEqual(supportedCoins);
      } finally {
        forEachStub.restore();
        delete require.cache[configPath];
      }
    });
  });

  it('leaves the legacy dai provider unchanged', function () {
    krsProviders.dai.should.deepEqual({
      feeType: 'flatUsd',
      feeAmount: 0,
      supportedCoins: ['btc', 'eth', 'xlm', 'xrp', 'dash', 'zec', 'ltc', 'bch', 'bsv', 'bcha'],
    });
  });
});
