import {
  ILightning,
  CreateInvoiceParams,
  PayInvoiceParams,
  LightningWithdrawalParams,
  LightningDepositParams,
  CreateInvoiceResponse,
  CreateDepositAddressResponse,
  PayInvoiceResponse,
  GetBalanceResponse,
  WithdrawResponse,
  DepositResponse,
} from './iLightning';
import { BitGoBase } from '../bitgoBase';
import { IWallet } from '../wallet';
import { decodeOrElse } from '../utils/decode';
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

  public async deposit(params?: LightningDepositParams): Promise<DepositResponse> {
    throw new Error('method not implemented');
  }
}
