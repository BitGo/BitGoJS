export interface Lock {
  id: string;
  accountId: string;
  status: LockStatus;
  amount: string;
  currency: string;
  createdAt: Date;
}

export enum LockStatus {
  ACTIVE, SETTLED, FAILED, REQUESTED, RELEASED
}
