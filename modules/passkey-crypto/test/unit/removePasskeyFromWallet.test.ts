import * as assert from 'assert';
import * as sinon from 'sinon';
import { removePasskeyFromWallet } from '../../src';

describe('removePasskeyFromWallet', function () {
  const coinName = 'tbtc';
  const walletId = 'wallet-abc123';
  const keychainId = 'key-user-id';
  const encryptedPrv = 'encrypted-prv-string';
  const walletPassphrase = 'correct-passphrase';

  const device = {
    id: 'mongo-object-id-123',
    credentialId: 'cred-id-456',
    prfSalt: 'some-salt',
    isPasskey: true,
  };

  let mockBitGo: any;
  let mockWallet: any;
  let mockKeychains: any;
  let mockWallets: any;

  beforeEach(function () {
    mockWallet = {
      keyIds: sinon.stub().returns([keychainId, 'backup-key-id', 'bitgo-key-id']),
    };

    mockWallets = {
      get: sinon.stub().resolves(mockWallet),
    };

    mockKeychains = {
      get: sinon.stub().resolves({ id: keychainId, encryptedPrv }),
    };

    mockBitGo = {
      coin: sinon.stub().returns({
        wallets: sinon.stub().returns(mockWallets),
        keychains: sinon.stub().returns(mockKeychains),
      }),
      decryptAsync: sinon.stub().resolves('xprv-decrypted'),
      del: sinon.stub().returns({
        result: sinon.stub().resolves({}),
      }),
      url: sinon.stub().callsFake((path: string, version?: number) => `/api/v${version ?? 1}${path}`),
    };
  });

  afterEach(function () {
    sinon.restore();
  });

  it('should successfully remove a passkey device', async function () {
    await removePasskeyFromWallet({
      bitgo: mockBitGo,
      coin: coinName,
      walletId,
      device,
      walletPassphrase,
    });

    // Verify coin was initialized
    sinon.assert.calledWithExactly(mockBitGo.coin, coinName);

    // Verify wallet was fetched
    sinon.assert.calledWithExactly(mockWallets.get, { id: walletId });

    // Verify keychain was fetched with correct ID
    sinon.assert.calledWithExactly(mockKeychains.get, { id: keychainId });

    // Verify DELETE was called with device.id (not credentialId)
    sinon.assert.calledOnce(mockBitGo.del);
    sinon.assert.calledWithExactly(mockBitGo.del, `/api/v2/key/${keychainId}/webauthndevice/${device.id}`);
  });

  it('should throw and not call DELETE if passphrase is wrong', async function () {
    mockBitGo.decryptAsync = sinon.stub().resolves(undefined);

    await assert.rejects(
      () =>
        removePasskeyFromWallet({
          bitgo: mockBitGo,
          coin: coinName,
          walletId,
          device,
          walletPassphrase: 'wrong-passphrase',
        }),
      (err: Error) => {
        assert.ok(err.message.includes('Incorrect wallet passphrase'));
        return true;
      }
    );

    sinon.assert.notCalled(mockBitGo.del);
  });

  it('should throw descriptively if keychain has no encryptedPrv', async function () {
    mockKeychains.get = sinon.stub().resolves({ id: keychainId });

    await assert.rejects(
      () =>
        removePasskeyFromWallet({
          bitgo: mockBitGo,
          coin: coinName,
          walletId,
          device,
          walletPassphrase,
        }),
      (err: Error) => {
        assert.ok(err.message.includes('Incorrect wallet passphrase'));
        return true;
      }
    );

    sinon.assert.notCalled(mockBitGo.del);
  });

  it('should throw if device.id is empty', async function () {
    const deviceNoId = { ...device, id: '' };

    await assert.rejects(
      () =>
        removePasskeyFromWallet({
          bitgo: mockBitGo,
          coin: coinName,
          walletId,
          device: deviceNoId,
          walletPassphrase,
        }),
      (err: Error) => {
        assert.ok(err.message.includes('device.id is required'));
        return true;
      }
    );

    sinon.assert.notCalled(mockBitGo.coin);
  });

  it('should propagate wallet fetch errors', async function () {
    mockWallets.get = sinon.stub().rejects(new Error('404 Not Found'));

    await assert.rejects(
      () =>
        removePasskeyFromWallet({
          bitgo: mockBitGo,
          coin: coinName,
          walletId,
          device,
          walletPassphrase,
        }),
      (err: Error) => {
        assert.ok(err.message.includes('404 Not Found'));
        return true;
      }
    );

    sinon.assert.notCalled(mockBitGo.del);
  });

  it('should propagate DELETE errors after passphrase verification', async function () {
    mockBitGo.del = sinon.stub().returns({
      result: sinon.stub().rejects(new Error('500 Internal Server Error')),
    });

    await assert.rejects(
      () =>
        removePasskeyFromWallet({
          bitgo: mockBitGo,
          coin: coinName,
          walletId,
          device,
          walletPassphrase,
        }),
      (err: Error) => {
        assert.ok(err.message.includes('500 Internal Server Error'));
        return true;
      }
    );
  });
});
