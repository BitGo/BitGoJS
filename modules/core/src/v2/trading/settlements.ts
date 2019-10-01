/**
 * @prettier
 * @hidden
 */

/**
 */
import * as Bluebird from 'bluebird';
import { BitGo } from '../../bitgo';

import { NodeCallback } from '../types';
import { Settlement } from './settlement';
import { Payload } from './payload';
import { Trade } from './trade';
import { TradingAccount } from './tradingAccount';

const co = Bluebird.coroutine;

interface CreateSettlementParams {
  requesterAccountId: string;
  payload: Payload;
  signature: string;
  trades: Trade[];
}

interface GetOptions {
  id: string;
  accountId: string;
}

export class Settlements {
  private bitgo: BitGo;
  private enterpriseId: string;
  private account?: TradingAccount;

  constructor(bitgo: BitGo, enterpriseId: string, account?: TradingAccount) {
    this.bitgo = bitgo;
    this.enterpriseId = enterpriseId;
    this.account = account;
  }

  /**
   * Retrieves all settlements for an enterprise
   * @param callback
   */
  list(callback?: NodeCallback<Settlement[]>): Bluebird<Settlement[]> {
    const self = this;
    return co<Settlement[]>(function* list() {
      let url;
      if (self.account) {
        url = self.bitgo.microservicesUrl(
          `/api/trade/v1/enterprise/${self.enterpriseId}/account/${self.account.id}/settlements`
        );
      } else {
        url = self.bitgo.microservicesUrl(`/api/trade/v1/enterprise/${self.enterpriseId}/settlements`);
      }
      const response = yield self.bitgo.get(url).result();

      return response.settlements.map(settlement => new Settlement(settlement, self.bitgo, self.enterpriseId));
    })
      .call(this)
      .asCallback(callback);
  }

  /**
   * Retrieves a single settlement by its ID.
   * @param id ID of the settlement
   * @param accountId ID of the trading account that the affirmation belongs to
   * @param callback
   */
  get({ id, accountId }: GetOptions, callback?: NodeCallback<Settlement>): Bluebird<Settlement> {
    const self = this;
    return co<Settlement>(function* get() {
      const account = accountId || (self.account && self.account.id);
      if (!account) {
        throw new Error('accountId must be provided in parameters for an enterprise context');
      }

      const url = self.bitgo.microservicesUrl(
        `/api/trade/v1/enterprise/${self.enterpriseId}/account/${account}/settlements/${id}`
      );
      const response = yield self.bitgo.get(url).result();
      return new Settlement(response, self.bitgo, self.enterpriseId);
    })
      .call(this)
      .asCallback(callback);
  }

  /**
   * Submits a new settlement for a set of trades.
   * NOTE: This function must be called as tradingAccount.settlements().create(), enterprise.settlements().create() is not a valid call.
   * @param params
   * @param params.requesterAccountId trading account ID that is creating this settlement
   * @param params.payload payload authorizing the movement of funds for the included trades
   * @param params.signature hex-encoded signature of the payload
   * @param params.trades list of trades to settle as part of this settlement
   * @param callback
   */
  create(params: CreateSettlementParams, callback?: NodeCallback<Settlement>): Bluebird<Settlement> {
    const self = this;
    return co<Settlement>(function* create() {
      if (!self.account) {
        throw new Error(
          'Must select a trading account before creating a settlement. Try tradingAccount.settlements().create()'
        );
      }

      // payload must be stringified before being passed to API
      const body = Object.assign({}, params as any);
      body.payload = JSON.stringify(body.payload);

      const url = self.bitgo.microservicesUrl(
        `/api/trade/v1/enterprise/${self.enterpriseId}/account/${self.account.id}/settlements`
      );
      const response = yield self.bitgo
        .post(url)
        .send(body)
        .result();

      return new Settlement(response, self.bitgo, self.enterpriseId);
    })
      .call(this)
      .asCallback(callback);
  }
}
