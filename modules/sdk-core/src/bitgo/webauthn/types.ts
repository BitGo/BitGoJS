export type { WebAuthnOtpDevice } from '@bitgo/public-types';

/** Result of a WebAuthn assertion with the PRF extension. */
export interface PasskeyAuthResult {
  prfResult: ArrayBuffer | undefined;
  credentialId: string;
  otpCode: string;
}

/** Options for WebAuthnProvider.get(). */
export interface PasskeyGetOptions {
  publicKey: PublicKeyCredentialRequestOptions;
  evalByCredential?: Record<string, string>;
}

/** Abstraction over the WebAuthn credential API. */
export interface WebAuthnProvider {
  create(options: PublicKeyCredentialCreationOptions): Promise<PublicKeyCredential>;
  get(options: PasskeyGetOptions): Promise<PasskeyAuthResult>;
}
