import { IPendingApproval } from './iPendingApproval';

export interface ListPendingApprovalsOptions {
  walletId?: string;
  enterpriseId?: string;
}

export interface GetPendingApprovalOptions {
  id?: string;
}

export interface ListPendingApprovalsResult {
  pendingApprovals: IPendingApproval[];
}

export interface IPendingApprovals {
  list(params?: ListPendingApprovalsOptions): Promise<ListPendingApprovalsResult>;
  get(params?: GetPendingApprovalOptions): Promise<IPendingApproval>;
}
