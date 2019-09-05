/**
 * Markets Object
 * BitGo accessor to Bitcoin market data.
 *
 * Copyright 2019, BitGo, Inc.  All Rights Reserved.
 *
 * @prettier
 */

import * as Bluebird from 'bluebird';
import { BitGo } from '../bitgo';

import { validateParams } from '../common';
import { BaseCoin } from './baseCoin';
import { NodeCallback } from './types';

const co = Bluebird.coroutine;

// TODO (SDKT-9): reverse engineer and add options
// export interface LatestOptions {}
export type LatestOptions = any;

// TODO (SDKT-9): reverse engineer and add options
// export interface YesterdayOptions {}
export type YesterdayOptions = any;

export interface LastDaysOptions {
  currencyName: string;
  days?: string;
}

export class Markets {
  private readonly bitgo: BitGo;
  private readonly baseCoin: BaseCoin;

  public constructor(bitgo: BitGo, baseCoin: BaseCoin) {
    this.bitgo = bitgo;
    this.baseCoin = baseCoin;
  }

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
    const self = this;
    return co(function*() {
      validateParams(params, ['currencyName'], []);

      const days = params.days && !isNaN(parseInt(params.days, 10)) ? parseInt(params.days, 10) : 90;

      if (days && days < 0) {
        throw new Error('must use a non-negative number of days');
      }

      return self.bitgo.get(self.baseCoin.url('/market/last/' + days + '/' + params.currencyName)).result();
    })
      .call(this)
      .asCallback(callback);
  }
}
