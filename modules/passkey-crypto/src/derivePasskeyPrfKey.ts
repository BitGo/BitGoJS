import type { BitGoBase, IWallet, KeychainWebauthnDevice, KeychainWithEncryptedPrv } from '@bitgo/sdk-core';
import { buildEvalByCredential, matchDeviceByCredentialId } from './prfHelpers';
import { derivePassword } from './derivePassword';
import type { WebAuthnProvider } from './webAuthnTypes';

/** API payloads may use either spelling for the webauthn device list. */
type UserKeychainResponse = KeychainWithEncryptedPrv & {
  webAuthnDevices?: KeychainWebauthnDevice[];
};

function webauthnDevicesFromKeychain(keychain: UserKeychainResponse): KeychainWebauthnDevice[] | undefined {
  const lower = keychain.webauthnDevices;
  if (lower !== undefined && lower.length > 0) {
    return lower;
  }
  const upper = keychain.webAuthnDevices;
  if (upper !== undefined && upper.length > 0) {
    return upper;
  }
  return undefined;
}

function challengeFromAuthResponse(body: unknown): string {
  if (typeof body !== 'object' || body === null) {
    throw new Error('Invalid assertion challenge response');
  }
  const rec = body as Record<string, unknown>;
  if (typeof rec.challenge !== 'string') {
    throw new Error('Invalid assertion challenge response');
  }
  return rec.challenge;
}

/**
 * Derives a wallet passphrase from a passkey PRF output.
 *
 * Fetches the wallet's user keychain, triggers a WebAuthn assertion with PRF
 * evaluation, and returns a hex-encoded passphrase suitable for use as
 * walletPassphrase in signing calls.
 */
export async function derivePasskeyPrfKey(params: {
  bitgo: BitGoBase;
  wallet: IWallet;
  provider: WebAuthnProvider;
}): Promise<string> {
  const { bitgo, wallet, provider } = params;

  const keychain: UserKeychainResponse = await wallet.getEncryptedUserKeychain();
  const devices = webauthnDevicesFromKeychain(keychain);

  if (!devices || devices.length === 0) {
    throw new Error('No passkey devices available');
  }

  const { evalByCredential } = buildEvalByCredential(devices);

  if (Object.keys(evalByCredential).length === 0) {
    throw new Error('No passkey devices available with a valid PRF salt');
  }

  const challenge = challengeFromAuthResponse(await bitgo.get(bitgo.url('/user/otp/webauthn/auth', 2)).result());

  const allowCredentials = Object.keys(evalByCredential).map((credId) => {
    const nodeBuf = Buffer.from(credId.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    const id = nodeBuf.buffer.slice(nodeBuf.byteOffset, nodeBuf.byteOffset + nodeBuf.byteLength);
    return {
      type: 'public-key' as const,
      id,
    };
  });

  const publicKey: PublicKeyCredentialRequestOptions = {
    challenge: new Uint8Array(Buffer.from(challenge, 'base64')),
    allowCredentials,
  };

  const result = await provider.get({
    publicKey,
    evalByCredential,
  });

  matchDeviceByCredentialId(devices, result.credentialId);

  if (!result.prfResult) {
    throw new Error('PRF output was not returned by the authenticator');
  }

  return derivePassword(result.prfResult);
}
