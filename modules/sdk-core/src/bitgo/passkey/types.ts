export interface PasskeyDevice {
  /** MongoDB ObjectId — used for deletion API calls */
  otpDeviceId: string;
  /** base64url WebAuthn credential ID — used for PRF evalByCredential map */
  credId: string;
  /** Enterprise-scoped PRF salt stored on the keychain */
  prfSalt: string;
  /** SJCL-encrypted private key (present once passkey is attached to a wallet keychain) */
  encryptedPrv?: string;
}

export interface PasskeyAuthResult {
  /** Raw PRF output from a WebAuthn assertion */
  prfResult: ArrayBuffer;
  /** base64url credential ID returned by the authenticator — matches PasskeyDevice.credId */
  credentialId: string;
  otpCode?: string;
}

export interface WebAuthnProvider {
  create(options: PublicKeyCredentialCreationOptions): Promise<PublicKeyCredential>;
  get(options: PublicKeyCredentialRequestOptions): Promise<PublicKeyCredential>;
}
