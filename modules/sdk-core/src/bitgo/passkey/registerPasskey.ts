import { BitGoBase } from '../bitgoBase';
import { WebAuthnOtpDevice, WebAuthnProvider } from './types';

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

interface RegisterOtpResponse {
  id: string;
  credentialId: string;
  prfSalt?: string;
  isPasskey?: boolean;
  extensions?: Record<string, boolean>;
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

  // Step 2: Pass challenge to provider.create() — browser returns attestation
  const attestation = await provider.create({
    challenge: Uint8Array.from(atob(challenge.challenge), (c) => c.charCodeAt(0)),
    rp: challenge.rp,
    user: challenge.user,
    pubKeyCredParams: challenge.pubKeyCredParams,
    timeout: challenge.timeout,
    excludeCredentials: challenge.excludeCredentials,
    authenticatorSelection: challenge.authenticatorSelection,
    attestation: challenge.attestation,
    extensions: challenge.extensions,
  });

  const attestationResponse = attestation.response as AuthenticatorAttestationResponse;

  // Step 3: Check if PRF output is present in the attestation response
  const clientExtensionResults = attestation.getClientExtensionResults() as {
    prf?: { results?: { first?: ArrayBuffer } };
  };
  const prfOutput = clientExtensionResults.prf?.results?.first;
  const prfSupported = prfOutput !== undefined;

  // Step 4: Build payload — include scopes only if PRF output is present
  const otpPayload = {
    clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(attestationResponse.clientDataJSON))),
    attestationObject: btoa(String.fromCharCode(...new Uint8Array(attestationResponse.attestationObject))),
  };

  const putBody: Record<string, unknown> = {
    otp: JSON.stringify(otpPayload),
    type: 'webauthn',
    label,
  };

  if (prfSupported) {
    putBody.scopes = ['prf'];
  }

  // Step 5: PUT /api/v2/user/otp
  const response = (await bitgo.put(bitgo.url('/user/otp', 2)).send(putBody).result()) as RegisterOtpResponse;

  // Step 6: Return WebAuthnOtpDevice + prfSupported
  return {
    id: response.id,
    credentialId: response.credentialId,
    prfSalt: response.prfSalt,
    isPasskey: response.isPasskey,
    extensions: response.extensions,
    prfSupported,
  };
}
