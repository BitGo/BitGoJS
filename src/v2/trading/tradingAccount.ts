import * as Bluebird from 'bluebird';
import * as crypto from 'crypto';

const co = Bluebird.coroutine;

export class TradingAccount {
  public wallet;

  constructor(wallet) {
    this.wallet = wallet;
  }

  buildPayload(params: BuildPayloadParameters): Payload {
    return {
      walletId: this.wallet.id(),
      currency: params.currency,
      amount: params.amount.toString(),
      nonceHold: crypto.randomBytes(16).toString('base64'),
      nonceSettle: crypto.randomBytes(16).toString('base64'),
      otherParties: params.otherParties
    };
  }

  signPayload(params: SignPayloadParameters, callback?): Bluebird<string> {
    return co(function *signPayload() {
      const key = yield this.wallet.baseCoin.keychains().get({ id: this.wallet.keyIds()[0] });
      const prv = this.wallet.bitgo.decrypt({ input: key.encryptedPrv, password: params.walletPassphrase });
      const payload = JSON.stringify(params.payload);

      return this.wallet.baseCoin.signMessage({ prv }, payload).toString('hex');
    }).call(this).asCallback(callback);
  }

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

interface Payload {
  walletId: string;
  currency: string;
  amount: string;
  nonceHold: string;
  nonceSettle: string;
  otherParties: string[];
}

interface BuildPayloadParameters {
  currency: string;
  amount: bigint | string;
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
