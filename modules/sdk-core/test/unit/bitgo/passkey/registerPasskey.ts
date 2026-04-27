import * as assert from 'assert';
import * as sinon from 'sinon';
import 'should';
import { registerPasskey } from '../../../../src/bitgo/passkey/registerPasskey';

describe('registerPasskey', function () {
  let mockBitGo: sinon.SinonStubbedInstance<{
    get: (url: string) => { result: <T>() => Promise<T> };
    put: (url: string) => { send: (body: unknown) => { result: <T>() => Promise<T> } };
    url: (path: string, version?: number) => string;
  }>;

  const mockChallenge = {
    challenge: btoa('server-challenge-bytes'),
    baseSalt: 'server-base-salt-abc123',
    rp: { id: 'bitgo.com', name: 'BitGo' },
    user: { id: new Uint8Array([1, 2, 3]), name: 'test@bitgo.com', displayName: 'Test User' },
    pubKeyCredParams: [{ type: 'public-key' as const, alg: -7 }],
    timeout: 60000,
  };

  const mockOtpResponse = {
    id: 'mongo-device-id-123',
    credentialId: 'cred-id-base64',
    prfSalt: 'server-assigned-prf-salt',
    isPasskey: true,
    extensions: { prf: true },
  };

  const clientDataJSON = new TextEncoder().encode(JSON.stringify({ type: 'webauthn.create' }));
  const attestationObject = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);

  function makeAttestation(prfFirst?: ArrayBuffer): PublicKeyCredential {
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
        prfFirst !== undefined
          ? ({ prf: { results: { first: prfFirst } } } as unknown as AuthenticationExtensionsClientOutputs)
          : ({} as AuthenticationExtensionsClientOutputs),
    } as unknown as PublicKeyCredential;
  }

  beforeEach(function () {
    mockBitGo = {
      get: sinon.stub(),
      put: sinon.stub(),
      url: sinon.stub().callsFake((path: string, _version?: number) => `/api/v2${path}`),
    } as unknown as typeof mockBitGo;
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('with PRF output present', function () {
    it('should include scopes in PUT payload and return prfSupported: true', async function () {
      const prfOutput = new ArrayBuffer(32);
      const attestation = makeAttestation(prfOutput);

      const mockProvider = {
        create: sinon.stub().resolves(attestation),
        get: sinon.stub(),
      };

      const getResultStub = sinon.stub().resolves(mockChallenge);
      (mockBitGo.get as sinon.SinonStub).returns({ result: getResultStub });

      const sendStub = sinon.stub().returns({ result: sinon.stub().resolves(mockOtpResponse) });
      (mockBitGo.put as sinon.SinonStub).returns({ send: sendStub });

      const result = await registerPasskey({
        bitgo: mockBitGo as unknown as Parameters<typeof registerPasskey>[0]['bitgo'],
        provider: mockProvider,
        label: 'My Passkey',
      });

      // Verify GET challenge called
      assert.ok((mockBitGo.get as sinon.SinonStub).calledOnce, 'GET challenge should be called');
      assert.ok(
        (mockBitGo.get as sinon.SinonStub).calledWith('/api/v2/user/otp/webauthn/register'),
        'GET should call correct URL'
      );

      // Verify PUT called with scopes
      const putBody = sendStub.firstCall.args[0] as Record<string, unknown>;
      assert.ok(putBody.scopes !== undefined, 'scopes should be present when PRF output exists');
      assert.deepStrictEqual(putBody.scopes, ['prf']);
      assert.strictEqual(putBody.type, 'webauthn');
      assert.strictEqual(putBody.label, 'My Passkey');

      // Verify PUT uses correct endpoint
      assert.ok((mockBitGo.put as sinon.SinonStub).calledWith('/api/v2/user/otp'), 'PUT should call correct URL');

      // Verify return shape
      assert.strictEqual(result.id, mockOtpResponse.id);
      assert.strictEqual(result.credentialId, mockOtpResponse.credentialId);
      assert.strictEqual(result.prfSalt, mockOtpResponse.prfSalt);
      assert.strictEqual(result.isPasskey, mockOtpResponse.isPasskey);
      assert.strictEqual(result.prfSupported, true);
    });
  });

  describe('without PRF output', function () {
    it('should omit scopes from PUT payload and return prfSupported: false', async function () {
      const attestation = makeAttestation(undefined);

      const mockProvider = {
        create: sinon.stub().resolves(attestation),
        get: sinon.stub(),
      };

      const getResultStub = sinon.stub().resolves(mockChallenge);
      (mockBitGo.get as sinon.SinonStub).returns({ result: getResultStub });

      const sendStub = sinon.stub().returns({ result: sinon.stub().resolves(mockOtpResponse) });
      (mockBitGo.put as sinon.SinonStub).returns({ send: sendStub });

      const result = await registerPasskey({
        bitgo: mockBitGo as unknown as Parameters<typeof registerPasskey>[0]['bitgo'],
        provider: mockProvider,
        label: 'My Passkey No PRF',
      });

      // Verify scopes omitted
      const putBody = sendStub.firstCall.args[0] as Record<string, unknown>;
      assert.ok(putBody.scopes === undefined, 'scopes should be omitted when PRF output is absent');
      assert.strictEqual(putBody.type, 'webauthn');
      assert.strictEqual(putBody.label, 'My Passkey No PRF');

      // Verify return shape
      assert.strictEqual(result.id, mockOtpResponse.id);
      assert.strictEqual(result.credentialId, mockOtpResponse.credentialId);
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

      const getResultStub = sinon.stub().callsFake(() => {
        callOrder.push('GET challenge');
        return Promise.resolve(mockChallenge);
      });
      (mockBitGo.get as sinon.SinonStub).returns({ result: getResultStub });

      const sendStub = sinon.stub().returns({ result: sinon.stub().resolves(mockOtpResponse) });
      (mockBitGo.put as sinon.SinonStub).returns({ send: sendStub });

      await registerPasskey({
        bitgo: mockBitGo as unknown as Parameters<typeof registerPasskey>[0]['bitgo'],
        provider: mockProvider,
        label: 'Test',
      });

      assert.deepStrictEqual(
        callOrder,
        ['GET challenge', 'provider.create'],
        'GET challenge must precede provider.create'
      );
    });
  });
});
