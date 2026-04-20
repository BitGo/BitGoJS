import * as assert from 'assert';
import * as sinon from 'sinon';
import 'should';
import { Wallets } from '../../../../src/bitgo/wallet/wallets';

describe('Wallets - WebAuthn wallet creation', function () {
  let wallets: Wallets;
  let mockBitGo: any;
  let mockBaseCoin: any;
  let mockKeychains: any;

  const userPrv = 'xprvSomeUserPrivateKey';
  const userPub =
    'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8';
  const backupPub =
    'xpub661MyMwAqRbcGczjuMoRm6dXaLDEhW1u34gKenbeYqAix21mdUKJyuyu5F1rzYGVxyL6tmgBUAEPrEz92mBXjByMRiJdba9wpnN37RLLAXa';
  const bitgoPub =
    'xpub661MyMwAqRbcEYS8w7XLSVeEsBXy79zSzH1J8vCdxAZningWLdN3zgtU6LBpB85b3D2yc8sfvZU521AAwdZafEz7mnzBBsz4wKY5fTtTQBm';

  beforeEach(function () {
    mockKeychains = {
      create: sinon.stub().returns({ pub: userPub, prv: userPrv }),
      add: sinon.stub().resolves({ id: 'user-key-id', pub: userPub, encryptedPrv: 'encrypted-prv' }),
      createBackup: sinon.stub().resolves({ id: 'backup-key-id', pub: backupPub }),
      createBitGo: sinon.stub().resolves({ id: 'bitgo-key-id', pub: bitgoPub }),
    };

    const mockWalletData = { id: 'wallet-id', keys: ['user-key-id', 'backup-key-id', 'bitgo-key-id'] };

    mockBitGo = {
      post: sinon.stub().returns({
        send: sinon.stub().returns({
          result: sinon.stub().resolves(mockWalletData),
        }),
      }),
      encrypt: sinon
        .stub()
        .callsFake(({ password, input }: { password: string; input: string }) => `encrypted:${password}:${input}`),
      encryptAsync: sinon
        .stub()
        .callsFake(
          async ({ password, input }: { password: string; input: string }) => `encrypted:${password}:${input}`
        ),
      setRequestTracer: sinon.stub(),
    };

    mockBaseCoin = {
      isEVM: sinon.stub().returns(false),
      supportsTss: sinon.stub().returns(false),
      getFamily: sinon.stub().returns('btc'),
      getDefaultMultisigType: sinon.stub().returns('onchain'),
      keychains: sinon.stub().returns(mockKeychains),
      url: sinon.stub().returns('/test/url'),
      isValidMofNSetup: sinon.stub().returns(true),
      getConfig: sinon.stub().returns({ features: [] }),
      supplementGenerateWallet: sinon.stub().callsFake((params: any) => Promise.resolve(params)),
      signMessage: sinon.stub().resolves(Buffer.from('aabbcc', 'hex')),
    };

    wallets = new Wallets(mockBitGo, mockBaseCoin);
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('generateWallet with webauthnInfo', function () {
    it('should add webauthnDevices to keychain params when webauthnInfo is provided', async function () {
      const webauthnInfo = {
        otpDeviceId: 'device-123',
        prfSalt: 'salt-abc',
        passphrase: 'prf-derived-passphrase',
      };

      await wallets.generateWallet({
        label: 'Test Wallet',
        passphrase: 'wallet-passphrase',
        webauthnInfo,
      });

      assert.strictEqual(mockKeychains.add.calledOnce, true);
      const addParams = mockKeychains.add.firstCall.args[0];
      addParams.should.have.property('webauthnDevices');
      addParams.webauthnDevices.should.have.length(1);
      addParams.webauthnDevices[0].should.have.property('otpDeviceId', webauthnInfo.otpDeviceId);
      addParams.webauthnDevices[0].should.have.property('prfSalt', webauthnInfo.prfSalt);
      addParams.webauthnDevices[0].should.have.property('encryptedPrv');
    });

    it('should encrypt user private key with the webauthn passphrase', async function () {
      const webauthnPassphrase = 'prf-derived-passphrase';

      await wallets.generateWallet({
        label: 'Test Wallet',
        passphrase: 'wallet-passphrase',
        webauthnInfo: {
          otpDeviceId: 'device-123',
          prfSalt: 'salt-abc',
          passphrase: webauthnPassphrase,
        },
      });

      const addParams = mockKeychains.add.firstCall.args[0];
      const expectedEncryptedPrv = `encrypted:${webauthnPassphrase}:${userPrv}`;
      addParams.webauthnDevices[0].should.have.property('encryptedPrv', expectedEncryptedPrv);
    });

    it('should also encrypt user private key with wallet passphrase when webauthnInfo is provided', async function () {
      const walletPassphrase = 'wallet-passphrase';

      await wallets.generateWallet({
        label: 'Test Wallet',
        passphrase: walletPassphrase,
        webauthnInfo: {
          otpDeviceId: 'device-123',
          prfSalt: 'salt-abc',
          passphrase: 'prf-derived-passphrase',
        },
      });

      const addParams = mockKeychains.add.firstCall.args[0];
      const expectedEncryptedPrv = `encrypted:${walletPassphrase}:${userPrv}`;
      addParams.should.have.property('encryptedPrv', expectedEncryptedPrv);
    });

    it('should use separate encrypt calls for wallet passphrase and webauthn passphrase', async function () {
      const walletPassphrase = 'wallet-passphrase';
      const webauthnPassphrase = 'prf-derived-passphrase';

      await wallets.generateWallet({
        label: 'Test Wallet',
        passphrase: walletPassphrase,
        webauthnInfo: {
          otpDeviceId: 'device-123',
          prfSalt: 'salt-abc',
          passphrase: webauthnPassphrase,
        },
      });

      const encryptCalls = mockBitGo.encryptAsync.getCalls();
      const passwordsUsed = encryptCalls.map((call: sinon.SinonSpyCall) => call.args[0].password);
      passwordsUsed.should.containEql(walletPassphrase);
      passwordsUsed.should.containEql(webauthnPassphrase);
    });

    it('should not add webauthnDevices when webauthnInfo is not provided', async function () {
      await wallets.generateWallet({
        label: 'Test Wallet',
        passphrase: 'wallet-passphrase',
      });

      assert.strictEqual(mockKeychains.add.calledOnce, true);
      const addParams = mockKeychains.add.firstCall.args[0];
      addParams.should.not.have.property('webauthnDevices');
    });

    it('should not add webauthnDevices when userKey is explicitly provided (no prv available)', async function () {
      // When a user-provided public key is used, there is no private key to encrypt, so webauthnDevices is skipped
      await wallets.generateWallet({
        label: 'Test Wallet',
        userKey: userPub,
        backupXpub: backupPub,
        webauthnInfo: {
          otpDeviceId: 'device-123',
          prfSalt: 'salt-abc',
          passphrase: 'prf-derived-passphrase',
        },
      });

      // add is called for both user keychain (pub-only) and backup keychain - neither should have webauthnDevices
      const allAddCalls = mockKeychains.add.getCalls();
      assert.ok(allAddCalls.length > 0, 'expected keychains().add to be called at least once');
      for (const call of allAddCalls) {
        call.args[0].should.not.have.property('webauthnDevices');
      }
    });

    it('should return wallet with keychains when webauthnInfo is provided', async function () {
      const result = await wallets.generateWallet({
        label: 'Test Wallet',
        passphrase: 'wallet-passphrase',
        webauthnInfo: {
          otpDeviceId: 'device-123',
          prfSalt: 'salt-abc',
          passphrase: 'prf-derived-passphrase',
        },
      });

      result.should.have.property('wallet');
      result.should.have.property('userKeychain');
      result.should.have.property('backupKeychain');
      result.should.have.property('bitgoKeychain');
    });
  });
});
