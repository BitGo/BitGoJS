/**
 * @prettier
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
  FAILED = 'failed'
}
