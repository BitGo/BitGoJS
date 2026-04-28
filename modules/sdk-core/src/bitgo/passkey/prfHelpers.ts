import type { KeychainWebauthnDevice } from '../keychain/iKeychains';

/**
 * Builds the PRF eval map and credential-to-device lookup from a wallet keychain's webauthn devices.
 * Devices without a prfSalt are skipped.
 */
export function buildEvalByCredential(devices: KeychainWebauthnDevice[]): {
  evalByCredential: Record<string, string>;
  credIdToDevice: Map<string, KeychainWebauthnDevice>;
} {
  const evalByCredential: Record<string, string> = {};
  const credIdToDevice = new Map<string, KeychainWebauthnDevice>();

  for (const device of devices) {
    if (!device.prfSalt) continue;

    const { credID } = device.authenticatorInfo;
    evalByCredential[credID] = device.prfSalt;
    credIdToDevice.set(credID, device);
  }

  return { evalByCredential, credIdToDevice };
}

/**
 * Returns the webauthn device matching the given credential ID.
 * @throws if no matching device is found
 */
export function matchDeviceByCredentialId(
  devices: KeychainWebauthnDevice[],
  credentialId: string
): KeychainWebauthnDevice {
  const { credIdToDevice } = buildEvalByCredential(devices);
  const device = credIdToDevice.get(credentialId);
  if (!device) {
    throw new Error('Could not identify which passkey device was used');
  }
  return device;
}
