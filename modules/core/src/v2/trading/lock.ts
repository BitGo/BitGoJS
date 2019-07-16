/**
 * @prettier
 */
export interface Lock {
  id: string;
  accountId: string;
  status: LockStatus;
  amount: string;
  currency: string;
  createdAt: Date;
}

export enum LockStatus {
  ACTIVE = 'active',
  SETTLED = 'settled',
  FAILED = 'failed',
  REQUESTED = 'requested',
  RELEASED = 'released',
}
