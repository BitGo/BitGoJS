//
// Markets Object
// BitGo accessor to Bitcoin market data.
//
// Copyright 2015, BitGo, Inc.  All Rights Reserved.
//


const common = require('../common');
const Promise = require('bluebird');
const co = Promise.coroutine;

//
// Constructor
//
const Markets = function(bitgo, baseCoin) {
  this.bitgo = bitgo;
  this.baseCoin = baseCoin;
};

/**
 * Get the latest price data
 * @param params {}
 * @param callback
 * @returns {*} an object containing price and volume data from the
 * current day in a number of currencies
 **/
Markets.prototype.latest = function latest(params, callback) {
  return co(function *() {
    params = params || {};
    common.validateParams(params, [], []);

    const res = yield this.bitgo.get(this.baseCoin.url('/market/latest'));
    return res.body;
  }).call(this).asCallback(callback);
};

/**
 * Get yesterday's price data
 * @param params {}
 * @param callback
 * @returns {*} an object containing price and volume data from the
 * previous day in a number of currencies
 */
Markets.prototype.yesterday = function yesterday(params, callback) {
  return co(function *() {
    params = params || {};
    common.validateParams(params, [], []);

    const res = yield this.bitgo.get(this.baseCoin.url('/market/yesterday'));
    return res.body;
  }).call(this).asCallback(callback);
};


/**
 * Get price data from up to 90 days prior to today
 * @param params { currencyName: the code for the desired currency, for example USD }
 * @param callback
 * @returns {*} an object containing average prices from a number of previous days
 */
Markets.prototype.lastDays = function lastDays(params, callback) {
  return co(function *() {
    params = params || {};
    common.validateParams(params, ['currencyName'], []);

    const days = !isNaN(parseInt(params.days, 10)) ? parseInt(params.days, 10) : 90;

    if (days && days < 0) {
      throw new Error('must use a non-negative number of days');
    }

    const res = yield this.bitgo.get(this.baseCoin.url('/market/last/' + days + '/' + params.currencyName));
    return res.body;
  }).call(this).asCallback(callback);
};

module.exports = Markets;
