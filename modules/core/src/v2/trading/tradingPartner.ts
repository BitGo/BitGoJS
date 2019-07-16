/**
 * @prettier
 */
import * as Bluebird from 'bluebird';

import { TradingAccount } from './tradingAccount';

export class TradingPartner {
  private bitgo: any;
  private currentAccount: TradingAccount; // account of the user using the SDK, needed to construct balance check URL

  public name: string;
  public accountId: string;
  public status: TradingPartnerStatus;

  constructor(tradingPartnerData, bitgo, currentAccount: TradingAccount) {
    this.name = tradingPartnerData.name;
    this.accountId = tradingPartnerData.accountId;
    this.status = tradingPartnerData.status;

    this.bitgo = bitgo;
    this.currentAccount = currentAccount;
  }

  /**
   * Check if a trading partner has enough funds to cover the cost of a trade.
   * @param currency the currency to check
   * @param amount the amount of currency to check, represented in base units (such as cents, satoshi, or wei)
   * @param callback
   */
  checkBalance(currency: string, amount: string, callback?): Bluebird<boolean> {
    const url = this.bitgo.microservicesUrl(
      `/api/trade/v1/account/${this.currentAccount.id}/tradingPartners/${this.accountId}/balance`
    );

    return this.bitgo
      .get(url)
      .query({ currency, amount })
      .result()
      .nodeify(callback);
  }
}

export enum TradingPartnerStatus {
  ACCEPTED = 'accepted',
}
