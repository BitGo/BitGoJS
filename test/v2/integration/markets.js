//
// Tests for Markets
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

require('should');
const Promise = require('bluebird');
const co = Promise.coroutine;
const BitGoJS = require('../../../src/index');

describe('Market', function() {

  // Note we are testing all coins except rmg (don't have rmg market data)
  // We start with supported coins, then add 't' to the front of each to get testnet coins
  // We will check whether a coin is in supportedCoins to test whether it is a test or mainnet coin
  // bitcoinaverage gives back different sets of data for each (real coins have more data)
  const supportedCoins = ['btc', 'xrp', 'eth', 'ltc'];
  const coinsToUse = supportedCoins.reduce((memo, coin) => memo.concat([coin, 't' + coin]), []);
  const isMainnet = (coinName) => supportedCoins.includes(coinName);

  for (const coin of coinsToUse) {
    describe(`${coin} market data`, co(function *() {
      let bitgo;
      before(function() {
        if (isMainnet(coin)) {
          bitgo = new BitGoJS.BitGo({ useProduction: true });
        } else {
          bitgo = new BitGoJS.BitGo();
        }
      });

      it('latest arguments', co(function *() {
        bitgo.coin(coin).markets().latest('invalid').should.be.rejected;
        bitgo.coin(coin).markets().latest({}, 'invalid').should.be.rejected;
      }));

      it('lastDays arguments', co(function *() {
        bitgo.coin(coin).markets().lastDays({ currencyName: '' }).should.be.rejected;
        bitgo.coin(coin).markets().lastDays({ currencyName: 'USD', days: -1 }).should.be.rejected;
      }));

      it('latest', co(function *() {
        const marketData = yield bitgo.coin(coin).markets().latest({});

        marketData.should.have.property('latest');

        marketData.latest.should.have.property('currencies');
        marketData.latest.currencies.should.have.property('USD');
        marketData.latest.currencies.USD.should.have.property('bid');
        marketData.latest.currencies.USD.should.have.property('ask');
        marketData.latest.currencies.USD.should.have.property('last');
        marketData.latest.currencies.USD.should.have.property('total_vol');
        marketData.latest.currencies.USD.should.have.property('24h_avg');

        if (isMainnet(coin)) {
          marketData.latest.currencies.USD.should.have.property('prevDayHigh');
          marketData.latest.currencies.USD.should.have.property('prevDayLow');
          marketData.latest.currencies.USD.should.have.property('total_vol');
          marketData.latest.currencies.USD.should.have.property('timestamp');
          (typeof marketData.latest.currencies.USD.timestamp === 'number').should.equal(true);
          marketData.latest.currencies.USD.should.have.property('monthlyLow');
          marketData.latest.currencies.USD.should.have.property('monthlyHigh');
          marketData.latest.currencies.USD.should.have.property('prevDayLow');
          marketData.latest.currencies.USD.should.have.property('prevDayHigh');
          marketData.latest.currencies.USD.should.have.property('lastHourLow');
          marketData.latest.currencies.USD.should.have.property('lastHourHigh');
        }
      }));

      it('lastDays 90 days', co(function *() {
        const marketData = yield bitgo.coin(coin).markets().lastDays({ currencyName: 'USD', days: 90 });

        if (isMainnet(coin)) {
          marketData.length.should.equal(90);
        } else {
          // We sometimes miss days on testnet. Unfortunately, the days aren't
          // timestamped, so it is hard to tell what days we are missing
          marketData.length.should.be.within(80, 90);
        }

        const data = marketData[0];
        data.length.should.equal(2);
      }));

      it('lastDays 5 days', co(function *() {
        const marketData = yield bitgo.coin(coin).markets().lastDays({ currencyName: 'USD', days: 5 });
        marketData.length.should.equal(5);
      }));

      // Only bitcoin works with non-usd tickers (see process.config.market.coins)
      if (coin === 'btc' || coin === 'tbtc') {
        it('lastDays ZAR currency and 45 days', co(function *() {
          const marketData = yield bitgo.coin(coin).markets().lastDays({ currencyName: 'ZAR', days: 45 });
          marketData.length.should.equal(45);
        }));
      }

      it('lastDays over 90', co(function *() {
        const marketData = yield bitgo.coin(coin).markets().lastDays({ currencyName: 'USD', days: 9001 });

        if (isMainnet(coin)) {
          marketData.length.should.equal(90);
        } else {
          // We sometimes miss days on testnet. Unfortunately, the days aren't
          // timestamped, so it is hard to tell what days we are missing
          marketData.length.should.be.within(80, 90);
        }
      }));
    }));
  }
});
