/**
 * @prettier
 */
import * as Bluebird from 'bluebird';

import { Affirmation, AffirmationStatus } from './affirmation';

const co = Bluebird.coroutine;

export class Affirmations {
  private bitgo: any;
  private enterprise: any;

  constructor(bitgo: any, enterprise: any) {
    this.bitgo = bitgo;
    this.enterprise = enterprise;
  }

  /**
   * Lists all affirmations for an enterprise
   * @param status optional status to filter affirmations by
   * @param callback
   */
  list(status?: AffirmationStatus, callback?): Bluebird<Affirmation[]> {
    return co(function* list() {
      let url = this.bitgo.microservicesUrl(`/api/trade/v1/enterprise/${this.enterprise.id}/affirmations`);
      if (status) {
        url = `${url}?status=${status}`;
      }

      const response = yield this.bitgo.get(url).result();

      return response.affirmations.map(affirmation => new Affirmation(affirmation, this.bitgo));
    })
      .call(this)
      .asCallback(callback);
  }

  /**
   * Retrieves a single affirmation by its ID
   * @param id ID of the affirmation to retrieve
   * @param callback
   */
  get({ id }, callback): Bluebird<Affirmation> {
    return co(function* get() {
      const url = this.bitgo.microservicesUrl(`/api/trade/v1/enterprise/${this.enterprise.id}/affirmations/${id}`);
      const response = yield this.bitgo.get(url).result();

      return new Affirmation(response, this.bitgo);
    })
      .call(this)
      .asCallback(callback);
  }
}
