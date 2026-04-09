/**
 * @prettier
 */
import { BitGoBase } from '../bitgoBase';
import { ITradingAccount, SignPayloadParameters } from '../trading';
import { IWallet } from '../wallet';
import { TradingNetwork } from './network';

export class TradingAccount implements ITradingAccount {
  private readonly bitgo: BitGoBase;
  private readonly enterpriseId: string;

  public wallet: IWallet;

  constructor(enterpriseId: string, wallet: IWallet, bitgo: BitGoBase) {
    this.enterpriseId = enterpriseId;
    this.wallet = wallet;
    this.bitgo = bitgo;
  }

  get id(): string {
    return this.wallet.id();
  }

  /**
   * Signs an arbitrary payload with the user key on this trading account
   * @param params
   * @param params.payload arbitrary payload object (string | Record<string, unknown>)
   * @param params.walletPassphrase passphrase on this trading account, used to unlock the account user key
   * @returns hex-encoded signature of the payload
   */
  async signPayload(params: SignPayloadParameters): Promise<string> {
    const key = (await this.wallet.baseCoin.keychains().get({ id: this.wallet.keyIds()[0] })) as any;
    const prv = this.wallet.bitgo.decrypt({
      input: key.encryptedPrv,
      password: params.walletPassphrase,
    });
    const payload = typeof params.payload === 'string' ? params.payload : JSON.stringify(params.payload);
    return ((await this.wallet.baseCoin.signMessage({ prv }, payload)) as any).toString('hex');
  }

  /**
   * Get Trade Network
   * To enable Off Exchange Allocation & Settlement, contact support@bitgo.com.
   * BitGo provides a UI experience for clients at: https://app.bitgo.com/web/enterprises/<enterpriseId>/allocate
   */
  toNetwork(): TradingNetwork {
    return new TradingNetwork(this.enterpriseId, this.wallet, this.bitgo);
  }
}
