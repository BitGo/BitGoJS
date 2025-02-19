import * as sdkcore from '@bitgo/sdk-core';
import * as t from 'io-ts';
import {
  createMessageSignature,
  LightningAuthKeychain,
  LightningKeychain,
  unwrapLightningCoinSpecific,
  UpdateLightningWalletSignedRequest,
  CreateInvoiceRequest,
  GetInvoicesQuery,
  LightningInvoice,
  InvoiceInfo,
} from '../lightning';

export interface ILightningWallet {
  /**
   * Creates a lightning invoice
   * @param params Invoice parameters (to be defined)
   */
  createInvoice(params: CreateInvoiceRequest): Promise<LightningInvoice>;

  /**
   * Lists current lightning invoices
   * @param params Invoice parameters (to be defined)
   */
  listInvoices(params: GetInvoicesQuery): Promise<InvoiceInfo[]>;

  /**
   * Pay a lightning invoice
   * @param params Payment parameters (to be defined)
   */
  payInvoice(params: unknown): Promise<unknown>;

  /**
   * Get the lightning keychain for the given wallet.
   */
  getLightningKeychain(): Promise<LightningKeychain>;

  /**
   * Get the lightning auth keychains for the given wallet.
   */
  getLightningAuthKeychains(): Promise<{ userAuthKey: LightningAuthKeychain; nodeAuthKey: LightningAuthKeychain }>;

  /**
   * Updates the coin-specific configuration for a Lightning Wallet.
   *
   * @param {UpdateLightningWalletSignedRequest} params - The parameters containing the updated wallet-specific details.
   *   - `encryptedSignerMacaroon` (optional): This macaroon is used by the watch-only node to ask the signer node to sign transactions.
   *     Encrypted with ECDH secret key from private key of wallet's user auth key and public key of lightning service.
   *   - `encryptedSignerAdminMacaroon` (optional): Generated when initializing the wallet of the signer node.
   *     Encrypted with client's wallet passphrase.
   *   - `signerIp` (optional): The IP address of the Lightning signer node.
   *   - `encryptedSignerTlsKey` (optional): The wallet passphrase encrypted TLS key of the signer.
   *   - `signerTlsCert` (optional): The TLS certificate of the signer.
   *   - `watchOnlyAccounts` (optional): These are the accounts used to initialize the watch-only wallet.
   * @param {string} passphrase - wallet passphrase.
   * @returns {Promise<unknown>} A promise resolving to the updated wallet response or throwing an error if the update fails.
   */
  updateWalletCoinSpecific(params: UpdateLightningWalletSignedRequest, passphrase: string): Promise<unknown>;
}

export class SelfCustodialLightningWallet implements ILightningWallet {
  public wallet: sdkcore.IWallet;

  constructor(wallet: sdkcore.IWallet) {
    const coin = wallet.baseCoin;
    if (coin.getFamily() !== 'lnbtc') {
      throw new Error(`Invalid coin to update lightning wallet: ${coin.getFamily()}`);
    }
    this.wallet = wallet;
  }

  async createInvoice(params: CreateInvoiceRequest): Promise<LightningInvoice> {
    const createInvoiceResponse = await this.wallet.bitgo
      .post(this.wallet.baseCoin.url(`/wallet/${this.wallet.id()}/lightning/invoice`))
      .send(CreateInvoiceRequest.encode(params))
      .result();
    return sdkcore.decodeOrElse(LightningInvoice.name, LightningInvoice, createInvoiceResponse, (_) => {
      // DON'T throw errors from decodeOrElse. It could leak sensitive information.
      throw new Error(`Invalid create invoice response`);
    });
  }

  async payInvoice(params: unknown): Promise<unknown> {
    throw new Error('Method not implemented.');
  }

  async listInvoices(params: GetInvoicesQuery): Promise<InvoiceInfo[]> {
    const returnCodec = t.array(InvoiceInfo);
    const createInvoiceResponse = await this.wallet.bitgo
      .get(this.wallet.baseCoin.url(`/wallet/${this.wallet.id()}/lightning/invoice`))
      .query(GetInvoicesQuery.encode(params))
      .result();
    return sdkcore.decodeOrElse(returnCodec.name, returnCodec, createInvoiceResponse, (_) => {
      throw new Error(`Invalid list invoices response`);
    });
  }

  async getLightningKeychain(): Promise<LightningKeychain> {
    const keyIds = this.wallet.keyIds();
    if (keyIds.length !== 1) {
      throw new Error(`Invalid number of key in lightning wallet: ${keyIds.length}`);
    }
    const keychain = await this.wallet.baseCoin.keychains().get({ id: keyIds[0] });
    return sdkcore.decodeOrElse(LightningKeychain.name, LightningKeychain, keychain, (_) => {
      throw new Error(`Invalid user key`);
    });
  }

  async getLightningAuthKeychains(): Promise<{
    userAuthKey: LightningAuthKeychain;
    nodeAuthKey: LightningAuthKeychain;
  }> {
    const authKeyIds = this.wallet.coinSpecific()?.keys;
    if (authKeyIds?.length !== 2) {
      throw new Error(`Invalid number of auth keys in lightning wallet: ${authKeyIds?.length}`);
    }
    const coin = this.wallet.baseCoin;
    const keychains = await Promise.all(authKeyIds.map((id) => coin.keychains().get({ id })));
    const authKeychains = keychains.map((keychain) => {
      return sdkcore.decodeOrElse(LightningAuthKeychain.name, LightningAuthKeychain, keychain, (_) => {
        // DON'T throw errors from decodeOrElse. It could leak sensitive information.
        throw new Error(`Invalid lightning auth key: ${keychain?.id}`);
      });
    });
    const [userAuthKey, nodeAuthKey] = (['userAuth', 'nodeAuth'] as const).map((purpose) => {
      const keychain = authKeychains.find(
        (k) => unwrapLightningCoinSpecific(k.coinSpecific, coin.getChain()).purpose === purpose
      );
      if (!keychain) {
        throw new Error(`Missing ${purpose} key`);
      }
      return keychain;
    });

    return { userAuthKey, nodeAuthKey };
  }

  async updateWalletCoinSpecific(params: UpdateLightningWalletSignedRequest, passphrase: string): Promise<unknown> {
    sdkcore.decodeOrElse(
      UpdateLightningWalletSignedRequest.name,
      UpdateLightningWalletSignedRequest,
      params,
      (errors) => {
        // DON'T throw errors from decodeOrElse. It could leak sensitive information.
        throw new Error(`Invalid params for lightning specific update wallet: ${errors}`);
      }
    );
    const { userAuthKey } = await this.getLightningAuthKeychains();
    const signature = createMessageSignature(
      params,
      this.wallet.bitgo.decrypt({ password: passphrase, input: userAuthKey.encryptedPrv })
    );
    const coinSpecific = {
      [this.wallet.coin()]: {
        signedRequest: params,
        signature,
      },
    };
    return await this.wallet.bitgo.put(this.wallet.url()).send({ coinSpecific }).result();
  }
}
