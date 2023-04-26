import { ISettlementAccount } from '../account';
import { ISettlementAffirmations } from '../affirmations';
import { ISettlementTradingPartners } from '../trading-partners';
import {
  PaginatedQuery,
  Settlement,
  SettlementSigning,
  SettlementStatus,
  SettlementTrade,
  SettlementTradeAmount,
  SettlementVersion,
} from '../types';

export type ISettlements = {
  create(params: CreateSettlementRequest): Promise<CreateSettlementResponse>;
  get(params: GetSettlementRequest): Promise<GetSettlementResponse>;
  list(params: ListSettlementByEnterpriseRequest): Promise<ListSettlementByEnterpriseResponse>;
  listByAccount(params: ListSettlementByAccountRequest): Promise<ListSettlementByAccountResponse>;
  getTradePayload(params: GetTradePayloadRequest): Promise<GetTradePayloadResponse>;

  account: ISettlementAccount;
  affirmations: ISettlementAffirmations;
  tradingPartners: ISettlementTradingPartners;
};

export type CreateSettlementRequest = {
  accountId?: string;
  externalReference?: string;
  signing?: SettlementSigning;
  tradeList: Omit<SettlementTrade, 'id'>[];
};

export type CreateSettlementResponse = Settlement;

export type GetSettlementRequest = {
  accountId?: string;
  settlementId: string;
};

export type GetSettlementResponse = Settlement;

export type ListSettlementByAccountRequest = PaginatedQuery & {
  accountId?: string;
  status?: SettlementStatus;
};

export type ListSettlementByAccountResponse = { settlementList: Settlement[] };

export type ListSettlementByEnterpriseRequest = PaginatedQuery & {
  status?: SettlementStatus;
};

export type ListSettlementByEnterpriseResponse = { settlementList: Settlement[] };

export type GetTradePayloadRequest = {
  accountId?: string;
  version: SettlementVersion;
  amountsList: SettlementTradeAmount[];
};

export type GetTradePayloadResponse = {
  payload: string;
};
