export type NodeCallback<R> = (err: Error, res: R) => void;
export type V1Network = 'bitcoin' | 'testnet';
export type V1RmgNetwork = 'rmg' | 'rmgTest';

/**
 * Basic coin recipient information
 */
export interface Recipient {
  address: string;
  amount: string;
}
