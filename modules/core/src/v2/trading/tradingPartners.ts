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
import { TradingPartner } from './tradingPartner';

const co = Bluebird.coroutine;

interface TradingPartnerReferralParameters {
  institutionName: string;
  contactName: string;
  contactEmail: string;
  contactPhoneNumber: string;
  memo: string;
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
   * @param callback
   */
  list(callback?: NodeCallback<TradingPartner[]>): Bluebird<TradingPartner[]> {
    const self = this;
    return co<TradingPartner[]>(function* list() {
      const url = self.bitgo.microservicesUrl(
        `/api/trade/v1/enterprise/${self.enterpriseId}/account/${self.account.id}/tradingpartners`
      );
      const response = yield self.bitgo.get(url).result();

      return response.tradingPartners.map(
        partner => new TradingPartner(partner, self.bitgo, self.enterpriseId, self.account)
      );
    })
      .call(this)
      .asCallback(callback);
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
  refer(params: TradingPartnerReferralParameters, callback?: NodeCallback<{}>): Bluebird<{}> {
    const self = this;
    return co<{}>(function* refer() {
      const url = self.bitgo.microservicesUrl(
        `/api/trade/v1/enterprise/${self.enterpriseId}/account/${self.account.id}/tradingpartners/referrals`
      );
      yield self.bitgo
        .post(url)
        .send(params)
        .result();

      return {}; // TODO: return result of referral
    })
      .call(this)
      .asCallback(callback);
  }
}
