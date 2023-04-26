import { BitGoBase } from '../../bitgoBase';
import {
  GetAccountSettingsRequest,
  GetAccountSettingsResponse,
  ISettlementAccount,
  UpdateAccountSettingsRequest,
  UpdateAccountSettingsResponse,
} from './types';

export class SettlementAccount implements ISettlementAccount {
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
   * Get a clearing settlement settings for a wallet.
   * @param {Object}  params
   * @param {string} [params.accountId] Trading wallet id
   * @returns {Promise<GetAccountSettingsResponse>}
   */
  public get({ accountId }: GetAccountSettingsRequest): Promise<GetAccountSettingsResponse> {
    return this._bitgo
      .get(`${this._url}/enterprise/${this._enterpriseId}/account-settings/${accountId || this._accountId}`)
      .result();
  }

  /**
   * Update clearing settlement settings for a wallet.
   * @param {Object}  params
   * @param {string} [params.accountId] Trading wallet id
   * @param {number} params.affirmationExpirationTime Time (ms) to expire a settlement upon creation
   * @returns {Promise<UpdateAccountSettingsResponse>}
   */
  public update({ accountId, ...params }: UpdateAccountSettingsRequest): Promise<UpdateAccountSettingsResponse> {
    return this._bitgo
      .put(`${this._url}/enterprise/${this._enterpriseId}/account-settings/${accountId || this._accountId}`)
      .send(params)
      .result();
  }
}
