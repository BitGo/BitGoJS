/**
 * @prettier
 * @hidden
 */

/**
 */
import { BigNumber } from 'bignumber.js';
import * as Bluebird from 'bluebird';
import { BitGo } from '../../bitgo';

import { NodeCallback } from '../types';
import { Wallet } from '../wallet';
import { Payload } from './payload';
import { TradingPartners } from './tradingPartners';
import { Affirmations } from './affirmations';
import { Settlements } from './settlements';

const co = Bluebird.coroutine;

const TRADE_PAYLOAD_VERSION = '1.1.1';

interface BuildPayloadParameters {
  currency: string;
  amount: string;
  otherParties: { accountId: string; currency: string; amount: string }[];
}

interface SignPayloadParameters {
  payload: Payload;
  walletPassphrase: string;
}

interface SettlementFees {
  feeRate: string;
  feeAmount: string;
  feeCurrency: string;
}

interface CalculateSettlementFeesParams {
  counterpartyAccountId: string;
  sendCurrency: string;
  sendAmount: string;
  receiveCurrency: string;
  receiveAmount: string;
}

export class TradingAccount {
  private readonly bitgo: BitGo;
  private readonly enterpriseId: string;

  public wallet: Wallet;

  constructor(enterpriseId: string, wallet: Wallet, bitgo: BitGo) {
    this.enterpriseId = enterpriseId;
    this.wallet = wallet;
    this.bitgo = bitgo;
  }

  get id() {
    return this.wallet.id();
  }

  /**
   * Builds a payload authorizing a trade from this trading account. The currency and amount must be specified, as well as a list
   * of trade counterparties.
   * @param params
   * @param params.currency the currency this account will be sending as part of the trade
   * @param params.amount the amount of currency (in base units, such as cents, satoshis, or wei)
   * @param params.otherParties array of counterparties and reciprocal funds authorized to receive funds as part of this trade
   * @param callback
   * @returns unsigned trade payload for the given parameters. This object should be stringified with JSON.stringify() before being submitted
   */
  buildPayload(params: BuildPayloadParameters, callback?: NodeCallback<Payload>): Bluebird<Payload> {
    return co<Payload>(function* buildTradePayload() {
      const url = this.bitgo.microservicesUrl(
        `/api/trade/v1/enterprise/${this.enterpriseId}/account/${this.id}/payload`
      );

      const body = {
        version: TRADE_PAYLOAD_VERSION,
        currency: params.currency,
        amount: params.amount,
        otherParties: params.otherParties,
      };

      const response = yield this.bitgo
        .post(url)
        .send(body)
        .result();

      if (!this.verifyPayload(params, response.payload)) {
        throw new Error(
          'Unable to verify trade payload. You may need to update the BitGo SDK, or the payload may have been tampered with.'
        );
      }

      return JSON.parse(response.payload) as Payload;
    })
      .call(this)
      .asCallback(callback);
  }

  /**
   * Verifies that a payload received from BitGo sufficiently matches the expected parameters. This is used to prevent
   * man-in-the-middle attacks which could maliciously alter the contents of a payload.
   * @param params parameters used to build the payload
   * @param payload payload received from the BitGo API
   * @returns true if the payload's sensitive fields match, false if the payload may have been tampered with
   */
  verifyPayload(params: BuildPayloadParameters, payload: string): boolean {
    const payloadObj = JSON.parse(payload);
    const paramsCopy = JSON.parse(JSON.stringify(params)); // needs to be a deep copy

    // Verifies that for each party in the payload, we requested a matching party, only checking sensitive fields
    let partiesMatch = true;
    for (const party of payloadObj.otherParties) {
      const matchingExpectedParty = paramsCopy.otherParties.findIndex(
        expectedParty =>
          party.accountId === expectedParty.accountId &&
          party.currency === expectedParty.currency &&
          party.amount === expectedParty.amount
      );

      if (matchingExpectedParty === -1) {
        partiesMatch = false;
        break;
      }

      // delete so we ensure no duplicates
      paramsCopy.otherParties.splice(matchingExpectedParty, 1);
    }

    // the amount field will change if fees are present, but subtotal should always equal the requested send amount
    let expectedAmount: string = params.amount;
    if (payloadObj.fees) {
      const totalFees = payloadObj.fees.reduce(
        (fees: BigNumber, feeObj) => fees.plus(feeObj.feeAmount),
        new BigNumber(0)
      );
      expectedAmount = new BigNumber(payloadObj.subtotal).plus(totalFees).toString();
    }

    return (
      payloadObj.accountId === this.id &&
      payloadObj.currency === params.currency &&
      payloadObj.subtotal === params.amount &&
      payloadObj.amount === expectedAmount &&
      payloadObj.otherParties.length === params.otherParties.length &&
      partiesMatch
    );
  }

  /**
   * Calculates the necessary fees to complete a settlement between two parties, based on the amounts and currencies of the settlement.
   * @param params
   * @param params.counterpartyAccountId Account ID of the counterparty of the settlement
   * @param params.sendCurrency Currency to be sent as part of the settlement
   * @param params.sendAmount Amount of currency (in base units such as cents, satoshis, or wei) to be sent
   * @param params.receiveCurrency Currency to be received as part of the settlement
   * @param params.receiveAmount Amount of currency (in base units such as cents, satoshis, or wei) to be received
   * @param callback
   * @returns Fee rate, currency, and total amount of the described settlement
   */
  calculateSettlementFees(
    params: CalculateSettlementFeesParams,
    callback?: NodeCallback<SettlementFees>
  ): Bluebird<SettlementFees> {
    const url = this.bitgo.microservicesUrl(
      `/api/trade/v1/enterprise/${this.enterpriseId}/account/${this.id}/calculatefees`
    );

    return this.bitgo
      .post(url)
      .send(params)
      .result()
      .asCallback(callback);
  }

  /**
   * Signs a pre-built trade payload with the user key on this trading account
   * @param params
   * @param params.payload trade payload object from TradingAccount::buildPayload()
   * @param params.walletPassphrase passphrase on this trading account, used to unlock the account user key
   * @param callback
   * @returns hex-encoded signature of the payload
   */
  signPayload(params: SignPayloadParameters, callback?): Bluebird<string> {
    const self = this;
    return co<string>(function* signPayload() {
      const key = yield self.wallet.baseCoin.keychains().get({ id: self.wallet.keyIds()[0] });
      const prv = self.wallet.bitgo.decrypt({
        input: key.encryptedPrv,
        password: params.walletPassphrase,
      });
      const payload = JSON.stringify(params.payload);
      return self.wallet.baseCoin.signMessage({ prv }, payload).toString('hex');
    })
      .call(this)
      .asCallback(callback);
  }

  affirmations(): Affirmations {
    return new Affirmations(this.bitgo, this.enterpriseId, this);
  }

  settlements(): Settlements {
    return new Settlements(this.bitgo, this.enterpriseId, this);
  }

  partners(): TradingPartners {
    return new TradingPartners(this.bitgo, this.enterpriseId, this);
  }
}
