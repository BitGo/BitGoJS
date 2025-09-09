import { IWallet } from '../wallet';
import { RequestTracer } from '../utils';
import { AccountSnapshot, UserVerificationElements } from './types';

export class WalletProofs {
  public wallet: IWallet;

  constructor(wallet: IWallet) {
    this.wallet = wallet;
  }

  /**
   * Get the liability proofs for a Go Account - these can be used to verify the balances of the account
   * were included in the total Go Account liabilities published by BitGo on the public proof of solvency page.
   * @returns UserVerificationElements
   */
  async getLiabilityProofs(): Promise<UserVerificationElements> {
    const reqId = new RequestTracer();
    this.wallet.bitgo.setRequestTracer(reqId);
    return (await this.wallet.bitgo
      .get(this.wallet.bitgo.url('/proofs-service/wallets/' + this.wallet.id() + '/liability-proofs'))
      .send()
      .result()) as UserVerificationElements;
  }

  /**
   * Get the account snapshot for a Go Account - this provides a snapshot of the account's balances at the
   * latest proof generation date (for proof of solvency).
   * @returns AccountSnapshot
   */
  async getAccountSnapshot(): Promise<AccountSnapshot> {
    const reqId = new RequestTracer();
    this.wallet.bitgo.setRequestTracer(reqId);

    return (await this.wallet.bitgo
      .get(this.wallet.bitgo.url('/proofs-service/wallets/' + this.wallet.id() + '/account-snapshot'))
      .send()
      .result()) as AccountSnapshot;
  }
}
