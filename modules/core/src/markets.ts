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

import * as Bluebird from 'bluebird';

import * as common from './common';

//
// Constructor
//
const Markets = function(bitgo) {
  this.bitgo = bitgo;
};

/**
 * Get the latest bitcoin price data
 * @param params {}
 * @param callback
 * @returns {*} an object containing price and volume data from the
 * current day in a number of currencies
 **/
Markets.prototype.latest = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  return Bluebird.resolve(
    this.bitgo.get(this.bitgo.url('/market/latest')).result()
  ).nodeify(callback);
};

/**
 * Get yesterday's bitcoin price data
 * @param params {}
 * @param callback
 * @returns {*} an object containing price and volume data from the
 * previous day in a number of currencies
 */
Markets.prototype.yesterday = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  return Bluebird.resolve(
    this.bitgo.get(this.bitgo.url('/market/yesterday')).result()
  ).nodeify(callback);
};

/**
 * Get bitcoin price data from up to 90 days prior to today
 * @param params { currencyName: the code for the desired currency, for example USD }
 * @param callback
 * @returns {*} an object containing average prices from a number of previous days
 */
Markets.prototype.lastDays = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['currencyName'], [], callback);

  const days = !isNaN(parseInt(params.days, 10)) ? parseInt(params.days, 10) : 90;

  if (days && days < 0) {
    throw new Error('must use a non-negative number of days');
  }

  return Bluebird.resolve(
    this.bitgo.get(this.bitgo.url('/market/last/' + days + '/' + params.currencyName)).result()
  ).nodeify(callback);
};

module.exports = Markets;
