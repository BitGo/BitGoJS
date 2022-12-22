import { Request } from 'express';
// RequestTracer should be extracted into a separate npm package (along with
// the rest of the BitGoJS HTTP request machinery)
import { RequestTracer } from 'bitgo/dist/src/v2/internal/util';

class V2Token {
  /**
   * Enables tokens on a wallet
   * handleV2EnableTokens
   * @param req
   */
  async enable(req: Request) {
    const bitgo = req.bitgo;
    const coin = bitgo.coin(req.params.coin);
    const reqId = new RequestTracer();
    const wallet = await coin.wallets().get({ id: req.params.id, reqId });
    req.body.reqId = reqId;
    try {
      return wallet.sendTokenEnablements(createSendParams(req));
    } catch (err) {
      err.status = 400;
      throw err;
    }
  }
}

export default new V2Token();
