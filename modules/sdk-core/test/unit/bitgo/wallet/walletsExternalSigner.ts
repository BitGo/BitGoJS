import * as assert from 'assert';
import * as sinon from 'sinon';
import 'should';

import { Wallets } from '../../../../src/bitgo/wallet/wallets';
import { CreateKeychainCallback } from '../../../../src/bitgo/wallet/iWallets';
import { Wallet } from '../../../../src/bitgo/wallet/wallet';

describe('Wallets - external signer onchain wallet generation', function () {
  let wallets: Wallets;
  let mockBitGo: any;
  let mockBaseCoin: any;
  let mockKeychains: any;
  let createKeychainCallback: sinon.SinonStub<Parameters<CreateKeychainCallback>, ReturnType<CreateKeychainCallback>>;
  let sendStub: sinon.SinonStub;

  const userPub =
    'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8';
  const backupPub =
    'xpub661MyMwAqRbcGczjuMoRm6dXaLDEhW1u34gKenbeYqAix21mdUKJyuyu5F1rzYGVxyL6tmgBUAEPrEz92mBXjByMRiJdba9wpnN37RLLAXa';
  const bitgoPub =
    'xpub661MyMwAqRbcEYS8w7XLSVeEsBXy79zSzH1J8vCdxAZningWLdN3zgtU6LBpB85b3D2yc8sfvZU521AAwdZafEz7mnzBBsz4wKY5fTtTQBm';

  beforeEach(function () {
    createKeychainCallback = sinon.stub();
    createKeychainCallback.withArgs({ source: 'user', coin: 'tbtc' }).resolves({
      pub: userPub,
      type: 'independent',
      source: 'user',
    });
    createKeychainCallback.withArgs({ source: 'backup', coin: 'tbtc' }).resolves({
      pub: backupPub,
      type: 'independent',
      source: 'backup',
    });

    mockKeychains = {
      add: sinon.stub().callsFake(async (params: { pub: string; source: string }) => ({
        id: `${params.source}-key-id`,
        pub: params.pub,
        source: params.source,
      })),
      createBitGo: sinon.stub().resolves({ id: 'bitgo-key-id', pub: bitgoPub }),
    };

    const mockWalletData = { id: 'wallet-id', keys: ['user-key-id', 'backup-key-id', 'bitgo-key-id'] };

    sendStub = sinon.stub().returns({
      result: sinon.stub().resolves(mockWalletData),
    });
    mockBitGo = {
      post: sinon.stub().returns({ send: sendStub }),
      setRequestTracer: sinon.stub(),
    };

    mockBaseCoin = {
      isEVM: sinon.stub().returns(false),
      supportsTss: sinon.stub().returns(true),
      getFamily: sinon.stub().returns('btc'),
      getChain: sinon.stub().returns('tbtc'),
      getDefaultMultisigType: sinon.stub().returns('onchain'),
      keychains: sinon.stub().returns(mockKeychains),
      url: sinon.stub().returns('/api/v2/tbtc/wallet/add'),
      getConfig: sinon.stub().returns({ features: [] }),
      supplementGenerateWallet: sinon.stub().callsFake((walletParams: unknown) => Promise.resolve(walletParams)),
      isValidPub: sinon.stub().returns(true),
    };

    wallets = new Wallets(mockBitGo, mockBaseCoin);
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('generateWalletWithExternalSigner', function () {
    it('should create user and backup keys via callback and create wallet', async function () {
      const result = await wallets.generateWalletWithExternalSigner({
        label: 'External Signer Wallet',
        enterprise: 'enterprise-id',
        createKeychainCallback,
      });

      assert.strictEqual(createKeychainCallback.callCount, 2);
      assert.strictEqual(mockKeychains.add.callCount, 2);
      assert.strictEqual(mockKeychains.createBitGo.calledOnce, true);
      assert.strictEqual(mockBitGo.post.calledOnce, true);

      const addUserParams = mockKeychains.add.getCall(0).args[0];
      addUserParams.should.have.property('pub', userPub);
      addUserParams.should.have.property('keyType', 'independent');
      addUserParams.should.have.property('source', 'user');

      const walletBody = sendStub.firstCall.args[0];
      walletBody.keys.should.deepEqual(['user-key-id', 'backup-key-id', 'bitgo-key-id']);
      walletBody.label.should.equal('External Signer Wallet');
      walletBody.enterprise.should.equal('enterprise-id');

      result.responseType.should.equal('WalletWithKeychains');
      assert.strictEqual(result.userKeychain.pub, userPub);
      assert.strictEqual(result.backupKeychain.pub, backupPub);
      assert.strictEqual(result.bitgoKeychain.pub, bitgoPub);
    });

    it('should reject when callback source does not match requested source', async function () {
      createKeychainCallback.withArgs({ source: 'user', coin: 'tbtc' }).resolves({
        pub: userPub,
        type: 'independent',
        source: 'backup',
      });

      await wallets
        .generateWalletWithExternalSigner({
          label: 'External Signer Wallet',
          createKeychainCallback,
        })
        .should.be.rejectedWith(
          'Failed to create user keychain: createKeychainCallback returned source backup, expected user'
        );
    });

    it('should reject invalid type from callback', async function () {
      const badTypeCallback = sinon.stub();
      badTypeCallback.withArgs({ source: 'user', coin: 'tbtc' }).resolves({
        pub: userPub,
        type: 'tss',
        source: 'user',
      });
      badTypeCallback.withArgs({ source: 'backup', coin: 'tbtc' }).resolves({
        pub: backupPub,
        type: 'independent',
        source: 'backup',
      });

      await wallets
        .generateWalletWithExternalSigner({
          label: 'External Signer Wallet',
          createKeychainCallback: badTypeCallback,
        })
        .should.be.rejectedWith(
          "Failed to create user keychain: createKeychainCallback returned invalid type tss, expected 'independent' for onchain multisig"
        );
    });

    it('should reject TSS multisig type', async function () {
      await wallets
        .generateWalletWithExternalSigner({
          label: 'TSS Wallet',
          multisigType: 'tss',
          createKeychainCallback,
        })
        .should.be.rejectedWith('external signer wallet generation is only supported for onchain multisig wallets');
    });

    it('should reject custodial wallet type', async function () {
      await wallets
        .generateWalletWithExternalSigner({
          label: 'Custodial Wallet',
          type: 'custodial',
          createKeychainCallback,
        })
        .should.be.rejectedWith('external signer wallet generation is not supported for custodial onchain wallets');
    });

    it('should reject passcodeEncryptionCode', async function () {
      await wallets
        .generateWalletWithExternalSigner({
          label: 'Wallet',
          passcodeEncryptionCode: 'some-code',
          createKeychainCallback,
        })
        .should.be.rejectedWith('passcodeEncryptionCode is not supported for external signer wallet generation');
    });

    it('should reject webauthnInfo', async function () {
      await wallets
        .generateWalletWithExternalSigner({
          label: 'Wallet',
          webauthnInfo: { otpDeviceId: 'dev-id', prfSalt: 'salt', passphrase: 'pass' },
          createKeychainCallback,
        })
        .should.be.rejectedWith('webauthnInfo is not supported for external signer wallet generation');
    });

    it('should reject isDistributedCustody without enterprise', async function () {
      await wallets
        .generateWalletWithExternalSigner({
          label: 'DC Wallet',
          type: 'cold',
          isDistributedCustody: true,
          createKeychainCallback,
        })
        .should.be.rejectedWith('must provide enterprise when creating distributed custody wallet');
    });

    it('should reject isDistributedCustody with non-cold type', async function () {
      await wallets
        .generateWalletWithExternalSigner({
          label: 'DC Wallet',
          type: 'hot',
          isDistributedCustody: true,
          enterprise: 'enterprise-id',
          createKeychainCallback,
        })
        .should.be.rejectedWith('distributed custody wallets must be type: cold');
    });

    it('should reject when callback returns invalid pub for coin', async function () {
      // only invalidate user pub so the rejection source is deterministic
      mockBaseCoin.isValidPub.callsFake((pub: string) => pub !== userPub);

      await wallets
        .generateWalletWithExternalSigner({
          label: 'External Signer Wallet',
          createKeychainCallback,
        })
        .should.be.rejectedWith(
          'Failed to create user keychain: createKeychainCallback returned invalid pub for user key on tbtc'
        );
    });

    it('should wrap error when callback throws', async function () {
      createKeychainCallback.withArgs({ source: 'user', coin: 'tbtc' }).rejects(new Error('HSM unreachable'));

      await wallets
        .generateWalletWithExternalSigner({
          label: 'External Signer Wallet',
          createKeychainCallback,
        })
        .should.be.rejectedWith('Failed to create user keychain: HSM unreachable');
    });

    it('should reject with backup keychain error when backup callback throws', async function () {
      createKeychainCallback.withArgs({ source: 'backup', coin: 'tbtc' }).rejects(new Error('HSM unreachable'));

      await wallets
        .generateWalletWithExternalSigner({
          label: 'External Signer Wallet',
          createKeychainCallback,
        })
        .should.be.rejectedWith('Failed to create backup keychain: HSM unreachable');

      assert.strictEqual(mockBitGo.post.callCount, 0);
    });

    it('should wrap non-Error thrown by callback', async function () {
      createKeychainCallback
        .withArgs({ source: 'user', coin: 'tbtc' })
        .returns(Promise.reject('plain string rejection'));

      await wallets
        .generateWalletWithExternalSigner({
          label: 'External Signer Wallet',
          createKeychainCallback,
        })
        .should.be.rejectedWith('Failed to create user keychain: plain string rejection');
    });

    it('should forward keySignatures to wallet params when provided', async function () {
      const keySignatures = {
        backup: 'deadbeef01',
        bitgo: 'deadbeef02',
      };

      await wallets.generateWalletWithExternalSigner({
        label: 'External Signer Wallet',
        enterprise: 'enterprise-id',
        createKeychainCallback,
        keySignatures,
      });

      const walletBody = sendStub.firstCall.args[0];
      walletBody.should.have.property('keySignatures');
      walletBody.keySignatures.should.deepEqual(keySignatures);
    });

    it('should not include keySignatures in wallet params when not provided', async function () {
      await wallets.generateWalletWithExternalSigner({
        label: 'External Signer Wallet',
        enterprise: 'enterprise-id',
        createKeychainCallback,
      });

      const walletBody = sendStub.firstCall.args[0];
      walletBody.should.not.have.property('keySignatures');
    });
  });

  describe('generateWallet with createKeychainCallback', function () {
    it('should delegate to generateWalletWithExternalSigner', async function () {
      const generateWalletWithExternalSignerStub = sinon.stub(wallets, 'generateWalletWithExternalSigner').resolves({
        responseType: 'WalletWithKeychains',
        wallet: sinon.createStubInstance(Wallet),
        userKeychain: { id: 'user-key-id', pub: userPub, type: 'independent' as const },
        backupKeychain: { id: 'backup-key-id', pub: backupPub, type: 'independent' as const },
        bitgoKeychain: { id: 'bitgo-key-id', pub: bitgoPub, type: 'independent' as const },
      });

      await wallets.generateWallet({
        label: 'Delegated Wallet',
        createKeychainCallback,
      });

      assert.strictEqual(generateWalletWithExternalSignerStub.calledOnce, true);
      generateWalletWithExternalSignerStub.firstCall.args[0].label.should.equal('Delegated Wallet');
    });

    it('should reject when createKeychainCallback is combined with passphrase', async function () {
      await wallets
        .generateWallet({
          label: 'Invalid Wallet',
          passphrase: 'secret',
          createKeychainCallback,
        })
        .should.be.rejectedWith('createKeychainCallback cannot be used with passphrase');
    });

    it('should reject when createKeychainCallback is combined with userKey', async function () {
      await wallets
        .generateWallet({
          label: 'Invalid Wallet',
          userKey: 'xpub...',
          createKeychainCallback,
        })
        .should.be.rejectedWith('createKeychainCallback cannot be used with userKey');
    });
  });
});
