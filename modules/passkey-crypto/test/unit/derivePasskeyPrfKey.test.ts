import * as assert from 'assert';
import * as sinon from 'sinon';
import { derivePasskeyPrfKey } from '../../src/derivePasskeyPrfKey';

describe('derivePasskeyPrfKey', function () {
  const mockDevices = [
    {
      otpDeviceId: 'device-1',
      authenticatorInfo: { credID: 'cred-aaa', fmt: 'none' as const, publicKey: 'pk-1' },
      prfSalt: 'salt-aaa',
      encryptedPrv: 'enc-prv-1',
    },
    {
      otpDeviceId: 'device-2',
      authenticatorInfo: { credID: 'cred-bbb', fmt: 'none' as const, publicKey: 'pk-2' },
      prfSalt: 'salt-bbb',
      encryptedPrv: 'enc-prv-2',
    },
  ];

  function makeWallet(devices: typeof mockDevices | undefined) {
    return {
      getEncryptedUserKeychain: sinon.stub().resolves({
        id: 'keychain-id',
        pub: 'xpub123',
        encryptedPrv: 'encrypted-prv',
        type: 'independent',
        webauthnDevices: devices,
      }),
    };
  }

  function makeBitGo(challenge = 'dGVzdC1jaGFsbGVuZ2U=') {
    return {
      url: sinon.stub().callsFake((path: string) => `https://app.bitgo.com/api/v2${path}`),
      get: sinon.stub().returns({
        result: sinon.stub().resolves({ challenge }),
      }),
    };
  }

  afterEach(function () {
    sinon.restore();
  });

  it('should return a hex string on happy path', async function () {
    const prfResult = new Uint8Array([0xde, 0xad, 0xbe, 0xef]).buffer;

    const mockProvider = {
      create: sinon.stub(),
      get: sinon.stub().resolves({
        prfResult,
        credentialId: 'cred-aaa',
        otpCode: 'otp-123',
      }),
    };

    const wallet = makeWallet(mockDevices);
    const mockBitGo = makeBitGo();

    const result = await derivePasskeyPrfKey({
      bitgo: mockBitGo as any,
      wallet: wallet as any,
      provider: mockProvider,
    });

    // derivePassword converts ArrayBuffer to hex
    assert.strictEqual(result, 'deadbeef');
    assert.ok(mockProvider.get.calledOnce);
    // Verify evalByCredential was passed
    const getCallArgs = mockProvider.get.firstCall.args[0];
    assert.strictEqual(getCallArgs.evalByCredential['cred-aaa'], 'salt-aaa');
    assert.strictEqual(getCallArgs.evalByCredential['cred-bbb'], 'salt-bbb');
    // Verify bitgo was used to fetch the assertion challenge
    assert.ok(mockBitGo.get.calledOnce);
    assert.ok(mockBitGo.url.calledWith('/user/otp/webauthn/assertion', 2));
  });

  it("should throw 'No passkey devices available' when no devices", async function () {
    const wallet = makeWallet(undefined);
    const mockProvider = { create: sinon.stub(), get: sinon.stub() };

    await assert.rejects(
      () => derivePasskeyPrfKey({ bitgo: makeBitGo() as any, wallet: wallet as any, provider: mockProvider }),
      (err: Error) => {
        assert.strictEqual(err.message, 'No passkey devices available');
        return true;
      }
    );
  });

  it("should throw 'No passkey devices available' when devices array is empty", async function () {
    const wallet = makeWallet([] as any);
    const mockProvider = { create: sinon.stub(), get: sinon.stub() };

    await assert.rejects(
      () => derivePasskeyPrfKey({ bitgo: makeBitGo() as any, wallet: wallet as any, provider: mockProvider }),
      (err: Error) => {
        assert.strictEqual(err.message, 'No passkey devices available');
        return true;
      }
    );
  });

  it("should throw 'No passkey devices available with a valid PRF salt' when no device has prfSalt", async function () {
    const devicesWithoutSalt = [
      {
        otpDeviceId: 'device-1',
        authenticatorInfo: { credID: 'cred-aaa', fmt: 'none' as const, publicKey: 'pk-1' },
        prfSalt: '', // empty — buildEvalByCredential skips falsy prfSalt
        encryptedPrv: 'enc-prv-1',
      },
    ];

    const wallet = makeWallet(devicesWithoutSalt as any);
    const mockProvider = { create: sinon.stub(), get: sinon.stub() };

    await assert.rejects(
      () => derivePasskeyPrfKey({ bitgo: makeBitGo() as any, wallet: wallet as any, provider: mockProvider }),
      (err: Error) => {
        assert.strictEqual(err.message, 'No passkey devices available with a valid PRF salt');
        return true;
      }
    );
  });

  it("should throw 'Could not identify which passkey device was used' when credentialId not found", async function () {
    const mockProvider = {
      create: sinon.stub(),
      get: sinon.stub().resolves({
        prfResult: new ArrayBuffer(32),
        credentialId: 'unknown-cred-id',
        otpCode: 'otp-123',
      }),
    };

    const wallet = makeWallet(mockDevices);

    await assert.rejects(
      () => derivePasskeyPrfKey({ bitgo: makeBitGo() as any, wallet: wallet as any, provider: mockProvider }),
      (err: Error) => {
        assert.strictEqual(err.message, 'Could not identify which passkey device was used');
        return true;
      }
    );
  });
});
