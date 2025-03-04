import * as sdkcore from '@bitgo/sdk-core';
import {
  PendingApprovalData,
  PendingApprovals,
  RequestTracer,
  RequestType,
  TxRequest,
  commonTssMethods,
  TxRequestState,
  decodeOrElse,
} from '@bitgo/sdk-core';
import * as t from 'io-ts';
import { createMessageSignature, deriveLightningServiceSharedSecret, unwrapLightningCoinSpecific } from '../lightning';
import {
  CreateInvoiceBody,
  Invoice,
  InvoiceInfo,
  InvoiceQuery,
  LightningAuthKeychain,
  LightningKeychain,
  LndCreatePaymentResponse,
  SubmitPaymentParams,
  UpdateLightningWalletClientRequest,
  UpdateLightningWalletEncryptedRequest,
  Transaction,
  TransactionQuery,
  PaymentInfo,
  BackupResponse,
  PaymentQuery,
} from '../codecs';
import { LightningPaymentIntent, LightningPaymentRequest } from '@bitgo/public-types';

export type PayInvoiceResponse = {
  txRequestId: string;
  txRequestState: TxRequestState;
  pendingApproval?: PendingApprovalData;
  // Absent if there's a pending approval
  paymentStatus?: LndCreatePaymentResponse;
};

export interface ILightningWallet {
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
   * @param {UpdateLightningWalletClientRequest} params - The parameters containing the updated wallet-specific details.
   *   - `encryptedSignerMacaroon` (optional): This macaroon is used by the watch-only node to ask the signer node to sign transactions.
   *     Encrypted with ECDH secret key from private key of wallet's user auth key and public key of lightning service.
   *   - `encryptedSignerAdminMacaroon` (optional): Generated when initializing the wallet of the signer node.
   *     Encrypted with client's wallet passphrase.
   *   - `signerHost` (optional): The host address of the Lightning signer node.
   *   - `encryptedSignerTlsKey` (optional): The wallet passphrase encrypted TLS key of the signer.
   *   - `passphrase` (required): The wallet passphrase.
   *   - `signerTlsCert` (optional): The TLS certificate of the signer.
   *   - `watchOnlyAccounts` (optional): These are the accounts used to initialize the watch-only wallet.
   * @returns {Promise<unknown>} A promise resolving to the updated wallet response or throwing an error if the update fails.
   */
  updateWalletCoinSpecific(params: UpdateLightningWalletClientRequest): Promise<unknown>;

  /**
   * Creates a lightning invoice
   * @param {object} params Invoice parameters
   * @param {bigint} params.valueMsat The value of the invoice in millisatoshis
   * @param {string} [params.memo] A memo or description for the invoice
   * @param {number} [params.expiry] The expiry time of the invoice in seconds
   * @returns {Promise<Invoice>} A promise that resolves to the created invoice
   */
  createInvoice(params: CreateInvoiceBody): Promise<Invoice>;
  /**
   * Get invoice details by payment hash
   * @param {string} paymentHash - Payment hash to lookup
   * @returns {Promise<InvoiceInfo>} Invoice details
   * @throws {InvalidPaymentHash} When payment hash is not valid
   */
  getInvoice(paymentHash: string): Promise<InvoiceInfo>;
  /**
   * Lists current lightning invoices
   * @param {InvoiceQuery} params Query parameters for filtering invoices
   * @param {string} [params.status] The status of the invoice (open, settled, canceled)
   * @param {bigint} [params.limit] The maximum number of invoices to return
   * @param {Date} [params.startDate] The start date for the query
   * @param {Date} [params.endDate] The end date for the query
   * @returns {Promise<InvoiceInfo[]>} List of invoices
   */
  listInvoices(params: InvoiceQuery): Promise<InvoiceInfo[]>;

  /**
   * Pay a lightning invoice
   * @param {SubmitPaymentParams} params - Payment parameters
   * @param {string} params.invoice - The invoice to pay
   * @param {string} params.amountMsat - The amount to pay in millisatoshis
   * @param {string} params.passphrase - The wallet passphrase
   * @param {string} [params.sequenceId] - Optional sequence ID for the respective payment transfer
   * @param {string} [params.comment] - Optional comment for the respective payment transfer
   * @returns {Promise<PayInvoiceResponse>} Payment result containing transaction request details and payment status
   */
  payInvoice(params: SubmitPaymentParams): Promise<PayInvoiceResponse>;
  /**
   * Get payment details by payment hash
   * @param {string} paymentHash - Payment hash to lookup
   * @returns {Promise<PaymentInfo>} Payment details
   * @throws {InvalidPaymentHash} When payment hash is not valid
   */
  getPayment(paymentHash: string): Promise<PaymentInfo>;
  /**
   * List payments for a wallet with optional filtering
   * @param {PaymentQuery} params Query parameters for filtering payments
   * @param {string} [params.status] The status of the payment
   * @param {bigint} [params.limit] The maximum number of payments to return
   * @param {Date} [params.startDate] The start date for the query
   * @param {Date} [params.endDate] The end date for the query
   * @returns {Promise<PaymentInfo[]>} List of payments
   */
  listPayments(params: PaymentQuery): Promise<PaymentInfo[]>;
  /**
   * Get transaction details by ID
   * @param {string} txId - Transaction ID to lookup
   * @returns {Promise<Transaction>} Transaction details
   * @throws {InvalidTxId} When transaction ID is not valid
   */
  getTransaction(txId: string): Promise<Transaction>;

