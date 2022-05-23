import { IAffirmation } from './iAffirmation';
import { Trade } from './trade';

export enum SettlementStatus {
  CANCELED = 'canceled',
  PENDING = 'pending',
  REJECTED = 'rejected',
  SETTLED = 'settled',
  FAILED = 'failed',
}

export enum SettlementType {
  DIRECT = 'direct',
  AGENCY = 'agency',
}

export interface ISettlement {
  id: string;
  requesterAccountId: string;
  status: SettlementStatus;
  type: SettlementType;
  affirmations: IAffirmation[];
  createdAt: Date;
  expireAt: Date;
  settledAt: Date;
  trades: Trade[];
}
