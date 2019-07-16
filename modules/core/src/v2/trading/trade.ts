/**
 * @prettier
 */
/**
 * Represents a single trade to be settled as part of a settlement. Only off-chain (OFC) currencies are supported, and
 * all amounts must be represented in base units (such as cents, satoshi, or wei)
 */
export interface Trade {
  id?: string;
  externalId: string;
  baseAccountId: string;
  quoteAccountId: string;
  timestamp: Date;
  status: TradeStatus;
  baseAmount: string;
  quoteAmount: string;
  baseCurrency: string;
  quoteCurrency: string;
  costBasis: string;
  costBasisCurrency: string;
}

export enum TradeStatus {
  CANCELED = 'canceled',
  EXECUTED = 'executed',
  PENDING = 'pending',
  FAILED = 'failed',
}
