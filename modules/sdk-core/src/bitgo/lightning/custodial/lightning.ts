import {
  ILightning,
  CreateInvoiceParams,
  PayInvoiceParams,
  LightningWithdrawalParams,
  LightningDepositParams,
  LnurlPayParams,
  CreateInvoiceResponse,
  CreateDepositAddressResponse,
  PayInvoiceResponse,
  GetBalanceResponse,
  WithdrawResponse,
  DepositResponse,
  GetInvoicesQuery,
  GetInvoicesResponse,
  DecodedLnurlPayRequest,
  GetPaymentsQuery,
  GetPaymentsResponse,
} from './iLightning';
import { decodeLnurlPay, fetchLnurlPayInvoice } from './lightningUtils';
import { BitGoBase } from '../../bitgoBase';
import { IWallet } from '../../wallet';
import { decodeOrElse } from '../../utils/decode';
import { randomBytes } from 'crypto';

export class Lightning implements ILightning {
  private readonly bitgo: BitGoBase;
  private readonly wallet: IWallet;
  private readonly url: string;

  constructor(bitgo: BitGoBase, wallet: IWallet) {
    this.bitgo = bitgo;
    this.wallet = wallet;
    this.url = this.bitgo.url(`/wallet/${this.wallet.id()}/lightning`, 2);
  }

  public async createInvoice(params: CreateInvoiceParams): Promise<CreateInvoiceResponse> {
    const body = await this.bitgo
      .post(this.url + '/invoice')
      .send(params)
      .result();

    return decodeOrElse(CreateInvoiceResponse.name, CreateInvoiceResponse, body, (errors) => {
      throw new Error(`error(s) parsing response body: ${errors}`);
    });
  }

  public async createDepositAddress(): Promise<CreateDepositAddressResponse> {
    const body = await this.bitgo.post(this.url + '/address').result();
    return decodeOrElse(CreateDepositAddressResponse.name, CreateDepositAddressResponse, body, (errors) => {
      throw new Error(`error(s) parsing response body: ${errors}`);
    });
  }

  public async payInvoice(params: PayInvoiceParams): Promise<PayInvoiceResponse> {
    const body = await this.bitgo
      .post(this.url + '/payment')
      .send(params)
      .result();

    return decodeOrElse(PayInvoiceResponse.name, PayInvoiceResponse, body, (errors) => {
      throw new Error(`error(s) parsing response body: ${errors}`);
    });
  }

  public async getBalance(): Promise<GetBalanceResponse> {
    const body = await this.bitgo.get(this.url + '/balance').result();
    return decodeOrElse(GetBalanceResponse.name, GetBalanceResponse, body, (errors) => {
      throw new Error(`error(s) parsing response body: ${errors}`);
    });
  }

  public async withdraw(params: LightningWithdrawalParams): Promise<WithdrawResponse> {
    const { value } = params;
    let { destination, sequenceId } = params;

    if (destination === undefined) {
      destination = (await this.wallet.createAddress()).address;
    }

    if (sequenceId === undefined) {
      sequenceId = randomBytes(16).toString('hex');
    }

    const body = await this.bitgo
      .post(this.url + '/withdrawal')
      .send({ value, destination, sequenceId })
      .result();
    return decodeOrElse(WithdrawResponse.name, WithdrawResponse, body, (errors) => {
      throw new Error(`error(s) parsing response body: ${errors}`);
    });
  }

  public async deposit(params: LightningDepositParams): Promise<DepositResponse> {
    const { amount } = params;
    const address = (await this.createDepositAddress()).address;

    const res = await this.wallet.send({ amount, address });

    return decodeOrElse(DepositResponse.name, DepositResponse, res, (errors) => {
      throw new Error(`error(s) parsing response body: ${errors}`);
    });
  }

  public async getInvoices(query?: GetInvoicesQuery): Promise<GetInvoicesResponse> {
    const queryParams = {
      status: query?.status,
      limit: query?.limit,
      startDate: query?.startDate,
      endDate: query?.endDate,
    };

    const body = await this.bitgo
      .get(this.url + '/invoices')
      .query(queryParams)
      .result();
    return decodeOrElse(GetInvoicesResponse.name, GetInvoicesResponse, body, (errors) => {
      throw new Error(`error(s) parsing response body: ${errors}`);
    });
  }

  /**
   * fetches lightning payments by status, limit, startDate and endDate
   * @param query
   * @return {GetPaymentsResponse}
   */
  public async getPayments(query?: GetPaymentsQuery): Promise<GetPaymentsResponse> {
    const queryParams: { status?: string; limit?: number; startDate?: string; endDate?: string } = {};
    queryParams.status = query?.status;
    queryParams.limit = query?.limit;
    queryParams.startDate = query?.startDate;
    queryParams.endDate = query?.endDate;

    const body = await this.bitgo
      .get(this.url + '/payments')
      .query(queryParams)
      .result();
    return decodeOrElse(GetPaymentsResponse.name, GetPaymentsResponse, body, (errors) => {
      throw new Error(`error(s) parsing response body: ${errors}`);
    });
  }

  public decodeLnurlPay(lnurl: string): Promise<DecodedLnurlPayRequest> {
    return decodeLnurlPay(lnurl);
  }

  public fetchLnurlPayInvoice(params: LnurlPayParams): Promise<string> {
    return fetchLnurlPayInvoice(params);
  }
}
