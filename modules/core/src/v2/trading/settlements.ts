/**
 * @prettier
 */
import * as Bluebird from 'bluebird';

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

export class Settlements {
  private bitgo;
  private enterpriseId: string;
  private account?: TradingAccount;

  constructor(bitgo, enterpriseId: string, account?: TradingAccount) {
    this.bitgo = bitgo;
    this.enterpriseId = enterpriseId;
    this.account = account;
  }

  /**
   * Retrieves all settlements for an enterprise
   * @param callback
   */
  list(callback?: NodeCallback<Settlement[]>): Bluebird<Settlement[]> {
    return co(function* list() {
      let url;
      if (this.account) {
        url = this.bitgo.microservicesUrl(
          `/api/trade/v1/enterprise/${this.enterpriseId}/account/${this.account.id}/settlements`
        );
      } else {
        url = this.bitgo.microservicesUrl(`/api/trade/v1/enterprise/${this.enterpriseId}/settlements`);
      }
      const response = yield this.bitgo.get(url).result();

      return response.settlements.map(settlement => new Settlement(settlement, this.bitgo, this.enterpriseId));
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
  get({ id, accountId }, callback?: NodeCallback<Settlement>): Bluebird<Settlement> {
    return co(function* get() {
      if (!accountId && !this.account) {
        throw new Error('accountId must be provided in parameters for an enterprise context');
      }

      const url = this.bitgo.microservicesUrl(
        `/api/trade/v1/enterprise/${this.enterpriseId}/account/${accountId || this.account.id}/settlements/${id}`
      );
      const response = yield this.bitgo.get(url).result();

      return new Settlement(response, this.bitgo, this.enterpriseId);
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
    return co(function* create() {
      if (!this.account) {
        throw new Error(
          'Must select a trading account before creating a settlement. Try tradingAccount.settlements().create()'
        );
      }

      // payload must be stringified before being passed to API
      const body = Object.assign({}, params as any);
      body.payload = JSON.stringify(body.payload);

      const url = this.bitgo.microservicesUrl(
        `/api/trade/v1/enterprise/${this.enterpriseId}/account/${this.account.id}/settlements`
      );
      const response = yield this.bitgo
        .post(url)
        .send(body)
        .result();

      return new Settlement(response, this.bitgo, this.enterpriseId);
    })
      .call(this)
      .asCallback(callback);
  }
}
