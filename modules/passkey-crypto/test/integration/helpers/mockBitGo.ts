import * as sinon from 'sinon';
import { decryptV2, encryptV2 } from '@bitgo/sdk-api';
import {
  ASSERTION_CHALLENGE,
  BASE_SALT,
  CREDENTIAL_ID,
  DEVICE_MONGO_ID,
  ENTERPRISE_ID,
  KEYCHAIN_ID,
  REGISTER_CHALLENGE,
} from './fixtures';

// Use sjcl directly — same underlying library as bitgo.encrypt/decrypt
const sjcl = require('sjcl');

function realEncrypt({ password, input }: { password: string; input: string }): string {
  return JSON.stringify(sjcl.encrypt(password, input));
}

function realDecrypt({ password, input }: { password: string; input: string }): string {
  return sjcl.decrypt(password, typeof input === 'string' ? JSON.parse(input) : input);
}

async function mockEncryptAsync(params: {
  password: string;
  input: string;
  encryptionVersion?: number;
}): Promise<string> {
  if (params.encryptionVersion === 2) {
    return encryptV2(params.password, params.input);
  }
  return realEncrypt(params);
}

async function mockDecryptAsync(params: { password: string; input: string }): Promise<string> {
  let envelopeVersion: number | undefined;
  try {
    envelopeVersion = JSON.parse(params.input).v;
  } catch {
    throw new Error('decrypt: ciphertext is not valid JSON');
  }
  if (envelopeVersion === 2) {
    return decryptV2(params.password, params.input);
  }
  if (envelopeVersion !== undefined && envelopeVersion !== 1) {
    throw new Error(`decrypt: unknown envelope version ${envelopeVersion}`);
  }
  return realDecrypt(params);
}

export interface KeychainState {
  id: string;
  encryptedPrv: string;
  webauthnDevices?: Array<{
    authenticatorInfo: { credID: string };
    prfSalt: string;
    id?: string;
    encryptedPrv?: string;
  }>;
}

export interface MockBitGo {
  bitgo: any;
  keychainState: KeychainState;
  wallet: any;
  encrypt: (params: { password: string; input: string }) => string;
  decrypt: (params: { password: string; input: string }) => string;
}

export function makeMockBitGo(initialEncryptedPrv: string): MockBitGo {
  const keychainState: KeychainState = {
    id: KEYCHAIN_ID,
    encryptedPrv: initialEncryptedPrv,
    webauthnDevices: undefined,
  };

  // Build the mock request chain: bitgo.get(url).result() etc.
  function makeRequest(result: unknown) {
    const req = {
      send: sinon.stub().returnsThis(),
      result: sinon.stub().resolves(result),
    };
    return req;
  }

  // Stub the wallet
  const mockWallet = {
    type: sinon.stub().returns('hot'),
    toJSON: sinon.stub().returns({ enterprise: ENTERPRISE_ID }),
    keyIds: sinon.stub().returns([KEYCHAIN_ID]),
    getEncryptedUserKeychain: sinon.stub().callsFake(async () => ({ ...keychainState })),
  };

  // Stub baseCoin
  const mockBaseCoin = {
    wallets: sinon.stub().returns({
      get: sinon.stub().resolves(mockWallet),
    }),
    keychains: sinon.stub().returns({
      get: sinon.stub().callsFake(async () => ({ ...keychainState })),
    }),
  };

  // Build the bitgo stub
  const bitgo: any = {
    coin: sinon.stub().returns(mockBaseCoin),

    url: (path: string, version?: number) => `https://app.bitgo-test.com/api/v${version ?? 2}${path}`,

    encrypt: (params: { password: string; input: string }) => realEncrypt(params),
    decrypt: (params: { password: string; input: string }) => realDecrypt(params),
    encryptAsync: mockEncryptAsync,
    decryptAsync: mockDecryptAsync,

    get: sinon.stub().callsFake((url: string) => {
      if (url.includes('/user/otp/webauthn/register')) {
        return makeRequest({
          challenge: REGISTER_CHALLENGE,
          baseSalt: BASE_SALT,
          rp: { name: 'BitGo', id: 'bitgo.com' },
          user: { id: Buffer.from('user-id'), name: 'test@bitgo.com', displayName: 'Test User' },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
        });
      }
      if (url.includes('/user/otp/webauthn/assertion')) {
        return makeRequest({ challenge: ASSERTION_CHALLENGE });
      }
      return makeRequest({});
    }),

    put: sinon.stub().callsFake((url: string) => {
      // PUT /user/otp — register device
      if (url.includes('/user/otp') && !url.includes('/key/')) {
        return {
          send: sinon.stub().returnsThis(),
          result: sinon.stub().resolves({
            user: {
              otpDevices: [
                {
                  id: DEVICE_MONGO_ID,
                  credentialId: CREDENTIAL_ID,
                  prfSalt: BASE_SALT,
                  isPasskey: true,
                  extensions: { prf: true },
                },
              ],
            },
          }),
        };
      }
      // PUT /{coin}/key/{keychainId} — attach webauthnInfo
      if (url.includes('/key/')) {
        return {
          send: sinon.stub().callsFake((body: any) => ({
            result: sinon.stub().callsFake(async () => {
              // Update keychainState with webauthnInfo — simulates server persisting it
              if (body?.webauthnInfo) {
                keychainState.webauthnDevices = [
                  {
                    authenticatorInfo: { credID: CREDENTIAL_ID },
                    prfSalt: body.webauthnInfo.prfSalt,
                    id: DEVICE_MONGO_ID,
                    encryptedPrv: body.webauthnInfo.encryptedPrv,
                  },
                ];
                keychainState.encryptedPrv = body.webauthnInfo.encryptedPrv;
              }
              return { ...keychainState };
            }),
          })),
        };
      }
      return { send: sinon.stub().returnsThis(), result: sinon.stub().resolves({}) };
    }),

    del: sinon.stub().callsFake((_url: string) => {
      return { result: sinon.stub().resolves({}) };
    }),
  };

  return { bitgo, keychainState, wallet: mockWallet, encrypt: realEncrypt, decrypt: realDecrypt };
}
