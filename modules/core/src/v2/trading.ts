import * as Bluebird from 'bluebird';
const co = Bluebird.coroutine;

export class Trading {
  private bitgo;
  private basecoin;
  private wallet;

  constructor(bitgo, basecoin, wallet) {
    this.bitgo = bitgo;
    this.basecoin = basecoin;
    this.wallet = wallet;
  }

  /**
   * Builds a payload authorizing a trade from this trading account. The currency and amount must be specified, as well as a list
   * of trade counterparties.
   * @param params
   * @param params.currency the currency this wallet will be sending as part of the trade
   * @param params.amount the amount of currency (in base units, such as cents, satoshis, or wei) authorized to be spent as part of the trade
   * @param params.otherParties array of trading account IDs authorized to receive funds as part of the trade
   * @param callback
   * @returns unsigned trade payload for the given parameters
   */
  public buildTradePayload(params: BuildPayloadParameters, callback?): Bluebird<string> {
    return co(function *buildTradePayload() {
      const url = this.bitgo.microservicesUrl('/api/trade/v1/payload');

      const body = {
        accountId: this.wallet.id(),
        currency: params.currency,
        amount: params.amount,
        otherParties: params.otherParties
      };

      const response = yield this.bitgo.post(url).send(body).result();

      return response.payload;
    }).call(this).asCallback(callback);
  }

  /**
   * Builds and signs a payload authorizing a trade from this trading account. The currency and amount must be specified, as well
   * as a list of trade counterparties. Requires the wallet keychain or raw private key to sign the transaction. Both
   * the payload and signature are returned.
   * @param params
   * @param params.currency the currency this wallet will be sending as part of the trade
   * @param params.amount the amount of currency (in base units, such as cents, satoshis, or wei) authorized to be spent as part of the trade
   * @param params.otherParties array of trading account IDs authorized to receive funds as part of the trade
   * @param params.walletPassphrase the wallet password, for decrypting the private key for signing
   * @param callback
   * @returns {{payload: string, signature: string}}
   */
  public signTradePayload(params: SignPayloadParameters, callback?): Bluebird<SignedPayload> {
    return co(function *signTradePayload() {
      const payload = yield this.buildTradePayload(params);

      const key = yield this.basecoin.keychains().get({ id: this.wallet.keyIds()[0] });
      const prv = this.bitgo.decrypt({ input: key.encryptedPrv, password: params.walletPassphrase });

      const signature = this.basecoin.signMessage({ prv }, payload).toString('hex');

      return { payload, signature };
    }).call(this).asCallback(callback);
  }
}

export interface BuildPayloadParameters {
  currency: string;
  amount: string;
  otherParties: string[]
}

export interface SignPayloadParameters extends BuildPayloadParameters {
  walletPassphrase?: string;
}

export interface SignedPayload {
  payload: string;
  signature: string;
}