  /**
   * List transactions for a wallet with optional filtering
   * @param {TransactionQuery} params Query parameters for filtering transactions
   * @param {bigint} [params.limit] The maximum number of transactions to return
   * @param {Date} [params.startDate] The start date for the query
   * @param {Date} [params.endDate] The end date for the query
   * @returns {Promise<Transaction[]>} List of transactions
   */
  listTransactions(params: TransactionQuery): Promise<Transaction[]>;

  /**
   * Get the channel backup for the given wallet.
   * @returns {Promise<BackupResponse>} A promise resolving to the channel backup
   */
  getChannelBackup(): Promise<BackupResponse>;
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

  private encryptWalletUpdateRequest(
    params: UpdateLightningWalletClientRequest,
    userAuthKey: LightningAuthKeychain
  ): UpdateLightningWalletEncryptedRequest {
    const coinName = this.wallet.coin() as 'tlnbtc' | 'lnbtc';

    const requestWithEncryption: Partial<UpdateLightningWalletClientRequest & UpdateLightningWalletEncryptedRequest> = {
      ...params,
    };

    const userAuthXprv = this.wallet.bitgo.decrypt({
      password: params.passphrase,
      input: userAuthKey.encryptedPrv,
    });

    if (params.signerTlsKey) {
      requestWithEncryption.encryptedSignerTlsKey = this.wallet.bitgo.encrypt({
        password: params.passphrase,
        input: params.signerTlsKey,
      });
    }

    if (params.signerAdminMacaroon) {
      requestWithEncryption.encryptedSignerAdminMacaroon = this.wallet.bitgo.encrypt({
        password: params.passphrase,
        input: params.signerAdminMacaroon,
      });
    }

    if (params.signerMacaroon) {
      requestWithEncryption.encryptedSignerMacaroon = this.wallet.bitgo.encrypt({
        password: deriveLightningServiceSharedSecret(coinName, userAuthXprv).toString('hex'),
        input: params.signerMacaroon,
      });
    }

    return t.exact(UpdateLightningWalletEncryptedRequest).encode(requestWithEncryption);
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

  async updateWalletCoinSpecific(params: UpdateLightningWalletClientRequest): Promise<unknown> {
    sdkcore.decodeOrElse(
      UpdateLightningWalletClientRequest.name,
      UpdateLightningWalletClientRequest,
      params,
      (errors) => {
        // DON'T throw errors from decodeOrElse. It could leak sensitive information.
        throw new Error(`Invalid params for lightning specific update wallet`);
      }
    );

    const { userAuthKey } = await this.getLightningAuthKeychains();
    const updateRequestWithEncryption = this.encryptWalletUpdateRequest(params, userAuthKey);
    const signature = createMessageSignature(
      updateRequestWithEncryption,
      this.wallet.bitgo.decrypt({ password: params.passphrase, input: userAuthKey.encryptedPrv })
    );
    const coinSpecific = {
      [this.wallet.coin()]: {
        signedRequest: updateRequestWithEncryption,
        signature,
      },
    };
    return await this.wallet.bitgo.put(this.wallet.url()).send({ coinSpecific }).result();
  }

  async createInvoice(params: CreateInvoiceBody): Promise<Invoice> {
    const createInvoiceResponse = await this.wallet.bitgo
      .post(this.wallet.baseCoin.url(`/wallet/${this.wallet.id()}/lightning/invoice`))
      .send(t.exact(CreateInvoiceBody).encode(params))
      .result();
    return sdkcore.decodeOrElse(Invoice.name, Invoice, createInvoiceResponse, (error) => {
      // DON'T throw errors from decodeOrElse. It could leak sensitive information.
      throw new Error(`Invalid create invoice response ${error}`);
    });
  }

  async getInvoice(paymentHash: string): Promise<InvoiceInfo> {
    const response = await this.wallet.bitgo
      .get(this.wallet.baseCoin.url(`/wallet/${this.wallet.id()}/lightning/invoice/${paymentHash}`))
      .result();
    return decodeOrElse(InvoiceInfo.name, InvoiceInfo, response, (error) => {
      throw new Error(`Invalid get invoice response ${error}`);
    });
  }

  async listInvoices(params: InvoiceQuery): Promise<InvoiceInfo[]> {
    const returnCodec = t.array(InvoiceInfo);
    const createInvoiceResponse = await this.wallet.bitgo
      .get(this.wallet.baseCoin.url(`/wallet/${this.wallet.id()}/lightning/invoice`))
      .query(InvoiceQuery.encode(params))
      .result();
    return sdkcore.decodeOrElse(returnCodec.name, returnCodec, createInvoiceResponse, (error) => {
      throw new Error(`Invalid list invoices response ${error}`);
    });
  }

  async payInvoice(params: SubmitPaymentParams): Promise<PayInvoiceResponse> {
    const reqId = new RequestTracer();
    this.wallet.bitgo.setRequestTracer(reqId);

    const { userAuthKey } = await this.getLightningAuthKeychains();
    const signature = createMessageSignature(
      t.exact(LightningPaymentRequest).encode(params),
      this.wallet.bitgo.decrypt({ password: params.passphrase, input: userAuthKey.encryptedPrv })
    );

    const paymentIntent: LightningPaymentIntent = {
      comment: params.comment,
      sequenceId: params.sequenceId,
      intentType: 'payment',
      signedRequest: {
        invoice: params.invoice,
        amountMsat: params.amountMsat,
        feeLimitMsat: params.feeLimitMsat,
        feeLimitRatio: params.feeLimitRatio,
      },
      signature,
    };

    const transactionRequestCreate = (await this.wallet.bitgo
      .post(this.wallet.bitgo.url('/wallet/' + this.wallet.id() + '/txrequests', 2))
      .send(LightningPaymentIntent.encode(paymentIntent))
      .result()) as TxRequest;

    if (transactionRequestCreate.state === 'pendingApproval') {
      const pendingApprovals = new PendingApprovals(this.wallet.bitgo, this.wallet.baseCoin);
      const pendingApproval = await pendingApprovals.get({ id: transactionRequestCreate.pendingApprovalId });
      return {
        pendingApproval: pendingApproval.toJSON(),
        txRequestId: transactionRequestCreate.txRequestId,
        txRequestState: transactionRequestCreate.state,
      };
    }

    const transactionRequestSend = await commonTssMethods.sendTxRequest(
      this.wallet.bitgo,
      this.wallet.id(),
      transactionRequestCreate.txRequestId,
      RequestType.tx,
      reqId
    );

    const coinSpecific = transactionRequestSend.transactions?.[0]?.unsignedTx?.coinSpecific;

    return {
      txRequestId: transactionRequestCreate.txRequestId,
      txRequestState: transactionRequestSend.state,
      paymentStatus: coinSpecific
        ? t.exact(LndCreatePaymentResponse).encode(coinSpecific as LndCreatePaymentResponse)
        : undefined,
    };
  }

  async getPayment(paymentHash: string): Promise<PaymentInfo> {
    const response = await this.wallet.bitgo
      .get(this.wallet.baseCoin.url(`/wallet/${this.wallet.id()}/lightning/payment/${paymentHash}`))
      .result();
    return decodeOrElse(PaymentInfo.name, PaymentInfo, response, (error) => {
      throw new Error(`Invalid payment response: ${error}`);
    });
  }

  async listPayments(params: PaymentQuery): Promise<PaymentInfo[]> {
    const response = await this.wallet.bitgo
      .get(this.wallet.baseCoin.url(`/wallet/${this.wallet.id()}/lightning/payment`))
      .query(PaymentQuery.encode(params))
      .result();
    return decodeOrElse(t.array(PaymentInfo).name, t.array(PaymentInfo), response, (error) => {
      throw new Error(`Invalid payment list response: ${error}`);
    });
  }

  async getTransaction(txId: string): Promise<Transaction> {
    const response = await this.wallet.bitgo
      .get(this.wallet.baseCoin.url(`/wallet/${this.wallet.id()}/lightning/transaction/${txId}`))
      .result();
    return decodeOrElse(Transaction.name, Transaction, response, (error) => {
      throw new Error(`Invalid transaction response: ${error}`);
    });
  }

  async listTransactions(params: TransactionQuery): Promise<Transaction[]> {
    const response = await this.wallet.bitgo
      .get(this.wallet.baseCoin.url(`/wallet/${this.wallet.id()}/lightning/transaction`))
      .query(TransactionQuery.encode(params))
      .result();
    return decodeOrElse(t.array(Transaction).name, t.array(Transaction), response, (error) => {
      throw new Error(`Invalid transaction list response: ${error}`);
    });
  }

  async getChannelBackup(): Promise<BackupResponse> {
    const backupResponse = await this.wallet.bitgo
      .get(this.wallet.baseCoin.url(`/wallet/${this.wallet.id()}/lightning/backup`))
      .result();
    return sdkcore.decodeOrElse(BackupResponse.name, BackupResponse, backupResponse, (error) => {
      throw new Error(`Invalid backup response: ${error}`);
    });
  }
}
