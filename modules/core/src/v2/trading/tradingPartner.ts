/**
 * @prettier
 */
import * as Bluebird from 'bluebird';

import { NodeCallback } from '../types';
import { TradingAccount } from './tradingAccount';

const co = Bluebird.coroutine;

export enum TradingPartnerStatus {
  ACCEPTED = 'accepted',
}

export class TradingPartner {
  private bitgo;
  private enterpriseId: string;
  private currentAccount: TradingAccount; // account of the user using the SDK, needed to construct balance check URL

  public name: string;
  public accountId: string;
  public status: TradingPartnerStatus;

  constructor(tradingPartnerData, bitgo, enterpriseId: string, currentAccount: TradingAccount) {
    this.name = tradingPartnerData.name;
    this.accountId = tradingPartnerData.accountId;
    this.status = tradingPartnerData.status;

    this.bitgo = bitgo;
    this.enterpriseId = enterpriseId;
    this.currentAccount = currentAccount;
  }

  /**
   * Check if a trading partner has enough funds to cover the cost of a trade.
   * @param currency the currency to check
   * @param amount the amount of currency to check, represented in base units (such as cents, satoshi, or wei)
   * @param callback
   */
  checkBalance(currency: string, amount: string, callback?: NodeCallback<boolean>): Bluebird<boolean> {
    return co(function* checkBalance() {
      const url = this.bitgo.microservicesUrl(
        `/api/trade/v1/enterprise/${this.enterpriseId}/account/${this.currentAccount.id}/tradingpartners/${this.accountId}/balance`
      );

      const response = yield this.bitgo
        .get(url)
        .query({ currency, amount })
        .result();

      return response.check;
    })
      .call(this)
      .asCallback(callback);
  }
}
