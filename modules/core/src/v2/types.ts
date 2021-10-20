export type NodeCallback<R> = (err: Error, res: R) => void;
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

export type TokenManagementType = 'enabletoken' | 'disabletoken';

export type ExplainTokenTxType= 'enableToken' | 'disableToken' | 'transferToken';
