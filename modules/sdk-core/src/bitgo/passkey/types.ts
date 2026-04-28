export type { WebAuthnOtpDevice } from '@bitgo/public-types';

/** Result of a WebAuthn assertion with the PRF extension. */
export interface PasskeyAuthResult {
  // raw PRF output; undefined if the authenticator does not support PRF
  prfResult: ArrayBuffer | undefined;
  // base64url credential ID identifying which passkey was used
  credentialId: string;
  // OTP code from the assertion
  otpCode: string;
}

/** Options for WebAuthnProvider.get(). */
export interface PasskeyGetOptions {
  publicKey: PublicKeyCredentialRequestOptions;
  // PRF eval map: { [credentialId]: prfSalt }
  evalByCredential?: Record<string, string>;
}

/** Abstraction over the WebAuthn credential API. Inject a mock in tests. */
export interface WebAuthnProvider {
  create(options: PublicKeyCredentialCreationOptions): Promise<PublicKeyCredential>;
  get(options: PasskeyGetOptions): Promise<PasskeyAuthResult>;
}
