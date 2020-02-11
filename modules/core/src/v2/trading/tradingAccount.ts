/**
 * @prettier
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

const TRADE_PAYLOAD_VERSION = '1.2.0';

export interface BuildPayloadParameters {
  amounts: BuildPayloadAmounts[];
}

export interface BuildPayloadAmounts {
  accountId: string;
  sendAmount: string;
  sendCurrency: string;
  receiveAmount: string;
  receiveCurrency: string;
}

export interface SignPayloadParameters {
  payload: Payload;
  walletPassphrase: string;
}

export interface SettlementFees {
  feeRate: string;
  feeAmount: string;
  feeCurrency: string;
}

export interface CalculateSettlementFeesParams {
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
   * Builds a payload authorizing trade from this trading account.
   * @param params
   * @param params.amounts[] array of amounts that will be traded as part of the settlement
   * @param params.amounts[].accountId the accountId corresponding with the sending and receiving amounts for the settlement
   * @param params.amounts[].sendAmount amount of currency sent by trading account of given accountId
   * @param params.amounts[].sendCurrency currency of amount sent by trading account of given accountId
   * @param params.amounts[].receiveAmount amount of currency received by trading account of given accountId
   * @param params.amounts[].receiveCurrency currency of amount received by trading account of given accountId
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
        amounts: params.amounts,
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
    let validAmounts = 0;
    for (const amount of payloadObj.amounts) {
      const matchingExpectedParty = paramsCopy.amounts.findIndex(
        expectedAmount =>
          amount.accountId === expectedAmount.accountId &&
          amount.sendCurrency === expectedAmount.sendCurrency &&
          amount.sendSubtotal === expectedAmount.sendAmount &&
          amount.receiveAmount === expectedAmount.receiveAmount &&
          amount.receiveCurrency === expectedAmount.receiveCurrency
      );

      if (matchingExpectedParty === -1) {
        // matchingExpectedParty not found to the payloadObject
        // payload is not valid
        break;
      }

      if (amount.fees && amount.fees.length > 0) {
        let feeTotal = new BigNumber(0);
        for (const fee of amount.fees) {
          feeTotal = feeTotal.plus(new BigNumber(fee.feeAmount));
        }

        const expectedTotalAmount = new BigNumber(paramsCopy.amounts[matchingExpectedParty].sendAmount).plus(feeTotal);
        if (expectedTotalAmount.toString() !== amount.sendAmount) {
          // expected total does not match the sendAmount of the payload
          // payload is not valid
          break;
        }
      }

      // matching party found, and fee found
      validAmounts = validAmounts + 1;
      // delete so we ensure no duplicates
      paramsCopy.amounts.splice(matchingExpectedParty, 1);
    }

    return (
      payloadObj.accountId === this.id &&
      payloadObj.amounts.length === params.amounts.length &&
      validAmounts === payloadObj.amounts.length
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
      return (yield self.wallet.baseCoin.signMessage({ prv }, payload)).toString('hex');
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
