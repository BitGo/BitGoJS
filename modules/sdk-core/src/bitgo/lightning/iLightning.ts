/* eslint-disable no-redeclare */
import * as t from 'io-ts';

export interface CreateInvoiceParams {
  value: number;
  memo?: string;
  expiry?: number;
}

export interface LightningWithdrawalParams {
  value: number;
  destination?: string;
  sequenceId?: string;
}

export interface LightningDepositParams {
  amount: number;
}

export interface PayInvoiceParams {
  invoice: string;
  sequenceId?: string;
  comment?: string;
  feeLimitRatio?: number;
  feeLimit?: number;
}

export interface GetInvoicesQuery {
  status?: string;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export interface GetPaymentsQuery {
  status?: string;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export interface LnurlPayParams {
  callback: string;
  millisatAmount: string;
  metadata: string;
}

export const WPTransferEntry = t.partial(
  {
    wallet: t.string,
    address: t.string,
    value: t.number,
    valueString: t.string,
    isChange: t.boolean,
    isPayGo: t.boolean,
    token: t.string,
  },
  'WPTransferEntry'
);

export type WPTransferEntry = t.TypeOf<typeof WPTransferEntry>;

export const WPTransfer = t.type(
  {
    entries: t.array(WPTransferEntry),
    id: t.string,
    heightId: t.string,
    type: t.string,
    value: t.number,
    state: t.string,
  },
  'WPTransfer'
);

export type WPTransfer = t.TypeOf<typeof WPTransfer>;

export const WithdrawResponse = t.strict(
  {
    txid: t.string,
  },
  'CreateWithdrawalResponse'
);

export type WithdrawResponse = t.TypeOf<typeof WithdrawResponse>;

export const CreateInvoiceResponse = t.strict(
  {
    value: t.number,
    memo: t.union([t.string, t.undefined]),
    paymentHash: t.string,
    invoice: t.string,
    walletId: t.string,
    status: t.string,
    expiresAt: t.string,
  },
  'CreateInvoiceResponse'
);

export type CreateInvoiceResponse = t.TypeOf<typeof CreateInvoiceResponse>;

export const CreateDepositAddressResponse = t.strict(
  {
    address: t.string,
  },
  'CreateDepositAddressResponse'
);

export type CreateDepositAddressResponse = t.TypeOf<typeof CreateDepositAddressResponse>;

export const DepositResponse = t.strict(
  {
    status: t.string,
    transfer: WPTransfer,
  },
  'DepositResponse'
);

export type DepositResponse = t.TypeOf<typeof DepositResponse>;

export const PayInvoiceResponse = t.strict(
  {
    paymentHash: t.string,
    transfer: WPTransfer,
    status: t.string,
  },
  'PayInvoiceResponse'
);

export type PayInvoiceResponse = t.TypeOf<typeof PayInvoiceResponse>;

export const GetBalanceResponse = t.strict(
  {
    balance: t.number,
    availableBalance: t.number,
    maximumBalance: t.number,
  },
  'GetBalanceResponse'
);

export type GetBalanceResponse = t.TypeOf<typeof GetBalanceResponse>;

const InvoiceInfo = t.strict({
  paymentHash: t.string,
  walletId: t.string,
  status: t.union([t.literal('open'), t.literal('settled'), t.literal('canceled')]),
  value: t.number,
  expiresAt: t.string,
  createdAt: t.string,
  updatedAt: t.string,
  amtPaidSats: t.union([t.number, t.undefined]),
});

export const GetInvoicesResponse = t.array(InvoiceInfo);

export type GetInvoicesResponse = t.TypeOf<typeof GetInvoicesResponse>;

const PaymentInfo = t.strict({
  paymentHash: t.string,
  walletId: t.string,
  status: t.union([t.literal('in_flight'), t.literal('settled'), t.literal('failed')]),
  amount: t.union([t.number, t.undefined]),
  invoice: t.string,
  sendQueueId: t.string,
  failureReason: t.union([t.string, t.undefined]),
  fee: t.union([t.number, t.undefined]),
  feeLimit: t.number,
  paymentPreimage: t.union([t.string, t.undefined]),
  destination: t.string,
});

export const GetPaymentsResponse = t.array(PaymentInfo);

export type GetPaymentsResponse = t.TypeOf<typeof GetPaymentsResponse>;

export const LnurlPayResponse = t.strict({
  tag: t.literal('payRequest'),
  callback: t.string,
  /** The maximum amount in millisatoshis we can pay for this LNRUL request */
  maxSendable: t.number,
  /** The minimum amount in millisatoshis we can pay for this LNRUL request */
  minSendable: t.number,
  /** A json array in string format describing the payment */
  metadata: t.string,
});

export type LnurlPayResponse = t.TypeOf<typeof LnurlPayResponse>;

export type DecodedLnurlPayRequest = LnurlPayResponse & {
  /**
   * From https://github.com/fiatjaf/lnurl-rfc/blob/luds/06.md#pay-to-static-qrnfclink
   * a payment dialog must include: Domain name extracted from LNURL query string.
   */
  domain: string;
};

export interface ILightning {
  createInvoice(params: CreateInvoiceParams): Promise<CreateInvoiceResponse>;
  createDepositAddress(): Promise<CreateDepositAddressResponse>;
  payInvoice(params: PayInvoiceParams): Promise<PayInvoiceResponse>;
  getBalance(): Promise<GetBalanceResponse>;
  withdraw(params: LightningWithdrawalParams): Promise<WithdrawResponse>;
  deposit(params: LightningDepositParams): Promise<DepositResponse>;
  getInvoices(query?: GetInvoicesQuery): Promise<GetInvoicesResponse>;
  decodeLnurlPay(lnurl: string): Promise<DecodedLnurlPayRequest>;
  fetchLnurlPayInvoice(params: LnurlPayParams): Promise<string>;
  getPayments(query?: GetPaymentsQuery): Promise<GetPaymentsResponse>;
}
