import { PaginatedQuery, SettlementAffirmation, SettlementAffirmationStatus } from '../types';

export type ISettlementAffirmations = {
  get(params: GetAffirmationRequest): Promise<GetAffirmationResponse>;
  list(params: ListAffirmationsByEnterpriseRequest): Promise<ListAffirmationsByEnterpriseResponse>;
  listByAccount(params: ListAffirmationsByAccountRequest): Promise<ListAffirmationsByAccountResponse>;
  update(params: UpdateAffirmationRequest): Promise<UpdateAffirmationResponse>;
};

export type GetAffirmationRequest = { accountId?: string; id: string };

export type GetAffirmationResponse = SettlementAffirmation;

export type ListAffirmationsByAccountRequest = PaginatedQuery & {
  accountId?: string;
  status: SettlementAffirmationStatus;
};

export type ListAffirmationsByAccountResponse = {
  affirmationList: SettlementAffirmation[];
};

export type ListAffirmationsByEnterpriseRequest = PaginatedQuery & {
  status: SettlementAffirmationStatus;
};

export type ListAffirmationsByEnterpriseResponse = {
  affirmationList: SettlementAffirmation[];
};

export type UpdateAffirmationRequest = {
  accountId?: string;
  id: string;
  status: SettlementAffirmationStatus;
};

export type UpdateAffirmationResponse = SettlementAffirmation;
