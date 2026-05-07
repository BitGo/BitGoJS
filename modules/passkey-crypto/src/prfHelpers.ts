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

    // Normalise credID to base64url (no padding, URL-safe chars) so it matches
    // the key format used by attachPasskeyToWallet (device.credentialId from the
    // browser, which is already base64url). The WebAuthn PRF extension looks up
    // the selected credential's ID against evalByCredential keys — if the encoding
    // differs (e.g. standard base64 with padding/+/), the lookup silently fails and
    // PRF evaluates with no salt, producing a different output.
    const credIdBase64url = credID.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    // Pass prfSalt through as-is (base64url). attachPasskeyToWallet writes the
    // server-stored salt in the same encoding and feeds the same string to
    // the PRF extension at attach time, so both paths produce the same salt
    // bytes — provided the WebAuthn provider layer decodes base64url before
    // handing the bytes to navigator.credentials.get.
    evalByCredential[credIdBase64url] = device.prfSalt;
    credIdToDevice.set(credIdBase64url, device);
  }

  return { evalByCredential, credIdToDevice };
}

/**
 * Returns the WebauthnDevice matching the given credential ID.
 * @throws if no matching device is found
 */
export function matchDeviceByCredentialId(devices: WebauthnDevice[], credentialId: string): WebauthnDevice {
  // Normalise both sides to base64url so padding/char differences don't break matching.
  const normalise = (s: string) => s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const needle = normalise(credentialId);
  const device = devices.find((d) => normalise(d.authenticatorInfo.credID) === needle);
  if (!device) {
    throw new Error('Could not identify which passkey device was used');
  }
  return device;
}
