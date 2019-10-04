/**
 * @prettier
 * @hidden
 */

/**
 */
import * as Bluebird from 'bluebird';
import { BitGo } from '../../bitgo';

import { NodeCallback } from '../types';
import { TradingAccount } from './tradingAccount';

const co = Bluebird.coroutine;

export enum TradingPartnerStatus {
  ACCEPTED = 'accepted',
}

export class TradingPartner {
  private bitgo: BitGo;
  private enterpriseId: string;
  private currentAccount: TradingAccount; // account of the user using the SDK, needed to construct balance check URL

  public name: string;
  public accountId: string;
  public status: TradingPartnerStatus;

  constructor(tradingPartnerData, bitgo: BitGo, enterpriseId: string, currentAccount: TradingAccount) {
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
    const self = this;
    return co<boolean>(function* checkBalance() {
      const url = self.bitgo.microservicesUrl(
        `/api/trade/v1/enterprise/${self.enterpriseId}/account/${self.currentAccount.id}/tradingpartners/${self.accountId}/balance`
      );

      const response = yield self.bitgo
        .get(url)
        .query({ currency, amount })
        .result();

      return response.check;
    })
      .call(this)
      .asCallback(callback);
  }
}
