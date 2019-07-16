/**
 * @prettier
 */
import { Settlement } from './settlement';
import * as Bluebird from 'bluebird';
import { Payload } from './payload';
import { Trade } from './trade';

const co = Bluebird.coroutine;

export class Settlements {
  private bitgo: any;
  private enterprise: any;
  constructor(bitgo: any, enterprise: any) {
    this.bitgo = bitgo;
    this.enterprise = enterprise;
  }

  /**
   * Retrieves all settlements for an enterprise
   * @param callback
   */
  list(callback?): Bluebird<Settlement[]> {
    return co(function* list() {
      const url = this.bitgo.microservicesUrl(`/api/trade/v1/enterprise/${this.enterprise.id}/settlements`);
      const response = yield this.bitgo.get(url).result();

      return response.settlements.map(settlement => new Settlement(settlement, this.bitgo));
    })
      .call(this)
      .asCallback(callback);
  }

  /**
   * Retrieves a single settlement by its ID.
   * @param id ID of the settlement
   * @param callback
   */
  get({ id }, callback?): Bluebird<Settlement> {
    return co(function* get() {
      const url = this.bitgo.microservicesUrl(`/api/trade/v1/enterprise/${this.enterprise.id}/settlements/${id}`);
      const response = yield this.bitgo.get(url).result();

      return new Settlement(response, this.bitgo);
    })
      .call(this)
      .asCallback(callback);
  }

  /**
   * Submits a new settlement for a set of trades
   * @param params
   * @param params.requesterAccountId trading account ID that is creating this settlement
   * @param params.payload payload authorizing the movement of funds for the included trades
   * @param params.signature hex-encoded signature of the payload
   * @param params.trades list of trades to settle as part of this settlement
   * @param callback
   */
  create(params: CreateSettlementParams, callback?): Bluebird<Settlement> {
    return co(function* create() {
      // payload must be stringified before being passed to API
      const body = Object.assign({}, params as any);
      body.payload = JSON.stringify(body.payload);

      const url = this.bitgo.microservicesUrl(`/api/trade/v1/settlement`);
      const response = yield this.bitgo
        .post(url)
        .send(body)
        .result();

      return new Settlement(response, this.bitgo);
    })
      .call(this)
      .asCallback(callback);
  }
}

interface CreateSettlementParams {
  requesterAccountId: string;
  payload: Payload;
  signature: string;
  trades: Trade[];
}
