/**
 * @prettier
 */
import * as Bluebird from 'bluebird';
import * as _ from 'lodash';
import { BitGo } from '../bitgo';

import { BaseCoin } from './baseCoin';
import { Enterprise } from './enterprise';
import { NodeCallback } from './types';

const co = Bluebird.coroutine;

export interface GetEnterpriseOptions {
  id?: string;
}

export class Enterprises {
  private readonly bitgo: BitGo;
  private readonly baseCoin: BaseCoin;

  constructor(bitgo: BitGo, baseCoin: BaseCoin) {
    this.bitgo = bitgo;
    this.baseCoin = baseCoin;
  }

  /**
   * List all enterprises available to the current user
   * @param params unused
   * @param callback
   */
  public list(params: {} = {}, callback?: NodeCallback<Enterprise[]>): Bluebird<Enterprise[]> {
    const self = this;
    return co<Enterprise[]>(function*() {
      const response = yield self.bitgo.get(self.bitgo.url('/enterprise')).result();
      return response.enterprises.map(e => {
        // instantiate a new object for each enterprise
        return new Enterprise(self.bitgo, self.baseCoin, e);
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
    const self = this;
    return co<Enterprise>(function*() {
      const enterpriseId = params.id;
      if (_.isUndefined(enterpriseId)) {
        throw new Error('id must not be empty');
      }
      if (!_.isString(enterpriseId)) {
        throw new Error('id must be hexadecimal enterprise ID');
      }

      const enterpriseData = yield self.bitgo.get(self.bitgo.url(`/enterprise/${enterpriseId}`)).result();
      return new Enterprise(self.bitgo, self.baseCoin, enterpriseData);
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
    const self = this;
    return co<Enterprise>(function*() {
      const enterpriseData = yield self.bitgo
        .post(self.bitgo.url(`/enterprise`))
        .send(params)
        .result();
      return new Enterprise(self.bitgo, self.baseCoin, enterpriseData);
    })
      .call(this)
      .asCallback(callback);
  }
}
