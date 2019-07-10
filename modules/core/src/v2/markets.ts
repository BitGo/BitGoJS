/**
 * Markets Object
 * BitGo accessor to Bitcoin market data.
 *
 * Copyright 2019, BitGo, Inc.  All Rights Reserved.
 *
 * @prettier
 */

import * as Bluebird from 'bluebird';

import { validateParams } from '../common';
import { BaseCoin } from './baseCoin';
import { NodeCallback } from './types';

const co = Bluebird.coroutine;

export interface LatestOptions {}
export interface YesterdayOptions {}

export interface LastDaysOptions {
  currencyName: string;
  days?: string;
}

export class Markets {
  public constructor(private bitgo: any, private baseCoin: BaseCoin) {}

  /**
   * Get the latest price data
   * @param params {}
   * @param callback
   * @returns {*} an object containing price and volume data from the
   * current day in a number of currencies
   **/
  latest(params: LatestOptions, callback: NodeCallback<any>): Bluebird<any> {
    return this.bitgo
      .get(this.baseCoin.url('/market/latest'))
      .result()
      .asCallback(callback);
  }

  /**
   * Get yesterday's price data
   * @param params {}
   * @param callback
   * @returns {*} an object containing price and volume data from the
   * previous day in a number of currencies
   */
  yesterday(params: YesterdayOptions, callback: NodeCallback<any>): Bluebird<any> {
    return this.bitgo
      .get(this.baseCoin.url('/market/yesterday'))
      .result()
      .asCallback(callback);
  }

  /**
   * Get price data from up to 90 days prior to today
   * @param params { currencyName: the code for the desired currency, for example USD }
   * @param callback
   * @returns {*} an object containing average prices from a number of previous days
   */
  lastDays(params: LastDaysOptions, callback: NodeCallback<any>): Bluebird<any> {
    return co(function*() {
      validateParams(params, ['currencyName'], []);

      const days = !isNaN(parseInt(params.days, 10)) ? parseInt(params.days, 10) : 90;

      if (days && days < 0) {
        throw new Error('must use a non-negative number of days');
      }

      return this.bitgo.get(this.baseCoin.url('/market/last/' + days + '/' + params.currencyName)).result();
    })
      .call(this)
      .asCallback(callback);
  }
}
