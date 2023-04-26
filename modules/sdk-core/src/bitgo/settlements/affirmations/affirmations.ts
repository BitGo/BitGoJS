import { BitGoBase } from '../../bitgoBase';
import {
  GetAffirmationRequest,
  GetAffirmationResponse,
  ListAffirmationsByAccountRequest,
  ListAffirmationsByAccountResponse,
  ListAffirmationsByEnterpriseRequest,
  ListAffirmationsByEnterpriseResponse,
  UpdateAffirmationRequest,
  UpdateAffirmationResponse,
  ISettlementAffirmations,
} from './types';

export class SettlementAffirmations implements ISettlementAffirmations {
  private readonly _bitgo: BitGoBase;
  private readonly _accountId?: string;
  private readonly _enterpriseId: string;
  private readonly _url: string;

  constructor(bitgo: BitGoBase, enterpriseId: string, accountId?: string) {
    this._bitgo = bitgo;
    this._enterpriseId = enterpriseId;
    this._url = '/api/clearing/v1';

    if (accountId) {
      this._accountId = accountId;
    }
  }

  /**
   * Get a single affirmation from a settlement.
   * @param {Object} params
   * @param {string} [params.accountId] Trading wallet id
   * @param {string} params.id Settlement id
   * @returns {Promise<GetAffirmationResponse>}
   */
  public get({ accountId, id }: GetAffirmationRequest): Promise<GetAffirmationResponse> {
    return this._bitgo
      .get(`${this._url}/enterprise/${this._enterpriseId}/account/${accountId || this._accountId}/affirmation/${id}`)
      .result();
  }

  /**
   * Get a list of affirmations by enterprise.
   * @param {Object} params
   * @param {string} [params.accountId] Trading wallet id
   * @param {string} [params.limit=25]
   * @param {string} [params.offset=0]
   * @param {('acknowledged'|'canceled'|'rejected'|'affirmed'|'pending'|'failed'|'overdue'|'expired')} [params.status]
   * @returns {Promise<ListAffirmationsByEnterpriseResponse>}
   */
  public list(params: ListAffirmationsByEnterpriseRequest): Promise<ListAffirmationsByEnterpriseResponse> {
    return this._bitgo.get(`${this._url}/enterprise/${this._enterpriseId}/affirmations`).query(params).result();
  }

  /**
   * Get a list of affirmations by an enterprise's account id.
   * @param {Object} params
   * @param {string} [params.accountId] Trading wallet id
   * @param {string} [params.limit=25]
   * @param {string} [params.offset=0]
   * @param {('acknowledged'|'canceled'|'rejected'|'affirmed'|'pending'|'failed'|'overdue'|'expired')} [params.status]
   * @returns {Promise<ListAffirmationsByAccountResponse>}
   */
  public listByAccount({
    accountId,
    ...params
  }: ListAffirmationsByAccountRequest): Promise<ListAffirmationsByAccountResponse> {
    return this._bitgo
      .get(`${this._url}/enterprise/${this._enterpriseId}/account/${accountId || this._accountId}/affirmations`)
      .query(params)
      .result();
  }

  /**
   * Update a settlement's affirmation.
   * @param {Object} params
   * @param {string} [params.accountId] Trading wallet id
   * @param {string} params.id affirmationID
   * @param {('acknowledged'|'canceled'|'rejected'|'affirmed'|'pending'|'failed'|'overdue'|'expired')} params.status
   * @returns {Promise<UpdateAffirmationResponse>}
   */
  public update({ accountId, id }: UpdateAffirmationRequest): Promise<UpdateAffirmationResponse> {
    return this._bitgo
      .put(`${this._url}/enterprise/${this._enterpriseId}/account/${accountId || this._accountId}/affirmation/${id}`)
      .result();
  }
}
