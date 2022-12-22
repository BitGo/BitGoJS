import { Request } from 'express';

class V2Address {
  /**
   * handle address canonicalization
   * handleCanonicalAddress
   * @param req
   */
  canonicalize(req: Request) {
    const bitgo = req.bitgo;
    const coin = bitgo.coin(req.params.coin);
    if (!['ltc', 'bch', 'bsv'].includes(coin.getFamily())) {
      throw new Error('only Litecoin/Bitcoin Cash/Bitcoin SV address canonicalization is supported');
    }

    const address = req.body.address;
    const fallbackVersion = req.body.scriptHashVersion; // deprecate
    const version = req.body.version;
    return (coin as Coin.Bch | Coin.Bsv | Coin.Ltc).canonicalAddress(address, version || fallbackVersion);
  }

  getWalletPwFromEnv(walletId: string): string {
    const name = `WALLET_${walletId}_PASSPHRASE`;
    const walletPw = process.env[name];
    if (walletPw === undefined) {
      throw new Error(`Could not find wallet passphrase ${name} in environment`);
    }
    return walletPw;
  }

  /**
   * handle v2 address validation
   * handleV2VerifyAddress
   * @param req
   */
  verify (req: Request): { isValid: boolean } {
    if (!_.isString(req.body.address)) {
      throw new Error('Expected address to be a string');
    }

    if (req.body.supportOldScriptHashVersion !== undefined && !_.isBoolean(req.body.supportOldScriptHashVersion)) {
      throw new Error('Expected supportOldScriptHashVersion to be a boolean.');
    }

    const bitgo = req.bitgo;
    const coin = bitgo.coin(req.params.coin);

    if (coin instanceof Coin.AbstractUtxoCoin) {
      return {
        isValid: coin.isValidAddress(req.body.address, !!req.body.supportOldScriptHashVersion),
      };
    }

    return {
      isValid: coin.isValidAddress(req.body.address),
    };
  }
}

export default new V2Address();
