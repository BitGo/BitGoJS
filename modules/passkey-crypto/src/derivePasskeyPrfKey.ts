import type { BitGoBase, IWallet } from '@bitgo/sdk-core';
import { buildEvalByCredential, matchDeviceByCredentialId } from './prfHelpers';
import { derivePassword } from './derivePassword';
import type { WebAuthnProvider } from './webAuthnTypes';

interface AuthChallengeResponse {
  challenge: string;
  allowCredentials?: Array<{ id: string; type: string; transports?: string[] }>;
  origin?: string;
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

  // Fetch the wallet's user keychain to get webauthnDevices
  const keychain = await wallet.getEncryptedUserKeychain();
  const devices = (keychain as any).webauthnDevices ?? (keychain as any).webAuthnDevices;

  if (!devices || devices.length === 0) {
    throw new Error('No passkey devices available');
  }

  // Build PRF eval map from devices
  const { evalByCredential } = buildEvalByCredential(devices as Parameters<typeof buildEvalByCredential>[0]);

  if (Object.keys(evalByCredential).length === 0) {
    throw new Error('No passkey devices available with a valid PRF salt');
  }

  // Fetch a server-issued assertion challenge via the auth endpoint
  const { challenge } = (await bitgo.get(bitgo.url('/user/otp/webauthn/auth', 2)).result()) as AuthChallengeResponse;

  // Build allowCredentials so the browser knows which credentials to use.
  // Pass the Buffer (Uint8Array) directly — not .buffer — so the provider
  // layer can correctly slice it via ArrayBuffer.isView.
  const allowCredentials = Object.keys(evalByCredential).map((credId) => ({
    type: 'public-key' as const,
    id: Buffer.from(credId.replace(/-/g, '+').replace(/_/g, '/'), 'base64') as unknown as ArrayBuffer,
  }));

  // Trigger WebAuthn assertion with PRF evaluation via the provider (navigator layer)
  const result = await provider.get({
    publicKey: {
      challenge: Buffer.from(challenge, 'base64'),
      allowCredentials,
    } as PublicKeyCredentialRequestOptions,
    evalByCredential,
  });

  // Verify the credential matches a known device
  matchDeviceByCredentialId(devices as Parameters<typeof matchDeviceByCredentialId>[0], result.credentialId);

  // Derive and return hex-encoded wallet passphrase
  if (!result.prfResult) {
    throw new Error('PRF output was not returned by the authenticator');
  }

  return derivePassword(result.prfResult);
}
