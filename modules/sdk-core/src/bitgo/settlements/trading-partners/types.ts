import { SettlementTradingPartner, SettlementTradingPartnerStatus } from '../types';

export type ISettlementTradingPartners = {
  add(params: CreateTradingPartnerRequest): Promise<CreateTradingPartnerResponse>;
  list(params: ListTradingPartnersByEnterpriseRequest): Promise<ListTradingPartnersByEnterpriseResponse>;
  listByAccount(params: ListTradingPartnersByAccountRequest): Promise<ListTradingPartnersByAccountResponse>;
};

export type CreateTradingPartnerRequest = { accountId?: string; referralCode: string };

export type CreateTradingPartnerResponse = SettlementTradingPartner;

export type ListTradingPartnersByAccountRequest = {
  accountId?: string;
  status: SettlementTradingPartnerStatus;
};

export type ListTradingPartnersByAccountResponse = {
  tradingPartnerList: SettlementTradingPartner;
};

export type ListTradingPartnersByEnterpriseRequest = {
  status: SettlementTradingPartnerStatus;
};

export type ListTradingPartnersByEnterpriseResponse = {
  tradingPartnerList: SettlementTradingPartner;
};
