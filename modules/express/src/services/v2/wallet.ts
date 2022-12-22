import { Request } from 'request';

class V2Wallet {
  /**
   * Share wallet with an existing BitGo user
   * handleV2ShareWallet
   * @param req
   */
  async share(req: Request) {
    const bitgo = req.bitgo;
    const coin = bitgo.coin(req.params.coin);
    const wallet = await coin.wallets().get({ id: req.params.id });
    return wallet.shareWallet(req.body);
  }
  
  /**
   * Accept wallet share
   * handleV2AcceptWalletShare
   * @param req
   */
  async acceptShare(req: Request) {
    const bitgo = req.bitgo;
    const coin = bitgo.coin(req.params.coin);
    const params = _.extend({}, req.body, { walletShareId: req.params.id });
    return coin.wallets().acceptShare(params);
  }
  
  /**
   * Consolidate wallet unspents
   * handleV2ConsolidateUnspents
   * @param req
   */
  async consolidateUnspents(req: Request) {
    const bitgo = req.bitgo;
    const coin = bitgo.coin(req.params.coin);
    const wallet = await coin.wallets().get({ id: req.params.id });
    return wallet.consolidateUnspents(createSendParams(req));
  }
  
  /**
   * Consolidation wallet account.
   * handleV2ConsolidateAccount
   * @param req
   */
  async consolidateAccount(req: Request) {
    const bitgo = req.bitgo;
    const coin = bitgo.coin(req.params.coin);
  
    if (req.body.consolidateAddresses && !_.isArray(req.body.consolidateAddresses)) {
      throw new Error('consolidate address must be an array of addresses');
    }
  
    if (!coin.allowsAccountConsolidations()) {
      throw new Error('invalid coin selected');
    }
  
    const wallet = await coin.wallets().get({ id: req.params.id });
  
    let result: any;
    try {
      if (coin.supportsTss()) {
        result = await wallet.sendAccountConsolidations(createTSSSendParams(req));
      } else {
        result = await wallet.sendAccountConsolidations(createSendParams(req));
      }
    } catch (err) {
      err.status = 400;
      throw err;
    }
  
    // we had failures to handle
    if (result.failure.length && result.failure.length > 0) {
      let msg = '';
      let status = 202;
  
      if (result.success.length && result.success.length > 0) {
        // but we also had successes
        msg = `Transactions failed: ${result.failure.length} and succeeded: ${result.success.length}`;
      } else {
        // or in this case only failures
        status = 400;
        msg = `All transactions failed`;
      }
  
      throw apiResponse(status, result, msg);
    }
  
    return result;
  }
  
  /**
   * Fanout wallet unspents
   * handleV2FanOutUnspents
   * @param req
   */
  async fanOutUnspents(req: Request) {
    const bitgo = req.bitgo;
    const coin = bitgo.coin(req.params.coin);
    const wallet = await coin.wallets().get({ id: req.params.id });
    return wallet.fanoutUnspents(createSendParams(req));
  }
  
  /**
   * Sweep wallet
   * handleV2Sweep
   * @param req
   */
  async sweep(req: Request) {
    const bitgo = req.bitgo;
    const coin = bitgo.coin(req.params.coin);
    const wallet = await coin.wallets().get({ id: req.params.id });
    return wallet.sweep(createSendParams(req));
  }
  
  /**
   * Create TSS send params
   * @param req 
   * @returns 
   */
  createTSSSendParams(req: Request) {
    if (req.config.externalSignerUrl !== undefined) {
      return {
        ...req.body,
        customRShareGeneratingFunction: createCustomRShareGenerator(req.config.externalSignerUrl, req.params.coin),
        customGShareGeneratingFunction: createCustomGShareGenerator(req.config.externalSignerUrl, req.params.coin),
      };
    } else {
      return req.body;
    }
  }
  
  /**
   * Create custom R Share generator
   * @param externalSignerUrl 
   * @param coin 
   * @returns 
   */
  createCustomRShareGenerator(externalSignerUrl: string, coin: string): CustomRShareGeneratingFunction {
    return async function (params): Promise<{ rShare: SignShare; signingKeyYShare: YShare }> {
      const { body: rShare } = await retryPromise(
        () => superagent.post(`${externalSignerUrl}/api/v2/${coin}/tssshare/R`).type('json').send(params),
        (err, tryCount) => {
          debug(`failed to connect to external signer (attempt ${tryCount}, error: ${err.message})`);
        }
      );
      return rShare;
    };
  }
  
  /**
   * Create custom G Share generator
   * @param externalSignerUrl 
   * @param coin 
   * @returns 
   */
  createCustomGShareGenerator(externalSignerUrl: string, coin: string): CustomGShareGeneratingFunction {
    return async function (params): Promise<GShare> {
      const { body: signedTx } = await retryPromise(
        () => superagent.post(`${externalSignerUrl}/api/v2/${coin}/tssshare/G`).type('json').send(params),
        (err, tryCount) => {
          debug(`failed to connect to external signer (attempt ${tryCount}, error: ${err.message})`);
        }
      );
      return signedTx;
    };
  }
  
  /**
   * Create wallet address
   * handleV2CreateAddress
   * @param req
   */
  async createAddress(req: Request) {
    const bitgo = req.bitgo;
    const coin = bitgo.coin(req.params.coin);
    const wallet = await coin.wallets().get({ id: req.params.id });
    return wallet.createAddress(req.body);
  }
  
  /**
   * Create new wallet
   * handleV2GenerateWallet
   * @param req
   */
  async generate(req: Request) {
    const bitgo = req.bitgo;
    const coin = bitgo.coin(req.params.coin);
    const result = await coin.wallets().generateWallet(req.body);
    if (req.query.includeKeychains) {
      return { ...result, wallet: result.wallet.toJSON() };
    }
    return result.wallet.toJSON();
  }
}

export default new V2Wallet();
