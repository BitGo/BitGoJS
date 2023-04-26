export type SettlementSigning = {
  payload: string;
  signature: string;
};

export type SettlementCostBasis = {
  amount: string;
  currency: string;
};

export type Settlement = {
  id: string;
  externalId: string;
  requesterAccountId: string;
  requesterAccountName: string;
  status: SettlementStatus;
  type: string;
  affirmationsList: SettlementAffirmation[];
  expireAt: string; // DateFromISOString
  finalizedAt?: string; // DateFromISOString
  createdAt: string; // DateFromISOString
  tradesList: SettlementTrade[];
};

export enum SettlementStatus {
  CANCELED = 'canceled',
  FAILED = 'failed',
  PENDING = 'pending',
  REJECTED = 'rejected',
  SETTLED = 'settled',
  EXPIRED = 'expired',
}

export type SettlementAffirmation = {
  id: string;
  counterpartyAccountId: string;
  counterpartyName: string;
  partyAccountId: string;
  partyAccountName: string;
  status: SettlementAffirmationStatus;
  lock: SettlementAffirmationLock;
  payload?: string;
  signature?: string;
  createdAt: string; // DateFromISOString
  expireAt: string; // DateFromISOString
};

export enum SettlementAffirmationStatus {
  ACKNOWLEDGED = 'acknowledged',
  CANCELED = 'canceled',
  REJECTED = 'rejected',
  AFFIRMED = 'affirmed',
  PENDING = 'pending',
  FAILED = 'failed',
  OVERDUE = 'overdue',
  EXPIRED = 'expired',
}

export type SettlementAffirmationLock = {
  id: string;
  accountId: string;
  status: SettlementAffirmationLockStatus;
  subtotal: string;
  amount: string;
  currency: string;
  receiveAmount: string;
  receiveCurrency: string;
  fees?: SettlementAffirmationLockFee;
  createdAt: string;
  lockId: string;
};

export type SettlementAffirmationLockStatus =
  | 'LockStatusActive'
  | 'LockStatusFailed'
  | 'LockStatusReleased'
  | 'LockStatusRequested'
  | 'LockStatusSettled';

export type SettlementAffirmationLockFee = {
  feeAmount: string;
  feeRate: string;
  feeCurrency: string; // SupportedCurrency
};

export type SettlementTrade = {
  id: string;
  externalId: string;
  baseAccountId: string;
  quoteAccountId: string;
  timestamp: string; // DateFromISOString
  status: SettlementTradeStatus;
  baseCurrency: string;
  baseAmount: string;
  quoteCurrency: string;
  quoteAmount: string;
  costBasis?: SettlementCostBasis;
};

export enum SettlementTradeStatus {
  CANCELED = 'canceled',
  EXECUTED = 'executed',
  PENDING = 'pending',
  FAILED = 'failed',
}

export type PaginatedQuery = {
  offset?: number;
  limit?: number;
};

export type SettlementVersion = '2.0.0';

export type SettlementTradeAmount = {
  accountId: string;
  sendAmount: string;
  sendCurrency: string;
  receiveAmount: string;
  receiveCurrency: string;
};

export enum SettlementTradingPartnerStatus {
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  CANCELED = 'canceled',
}

export type SettlementTradingPartner = {
  id: string;
  primaryAccountId: string;
  primaryEnterpriseName: string;
  secondaryAccountId: string;
  secondaryEnterpriseName: string;
  status: SettlementTradingPartnerStatus;
  updatedAt: string; // DateFromISOString
};

export type SettlementTradePayload = {
  nonce: string;
  version: SettlementVersion;
  signerAccount: string;
  party: SettlementTradePayloadParty;
  counterparty: SettlementTradePayloadCounterparty;
};

export type SettlementTradePayloadParty = {
  walletId: string;
  currency: string;
  amount: string;
};

export type SettlementTradePayloadCounterparty = {
  walletId: string;
  currency: string;
  amount: string;
};

export type SettlementAccountSettings = {
  accountId: string;
  affirmationExpirationTime: string;
  feeRates?: SettlementAccountSettingsFeeRate;
  referralCode: string;
};

export type SettlementAccountSettingsFeeRate = {
  settlement: number;
};
