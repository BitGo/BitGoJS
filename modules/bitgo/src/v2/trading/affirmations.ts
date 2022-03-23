/**
 * @prettier
 */

import { BitGo } from '../../bitgo';
import { Affirmation, AffirmationStatus } from './affirmation';
import { TradingAccount } from './tradingAccount';

export interface GetAffirmationParameters {
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
   */
  async list(status?: AffirmationStatus): Promise<Affirmation[]> {
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

    const response = (await this.bitgo.get(url).result()) as any;

    return response.affirmations.map((affirmation) => new Affirmation(affirmation, this.bitgo, this.enterpriseId));
  }

  /**
   * Retrieves a single affirmation by its ID
   * @param id ID of the affirmation to retrieve
   * @param accountId ID of the trading account that the affirmation belongs to
   */
  async get({ id, accountId }: GetAffirmationParameters): Promise<Affirmation> {
    const account = (this.account && this.account.id) || accountId;
    if (!account) {
      throw new Error('accountId must be provided in parameters for an enterprise context');
    }

    const url = this.bitgo.microservicesUrl(
      `/api/trade/v1/enterprise/${this.enterpriseId}/account/${account}/affirmations/${id}`
    );
    const response = await this.bitgo.get(url).result();
    return new Affirmation(response, this.bitgo, this.enterpriseId);
  }
}
