/**
 * @prettier
 */
import { BitGoBase } from '../bitgoBase';
import { ITradingPartners, TradingAccount, TradingPartner, TradingPartnerAddByCodeParameters } from '../trading';

export class TradingPartners implements ITradingPartners {
  private bitgo: BitGoBase;

  private enterpriseId: string;
  private account: TradingAccount;

  constructor(bitgo: BitGoBase, enterpriseId: string, account: TradingAccount) {
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
