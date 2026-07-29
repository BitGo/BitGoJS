/**
 * @hidden
 */

/**
 */
//
// Markets Object
// BitGo accessor to Bitcoin market data.
//
// Copyright 2015, BitGo, Inc.  All Rights Reserved.
//

import { common } from '@bitgo/sdk-core';

//
// Constructor
//
const Markets = function (bitgo) {
  // @ts-expect-error - no implicit this
  this.bitgo = bitgo;
};

/**
 * Get the latest bitcoin price data
 * @param params {}
 * @param callback
 * @returns {*} an object containing price and volume data from the
 * current day in a number of currencies
 **/
Markets.prototype.latest = function (params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  return Promise.resolve(this.bitgo.get(this.bitgo.url('/market/latest')).result())
    .then(callback)
    .catch(callback);
};

/**
 * Get yesterday's bitcoin price data
 * @param params {}
 * @param callback
 * @returns {*} an object containing price and volume data from the
 * previous day in a number of currencies
 */
Markets.prototype.yesterday = function (params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  return Promise.resolve(this.bitgo.get(this.bitgo.url('/market/yesterday')).result())
    .then(callback)
    .catch(callback);
};

/**
 * Get bitcoin price data from up to 90 days prior to today
 * @param params { currencyName: the code for the desired currency, for example USD }
 * @param callback
 * @returns {*} an object containing average prices from a number of previous days
 */
Markets.prototype.lastDays = function (params, callback) {
  params = params || {};
  common.validateParams(params, ['currencyName'], [], callback);

  const days = !isNaN(parseInt(params.days, 10)) ? parseInt(params.days, 10) : 90;

  if (days && days < 0) {
    throw new Error('must use a non-negative number of days');
  }

  return Promise.resolve(this.bitgo.get(this.bitgo.url('/market/last/' + days + '/' + params.currencyName)).result())
    .then(callback)
    .catch(callback);
};

module.exports = Markets;
