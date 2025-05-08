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
import { createMessageSignature, unwrapLightningCoinSpecific } from '../lightning';
import {
  CreateInvoiceBody,
  Invoice,
  InvoiceInfo,
  InvoiceQuery,
  LightningAuthKeychain,
  LightningKeychain,
  LndCreatePaymentResponse,
  SubmitPaymentParams,
  Transaction,
  TransactionQuery,
  PaymentInfo,
  PaymentQuery,
  LightningOnchainWithdrawParams,
  LightningOnchainWithdrawResponse,
  InvoicePaymentParams,
  LnurlPaymentParams,
} from '../codecs';
import { LightningPaymentIntent, LightningPaymentRequest } from '@bitgo/public-types';
import * as lnurlProcessor from '../lightning/lnurl';

export type PayInvoiceResponse = {
  /**
   * Unique identifier for the payment request submitted to BitGo.
   */
  txRequestId: string;

  /**
   * Status of the payment request submission to BitGo.
   * - `'delivered'`: Successfully received by BitGo, but may or may not have been sent to the Lightning Network yet.
   * - For the actual payment status, refer to `paymentStatus` and track `transfer`.
   */
  txRequestState: TxRequestState;

  /**
   * Pending approval details, if applicable.
   * - If present, the payment has not been initiated yet.
   */
  pendingApproval?: PendingApprovalData;

  /**
   * Current snapshot of payment status (if available).
   * - **`'in_flight'`**: Payment is in progress.
   * - **`'settled'`**: Payment was successfully completed.
   * - **`'failed'`**: Payment failed.
   * This field is absent if approval is required before processing.
   */
  paymentStatus?: LndCreatePaymentResponse;

  /**
   * Latest transfer details for this payment request (if available).
   * - Provides the current state of the transfer.
   * - To track the final payment status, monitor `transfer` asynchronously.
   * This field is absent if approval is required before processing.
   */
  transfer?: any;
};

/**
 * Get the lightning keychain for the given wallet.
 */
export async function getLightningKeychain(wallet: sdkcore.IWallet): Promise<LightningKeychain> {
  const coin = wallet.baseCoin;
  if (coin.getFamily() !== 'lnbtc') {
    throw new Error(`Invalid coin to get lightning wallet key: ${coin.getFamily()}`);
  }
  const keyIds = wallet.keyIds();
  if (keyIds.length !== 1) {
    throw new Error(`Invalid number of key in lightning wallet: ${keyIds.length}`);
  }
  const keychain = await coin.keychains().get({ id: keyIds[0] });
  return sdkcore.decodeOrElse(LightningKeychain.name, LightningKeychain, keychain, (_) => {
    throw new Error(`Invalid user key`);
  });
}

/**
 * Get the lightning auth keychains for the given wallet.
 */
