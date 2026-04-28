import { ITradingNetwork } from './network';

/**
 * Parameters for the signing a payload from the trading account
 * @param payload - The payload to sign
 * @param walletPassphrase - The passphrase of the wallet that will be used to decrypt the user key and sign the payload. If not provided, the BitGo key will be used.
 */
export interface SignPayloadParameters {
  payload: string | Record<string, unknown>;
  walletPassphrase?: string;
}

export interface ITradingAccount {
  readonly id: string;
  signPayload(params: SignPayloadParameters): Promise<string>;
  toNetwork(): ITradingNetwork;
}
