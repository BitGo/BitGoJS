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

export class Lightning implements ILightning {
  private readonly bitgo: BitGoBase;
  private readonly url: string;

  constructor(bitgo: BitGoBase, walletId: string) {
    this.bitgo = bitgo;
    this.url = this.bitgo.url(`/wallet/${walletId}/lightning/`, 2);
  }

  public async createInvoice(params?: CreateInvoiceParams): Promise<CreateInvoiceResponse> {
    throw new Error('method not implemented');
  }

  public async createDepositAddress(): Promise<CreateDepositAddressResponse> {
    throw new Error('method not implemented');
  }

  public async payInvoice(params?: PayInvoiceParams): Promise<PayInvoiceResponse> {
    throw new Error('method not implemented');
  }

  public async getBalance(): Promise<GetBalanceResponse> {
    throw new Error('method not implemented');
  }

  public async withdraw(params?: LightningWithdrawalParams): Promise<WithdrawResponse> {
    throw new Error('method not implemented');
  }

  public async deposit(params?: LightningDepositParams): Promise<DepositResponse> {
    throw new Error('method not implemented');
  }
}
