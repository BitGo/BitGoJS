import * as Bluebird from 'bluebird';

import { TradingAccount } from './tradingAccount';
import { TradingPartner } from './tradingPartner';

const co = Bluebird.coroutine;

export class TradingPartners {
  private bitgo: any;

  private account: TradingAccount;

  constructor(account: TradingAccount, bitgo: any) {
    this.account = account;
    this.bitgo = bitgo;
  }

  /**
   * List all trading partners of your trading account. Your trading partners are the accounts you are allowed to settle with.
   * @param callback
   */
  list(callback?): Bluebird<TradingPartner[]> {
    return co(function *list() {
      const url = this.bitgo.microservicesUrl(`/api/trade/v1/account/${this.account.id}/tradingPartners`);
      const response = yield this.bitgo.get(url).result();

      return response.tradingPartners.map(partner => new TradingPartner(partner, this.bitgo, this.account));
    }).call(this).asCallback(callback);
  }

  /**
   * Refer a new trading partner to join the BitGo network and become your partner.
   * @param params
   * @param params.institutionName name of the institution to invite
   * @param params.contactName full name of a member of the institution to contact
   * @param params.contactEmail email address of the contact
   * @param params.contactPhoneNumber phone number of the contact
   * @param params.memo memo to send to the trading partner when sending the invite
   * @param callback
   */
  refer(params: TradingPartnerReferralParameters, callback?): Bluebird<{}> {
    return co(function *refer() {
      const url = this.bitgo.microservicesUrl(`/api/trade/v1/account/${this.account.id}/tradingPartners/referrals`);
      yield this.bitgo.post(url).send(params).result();

      return {}; // TODO: return result of referral
    }).call(this).asCallback(callback);
  }
}

interface TradingPartnerReferralParameters {
  institutionName: string;
  contactName: string;
  contactEmail: string;
  contactPhoneNumber: string;
  memo: string;
}
