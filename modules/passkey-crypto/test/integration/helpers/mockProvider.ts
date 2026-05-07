import { PasskeyAuthResult, PasskeyGetOptions, WebAuthnProvider } from '../../../src/webAuthnTypes';
import { CREDENTIAL_ID, PRF_OUTPUT } from './fixtures';

export function makeMockProvider(): WebAuthnProvider & { lastEvalByCredential: Record<string, string> | undefined } {
  let lastEvalByCredential: Record<string, string> | undefined;

  const provider: WebAuthnProvider & { lastEvalByCredential: Record<string, string> | undefined } = {
    get lastEvalByCredential() {
      return lastEvalByCredential;
    },

    async create(options: PublicKeyCredentialCreationOptions): Promise<PublicKeyCredential> {
      return {
        id: CREDENTIAL_ID,
        rawId: Buffer.from(CREDENTIAL_ID, 'base64'),
        type: 'public-key',
        response: {
          attestationObject: new ArrayBuffer(0),
          clientDataJSON: new ArrayBuffer(0),
          getTransports: () => [],
        },
        authenticatorAttachment: 'platform',
        getClientExtensionResults: () => ({ prf: { enabled: true } }),
        toJSON: () => ({} as PublicKeyCredentialJSON),
      } as unknown as PublicKeyCredential;
    },

    async get(options: PasskeyGetOptions): Promise<PasskeyAuthResult> {
      lastEvalByCredential = options.evalByCredential;
      return {
        prfResult: PRF_OUTPUT,
        credentialId: CREDENTIAL_ID,
        otpCode: '123456',
      };
    },
  };

  return provider;
}
