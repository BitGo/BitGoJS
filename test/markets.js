//
// Tests for Markets
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var assert = require('assert');
var should = require('should');
var BitGoJS = require('../src/index');

describe('Market', function() {
  var bitgo;
  before(function() {
    bitgo = new BitGoJS.BitGo();
  });

  it('latest arguments', function() {
    assert.throws(function() { bitgo.markets().latest('invalid'); });
    assert.throws(function() { bitgo.markets().latest({}, 'invalid'); });
  });

  it('lastDays arguments', function() {
    assert.throws(function() { bitgo.markets().lastDays({ currencyName: '' }) });
    assert.throws(function() { bitgo.markets().lastDays({ currencyName: 'USD', days: -1 }) });
  });

  it('latest', function(done) {
    bitgo.markets().latest({}, function(err, marketData) {
      if (err) {
        throw err;
      }
      marketData.should.have.property('latest');
      marketData.latest.should.have.property('currencies');
      marketData.latest.currencies.should.have.property('USD');
      marketData.latest.currencies.USD.should.have.property('bid');
      marketData.latest.currencies.USD.should.have.property('ask');
      marketData.latest.currencies.USD.should.have.property('last');
      marketData.latest.currencies.USD.should.have.property('total_vol');
      marketData.latest.currencies.USD.should.have.property('prevDayHigh');
      marketData.latest.currencies.USD.should.have.property('prevDayLow');
      done();
    });
  });

  it('lastDays 90 days', function() {
    bitgo.markets().lastDays({ currencyName: 'USD', days: 90 })
    .then(function(marketData) {
      marketData.length.should.equal(90);

      var data = marketData[0];
      data.length.should.equal(2);
    });
  });

  it('lastDays 0 days', function() {
    bitgo.markets().lastDays({ currencyName: 'USD', days: 0 })
    .then(function(marketData) {
      marketData.length.should.equal(0);
    });
  });

  it('lastDays ZAR currency and 45 days', function() {
    bitgo.markets().lastDays({ currencyName: 'ZAR', days: 45 })
    .then(function(marketData) {
      marketData.length.should.equal(45);
    });
  });

  it('lastDays over 90', function() {
    bitgo.markets().lastDays({ currencyName: 'USD', days: 9001 })
    .then(function(marketData) {
      marketData.length.should.equal(90);
    });
  });
});