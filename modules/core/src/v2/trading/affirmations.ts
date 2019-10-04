/**
 * @prettier
 * @hidden
 */

/**
 */
import * as Bluebird from 'bluebird';
import { BitGo } from '../../bitgo';
import { NodeCallback } from '../types';
import { Affirmation, AffirmationStatus } from './affirmation';
import { TradingAccount } from './tradingAccount';

const co = Bluebird.coroutine;

interface GetAffirmationParameters {
  id: string;
  accountId?: string;
}

export class Affirmations {
  private bitgo: BitGo;
  private enterpriseId: string;
  private account?: TradingAccount;

  constructor(bitgo: BitGo, enterpriseId: string, account?: TradingAccount) {
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
    const self = this;
    return co<Affirmation[]>(function* list() {
      let url;
      if (self.account) {
        url = self.bitgo.microservicesUrl(
          `/api/trade/v1/enterprise/${self.enterpriseId}/account/${self.account.id}/affirmations`
        );
      } else {
        url = self.bitgo.microservicesUrl(`/api/trade/v1/enterprise/${self.enterpriseId}/affirmations`);
      }
      if (status) {
        url = `${url}?status=${status}`;
      }

      const response = yield self.bitgo.get(url).result();

      return response.affirmations.map(affirmation => new Affirmation(affirmation, self.bitgo, self.enterpriseId));
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
    const self = this;
    return co<Affirmation>(function* get() {
      const account = (self.account && self.account.id) || accountId;
      if (!account) {
        throw new Error('accountId must be provided in parameters for an enterprise context');
      }

      const url = self.bitgo.microservicesUrl(
        `/api/trade/v1/enterprise/${self.enterpriseId}/account/${account}/affirmations/${id}`
      );
      const response = yield self.bitgo.get(url).result();
      return new Affirmation(response, self.bitgo, self.enterpriseId);
    })
      .call(this)
      .asCallback(callback);
  }
}
