import * as assert from 'assert';
import * as sinon from 'sinon';
import { registerPasskey } from '../../src/registerPasskey';

describe('registerPasskey', function () {
  let mockBitGo: {
    get: sinon.SinonStub;
    put: sinon.SinonStub;
    url: sinon.SinonStub;
  };

  const mockChallenge = {
    challenge: btoa('server-challenge-bytes'),
    baseSalt: 'server-base-salt-abc123',
    rp: { id: 'bitgo.com', name: 'BitGo' },
    user: { id: new Uint8Array([1, 2, 3]), name: 'test@bitgo.com', displayName: 'Test User' },
    pubKeyCredParams: [{ type: 'public-key' as const, alg: -7 }],
    timeout: 60000,
  };

  const mockOtpResponse = {
    user: {
      otpDevices: [
        {
          id: 'mongo-device-id-123',
          credentialId: 'cred-id-base64',
          prfSalt: 'server-assigned-prf-salt',
          isPasskey: true,
          extensions: { prf: true },
        },
      ],
    },
  };

  const clientDataJSON = new TextEncoder().encode(JSON.stringify({ type: 'webauthn.create' }));
  const attestationObject = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);

  function makeAttestation(prfEnabled = false): PublicKeyCredential {
    return {
      id: 'cred-id-base64',
      rawId: new ArrayBuffer(8),
      type: 'public-key',
      response: {
        clientDataJSON: clientDataJSON.buffer,
        attestationObject: attestationObject.buffer,
        getTransports: () => [],
      } as unknown as AuthenticatorAttestationResponse,
      authenticatorAttachment: null,
      getClientExtensionResults: () =>
        prfEnabled
          ? ({ prf: { enabled: true } } as unknown as AuthenticationExtensionsClientOutputs)
          : ({} as AuthenticationExtensionsClientOutputs),
    } as unknown as PublicKeyCredential;
  }

  beforeEach(function () {
    mockBitGo = {
      get: sinon.stub(),
      put: sinon.stub(),
      url: sinon.stub().callsFake((path: string, _version?: number) => `/api/v2${path}`),
    };
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('with PRF supported', function () {
    it('should include scopes in PUT payload and return prfSupported: true', async function () {
      const attestation = makeAttestation(true);

      const mockProvider = { create: sinon.stub().resolves(attestation), get: sinon.stub() };

      mockBitGo.get.returns({ result: sinon.stub().resolves(mockChallenge) });
      const sendStub = sinon.stub().returns({ result: sinon.stub().resolves(mockOtpResponse) });
      mockBitGo.put.returns({ send: sendStub });

      const result = await registerPasskey({
        bitgo: mockBitGo as never,
        provider: mockProvider,
        label: 'My Passkey',
      });

      assert.ok(mockBitGo.get.calledWith('/api/v2/user/otp/webauthn/register'), 'GET should call correct URL');
      assert.ok(mockBitGo.put.calledWith('/api/v2/user/otp'), 'PUT should call correct URL');

      const putBody = sendStub.firstCall.args[0] as Record<string, unknown>;
      assert.deepStrictEqual(putBody.extensions, ['prf']);
      assert.deepStrictEqual(putBody.scopes, ['wallet_hot']);
      assert.strictEqual(putBody.type, 'webauthn');
      assert.strictEqual(putBody.label, 'My Passkey');

      const device = mockOtpResponse.user.otpDevices[0];
      assert.strictEqual(result.id, device.id);
      assert.strictEqual(result.credentialId, device.credentialId);
      assert.strictEqual(result.prfSalt, device.prfSalt);
      assert.strictEqual(result.prfSupported, true);
    });
  });

  describe('without PRF support', function () {
    it('should omit scopes from PUT payload and return prfSupported: false', async function () {
      const mockProvider = { create: sinon.stub().resolves(makeAttestation(false)), get: sinon.stub() };

      mockBitGo.get.returns({ result: sinon.stub().resolves(mockChallenge) });
      const sendStub = sinon.stub().returns({ result: sinon.stub().resolves(mockOtpResponse) });
      mockBitGo.put.returns({ send: sendStub });

      const result = await registerPasskey({
        bitgo: mockBitGo as never,
        provider: mockProvider,
        label: 'My Passkey No PRF',
      });

      const putBody = sendStub.firstCall.args[0] as Record<string, unknown>;
      assert.ok(putBody.extensions === undefined, 'extensions should be omitted when PRF is not supported');
      assert.ok(putBody.scopes === undefined, 'scopes should be omitted when PRF is not supported');
      assert.strictEqual(result.prfSupported, false);
    });
  });

  describe('baseSalt sourcing', function () {
    it('should call GET challenge before provider.create()', async function () {
      const callOrder: string[] = [];

      const mockProvider = {
        create: sinon.stub().callsFake(() => {
          callOrder.push('provider.create');
          return Promise.resolve(makeAttestation());
        }),
        get: sinon.stub(),
      };

      mockBitGo.get.returns({
        result: sinon.stub().callsFake(() => {
          callOrder.push('GET challenge');
          return Promise.resolve(mockChallenge);
        }),
      });
      mockBitGo.put.returns({ send: sinon.stub().returns({ result: sinon.stub().resolves(mockOtpResponse) }) });

      await registerPasskey({ bitgo: mockBitGo as never, provider: mockProvider, label: 'Test' });

      assert.deepStrictEqual(callOrder, ['GET challenge', 'provider.create']);
    });
  });
});
