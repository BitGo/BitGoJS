import * as assert from 'assert';
import * as sinon from 'sinon';
import { attachPasskeyToWallet } from '../../src/attachPasskeyToWallet';
import { derivePassword } from '../../src/derivePassword';
import { WebAuthnOtpDevice, PasskeyAuthResult, WebAuthnProvider } from '../../src/webAuthnTypes';

describe('attachPasskeyToWallet', function () {
  const coin = 'tbtc';
  const walletId = 'wallet-abc123';
  const keychainId = 'key-user-id';
  const enterpriseId = 'enterprise-xyz';
  const encryptedPrv = 'encrypted-prv-string';
  const decryptedPrv = 'xprv-decrypted';
  const existingPassphrase = 'correct-passphrase';
  const reEncryptedPrv = 're-encrypted-prv';

  const prfResultBuffer = new Uint8Array([0x1e, 0x5c, 0xb4, 0x78]).buffer;

  const device: WebAuthnOtpDevice = {
    id: 'mongo-object-id-123',
    credentialId: 'cred-id-456',
    prfSalt: 'ZqJ64M2dL65zn2-Jxd58SMN2ILc9QjbCFxUTGHd_LC8',
    isPasskey: true,
  };

  const mockAuthResult: PasskeyAuthResult = {
    prfResult: prfResultBuffer,
    credentialId: 'cred-id-456',
    otpCode: '123456',
  };

  const updatedKeychain = {
    id: keychainId,
    pub: 'xpub-123',
    type: 'independent' as const,
    encryptedPrv,
  };

  let mockWallet: {
    type: sinon.SinonStub;
    toJSON: sinon.SinonStub;
    getEncryptedUserKeychain: sinon.SinonStub;
  };

  let mockWallets: {
    get: sinon.SinonStub;
  };

  let mockBaseCoin: {
    wallets: sinon.SinonStub;
  };

  let mockBitGo: {
    url: sinon.SinonStub;
    coin: sinon.SinonStub;
    put: sinon.SinonStub;
    decryptAsync: sinon.SinonStub;
    encryptAsync: sinon.SinonStub;
  };

  let mockProvider: {
    create: sinon.SinonStub;
    get: sinon.SinonStub;
  };

  beforeEach(function () {
    mockWallet = {
      type: sinon.stub().returns('hot'),
      toJSON: sinon.stub().returns({ enterprise: enterpriseId }),
      getEncryptedUserKeychain: sinon.stub().resolves({ id: keychainId, encryptedPrv }),
    };

    mockWallets = {
      get: sinon.stub().resolves(mockWallet),
    };

    mockBaseCoin = {
      wallets: sinon.stub().returns(mockWallets),
    };

    mockBitGo = {
      url: sinon
        .stub<[path: string, version?: number], string>()
        .callsFake((path, version) => `/api/v${version ?? 1}${path}`),
      coin: sinon.stub().returns(mockBaseCoin),
      put: sinon.stub(),
      decryptAsync: sinon.stub(),
      encryptAsync: sinon.stub(),
    };

    mockProvider = {
      create: sinon.stub(),
      get: sinon.stub(),
    };

    mockBitGo.decryptAsync.resolves(decryptedPrv);
    mockBitGo.encryptAsync.resolves(reEncryptedPrv);

    const putSendStub = sinon.stub().returns({ result: sinon.stub().resolves(updatedKeychain) });
    mockBitGo.put.returns({ send: putSendStub });

    mockProvider.get.resolves(mockAuthResult);
  });

  afterEach(function () {
    sinon.restore();
  });

  async function callAttach(overrides?: Partial<Parameters<typeof attachPasskeyToWallet>[0]>) {
    return attachPasskeyToWallet({
      bitgo: mockBitGo as unknown as Parameters<typeof attachPasskeyToWallet>[0]['bitgo'],
      coin,
      walletId,
      device,
      existingPassphrase,
      provider: mockProvider as unknown as WebAuthnProvider,
      ...overrides,
    });
  }

  it('should attach a passkey and return the updated keychain', async function () {
    const result = await callAttach();

    sinon.assert.calledWith(mockBitGo.coin, coin);
    sinon.assert.calledWith(mockWallets.get, { id: walletId });
    sinon.assert.calledOnce(mockWallet.type);
    sinon.assert.calledOnce(mockWallet.getEncryptedUserKeychain);
    sinon.assert.calledOnce(mockBitGo.decryptAsync);
    sinon.assert.calledWithExactly(mockBitGo.decryptAsync, { password: existingPassphrase, input: encryptedPrv });

    // provider.get called with evalByCredential keyed on device.credentialId
    sinon.assert.calledOnce(mockProvider.get);
    const getArgs = mockProvider.get.firstCall.args[0];
    assert.ok(getArgs.evalByCredential);
    assert.strictEqual(typeof getArgs.evalByCredential[device.credentialId], 'string');

    // allowCredentials must be populated with the credential ID as an ArrayBuffer
    assert.ok(Array.isArray(getArgs.publicKey.allowCredentials));
    assert.strictEqual(getArgs.publicKey.allowCredentials.length, 1);
    assert.strictEqual(getArgs.publicKey.allowCredentials[0].type, 'public-key');
    assert.ok(getArgs.publicKey.allowCredentials[0].id instanceof ArrayBuffer);

    // PUT called with correct shape
    sinon.assert.calledOnce(mockBitGo.put);
    sinon.assert.calledWith(mockBitGo.put, `/api/v2/${coin}/key/${keychainId}`);
    const sendStub = mockBitGo.put.firstCall.returnValue.send;
    sinon.assert.calledOnce(sendStub);
    const putBody = sendStub.firstCall.args[0];
    assert.ok(putBody.webauthnInfo);
    assert.strictEqual(putBody.webauthnInfo.otpDeviceId, device.id);
    // prfSalt must be base64url (URL-safe, no padding) as required by server validation
    assert.match(putBody.webauthnInfo.prfSalt, /^[A-Za-z0-9\-_]+$/);
    assert.strictEqual(typeof putBody.webauthnInfo.encryptedPrv, 'string');

    // encryptAsync must be called with encryptionVersion 2
    sinon.assert.calledOnce(mockBitGo.encryptAsync);
    sinon.assert.calledWithMatch(mockBitGo.encryptAsync, { encryptionVersion: 2 });

    assert.strictEqual(result.id, keychainId);
  });

  it('should re-encrypt the private key as a v2 Argon2id envelope', async function () {
    const expectedPrfPassword = derivePassword(prfResultBuffer);

    await callAttach();

    // The PRF-derived password and the decrypted xprv must be passed to encryptAsync
    sinon.assert.calledWithMatch(mockBitGo.encryptAsync, {
      password: expectedPrfPassword,
      input: decryptedPrv,
      encryptionVersion: 2,
    });

    // The v2 blob returned by encryptAsync is what gets stored on the server
    const putBody = mockBitGo.put.firstCall.returnValue.send.firstCall.args[0];
    assert.strictEqual(putBody.webauthnInfo.encryptedPrv, reEncryptedPrv);
  });

  it('should decode credentialId containing base64url-specific characters (- and _)', async function () {
    const deviceWithUrlChars: WebAuthnOtpDevice = {
      ...device,
      credentialId: 'abc-def_ghi+jkl',
    };

    const result = await callAttach({ device: deviceWithUrlChars });
    assert.ok(result);

    const getArgs = mockProvider.get.firstCall.args[0];
    assert.ok(getArgs.publicKey.allowCredentials[0].id instanceof ArrayBuffer);
  });

  it('should throw if device.prfSalt is undefined', async function () {
    const deviceNoPrf: WebAuthnOtpDevice = { ...device, prfSalt: undefined };

    await assert.rejects(
      () => callAttach({ device: deviceNoPrf }),
      (err: Error) => {
        assert.strictEqual(err.message, 'PRF extension not supported by this device. Please use a different passkey.');
        return true;
      }
    );

    sinon.assert.notCalled(mockBitGo.coin);
    sinon.assert.notCalled(mockBitGo.put);
  });

  it('should throw if wallet is not a hot wallet', async function () {
    mockWallet.type.returns('cold');

    await assert.rejects(
      () => callAttach(),
      (err: Error) => {
        assert.ok(err.message.includes('not a hot wallet'));
        return true;
      }
    );

    sinon.assert.notCalled(mockBitGo.put);
  });

  it('should throw if wallet has no enterprise', async function () {
    mockWallet.toJSON.returns({ enterprise: undefined });

    await assert.rejects(
      () => callAttach(),
      (err: Error) => {
        assert.ok(err.message.includes('has no enterprise'));
        return true;
      }
    );
  });

  it('should throw if PRF assertion returns no result', async function () {
    mockProvider.get.resolves({ ...mockAuthResult, prfResult: undefined });

    await assert.rejects(
      () => callAttach(),
      (err: Error) => {
        assert.ok(err.message.includes('PRF assertion did not return a result'));
        return true;
      }
    );

    sinon.assert.notCalled(mockBitGo.put);
  });

  it('should propagate decrypt errors', async function () {
    mockBitGo.decryptAsync.rejects(new Error('decryption failed'));

    await assert.rejects(
      () => callAttach(),
      (err: Error) => {
        assert.ok(err.message.includes('decryption failed'));
        return true;
      }
    );

    sinon.assert.notCalled(mockBitGo.put);
  });

  it('should use device.credentialId as the key in evalByCredential', async function () {
    await callAttach();

    const getArgs = mockProvider.get.firstCall.args[0];
    const evalKeys = Object.keys(getArgs.evalByCredential);
    assert.strictEqual(evalKeys.length, 1);
    assert.strictEqual(evalKeys[0], device.credentialId);
  });
});
