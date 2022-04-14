/**
 * Basic coin recipient information
 */
export interface Recipient {
  address: string;
  amount: string;
}

export type TokenManagementType = 'enabletoken' | 'disabletoken';

export type ExplainTokenTxType= 'enableToken' | 'disableToken' | 'transferToken';
