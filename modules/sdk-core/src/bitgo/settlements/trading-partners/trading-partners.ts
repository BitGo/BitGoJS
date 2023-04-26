import { BitGoBase } from '../../bitgoBase';
import {
  CreateTradingPartnerRequest,
  CreateTradingPartnerResponse,
  ListTradingPartnersByAccountRequest,
  ListTradingPartnersByAccountResponse,
  ListTradingPartnersByEnterpriseRequest,
  ListTradingPartnersByEnterpriseResponse,
  ISettlementTradingPartners,
} from './types';

export class SettlementTradingPartners implements ISettlementTradingPartners {
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
   * Link a trading partner to an enterprise wallet.
   * @param {Object} params
   * @param {string} params.accountId Trading wallet id
   * @param {string} params.referralCode 4 digit string
   * @returns {Promise<CreateTradingPartnerResponse>}
   */
  public add({ accountId, ...params }: CreateTradingPartnerRequest): Promise<CreateTradingPartnerResponse> {
    return this._bitgo
      .post(`${this._url}/enterprise/${this._enterpriseId}/account/${accountId || this._accountId}/trading-partner`)
      .send(params)
      .result();
  }

  /**
   * Get a list of trading partners by enterprise.
   * @param {Object} params
   * @param {('accepted'|'rejected'|'canceled')} [params.status]
   * @returns {Promise<ListTradingPartnersByEnterpriseResponse>}
   */
  public list(params: ListTradingPartnersByEnterpriseRequest): Promise<ListTradingPartnersByEnterpriseResponse> {
    return this._bitgo.get(`${this._url}/enterprise/${this._enterpriseId}/trading-partners`).query(params).result();
  }

  /**
   * Get a list of trading partners by an enterprise's account.
   * @param {Object} params
   * @param {string} [params.accountId] Trading wallet id
   * @param {('accepted'|'rejected'|'canceled')} [params.status]
   * @returns {Promise<ListTradingPartnersByAccountResponse>}
   */
  public listByAccount({
    accountId,
    ...params
  }: ListTradingPartnersByAccountRequest): Promise<ListTradingPartnersByAccountResponse> {
    return this._bitgo
      .get(`${this._url}/enterprise/${this._enterpriseId}/account/${accountId || this._accountId}/trading-partners`)
      .query(params)
      .result();
  }
}
