import { ITradingPartner, TradingPartnerType } from './iTradingPartner';

export enum TradingReferralRequesterSide {
  PRIMARY = 'primary', // if partnership is of type agency, primary is the agent
  SECONDARY = 'secondary',
}

export interface TradingPartnerAddByCodeParameters {
  referralCode: string;
  type: TradingPartnerType;
  requesterSide: TradingReferralRequesterSide;
}

export interface ITradingPartners {
  list(): Promise<ITradingPartner[]>;
  addByCode(params: TradingPartnerAddByCodeParameters): Promise<ITradingPartner>;
}
