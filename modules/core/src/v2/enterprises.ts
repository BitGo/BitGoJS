/**
 * @prettier
 */
import * as Bluebird from 'bluebird';
import * as _ from 'lodash';

import { BaseCoin } from './baseCoin';
import { Enterprise } from './enterprise';
import { NodeCallback } from './types';

const co = Bluebird.coroutine;

export interface GetEnterpriseOptions {
  id?: string;
}

export class Enterprises {
  private readonly bitgo: any;
  private readonly baseCoin: BaseCoin;

  constructor(bitgo: any, baseCoin: BaseCoin) {
    this.bitgo = bitgo;
    this.baseCoin = baseCoin;
  }

  /**
   * List all enterprises available to the current user
   * @param params unused
   * @param callback
   */
  public list(params: {} = {}, callback?: NodeCallback<Enterprise[]>): Bluebird<Enterprise[]> {
    return co(function*() {
      const response = yield this.bitgo.get(this.bitgo.url('/enterprise')).result();
      return response.enterprises.map(e => {
        // instantiate a new object for each enterprise
        return new Enterprise(this.bitgo, this.baseCoin, e);
      });
    })
      .call(this)
      .asCallback(callback);
  }

  /**
   * Fetch an enterprise from BitGo
   * @param params
   * @param callback
   */
  public get(params: GetEnterpriseOptions = {}, callback?: NodeCallback<Enterprise>): Bluebird<Enterprise> {
    return co(function*() {
      const enterpriseId = params.id;
      if (_.isUndefined(enterpriseId)) {
        throw new Error('id must not be empty');
      }
      if (!_.isString(enterpriseId)) {
        throw new Error('id must be hexadecimal enterprise ID');
      }

      const enterpriseData = yield this.bitgo.get(this.bitgo.url(`/enterprise/${enterpriseId}`)).result();
      return new Enterprise(this.bitgo, this.baseCoin, enterpriseData);
    })
      .call(this)
      .asCallback(callback);
  }

  /**
   * Create a new enterprise
   * @param params
   * @param callback
   */
  // TODO: (CT-686) Flesh out params object with valid enterprise creation parameters
  public create(params: any = {}, callback?: NodeCallback<Enterprise>): Bluebird<Enterprise> {
    return co(function*() {
      const enterpriseData = yield this.bitgo
        .post(this.bitgo.url(`/enterprise`))
        .send(params)
        .result();
      return new Enterprise(this.bitgo, this.baseCoin, enterpriseData);
    })
      .call(this)
      .asCallback(callback);
  }
}
