import { Request } from 'express';
// RequestTracer should be extracted into a separate npm package (along with
// the rest of the BitGoJS HTTP request machinery)
import { RequestTracer } from 'bitgo/dist/src/v2/internal/util';

class V2Transaction {
  /**
   * Sign wallet transaction
   * handleV2SignTxWallet
   */
  async signWalletTx(req: Request) {
    const bitgo = req.bitgo;
    const coin = bitgo.coin(req.params.coin);
    const wallet = await coin.wallets().get({ id: req.params.id });
    try {
      return await wallet.signTransaction(createSendParams(req));
    } catch (error) {
      console.log('error while signing wallet transaction ', error);
      throw error;
    }
  }

  /**
   * Sign transaction
   * handleV2SignTx
   * @param req
   */
  async sign(req: Request) {
    const bitgo = req.bitgo;
    const coin = bitgo.coin(req.params.coin);
    try {
      return await coin.signTransaction(req.body);
    } catch (error) {
      console.log('error while signing the transaction ', error);
      throw error;
    }
  }

  /**
   * Recover wallet token
   * handleV2RecoverToken
   * @param req
   */
  async recoverToken(req: Request) {
    const bitgo = req.bitgo;
    const coin = bitgo.coin(req.params.coin);

    const wallet = await coin.wallets().get({ id: req.params.id });
    return wallet.recoverToken(req.body);
  }

  /**
   * CPFP accelerate transaction creation
   * handleV2AccelerateTransaction
   * @param req
   */
  async accelerate(req: Request) {
    const bitgo = req.bitgo;
    const coin = bitgo.coin(req.params.coin);
    const wallet = await coin.wallets().get({ id: req.params.id });
    return wallet.accelerateTransaction(createSendParams(req));
  }

  /**
   * Send one
   * handleV2SendOne
   * @param req
   */
  async sendOne(req: Request) {
    const bitgo = req.bitgo;
    const coin = bitgo.coin(req.params.coin);
    const reqId = new RequestTracer();
    const wallet = await coin.wallets().get({ id: req.params.id, reqId });
    req.body.reqId = reqId;

    let result;
    try {
      result = await wallet.send(createSendParams(req));
    } catch (err) {
      err.status = 400;
      throw err;
    }
    if (result.status === 'pendingApproval') {
      throw apiResponse(202, result);
    }
    return result;
  }

  /**
   * Send many
   * handleV2SendMany
   * @param req
   */
  async sendMany(req: Request) {
    const bitgo = req.bitgo;
    const coin = bitgo.coin(req.params.coin);
    const reqId = new RequestTracer();
    const wallet = await coin.wallets().get({ id: req.params.id, reqId });
    req.body.reqId = reqId;
    let result;
    try {
      result = await wallet.sendMany(createSendParams(req));
    } catch (err) {
      err.status = 400;
      throw err;
    }
    if (result.status === 'pendingApproval') {
      throw apiResponse(202, result);
    }
    return result;
  }

  /**
   * Routes payload meant for prebuildAndSignTransaction() in sdk-core which
   * validates the payload and makes the appropriate request to WP to
   * build, sign, and send a tx.
   * - sends request to Platform to build the transaction
   * - signs with user key
   * - request signature from the second key (BitGo HSM)
   * - send/broadcast transaction
   * handleV2PrebuildAndSignTransaction
   * @param req where req.body is {@link PrebuildAndSignTransactionOptions}
   */
  async prebuildAndSign(req: Request): Promise<SignedTransactionRequest> {
    const bitgo = req.bitgo;
    const coin = bitgo.coin(req.params.coin);
    const reqId = new RequestTracer();
    const wallet = await coin.wallets().get({ id: req.params.id, reqId });
    req.body.reqId = reqId;
    let result;
    try {
      result = await wallet.prebuildAndSignTransaction(createSendParams(req));
    } catch (err) {
      err.status = 400;
      throw err;
    }
    return result;
  }
  
  /**
   * Sign TSS wallet transaction
   * handleV2SignTSSWalletTx
   * @param {Request} req 
   * @returns 
   */
  async signTSSWalletTx(req: Request) {
    const bitgo = req.bitgo;
    const coin = bitgo.coin(req.params.coin);
    const wallet = await coin.wallets().get({ id: req.params.id });
    try {
      return await wallet.signTransaction(createTSSSendParams(req));
    } catch (error) {
      console.error('error while signing wallet transaction ', error);
      throw error;
    }
  }
}

export default new V2Transaction();
