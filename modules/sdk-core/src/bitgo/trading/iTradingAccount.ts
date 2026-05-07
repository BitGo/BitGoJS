import { ITradingNetwork } from './network';

/**
 * Parameters for the signing a payload from the trading account.
 * If both walletPassphrase and prv are not provided, the BitGo key will be used.
 *
 * @note If wallet has userKeySigningRequired set to true, then attempting to sign with BitGo key will throw.
 *
 * @param payload - The payload to sign
 * @param walletPassphrase - The passphrase of the wallet that will be used to decrypt the user key and sign the payload.
 * @param prv - The decrypted user key prv used to sign the payload
 */
export interface SignPayloadParameters {
  payload: string | Record<string, unknown>;
  walletPassphrase?: string;
  prv?: string;
}

export interface ITradingAccount {
  readonly id: string;
  signPayload(params: SignPayloadParameters): Promise<string>;
  toNetwork(): ITradingNetwork;
}
