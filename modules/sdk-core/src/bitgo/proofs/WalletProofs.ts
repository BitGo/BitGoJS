import { IWallet } from '../wallet';
import { RequestTracer } from '../utils';

export class WalletProofs {
  public wallet: IWallet;

  constructor(wallet: IWallet) {
    this.wallet = wallet;
  }

  async getWalletProof(): Promise<string> {
    const reqId = new RequestTracer();
    this.wallet.bitgo.setRequestTracer(reqId);

    return (await this.wallet.bitgo
      .get(this.wallet.bitgo.url('/wallet/' + this.wallet.id() + '/liability-proofs', 2))
      .send()
      .result()) as string;
  }
}