export async function getLightningAuthKeychains(wallet: sdkcore.IWallet): Promise<{
  userAuthKey: LightningAuthKeychain;
  nodeAuthKey: LightningAuthKeychain;
}> {
  const coin = wallet.baseCoin;
  if (coin.getFamily() !== 'lnbtc') {
    throw new Error(`Invalid coin to get lightning wallet auth keys: ${coin.getFamily()}`);
  }
  const authKeyIds = wallet.coinSpecific()?.keys;
  if (authKeyIds?.length !== 2) {
    throw new Error(`Invalid number of auth keys in lightning wallet: ${authKeyIds?.length}`);
  }
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

export interface ILightningWallet {
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
   * Pay a Lightning invoice or LNURL
   * @param {SubmitPaymentParams} params - Payment parameters
   * @param {string} params.invoice - BOLT11 invoice (if paying invoice)
   * @param {string} params.lnurl - LNURL string (if paying LNURL)
   * @param {bigint} params.amountMsat - The amount to pay in millisatoshis
   * @param {string} params.passphrase - The wallet passphrase
   * @param {string} [params.sequenceId] - Optional sequence ID for the payment
   * @param {string} [params.comment] - Optional comment for the payment
   * @param {bigint} [params.feeLimitMsat] - Optional fee limit in millisatoshis
   * @param {number} [params.feeLimitRatio] - Optional fee limit as a ratio
   * @returns {Promise<PayInvoiceResponse>} Payment result
   */
  pay(params: SubmitPaymentParams): Promise<PayInvoiceResponse>;

  /**
   * On chain withdrawal
   * @param {LightningOnchainWithdrawParams} params - Withdraw parameters
   * @param {LightningOnchainRecipient[]} params.recipients - The recipients to pay
   * @param {bigint} [params.satsPerVbyte] - Optional value for sats per virtual byte
   * @returns {Promise<LightningOnchainWithdrawResponse>} Withdraw result containing transaction request details and status
   */
  withdrawOnchain(params: LightningOnchainWithdrawParams): Promise<LightningOnchainWithdrawResponse>;

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
}

export class LightningWallet implements ILightningWallet {
  public wallet: sdkcore.IWallet;

  constructor(wallet: sdkcore.IWallet) {
    const coin = wallet.baseCoin;
    if (coin.getFamily() !== 'lnbtc') {
      throw new Error(`Invalid coin for lightning wallet: ${coin.getFamily()}`);
    }
    this.wallet = wallet;
  }

  async createInvoice(params: CreateInvoiceBody): Promise<Invoice> {
    const createInvoiceResponse = await this.wallet.bitgo
      .post(this.wallet.bitgo.url(`/wallet/${this.wallet.id()}/lightning/invoice`, 2))
      .send(t.exact(CreateInvoiceBody).encode(params))
      .result();
    return sdkcore.decodeOrElse(Invoice.name, Invoice, createInvoiceResponse, (error) => {
      // DON'T throw errors from decodeOrElse. It could leak sensitive information.
      throw new Error(`Invalid create invoice response ${error}`);
    });
  }

  async getInvoice(paymentHash: string): Promise<InvoiceInfo> {
    const response = await this.wallet.bitgo
      .get(this.wallet.bitgo.url(`/wallet/${this.wallet.id()}/lightning/invoice/${paymentHash}`, 2))
      .result();
    return decodeOrElse(InvoiceInfo.name, InvoiceInfo, response, (error) => {
      throw new Error(`Invalid get invoice response ${error}`);
    });
  }

  async listInvoices(params: InvoiceQuery): Promise<InvoiceInfo[]> {
    const returnCodec = t.array(InvoiceInfo);
    const createInvoiceResponse = await this.wallet.bitgo
      .get(this.wallet.bitgo.url(`/wallet/${this.wallet.id()}/lightning/invoice`, 2))
      .query(InvoiceQuery.encode(params))
      .result();
    return sdkcore.decodeOrElse(returnCodec.name, returnCodec, createInvoiceResponse, (error) => {
      throw new Error(`Invalid list invoices response ${error}`);
    });
  }
  /**
   * Private method to handle direct invoice payments
   * @param {SubmitPaymentParams} params - Invoice payment parameters
   * @returns {Promise<PayInvoiceResponse>} Payment result
   * @private
   */
  private async payInvoice(params: InvoicePaymentParams): Promise<PayInvoiceResponse> {
    const reqId = new RequestTracer();
    this.wallet.bitgo.setRequestTracer(reqId);

    const { userAuthKey } = await getLightningAuthKeychains(this.wallet);
    const userAuthKeyEncryptedPrv = userAuthKey.encryptedPrv;
    if (!userAuthKeyEncryptedPrv) {
      throw new Error(`user auth key is missing encrypted private key`);
    }

    const signature = createMessageSignature(
      t.exact(LightningPaymentRequest).encode({
        invoice: params.invoice,
        amountMsat: params.amountMsat,
        feeLimitMsat: params.feeLimitMsat,
        feeLimitRatio: params.feeLimitRatio,
      }),
      this.wallet.bitgo.decrypt({ password: params.passphrase, input: userAuthKeyEncryptedPrv })
    );

    const paymentIntent: { intent: LightningPaymentIntent } = {
      intent: {
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
      },
    };

    const transactionRequestCreate = (await this.wallet.bitgo
      .post(this.wallet.bitgo.url('/wallet/' + this.wallet.id() + '/txrequests', 2))
      .send(t.type({ intent: LightningPaymentIntent }).encode(paymentIntent))
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
    let transfer;
    if (coinSpecific && coinSpecific.paymentHash && typeof coinSpecific.paymentHash === 'string') {
      transfer = await this.wallet.getTransfer({ id: coinSpecific.paymentHash });
    }

    return {
      txRequestId: transactionRequestCreate.txRequestId,
      txRequestState: transactionRequestSend.state,
      paymentStatus: coinSpecific
        ? t.exact(LndCreatePaymentResponse).encode(coinSpecific as LndCreatePaymentResponse)
        : undefined,
      transfer,
    };
  }

  /**
   * Private method to handle LNURL payments
   * @param {SubmitPaymentParams} params - LNURL payment parameters
   * @returns {Promise<PayInvoiceResponse>} Payment result
   * @private
   */
  private async payLnurl(params: LnurlPaymentParams): Promise<PayInvoiceResponse> {
    if (!lnurlProcessor.isValidLnurl(params.lnurl)) {
      throw new Error('Invalid LNURL format');
    }
    const amountSats = params.amountMsat / BigInt(1000);
    const lnurlPaymentResult = await lnurlProcessor.processLnurlPayment(params.lnurl, amountSats, params.comment);
    const comment = params.comment;

    return this.payInvoice({
      ...params,
      invoice: lnurlPaymentResult.invoice,
      comment,
    });
  }

  /**
   * Pay a Lightning invoice or LNURL
   * @param {SubmitPaymentParams} params - Payment parameters
   * @returns {Promise<PayInvoiceResponse>} Payment result
   */
  async pay(params: SubmitPaymentParams): Promise<PayInvoiceResponse> {
    if ('lnurl' in params) {
      return this.payLnurl(params);
    } else if ('invoice' in params) {
      return this.payInvoice(params);
    } else {
      throw new Error('Either invoice or lnurl must be provided');
    }
  }

  async withdrawOnchain(params: LightningOnchainWithdrawParams): Promise<LightningOnchainWithdrawResponse> {
    const reqId = new RequestTracer();
    this.wallet.bitgo.setRequestTracer(reqId);

    const paymentIntent: { intent: LightningPaymentIntent } = {
      intent: {
        onchainRequest: {
          recipients: params.recipients,
          satsPerVbyte: params.satsPerVbyte,
        },
        intentType: 'payment',
      },
    };

    const transactionRequestCreate = (await this.wallet.bitgo
      .post(this.wallet.bitgo.url('/wallet/' + this.wallet.id() + '/txrequests', 2))
      .send(t.type({ intent: LightningPaymentIntent }).encode(paymentIntent))
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

    return {
      txRequestId: transactionRequestCreate.txRequestId,
      txRequestState: transactionRequestSend.state,
    };
  }

  async getPayment(paymentHash: string): Promise<PaymentInfo> {
    const response = await this.wallet.bitgo
      .get(this.wallet.bitgo.url(`/wallet/${this.wallet.id()}/lightning/payment/${paymentHash}`, 2))
      .result();
    return decodeOrElse(PaymentInfo.name, PaymentInfo, response, (error) => {
      throw new Error(`Invalid payment response: ${error}`);
    });
  }

  async listPayments(params: PaymentQuery): Promise<PaymentInfo[]> {
    const response = await this.wallet.bitgo
      .get(this.wallet.bitgo.url(`/wallet/${this.wallet.id()}/lightning/payment`, 2))
      .query(PaymentQuery.encode(params))
      .result();
    return decodeOrElse(t.array(PaymentInfo).name, t.array(PaymentInfo), response, (error) => {
      throw new Error(`Invalid payment list response: ${error}`);
    });
  }

  async getTransaction(txId: string): Promise<Transaction> {
    const response = await this.wallet.bitgo
      .get(this.wallet.bitgo.url(`/wallet/${this.wallet.id()}/lightning/transaction/${txId}`, 2))
      .result();
    return decodeOrElse(Transaction.name, Transaction, response, (error) => {
      throw new Error(`Invalid transaction response ${error}`);
    });
  }

  async listTransactions(params: TransactionQuery): Promise<Transaction[]> {
    const response = await this.wallet.bitgo
      .get(this.wallet.bitgo.url(`/wallet/${this.wallet.id()}/lightning/transaction`, 2))
      .query(TransactionQuery.encode(params))
      .result();
    return decodeOrElse(t.array(Transaction).name, t.array(Transaction), response, (error) => {
      throw new Error(`Invalid transaction list response ${error}`);
    });
  }
}
