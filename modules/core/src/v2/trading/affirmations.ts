/**
 * @prettier
 */
import * as Bluebird from 'bluebird';

import { NodeCallback } from '../types';
import { Affirmation, AffirmationStatus } from './affirmation';
import { TradingAccount } from './tradingAccount';

const co = Bluebird.coroutine;

interface GetAffirmationParameters {
  id: string;
  accountId?: string;
}

export class Affirmations {
  private bitgo;
  private enterpriseId: string;
  private account?: TradingAccount;

  constructor(bitgo, enterpriseId: string, account?: TradingAccount) {
    this.bitgo = bitgo;
    this.enterpriseId = enterpriseId;
    this.account = account;
  }

  /**
   * Lists all affirmations for an enterprise
   * @param status optional status to filter affirmations by
   * @param callback
   */
  list(status?: AffirmationStatus, callback?: NodeCallback<Affirmation[]>): Bluebird<Affirmation[]> {
    return co(function* list() {
      let url;
      if (this.account) {
        url = this.bitgo.microservicesUrl(
          `/api/trade/v1/enterprise/${this.enterpriseId}/account/${this.account.id}/affirmations`
        );
      } else {
        url = this.bitgo.microservicesUrl(`/api/trade/v1/enterprise/${this.enterpriseId}/affirmations`);
      }
      if (status) {
        url = `${url}?status=${status}`;
      }

      const response = yield this.bitgo.get(url).result();

      return response.affirmations.map(affirmation => new Affirmation(affirmation, this.bitgo, this.enterpriseId));
    })
      .call(this)
      .asCallback(callback);
  }

  /**
   * Retrieves a single affirmation by its ID
   * @param id ID of the affirmation to retrieve
   * @param accountId ID of the trading account that the affirmation belongs to
   * @param callback
   */
  get({ id, accountId }: GetAffirmationParameters, callback?: NodeCallback<Affirmation>): Bluebird<Affirmation> {
    return co(function* get() {
      if (!this.account && !accountId) {
        throw new Error('accountId must be provided in parameters for an enterprise context');
      }

      const url = this.bitgo.microservicesUrl(
        `/api/trade/v1/enterprise/${this.enterpriseId}/account/${accountId || this.account.id}/affirmations/${id}`
      );
      const response = yield this.bitgo.get(url).result();

      return new Affirmation(response, this.bitgo, this.enterpriseId);
    })
      .call(this)
      .asCallback(callback);
  }
}
