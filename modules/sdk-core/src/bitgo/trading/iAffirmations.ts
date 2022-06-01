import { AffirmationStatus, IAffirmation } from './iAffirmation';

export interface GetAffirmationParameters {
  id: string;
  accountId?: string;
}

export interface IAffirmations {
  list(status?: AffirmationStatus): Promise<IAffirmation[]>;
  get(options: GetAffirmationParameters): Promise<IAffirmation>;
}
