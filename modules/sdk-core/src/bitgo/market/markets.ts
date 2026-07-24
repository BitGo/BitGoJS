/**
 * Markets Object
 * BitGo accessor to Bitcoin market data.
 *
 * Copyright 2022, BitGo, Inc.  All Rights Reserved.
 *
 * @prettier
 */
import * as common from '../../common';
import { IBaseCoin } from '../baseCoin';
import { BitGoBase } from '../bitgoBase';
import { IMarkets, LastDaysOptions, LatestOptions, YesterdayOptions } from '../market';

export class Markets implements IMarkets {
  private readonly bitgo: BitGoBase;
  private readonly baseCoin: IBaseCoin;

  public constructor(bitgo: BitGoBase, baseCoin: IBaseCoin) {
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
    common.validateParams(params, ['currencyName'], []);

    const days = params.days && !isNaN(parseInt(params.days, 10)) ? parseInt(params.days, 10) : 90;

    if (days && days < 0) {
      throw new Error('must use a non-negative number of days');
    }

    return this.bitgo.get(this.baseCoin.url('/market/last/' + days + '/' + params.currencyName)).result();
  }
}
