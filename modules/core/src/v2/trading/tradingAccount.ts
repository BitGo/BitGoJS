/**
 * @prettier
 */
import * as Bluebird from 'bluebird';
import * as crypto from 'crypto';
import { Payload } from './payload';

const co = Bluebird.coroutine;

export class TradingAccount {
  public wallet;

  constructor(wallet) {
    this.wallet = wallet;
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
   * @param params.otherParties array of trading account IDs authorized to receive funds as part of this trade
   * @param callback
   * @returns unsigned trade payload for the given parameters. This object should be stringified with JSON.stringify() before being submitted
   */
  buildPayload(params: BuildPayloadParameters): Payload {
    return {
      walletId: this.wallet.id(),
      currency: params.currency,
      amount: params.amount,
      nonceHold: crypto.randomBytes(16).toString('base64'),
      nonceSettle: crypto.randomBytes(16).toString('base64'),
      otherParties: params.otherParties
    };
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
    return co(function *signPayload() {
      const key = yield this.wallet.baseCoin.keychains().get({ id: this.wallet.keyIds()[0] });
      const prv = this.wallet.bitgo.decrypt({ input: key.encryptedPrv, password: params.walletPassphrase });
      const payload = JSON.stringify(params.payload);

      return this.wallet.baseCoin.signMessage({ prv }, payload).toString('hex');
    }).call(this).asCallback(callback);
  }

  /**
   * Builds and signs a payload authorizing a trade from this trading account. The currency and amount must be specified, as well
   * as a list of trade counterparties. Requires the wallet keychain to unlock the trading account's user key. Both the payload
   * and signature are returned.
   * @param params
   * @param params.currency the currency this wallet will be sending as part of the trade
   * @param params.amount the amount of currency (in base units, such as cents, satoshis, or wei) authorized to be spent as part of the trade
   * @param params.otherParties array of trading account IDs authorized to receive funds as part of the trade
   * @param params.walletPassphrase the wallet password, for decrypting the private key for signing
   * @param callback
   * @returns the trade payload and hex-encoded signature of the payload
   */
  buildAndSignPayload(params: BuildAndSignPayloadParameters, callback?): Bluebird<SignedPayload> {
    return co(function *buildAndSignPayload() {
      const buildParams = Object.assign({}, params);
      delete buildParams.walletPassphrase;
      const payload = this.buildPayload(buildParams);

      const signature = yield this.signPayload({
        payload: payload,
        walletPassphrase: params.walletPassphrase
      });

      return { payload, signature };
    }).call(this).asCallback(callback);
  }
}

interface BuildPayloadParameters {
  currency: string;
  amount: string;
  otherParties: string[];
}

interface SignPayloadParameters {
  payload: Payload;
  walletPassphrase: string;
}

interface BuildAndSignPayloadParameters extends BuildPayloadParameters {
  walletPassphrase: string;
}

interface SignedPayload {
  payload: Payload;
  signature: string;
}
