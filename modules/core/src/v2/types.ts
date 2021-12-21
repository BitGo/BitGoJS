export type V1Network = 'bitcoin' | 'testnet';

/**
 * Basic coin recipient information
 */
export interface Recipient {
  address: string;
  amount: string;
}

export interface RequestTracer {
  inc(): void;
  toString(): string;
}

/**
 * @deprecated use TransactionType.EnableToken and TransactionType.DisableToken
 */
export type TokenManagementType = 'enabletoken' | 'disabletoken';

/**
 * @deprecated use TransactionType.Enabletoken and TransactionType.DisableToken
 */
export type ExplainTokenTxType= 'enableToken' | 'disableToken' | 'transferToken';
