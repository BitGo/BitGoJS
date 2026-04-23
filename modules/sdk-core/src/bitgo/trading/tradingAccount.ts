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
   * Signs an arbitrary payload. Use the user key if passphrase is provided, or the BitGo key if not.
   * @param params
   * @param params.payload arbitrary payload object (string | Record<string, unknown>)
   * @param params.walletPassphrase passphrase on this trading account, used to unlock the account user key
   * @returns hex-encoded signature of the payload
   */
  async signPayload(params: SignPayloadParameters): Promise<string> {
    // if no passphrase is provided, attempt to sign using the wallet's bitgo key remotely
    if (!params.walletPassphrase) {
      return this.signPayloadByBitGoKey(params);
    }
    // if a passphrase is provided, we must be trying to sign using the user private key - decrypt and sign locally
    return this.signPayloadByUserKey(params);
  }

  /**
   * Signs the payload of a trading account via the trading account BitGo key stored in a remote KMS
   * @param params
   * @private
   */
  private async signPayloadByBitGoKey(params: Omit<SignPayloadParameters, 'walletPassphrase'>): Promise<string> {
    const walletData = this.wallet.toJSON();
    if (walletData.userKeySigningRequired) {
      throw new Error('Wallet must use user key to sign ofc transaction, please provide the wallet passphrase');
    }
    if (walletData.keys.length < 2) {
      throw new Error('Wallet does not support BitGo signing');
    }

    const url = this.wallet.url('/tx/sign');
    const { signature } = await this.wallet.bitgo.post(url).send(params.payload).result();

    return signature;
  }

  /**
   * Signs the payload of a trading account locally by fetching the user's encrypted private key and decrypt using passphrase
   * @param params
   * @private
   */
  private async signPayloadByUserKey(params: SignPayloadParameters): Promise<string> {
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
