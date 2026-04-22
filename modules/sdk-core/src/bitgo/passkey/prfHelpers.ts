import { PasskeyDevice } from './types';

/**
 * Builds the `evalByCredential` map passed to `WebAuthnProvider.get()`.
 * Maps each device's credId to its prfSalt so the authenticator can
 * evaluate the PRF with the correct salt for whichever credential it selects.
 *
 * @param devices - passkey devices stored on the keychain
 * @returns a map of { [credId]: prfSalt }
 */
export function buildEvalByCredential(devices: PasskeyDevice[]): Record<string, string> {
  return Object.fromEntries(devices.map((d) => [d.credId, d.prfSalt]));
}

/**
 * Finds the PasskeyDevice whose credId matches the credential ID returned
 * by the WebAuthn assertion.
 *
 * @param devices - passkey devices stored on the keychain
 * @param credentialId - base64url credential ID from the WebAuthn assertion
 * @throws if no device matches
 */
export function matchDeviceByCredentialId(devices: PasskeyDevice[], credentialId: string): PasskeyDevice {
  const device = devices.find((d) => d.credId === credentialId);
  if (!device) {
    throw new Error(
      `No passkey device found matching credential ID "${credentialId}". ` +
        `Known credential IDs: [${devices.map((d) => d.credId).join(', ')}]`
    );
  }
  return device;
}
