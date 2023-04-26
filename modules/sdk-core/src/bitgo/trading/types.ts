import {
  ISettlementAffirmations,
  ISettlementTradingPartners,
  ISettlements,
  SettlementTradeAmount,
  SettlementTradePayload,
} from '../settlements';

export type BuildPayloadParameters = {
  amounts: SettlementTradeAmount[];
};

export type SignPayloadParameters = {
  payload: string | SettlementTradePayload;
  walletPassphrase: string;
};

export type ITradingAccount = {
  readonly id: string;
  buildPayload(params: BuildPayloadParameters): Promise<SettlementTradePayload>;
  verifyPayload(params: BuildPayloadParameters, payload: string): boolean;
  signPayload(params: SignPayloadParameters): Promise<string>;
  affirmations(): ISettlementAffirmations;
  settlements(): ISettlements;
  partners(): ISettlementTradingPartners;
};
