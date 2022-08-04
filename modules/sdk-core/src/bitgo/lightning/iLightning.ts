import * as t from 'io-ts';

export interface CreateInvoiceParams {
  amount: number;
  memo?: string;
  expiration?: number;
}

export interface CreateDepositAddressParams {
  amount: number;
  memo?: string;
  expiration?: number;
}

export interface GetInvoicesParams {
  id?: string;
  status?: 'open' | 'closed';
}

export interface LightningWithdrawalParams {
  amount: number;
  address?: string;
  sequenceId?: string;
}

export interface LightningDepositParams {
  amount: number;
  address?: string;
  sequenceId?: string;
}

export interface PayInvoiceParams {
  invoice: string;
}

export const WPTransferEntry = t.type(
  {
    wallet: t.string,
    address: t.string,
    value: t.number,
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
  },
  'GetBalanceResponse'
);

// eslint-disable-next-line no-redeclare
export type GetBalanceResponse = t.TypeOf<typeof GetBalanceResponse>;

const GetInvoiceResponse = t.strict(
  {
    paymentHash: t.string,
    walletId: t.string,
    status: t.string,
    expiresAt: t.string,
    value: t.number,
    amtPaidMillisats: t.number,
    updatedAt: t.string,
    createdAt: t.string,
  },
  'GetInvoiceResponse'
);

// eslint-disable-next-line no-redeclare
type GetInvoiceResponse = t.TypeOf<typeof GetInvoiceResponse>;

export const GetInvoicesResponse = t.array(GetInvoiceResponse);

// eslint-disable-next-line no-redeclare
export type GetInvoicesResponse = t.TypeOf<typeof GetInvoicesResponse>;

export interface ILightning {
  createInvoice(params?: CreateInvoiceParams): Promise<CreateInvoiceResponse>;
  createDepositAddress(params?: CreateDepositAddressParams): Promise<CreateDepositAddressResponse>;
  payInvoice(params?: PayInvoiceParams): Promise<PayInvoiceResponse>;
  getBalance(): Promise<GetBalanceResponse>;
  withdraw(params?: LightningWithdrawalParams): Promise<WithdrawResponse>;
  deposit(params?: LightningDepositParams): Promise<DepositResponse>;
  getInvoices(params?: GetInvoicesParams): Promise<GetInvoicesResponse>;
}
