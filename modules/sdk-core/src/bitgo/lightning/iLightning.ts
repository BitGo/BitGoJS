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
  address?: string;
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
}

export interface LnurlPayParams {
  callback: string;
  milliSatAmount: string;
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

// eslint-disable-next-line no-redeclare
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

// eslint-disable-next-line no-redeclare
export type WPTransfer = t.TypeOf<typeof WPTransfer>;

export const WithdrawResponse = t.strict(
  {
    status: t.string,
    transfer: WPTransfer,
  },
  'CreateWithdrawalResponse'
);

// eslint-disable-next-line no-redeclare
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

// eslint-disable-next-line no-redeclare
export type CreateInvoiceResponse = t.TypeOf<typeof CreateInvoiceResponse>;

export const CreateDepositAddressResponse = t.strict(
  {
    address: t.string,
  },
  'CreateDepositAddressResponse'
);

// eslint-disable-next-line no-redeclare
export type CreateDepositAddressResponse = t.TypeOf<typeof CreateDepositAddressResponse>;

export const DepositResponse = t.strict(
  {
    status: t.string,
    transfer: WPTransfer,
  },
  'DepositResponse'
);

// eslint-disable-next-line no-redeclare
export type DepositResponse = t.TypeOf<typeof DepositResponse>;

export const PayInvoiceResponse = t.strict(
  {
    paymentHash: t.string,
    transfer: WPTransfer,
    status: t.string,
  },
  'PayInvoiceResponse'
);

// eslint-disable-next-line no-redeclare
export type PayInvoiceResponse = t.TypeOf<typeof PayInvoiceResponse>;

export const GetBalanceResponse = t.strict(
  {
    balance: t.number,
    availableBalance: t.number,
    maximumBalance: t.number,
  },
  'GetBalanceResponse'
);

// eslint-disable-next-line no-redeclare
export type GetBalanceResponse = t.TypeOf<typeof GetBalanceResponse>;

const InvoiceInfo = t.strict({
  paymentHash: t.string,
  walletId: t.string,
  status: t.string,
  value: t.number,
  expiresAt: t.string,
  createdAt: t.string,
  updatedAt: t.string,
  amtPaidSats: t.number,
});

export const GetInvoicesResponse = t.array(InvoiceInfo);

// eslint-disable-next-line no-redeclare
export type GetInvoicesResponse = t.TypeOf<typeof GetInvoicesResponse>;

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

// eslint-disable-next-line no-redeclare
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
}
