export interface WebAuthnOtpDevice {
  /** MongoDB ObjectId — used for deletion API calls */
  otpDeviceId: string;
  /** base64url WebAuthn credential ID */
  credID: string;
  /** WebAuthn attestation format */
  fmt: 'none' | 'packed' | 'fido-u2f';
  /** Base64-encoded public key from the authenticator */
  publicKey: string;
  /** base64url-encoded salt from the server — optional */
  prfSalt?: string;
  /** SJCL-encrypted private key (present once passkey is attached to a wallet keychain) */
  encryptedPrv?: string;
}

export interface PasskeyAuthResult {
  /** Raw PRF output — undefined if the authenticator does not support PRF */
  prfResult: ArrayBuffer | undefined;
  /** base64url credential ID returned by the authenticator — matches KeychainWebauthnDevice.authenticatorInfo.credID */
  credentialId: string;
  /** JSON-stringified WebAuthn assertion — pass to sdk.unlock({ otp: otpCode }) */
  otpCode: string;
}

export interface WebAuthnProvider {
  create(options: PublicKeyCredentialCreationOptions): Promise<PublicKeyCredential | null>;
  get(options: PublicKeyCredentialRequestOptions): Promise<PublicKeyCredential | null>;
}
