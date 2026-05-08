/**
 * User webhook handler for v2 coins and tokens
 *
 * @prettier
 */
import * as _ from 'lodash';
import * as common from '../../common';
import { IBaseCoin } from '../baseCoin';
import { BitGoBase } from '../bitgoBase';
import { AddOptions, IWebhooks, ListNotificationsOptions, RemoveOptions, SimulateOptions } from './iWebhooks';

export class Webhooks implements IWebhooks {
  private bitgo: BitGoBase;
  private baseCoin: IBaseCoin;

  public constructor(bitgo: BitGoBase, baseCoin: IBaseCoin) {
    this.bitgo = bitgo;
    this.baseCoin = baseCoin;
  }

  /**
   * Fetch list of user webhooks
   *
   * @returns {*}
   */
  async list(): Promise<any> {
    return await this.bitgo.get(this.baseCoin.url('/webhooks')).result();
  }

  /**
   * Add new user webhook
   *
   * @param params
   * @returns {*}
   */
  async add({ url, type, label, numConfirmations = 0 }: AddOptions): Promise<any> {
    common.validateParams({ url, type, label, numConfirmations }, ['url', 'type'], ['string', 'numConfirmations']);
    return await this.bitgo.post(this.baseCoin.url('/webhooks')).send({ url, type, label, numConfirmations }).result();
  }

  /**
   * Remove user webhook
   *
   * @param params
   * @returns {*}
   */
  async remove(params: RemoveOptions): Promise<any> {
    common.validateParams(params, ['url', 'type'], []);

    return this.bitgo.del(this.baseCoin.url('/webhooks')).send(params).result();
  }

  /**
   * Fetch list of webhook notifications for the user
   *
   * @param params
   * @returns {*}
   */
  async listNotifications(params: ListNotificationsOptions = {}): Promise<any> {
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

    return this.bitgo.get(this.baseCoin.url('/webhooks/notifications')).query(query).result();
  }

  /**
   * Simulate a user webhook
   *
   * @param params
   * @returns {*}
   */
  async simulate(params: SimulateOptions): Promise<any> {
    common.validateParams(params, ['webhookId', 'blockId'], []);

    const webhookId = params.webhookId;
    return this.bitgo
      .post(this.baseCoin.url('/webhooks/' + webhookId + '/simulate'))
      .send(params)
      .result();
  }
}
