import type { WebauthnDevice } from '@bitgo/public-types';

/**
 * Builds the PRF eval map and credential-to-device lookup from a wallet
 * keychain's webauthn devices. Devices without a prfSalt are skipped.
 */
export function buildEvalByCredential(devices: WebauthnDevice[]): {
  evalByCredential: Record<string, string>;
  credIdToDevice: Map<string, WebauthnDevice>;
} {
  const evalByCredential: Record<string, string> = {};
  const credIdToDevice = new Map<string, WebauthnDevice>();

  for (const device of devices) {
    if (!device.prfSalt) continue;
    const { credID } = device.authenticatorInfo;
    evalByCredential[credID] = device.prfSalt;
    credIdToDevice.set(credID, device);
  }

  return { evalByCredential, credIdToDevice };
}

/**
 * Returns the WebauthnDevice matching the given credential ID.
 * @throws if no matching device is found
 */
export function matchDeviceByCredentialId(devices: WebauthnDevice[], credentialId: string): WebauthnDevice {
  const device = devices.find((d) => d.authenticatorInfo.credID === credentialId);
  if (!device) {
    throw new Error('Could not identify which passkey device was used');
  }
  return device;
}
