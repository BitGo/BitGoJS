import { IAffirmations } from './iAffirmations';
import { ISettlements } from './iSettlements';
import { ITradingPartners } from './iTradingPartners';
import { Payload } from './payload';

export interface BuildPayloadParameters {
  amounts: BuildPayloadAmounts[];
}

export interface BuildPayloadAmounts {
  accountId: string;
  sendAmount: string;
  sendCurrency: string;
  receiveAmount: string;
  receiveCurrency: string;
}

export interface SignPayloadParameters {
  payload: string | Record<string, unknown>;
  walletPassphrase: string;
}

export interface SettlementFees {
  feeRate: string;
  feeAmount: string;
  feeCurrency: string;
}

export interface CalculateSettlementFeesParams {
  counterpartyAccountId: string;
  sendCurrency: string;
  sendAmount: string;
  receiveCurrency: string;
  receiveAmount: string;
}

export interface ITradingAccount {
  readonly id: string;
  buildPayload(params: BuildPayloadParameters): Promise<Payload>;
  verifyPayload(params: BuildPayloadParameters, payload: string): boolean;
  calculateSettlementFees(params: CalculateSettlementFeesParams): Promise<SettlementFees>;
  signPayload(params: SignPayloadParameters): Promise<string>;
  affirmations(): IAffirmations;
  settlements(): ISettlements;
  partners(): ITradingPartners;
}
