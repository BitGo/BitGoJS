/**
 * User webhook handler for v2 coins and tokens
 *
 * @prettier
 */

import * as _ from 'lodash';
import * as Bluebird from 'bluebird';

import { validateParams } from '../common';
import { BaseCoin } from './baseCoin';
import { NodeCallback } from './types';

const co = Bluebird.coroutine;

export interface AddOptions {
  url: string;
  type: string;
}

export interface RemoveOptions {
  url: string;
  type: string;
}

export interface ListNotificationsOptions {
  prevId?: string;
  limit?: number;
}

export interface SimulateOptions {
  webhookId: string;
  blockId: string;
}

export class Webhooks {
  public constructor(private bitgo: any, private baseCoin: BaseCoin) {}

  /**
   * Fetch list of user webhooks
   *
   * @param callback
   * @returns {*}
   */
  list(callback: NodeCallback<any>): Bluebird<any> {
    return this.bitgo
      .get(this.baseCoin.url('/webhooks'))
      .result()
      .nodeify(callback);
  }

  /**
   * Add new user webhook
   *
   * @param params
   * @param callback
   * @returns {*}
   */
  add(params: AddOptions, callback: NodeCallback<any>): Bluebird<any> {
    return co(function*() {
      validateParams(params, ['url', 'type'], [], callback);
      return this.bitgo
        .post(this.baseCoin.url('/webhooks'))
        .send(params)
        .result();
    })
      .call(this)
      .asCallback(callback);
  }

  /**
   * Remove user webhook
   *
   * @param params
   * @param callback
   * @returns {*}
   */
  remove(params: RemoveOptions, callback: NodeCallback<any>): Bluebird<any> {
    return co(function*() {
      validateParams(params, ['url', 'type'], [], callback);

      return this.bitgo
        .del(this.baseCoin.url('/webhooks'))
        .send(params)
        .result();
    })
      .call(this)
      .asCallback(callback);
  }

  /**
   * Fetch list of webhook notifications for the user
   *
   * @param params
   * @param callback
   * @returns {*}
   */
  listNotifications(params: ListNotificationsOptions = {}, callback: NodeCallback<any>): Bluebird<any> {
    return co(function*() {
      const queryProperties: (keyof ListNotificationsOptions)[] = [];
      if (params.prevId) {
        if (!_.isString(params.prevId)) {
          throw new Error('invalid prevId argument, expecting string');
        }
        queryProperties.push('prevId');
      }
      if (params.limit) {
        if (!_.isNumber(params.limit)) {
          throw new Error('invalid limit argument, expecting number');
        }
        queryProperties.push('limit');
      }
      const query = _.pick(params, queryProperties);

      return this.bitgo
        .get(this.baseCoin.url('/webhooks/notifications'))
        .query(query)
        .result();
    })
      .call(this)
      .asCallback(callback);
  }

  /**
   * Simulate a user webhook
   *
   * @param params
   * @param callback
   * @returns {*}
   */
  simulate(params: SimulateOptions, callback: NodeCallback<any>): Bluebird<any> {
    return co(function*() {
      validateParams(params, ['webhookId', 'blockId'], [], callback);

      const webhookId = params.webhookId;
      return this.bitgo
        .post(this.baseCoin.url('/webhooks/' + webhookId + '/simulate'))
        .send(params)
        .result();
    })
      .call(this)
      .asCallback(callback);
  }
}
