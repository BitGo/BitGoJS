/**
 * Markets Object
 * BitGo accessor to Bitcoin market data.
 *
 * Copyright 2022, BitGo, Inc.  All Rights Reserved.
 *
 * @prettier
 */
import { BitGo } from '../bitgo';

import { common } from '@bitgo/sdk-core';
import { BaseCoin } from './baseCoin';

const { validateParams } = common;

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
   * @returns {*} an object containing price and volume data from the
   * current day in a number of currencies
   **/
  async latest(params: LatestOptions): Promise<any> {
    return await this.bitgo.get(this.baseCoin.url('/market/latest')).result();
  }

  /**
   * Get yesterday's price data
   * @param params {}
   * @returns {*} an object containing price and volume data from the
   * previous day in a number of currencies
   */
  async yesterday(params: YesterdayOptions): Promise<any> {
    return await this.bitgo.get(this.baseCoin.url('/market/yesterday')).result();
  }

  /**
   * Get price data from up to 90 days prior to today
   * @param params { currencyName: the code for the desired currency, for example USD }
   * @returns {*} an object containing average prices from a number of previous days
   */
  async lastDays(params: LastDaysOptions): Promise<any> {
    validateParams(params, ['currencyName'], []);

    const days = params.days && !isNaN(parseInt(params.days, 10)) ? parseInt(params.days, 10) : 90;

    if (days && days < 0) {
      throw new Error('must use a non-negative number of days');
    }

    return this.bitgo.get(this.baseCoin.url('/market/last/' + days + '/' + params.currencyName)).result();
  }
}
