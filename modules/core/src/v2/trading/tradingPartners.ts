/**
 * @prettier
 */

import { BitGo } from '../../bitgo';

import { TradingAccount } from './tradingAccount';
import { TradingPartner, TradingPartnerType } from './tradingPartner';

// Side of the requester (if they should be considered the primary or the secondary)
// Only important for agency partnerships
// the primaryAccount is the agent, settling trades for the secondary account id
export enum TradingReferralRequesterSide {
  PRIMARY = 'primary', // if partnership is of type agency, primary is the agent
  SECONDARY = 'secondary',
}

export interface TradingPartnerAddByCodeParameters {
  referralCode: string;
  type: TradingPartnerType;
  requesterSide: TradingReferralRequesterSide;
}

export class TradingPartners {
  private bitgo: BitGo;

  private enterpriseId: string;
  private account: TradingAccount;

  constructor(bitgo: BitGo, enterpriseId: string, account: TradingAccount) {
    this.bitgo = bitgo;
    this.enterpriseId = enterpriseId;
    this.account = account;
  }

  /**
   * List all trading partners of your trading account. Your trading partners are the accounts you are allowed to settle with.
   */
  async list(): Promise<TradingPartner[]> {
    const url = this.bitgo.microservicesUrl(
      `/api/trade/v1/enterprise/${this.enterpriseId}/account/${this.account.id}/tradingpartners`
    );
    const response = (await this.bitgo.get(url).result()) as any;

    return response.tradingPartners.map(
      (partner) => new TradingPartner(partner, this.bitgo, this.enterpriseId, this.account)
    );
  }

  /**
   * Add trading partner given the unique referralCode provided by trading partner.
   * @param params
   * @param params.referralCode unique referral code provided by counterparty
   * @param params.type type of trading partnership
   * @param params.requesterSide side of the requester (primary or secondary) important for agency relationships
   */
  async addByCode(params: TradingPartnerAddByCodeParameters): Promise<TradingPartner> {
    const url = this.bitgo.microservicesUrl(
      `/api/trade/v1/enterprise/${this.enterpriseId}/account/${this.account.id}/tradingpartners`
    );
    return await this.bitgo.post(url).send(params).result();
  }
}
