import { AffirmationStatus, IAffirmation } from './iAffirmation';

export interface GetAffirmationParameters {
  id: string;
  accountId?: string;
}

export interface IAffirmations {
  list(status: AffirmationStatus): Promise<AffirmationStatus[]>;
  get(id: undefined, accountId: undefined): Promise<IAffirmation>;
}
