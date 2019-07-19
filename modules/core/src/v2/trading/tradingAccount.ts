/**
 * @prettier
 */
import { BigNumber } from 'bignumber.js';
import * as Bluebird from 'bluebird';

import { Payload } from './payload';
import { TradingPartners } from './tradingPartners';

const co = Bluebird.coroutine;

const TRADE_PAYLOAD_VERSION = '1.1.1';

export class TradingAccount {
  private bitgo: any;

  public wallet;

  constructor(wallet, bitgo) {
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
   * @returns unsigned trade payload for the given parameters. This object should be stringified with JSON.stringify() before being submitted
   */
  buildPayload(params: BuildPayloadParameters, callback?): Bluebird<Payload> {
    return co(function* buildTradePayload() {
      const url = this.bitgo.microservicesUrl('/api/trade/v1/payload');

      const body = {
        version: TRADE_PAYLOAD_VERSION,
        accountId: this.id,
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
   * Signs a pre-built trade payload with the user key on this trading account
   * @param params
   * @param params.payload trade payload object from TradingAccount::buildPayload()
   * @param params.walletPassphrase passphrase on this trading account, used to unlock the account user key
   * @param callback
   * @returns hex-encoded signature of the payload
   */
  signPayload(params: SignPayloadParameters, callback?): Bluebird<string> {
    return co(function* signPayload() {
      const key = yield this.wallet.baseCoin.keychains().get({ id: this.wallet.keyIds()[0] });
      const prv = this.wallet.bitgo.decrypt({ input: key.encryptedPrv, password: params.walletPassphrase });
      const payload = JSON.stringify(params.payload);

      return this.wallet.baseCoin.signMessage({ prv }, payload).toString('hex');
    })
      .call(this)
      .asCallback(callback);
  }

  partners(): TradingPartners {
    return new TradingPartners(this, this.bitgo);
  }
}

interface BuildPayloadParameters {
  currency: string;
  amount: string;
  otherParties: { accountId: string; currency: string; amount: string }[];
}

interface SignPayloadParameters {
  payload: Payload;
  walletPassphrase: string;
}
