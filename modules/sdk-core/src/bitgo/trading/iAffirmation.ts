import { Payload } from './payload';

export enum AffirmationStatus {
  PENDING = 'pending',
  OVERDUE = 'overdue',
  REJECTED = 'rejected',
  AFFIRMED = 'affirmed',
  FAILED = 'failed',
  CANCELED = 'canceled',
}

export interface IAffirmation {
  affirm(payload: Payload, signature: string): Promise<void>;
  reject(): Promise<void>;
  cancel(): Promise<void>;
}
