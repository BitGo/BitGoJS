import * as assert from 'assert';
import * as sinon from 'sinon';
import 'should';
import { removePasskeyFromWallet } from '../../../../src/bitgo/passkey/removePasskeyFromWallet';
import { WebAuthnOtpDevice } from '../../../../src/bitgo/passkey/types';

describe('removePasskeyFromWallet', function () {
  const walletId = 'wallet-abc123';
  const keychainId = 'key-user-id';
  const encryptedPrv = 'encrypted-prv-string';
  const walletPassphrase = 'correct-passphrase';
  const decryptedPrv = 'xprv-decrypted';

  const device: WebAuthnOtpDevice = {
    id: 'mongo-object-id-123',
    credentialId: 'cred-id-456',
    prfSalt: 'some-salt',
    isPasskey: true,
  };

  let mockBitGo: sinon.SinonStubbedInstance<{
    url: (path: string, version?: number) => string;
    get: (url: string) => { result: () => Promise<unknown> };
    del: (url: string) => { result: () => Promise<unknown> };
    decrypt: (params: { password: string; input: string }) => string;
  }>;

  beforeEach(function () {
    mockBitGo = {
      url: sinon.stub().callsFake((path: string, version?: number) => `/api/v${version ?? 1}${path}`),
      get: sinon.stub(),
      del: sinon.stub(),
      decrypt: sinon.stub(),
    };

    // Default: wallet fetch returns coin + keys
    (mockBitGo.get as sinon.SinonStub).withArgs(`/api/v2/wallet/${walletId}`).returns({
      result: sinon.stub().resolves({ coin: 'tbtc', keys: [keychainId, 'backup-key-id', 'bitgo-key-id'] }),
    });

    // Default: keychain fetch returns encryptedPrv
    (mockBitGo.get as sinon.SinonStub).withArgs(`/api/v2/tbtc/key/${keychainId}`).returns({
      result: sinon.stub().resolves({ id: keychainId, encryptedPrv }),
    });

    // Default: decrypt succeeds
    (mockBitGo.decrypt as sinon.SinonStub).returns(decryptedPrv);

    // Default: DELETE succeeds
    (mockBitGo.del as sinon.SinonStub).returns({
      result: sinon.stub().resolves({}),
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  it('should successfully remove a passkey device', async function () {
    await removePasskeyFromWallet({
      bitgo: mockBitGo as any,
      walletId,
      device,
      walletPassphrase,
    });

    // Verify decrypt was called with the right args
    sinon.assert.calledOnce(mockBitGo.decrypt);
    sinon.assert.calledWithExactly(mockBitGo.decrypt, { password: walletPassphrase, input: encryptedPrv });

    // Verify DELETE was called with device.id (not credentialId)
    sinon.assert.calledOnce(mockBitGo.del);
    sinon.assert.calledWithExactly(mockBitGo.del, `/api/v2/key/${keychainId}/webauthndevice/${device.id}`);
  });

  it('should throw and not call DELETE if passphrase is wrong', async function () {
    (mockBitGo.decrypt as sinon.SinonStub).throws(new Error('decryption failed'));

    await assert.rejects(
      () =>
        removePasskeyFromWallet({
          bitgo: mockBitGo as any,
          walletId,
          device,
          walletPassphrase: 'wrong-passphrase',
        }),
      (err: Error) => {
        assert.ok(err.message.includes('Incorrect wallet passphrase'));
        assert.ok(err.message.includes('Passkey removal aborted to prevent lockout'));
        return true;
      }
    );

    // DELETE must NOT have been called
    sinon.assert.notCalled(mockBitGo.del);
  });

  it('should throw descriptively if keychain has no encryptedPrv', async function () {
    (mockBitGo.get as sinon.SinonStub).withArgs(`/api/v2/tbtc/key/${keychainId}`).returns({
      result: sinon.stub().resolves({ id: keychainId }),
    });

    await assert.rejects(
      () =>
        removePasskeyFromWallet({
          bitgo: mockBitGo as any,
          walletId,
          device,
          walletPassphrase,
        }),
      (err: Error) => {
        assert.ok(err.message.includes('no encryptedPrv'));
        return true;
      }
    );

    // No decrypt or DELETE should be called
    sinon.assert.notCalled(mockBitGo.decrypt);
    sinon.assert.notCalled(mockBitGo.del);
  });
});
