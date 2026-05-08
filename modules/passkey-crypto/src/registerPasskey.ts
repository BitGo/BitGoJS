import { BitGoBase } from '@bitgo/sdk-core';
import { bufferToBase64Url } from './base64url';
import { WebAuthnOtpDevice, WebAuthnProvider } from './webAuthnTypes';

interface RegisterChallengeResponse {
  challenge: string;
  baseSalt: string;
  rp: PublicKeyCredentialRpEntity;
  user: PublicKeyCredentialUserEntity;
  pubKeyCredParams: PublicKeyCredentialParameters[];
  timeout?: number;
  excludeCredentials?: PublicKeyCredentialDescriptor[];
  authenticatorSelection?: AuthenticatorSelectionCriteria;
  attestation?: AttestationConveyancePreference;
  extensions?: AuthenticationExtensionsClientInputs;
}

interface OtpDevice {
  id: string;
  credentialId: string;
  prfSalt?: string;
  isPasskey?: boolean;
  extensions?: Record<string, boolean>;
}

interface RegisterOtpResponse {
  user: {
    otpDevices: OtpDevice[];
  };
}

/**
 * Recursively converts a PublicKeyCredential (or any value it contains) to a
 * JSON-serialisable representation, encoding ArrayBuffers as base64url strings.
 */
function publicKeyCredentialToJSON(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(publicKeyCredentialToJSON);
  }
  if (value instanceof ArrayBuffer) {
    return bufferToBase64Url(value);
  }
  if (ArrayBuffer.isView(value)) {
    return bufferToBase64Url(value.buffer as ArrayBuffer);
  }
  if (value instanceof Object) {
    const result: Record<string, unknown> = {};
    // Use for...in to enumerate DOM object properties (non-enumerable own + inherited)
    for (const key in value) {
      result[key] = publicKeyCredentialToJSON((value as Record<string, unknown>)[key]);
    }
    return result;
  }
  return value;
}

/**
 * Decodes excluded credential IDs from base64 strings to ArrayBuffers.
 * The WebAuthn API requires BufferSource values, not base64 strings.
 */
function preformatExcludedCredentials(
  excludeCredentials: PublicKeyCredentialDescriptor[] | undefined
): PublicKeyCredentialDescriptor[] {
  if (!excludeCredentials) return [];
  return excludeCredentials.map((cred) => ({
    ...cred,
    id: Buffer.from(cred.id as unknown as string, 'base64') as unknown as ArrayBuffer,
  }));
}

export async function registerPasskey(params: {
  bitgo: BitGoBase;
  provider: WebAuthnProvider;
  label: string;
}): Promise<WebAuthnOtpDevice & { prfSupported: boolean }> {
  const { bitgo, provider, label } = params;

  // Step 1: Fetch server challenge (contains baseSalt)
  const challenge = (await bitgo
    .get(bitgo.url('/user/otp/webauthn/register', 2))
    .result()) as RegisterChallengeResponse;

  // Step 2: Pass formatted challenge to provider.create() — browser returns attestation
  const attestation = await provider.create({
    challenge: Buffer.from(challenge.challenge, 'base64'),
    rp: challenge.rp,
    user: challenge.user,
    pubKeyCredParams: challenge.pubKeyCredParams,
    timeout: challenge.timeout,
    excludeCredentials: preformatExcludedCredentials(challenge.excludeCredentials),
    authenticatorSelection: challenge.authenticatorSelection,
    attestation: challenge.attestation,
    extensions: challenge.extensions,
  });

  // Step 3: Check if PRF is supported — `prf.enabled` is set during registration
  // (not `prf.results.first`, which is only present during authentication assertions)
  const clientExtensionResults: AuthenticationExtensionsClientOutputs = attestation.getClientExtensionResults();
  const prfEnabled = clientExtensionResults.prf;
  const prfSupported = typeof prfEnabled === 'object' && prfEnabled !== null && prfEnabled.enabled === true;

  // Step 4: Serialize the full credential using recursive base64url encoding
  const otp = JSON.stringify(publicKeyCredentialToJSON(attestation));

  const putBody: Record<string, unknown> = {
    otp,
    type: 'webauthn',
    label,
  };

  if (prfSupported) {
    putBody.extensions = ['prf'];
    putBody.scopes = ['wallet_hot'];
  }

  // Step 5: PUT /api/v2/user/otp
  const response = (await bitgo.put(bitgo.url('/user/otp', 2)).send(putBody).result()) as RegisterOtpResponse;

  // Step 6: Find the newly registered device by matching credentialId
  const device = response.user.otpDevices.find((d) => d.credentialId === attestation.id);
  if (!device) {
    const available = response.user.otpDevices.map((d) => d.credentialId).join(', ');
    throw new Error(
      `Registered device not found in response (credentialId: ${attestation.id}). Available: [${available}]`
    );
  }

  // Step 7: Return WebAuthnOtpDevice + prfSupported
  return {
    id: device.id,
    credentialId: device.credentialId,
    prfSalt: device.prfSalt,
    isPasskey: device.isPasskey,
    extensions: device.extensions,
    prfSupported,
  };
}
