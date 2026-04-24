import { KeychainWebauthnDevice } from '../keychain/iKeychains';

/**
 * Builds the `evalByCredential` map passed to `WebAuthnProvider.get()`.
 * Maps each device's credID to its prfSalt so the authenticator can
 * evaluate the PRF with the correct salt for whichever credential it selects.
 *
 * Mirrors retail's buildEvalByCredentialFromKeychain — takes KeychainWebauthnDevice[]
 * directly so credID is read from authenticatorInfo where it actually lives.
 *
 * @param devices - webauthnDevices from the wallet keychain
 * @returns a map of { [credID]: prfSalt }
 */
export function buildEvalByCredential(devices: KeychainWebauthnDevice[]): Record<string, string> {
  return Object.fromEntries(devices.map((d) => [d.authenticatorInfo.credID, d.prfSalt]));
}

/**
 * Finds the KeychainWebauthnDevice whose credID matches the credential ID
 * returned by the WebAuthn assertion.
 *
 * @param devices - webauthnDevices from the wallet keychain
 * @param credentialId - base64url credential ID from the WebAuthn assertion
 * @throws if no device matches
 */
export function matchDeviceByCredentialId(
  devices: KeychainWebauthnDevice[],
  credentialId: string
): KeychainWebauthnDevice {
  const device = devices.find((d) => d.authenticatorInfo.credID === credentialId);
  if (!device) {
    throw new Error(
      `No passkey device found matching credential ID "${credentialId}". ` +
        `Known credential IDs: [${devices.map((d) => d.authenticatorInfo.credID).join(', ')}]`
    );
  }
  return device;
}
