import { ITradingNetwork } from './network';

export interface SignPayloadParameters {
  payload: string | Record<string, unknown>;
  walletPassphrase: string;
}

export interface ITradingAccount {
  readonly id: string;
  signPayload(params: SignPayloadParameters): Promise<string>;
  toNetwork(): ITradingNetwork;
}
