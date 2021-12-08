/**
 * @prettier
 */

import { BitGo } from '../../bitgo';

import { TradingAccount } from './tradingAccount';

export enum TradingPartnerStatus {
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  CANCELED = 'canceled',
  PENDING = 'pending',
}

// Type of partnership used for settlements
export enum TradingPartnerType {
  DIRECT = 'direct', // direct settlement between requester and counterparty
  AGENCY = 'agency', // agent settlement between two counterparties of the agent
}

export class TradingPartner {
  private bitgo: BitGo;
  private enterpriseId: string;
  private currentAccount: TradingAccount; // account of the user using the SDK, needed to construct balance check URL

  public id: string;
  public primaryEnterpriseName: string;
  public primaryAccountId: string;
  public secondaryEnterpriseName: string;
  public secondaryAccountId: string;
  public requesterAccountId: string;
  public status: TradingPartnerStatus;
  public type: TradingPartnerType;

  constructor(tradingPartnerData: any, bitgo: BitGo, enterpriseId: string, currentAccount: TradingAccount) {
    this.id = tradingPartnerData.id;
    this.primaryEnterpriseName = tradingPartnerData.primaryEnterpriseName;
    this.primaryAccountId = tradingPartnerData.primaryAccountId;
    this.secondaryEnterpriseName = tradingPartnerData.secondaryEnterpriseName;
    this.secondaryAccountId = tradingPartnerData.secondaryAccountId;
    this.requesterAccountId = tradingPartnerData.requesterAccountId;
    this.status = tradingPartnerData.status;
    this.type = tradingPartnerData.type;

    this.bitgo = bitgo;
    this.enterpriseId = enterpriseId;
    this.currentAccount = currentAccount;
  }

  /**
   * Check if a trading partner has enough funds to cover the cost of a trade.
   * @param currency the currency to check
   * @param amount the amount of currency to check, represented in base units (such as cents, satoshi, or wei)
   */
  async checkBalance(currency: string, amount: string): Promise<boolean> {
    const partnerAccountId =
      this.primaryAccountId === this.currentAccount.id ? this.secondaryAccountId : this.primaryAccountId;
    const url = this.bitgo.microservicesUrl(
      `/api/trade/v1/enterprise/${this.enterpriseId}/account/${this.currentAccount.id}/tradingpartners/${partnerAccountId}/balance`
    );

    const response = (await this.bitgo.get(url).query({ currency, amount }).result()) as any;

    return response.check;
  }
}
