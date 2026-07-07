import * as assert from 'assert';
import * as sinon from 'sinon';
import 'should';

import { Wallets } from '../../../../src/bitgo/wallet/wallets';
import { ECDSAUtils, EDDSAUtils } from '../../../../src/bitgo/utils';
import { CoinFeature } from '@bitgo/statics';
import {
  CreateKeychainCallback,
  EcdsaMPCv2KeyGenCallbacks,
  EddsaKeyGenCallbacks,
  EddsaMPCv2KeyGenCallbacks,
} from '../../../../src/bitgo/wallet/iWallets';
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
      add: sinon
        .stub()
        .callsFake((params: any) =>
          Promise.resolve({ id: `${params?.source ?? ''}-key-id`, pub: params?.pub, source: params?.source })
        ),
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
      getMPCAlgorithm: sinon.stub().returns('ecdsa'),
      getFamily: sinon.stub().returns('btc'),
      getChain: sinon.stub().returns('tbtc'),
      getDefaultMultisigType: sinon.stub().returns('onchain'),
      keychains: sinon.stub().returns(mockKeychains),
      url: sinon.stub().returns('/api/v2/tbtc/wallet/add'),
      getConfig: sinon.stub().returns({ features: [] }),
      supplementGenerateWallet: sinon.stub().callsFake((params: any) => Promise.resolve(params)),
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

    it('should pass advanced wallet type through to wallet/add', async function () {
      await wallets.generateWalletWithExternalSigner({
        label: 'Advanced Wallet',
        enterprise: 'enterprise-id',
        type: 'advanced',
        createKeychainCallback,
      });

      const walletBody = sendStub.firstCall.args[0];
      walletBody.type.should.equal('advanced');
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

    it('should reject TSS multisig type without TSS callbacks', async function () {
      await wallets
        .generateWalletWithExternalSigner({
          label: 'TSS Wallet',
          multisigType: 'tss',
          enterprise: 'enterprise-id',
          createKeychainCallback,
        })
        .should.be.rejectedWith('ecdsaMPCv2Callbacks is required for ECDSA TSS wallet generation with external signer');
    });

    it('should route to onchain when createKeychainCallback is provided on a TSS-default coin', async function () {
      mockBaseCoin.getDefaultMultisigType.returns('tss');

      await wallets.generateWalletWithExternalSigner({
        label: 'Onchain on TSS coin',
        enterprise: 'enterprise-id',
        createKeychainCallback,
      });

      assert.strictEqual(createKeychainCallback.callCount, 2);
      assert.strictEqual(mockKeychains.createBitGo.calledOnce, true);
    });

    it('should reject when both createKeychainCallback and MPC callbacks are provided', async function () {
      await wallets
        .generateWalletWithExternalSigner({
          label: 'Ambiguous Wallet',
          enterprise: 'enterprise-id',
          createKeychainCallback,
          ecdsaMPCv2Callbacks: {
            initializeCallback: sinon.stub(),
            round2Callback: sinon.stub(),
            round3Callback: sinon.stub(),
            finalizeCallback: sinon.stub(),
          },
        })
        .should.be.rejectedWith('createKeychainCallback cannot be used together with MPC TSS key generation callbacks');
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
      const keySignatures = { backup: 'deadbeef01', bitgo: 'deadbeef02' };

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

  describe('generateWalletWithExternalSigner - ECDSA MPCv2 TSS', function () {
    let ecdsaCallbacks: EcdsaMPCv2KeyGenCallbacks;
    let ecdsaMockBaseCoin: any;
    let ecdsaWallets: Wallets;

    const commonKeychain = 'abc123commonkeychain';

    beforeEach(function () {
      const mpcState = { encryptedData: 'data', encryptedDataKey: 'data-key' };
      ecdsaCallbacks = {
        initializeCallback: sinon.stub().resolves({
          userGpgPublicKey: 'user-gpg-pub',
          backupGpgPublicKey: 'backup-gpg-pub',
          round1Messages: { broadcastMessages: [], p2pMessages: [] },
          userState: mpcState,
          backupState: mpcState,
        }),
        round2Callback: sinon.stub().resolves({
          round2Messages: { broadcastMessages: [], p2pMessages: [] },
          userState: mpcState,
          backupState: mpcState,
        }),
        round3Callback: sinon.stub().resolves({
          round3Messages: { broadcastMessages: [], p2pMessages: [] },
          userState: mpcState,
          backupState: mpcState,
        }),
        finalizeCallback: sinon.stub().resolves({ commonKeychain }),
      };

      const mockEcdsaBitGo = {
        post: sinon.stub().returns({
          send: sinon.stub().returns({ result: sinon.stub().resolves({ id: 'tss-wallet-id' }) }),
        }),
        get: sinon.stub().returns({ result: sinon.stub().resolves({ coinSettings: {} }) }),
        setRequestTracer: sinon.stub(),
        microservicesUrl: sinon.stub().returns('/api/v2/tss/settings'),
      };

      ecdsaMockBaseCoin = {
        isEVM: sinon.stub().returns(false),
        supportsTss: sinon.stub().returns(true),
        getMPCAlgorithm: sinon.stub().returns('ecdsa'),
        getFamily: sinon.stub().returns('eth'),
        getChain: sinon.stub().returns('teth'),
        getDefaultMultisigType: sinon.stub().returns('tss'),
        keychains: sinon.stub().returns({ add: sinon.stub() }),
        url: sinon.stub().returns('/api/v2/teth/wallet/add'),
        getConfig: sinon.stub().returns({ features: [] }),
        supplementGenerateWallet: sinon.stub().callsFake((params: any) => Promise.resolve(params)),
      };

      ecdsaWallets = new Wallets(mockEcdsaBitGo as any, ecdsaMockBaseCoin);
      sinon.stub(ecdsaWallets as any, 'generateMpcWalletWithExternalSigner').resolves({
        responseType: 'WalletWithKeychains' as const,
        wallet: sinon.createStubInstance(Wallet),
        userKeychain: { id: 'user-key-id', commonKeychain, type: 'tss' },
        backupKeychain: { id: 'backup-key-id', commonKeychain, type: 'tss' },
        bitgoKeychain: { id: 'bitgo-key-id', commonKeychain, type: 'tss' },
      });
    });

    it('should route to generateMpcWalletWithExternalSigner for tss multisig type', async function () {
      const result = await ecdsaWallets.generateWalletWithExternalSigner({
        label: 'ECDSA TSS Wallet',
        multisigType: 'tss',
        enterprise: 'enterprise-id',
        ecdsaMPCv2Callbacks: ecdsaCallbacks,
      });

      result.responseType.should.equal('WalletWithKeychains');
      assert.strictEqual((ecdsaWallets as any).generateMpcWalletWithExternalSigner.calledOnce, true);
    });

    it('should reject without enterprise', async function () {
      sinon.restore();
      ecdsaMockBaseCoin.getMPCAlgorithm = sinon.stub().returns('ecdsa');

      await ecdsaWallets
        .generateWalletWithExternalSigner({
          label: 'ECDSA TSS Wallet',
          multisigType: 'tss',
          ecdsaMPCv2Callbacks: ecdsaCallbacks,
        })
        .should.be.rejectedWith('enterprise is required for TSS wallet generation with external signer');
    });

    it('should reject without ecdsaMPCv2Callbacks for ecdsa coin', async function () {
      sinon.restore();
      ecdsaMockBaseCoin.getMPCAlgorithm = sinon.stub().returns('ecdsa');

      await ecdsaWallets
        .generateWalletWithExternalSigner({
          label: 'ECDSA TSS Wallet',
          multisigType: 'tss',
          enterprise: 'enterprise-id',
        })
        .should.be.rejectedWith('ecdsaMPCv2Callbacks is required for ECDSA TSS wallet generation with external signer');
    });

    it('should reject when coin does not support TSS', async function () {
      sinon.restore();
      ecdsaMockBaseCoin.supportsTss = sinon.stub().returns(false);
      ecdsaMockBaseCoin.getFamily = sinon.stub().returns('btc');

      await ecdsaWallets
        .generateWalletWithExternalSigner({
          label: 'ECDSA TSS Wallet',
          multisigType: 'tss',
          enterprise: 'enterprise-id',
          ecdsaMPCv2Callbacks: ecdsaCallbacks,
        })
        .should.be.rejectedWith('coin btc does not support TSS at this time');
    });

    it('should reject EVM coin with invalid walletVersion', async function () {
      sinon.restore();
      ecdsaMockBaseCoin.isEVM = sinon.stub().returns(true);
      ecdsaMockBaseCoin.getMPCAlgorithm = sinon.stub().returns('ecdsa');

      await ecdsaWallets
        .generateWalletWithExternalSigner({
          label: 'ECDSA TSS Wallet',
          multisigType: 'tss',
          enterprise: 'enterprise-id',
          walletVersion: 4,
          ecdsaMPCv2Callbacks: ecdsaCallbacks,
        })
        .should.be.rejectedWith('EVM TSS wallets are only supported for wallet version 5 and 6');
    });

    it('should reject custodial TSS wallet', async function () {
      sinon.restore();
      ecdsaMockBaseCoin.getMPCAlgorithm = sinon.stub().returns('ecdsa');

      await ecdsaWallets
        .generateWalletWithExternalSigner({
          label: 'Custodial TSS Wallet',
          multisigType: 'tss',
          enterprise: 'enterprise-id',
          type: 'custodial',
          ecdsaMPCv2Callbacks: ecdsaCallbacks,
        })
        .should.be.rejectedWith('custodial TSS wallets are not supported for external signer wallet generation');
    });

    it('should reject passphrase on TSS path', async function () {
      sinon.restore();
      ecdsaMockBaseCoin.getMPCAlgorithm = sinon.stub().returns('ecdsa');

      await ecdsaWallets
        .generateWalletWithExternalSigner({
          label: 'TSS Wallet',
          multisigType: 'tss',
          enterprise: 'enterprise-id',
          ecdsaMPCv2Callbacks: ecdsaCallbacks,
          passphrase: 'secret',
        } as Parameters<Wallets['generateWalletWithExternalSigner']>[0] & { passphrase: string })
        .should.be.rejectedWith('passphrase cannot be used with TSS external signer wallet generation');
    });

    it('should reject ECDSA MPCv1 wallet version 3', async function () {
      sinon.restore();
      ecdsaMockBaseCoin.getMPCAlgorithm = sinon.stub().returns('ecdsa');

      await ecdsaWallets
        .generateWalletWithExternalSigner({
          label: 'MPCv1 Wallet',
          multisigType: 'tss',
          enterprise: 'enterprise-id',
          walletVersion: 3,
          ecdsaMPCv2Callbacks: ecdsaCallbacks,
        })
        .should.be.rejectedWith(
          'ECDSA MPCv1 (wallet version 3) is not supported for external signer wallet generation'
        );
    });

    describe('wallet/add integration (unstubbed generateMpcWalletWithExternalSigner)', function () {
      let send: sinon.SinonStub;
      let integrationCallbacks: EcdsaMPCv2KeyGenCallbacks;

      // Builds a fresh Wallets instance with only createKeychainsWithExternalSigner stubbed,
      // so the routing/version/wallet-add logic in generateMpcWalletWithExternalSigner actually runs.
      function createIntegrationWallets(
        coinOverrides: Record<string, unknown> = {},
        bitgoOverrides: Record<string, unknown> = {}
      ) {
        sinon.restore();

        const mpcState = { encryptedData: 'data', encryptedDataKey: 'data-key' };
        integrationCallbacks = {
          initializeCallback: sinon.stub().resolves({
            userGpgPublicKey: 'user-gpg-pub',
            backupGpgPublicKey: 'backup-gpg-pub',
            round1Messages: { broadcastMessages: [], p2pMessages: [] },
            userState: mpcState,
            backupState: mpcState,
          }),
          round2Callback: sinon.stub().resolves({
            round2Messages: { broadcastMessages: [], p2pMessages: [] },
            userState: mpcState,
            backupState: mpcState,
          }),
          round3Callback: sinon.stub().resolves({
            round3Messages: { broadcastMessages: [], p2pMessages: [] },
            userState: mpcState,
            backupState: mpcState,
          }),
          finalizeCallback: sinon.stub().resolves({ commonKeychain }),
        };

        send = sinon.stub().returns({ result: sinon.stub().resolves({ id: 'tss-wallet-id' }) });
        const integrationBitGo = {
          post: sinon.stub().returns({ send }),
          get: sinon.stub().returns({ result: sinon.stub().resolves({ coinSettings: {} }) }),
          setRequestTracer: sinon.stub(),
          microservicesUrl: sinon.stub().returns('/api/v2/tss/settings'),
          ...bitgoOverrides,
        };
        const integrationCoin = {
          isEVM: sinon.stub().returns(false),
          supportsTss: sinon.stub().returns(true),
          getMPCAlgorithm: sinon.stub().returns('ecdsa'),
          getFamily: sinon.stub().returns('eth'),
          getChain: sinon.stub().returns('teth'),
          getDefaultMultisigType: sinon.stub().returns('tss'),
          getConfig: sinon.stub().returns({ features: [CoinFeature.MPCV2] }),
          keychains: sinon.stub().returns({ add: sinon.stub() }),
          url: sinon.stub().returns('/api/v2/teth/wallet/add'),
          supplementGenerateWallet: sinon.stub().callsFake((params: any) => Promise.resolve(params)),
          ...coinOverrides,
        };

        sinon.stub(ECDSAUtils.EcdsaMPCv2Utils.prototype, 'createKeychainsWithExternalSigner').resolves({
          userKeychain: { id: 'user-key-id', commonKeychain, type: 'tss' },
          backupKeychain: { id: 'backup-key-id', commonKeychain, type: 'tss' },
          bitgoKeychain: { id: 'bitgo-key-id', commonKeychain, type: 'tss' },
        });

        return new Wallets(integrationBitGo as any, integrationCoin as any);
      }

      it('should pass advanced wallet type through to wallet/add', async function () {
        const integrationWallets = createIntegrationWallets();

        await integrationWallets.generateWalletWithExternalSigner({
          label: 'Advanced TSS Wallet',
          type: 'advanced',
          multisigType: 'tss',
          enterprise: 'enterprise-id',
          ecdsaMPCv2Callbacks: integrationCallbacks,
        });

        send.firstCall.args[0].type.should.equal('advanced');
      });

      it('should default EVM walletVersion to 5 when TSS settings specify MPCv2', async function () {
        const integrationWallets = createIntegrationWallets(
          { isEVM: sinon.stub().returns(true) },
          {
            get: sinon.stub().returns({
              result: sinon.stub().resolves({
                coinSettings: { eth: { walletCreationSettings: { multiSigTypeVersion: 'MPCv2' } } },
              }),
            }),
          }
        );

        await integrationWallets.generateWalletWithExternalSigner({
          label: 'EVM TSS Wallet',
          type: 'advanced',
          multisigType: 'tss',
          enterprise: 'enterprise-id',
          ecdsaMPCv2Callbacks: integrationCallbacks,
        });

        send.firstCall.args[0].walletVersion.should.equal(5);
      });

      it('should forward explicit walletVersion to wallet/add', async function () {
        const integrationWallets = createIntegrationWallets({ isEVM: sinon.stub().returns(true) });

        await integrationWallets.generateWalletWithExternalSigner({
          label: 'EVM TSS Wallet v6',
          type: 'advanced',
          multisigType: 'tss',
          enterprise: 'enterprise-id',
          walletVersion: 6,
          ecdsaMPCv2Callbacks: integrationCallbacks,
        });

        send.firstCall.args[0].walletVersion.should.equal(6);
      });
    });
  });

  describe('generateWalletWithExternalSigner - EdDSA TSS', function () {
    let eddsaCallbacks: EddsaKeyGenCallbacks;
    let eddsaMockBaseCoin: any;
    let eddsaWallets: Wallets;

    const commonKeychain = 'eddsa-common-keychain';

    beforeEach(function () {
      const keyShare = (pub: string, prv: string, proof: string) => ({
        publicShare: pub,
        privateShare: prv,
        privateShareProof: proof,
        vssProof: `${proof}-vss`,
        gpgKey: `${pub}-gpg`,
      });
      const mpcState = { encryptedData: 'data', encryptedDataKey: 'data-key' };
      eddsaCallbacks = {
        initializeCallback: sinon.stub().resolves({
          userGpgPublicKey: 'user-gpg-pub',
          backupGpgPublicKey: 'backup-gpg-pub',
          userToBitgoKeyShare: keyShare('upub', 'uprv-enc', 'uproof'),
          backupToBitgoKeyShare: keyShare('bpub', 'bprv-enc', 'bproof'),
          userState: mpcState,
          backupState: mpcState,
          backupToUserCounterPartyKeyShare: keyShare('ucp', 'ucp-prv', 'ucp-proof'),
        }),
        finalizeCallback: sinon.stub().resolves({ commonKeychain }),
      };

      const mockEddsaBitGo = {
        post: sinon.stub().returns({
          send: sinon.stub().returns({ result: sinon.stub().resolves({ id: 'eddsa-wallet-id' }) }),
        }),
        setRequestTracer: sinon.stub(),
      };

      eddsaMockBaseCoin = {
        isEVM: sinon.stub().returns(false),
        supportsTss: sinon.stub().returns(true),
        getMPCAlgorithm: sinon.stub().returns('eddsa'),
        getFamily: sinon.stub().returns('sol'),
        getChain: sinon.stub().returns('tsol'),
        getDefaultMultisigType: sinon.stub().returns('tss'),
        keychains: sinon.stub().returns({ add: sinon.stub() }),
        url: sinon.stub().returns('/api/v2/tsol/wallet/add'),
        getConfig: sinon.stub().returns({ features: [] }),
        supplementGenerateWallet: sinon.stub().callsFake((params: any) => Promise.resolve(params)),
      };

      eddsaWallets = new Wallets(mockEddsaBitGo as any, eddsaMockBaseCoin);
      sinon.stub(eddsaWallets as any, 'generateMpcWalletWithExternalSigner').resolves({
        responseType: 'WalletWithKeychains' as const,
        wallet: sinon.createStubInstance(Wallet),
        userKeychain: { id: 'user-key-id', commonKeychain, type: 'tss' },
        backupKeychain: { id: 'backup-key-id', commonKeychain, type: 'tss' },
        bitgoKeychain: { id: 'bitgo-key-id', commonKeychain, type: 'tss' },
      });
    });

    it('should route to generateMpcWalletWithExternalSigner for tss EdDSA coin', async function () {
      const result = await eddsaWallets.generateWalletWithExternalSigner({
        label: 'EdDSA TSS Wallet',
        multisigType: 'tss',
        enterprise: 'enterprise-id',
        eddsaCallbacks,
      });

      result.responseType.should.equal('WalletWithKeychains');
      assert.strictEqual((eddsaWallets as any).generateMpcWalletWithExternalSigner.calledOnce, true);
    });

    it('should reject without eddsaCallbacks for eddsa coin', async function () {
      sinon.restore();
      eddsaMockBaseCoin.getMPCAlgorithm = sinon.stub().returns('eddsa');

      await eddsaWallets
        .generateWalletWithExternalSigner({
          label: 'EdDSA TSS Wallet',
          multisigType: 'tss',
          enterprise: 'enterprise-id',
        })
        .should.be.rejectedWith('eddsaCallbacks is required for EdDSA TSS wallet generation with external signer');
    });
  });

  describe('generateWalletWithExternalSigner - EdDSA MPCv2 TSS', function () {
    let eddsaMPCv2Callbacks: EddsaMPCv2KeyGenCallbacks;
    let eddsaMPCv2MockBaseCoin: any;
    let eddsaMPCv2Wallets: Wallets;

    const commonKeychain = 'eddsampcv2-common-keychain';

    beforeEach(function () {
      const mpcState = { encryptedData: 'data', encryptedDataKey: 'data-key' };
      eddsaMPCv2Callbacks = {
        initializeCallback: sinon.stub().resolves({
          userGpgPublicKey: 'user-gpg-pub',
          backupGpgPublicKey: 'backup-gpg-pub',
          userState: mpcState,
          backupState: mpcState,
        }),
        round1Callback: sinon.stub().resolves({
          userSignedMsg1: { from: 0, payload: '', signature: '' },
          backupSignedMsg1: { from: 1, payload: '', signature: '' },
          userState: mpcState,
          backupState: mpcState,
        }),
        round2Callback: sinon.stub().resolves({
          userSignedMsg2: { from: 0, payload: '', signature: '' },
          backupSignedMsg2: { from: 1, payload: '', signature: '' },
          userState: mpcState,
          backupState: mpcState,
        }),
        finalizeCallback: sinon.stub().resolves({ commonKeychain }),
      };

      const mockEddsaMPCv2BitGo = {
        post: sinon.stub().returns({
          send: sinon.stub().returns({ result: sinon.stub().resolves({ id: 'eddsampcv2-wallet-id' }) }),
        }),
        setRequestTracer: sinon.stub(),
      };

      eddsaMPCv2MockBaseCoin = {
        isEVM: sinon.stub().returns(false),
        supportsTss: sinon.stub().returns(true),
        getMPCAlgorithm: sinon.stub().returns('eddsa'),
        getFamily: sinon.stub().returns('sol'),
        getChain: sinon.stub().returns('tsol'),
        getDefaultMultisigType: sinon.stub().returns('tss'),
        keychains: sinon.stub().returns({ add: sinon.stub() }),
        url: sinon.stub().returns('/api/v2/tsol/wallet/add'),
        getConfig: sinon.stub().returns({ features: [] }),
        supplementGenerateWallet: sinon.stub().callsFake((params: any) => Promise.resolve(params)),
      };

      eddsaMPCv2Wallets = new Wallets(mockEddsaMPCv2BitGo as any, eddsaMPCv2MockBaseCoin);
      sinon.stub(eddsaMPCv2Wallets as any, 'generateMpcWalletWithExternalSigner').resolves({
        responseType: 'WalletWithKeychains' as const,
        wallet: sinon.createStubInstance(Wallet),
        userKeychain: { id: 'user-key-id', commonKeychain, type: 'tss' },
        backupKeychain: { id: 'backup-key-id', commonKeychain, type: 'tss' },
        bitgoKeychain: { id: 'bitgo-key-id', commonKeychain, type: 'tss' },
      });
    });

    it('should route to generateMpcWalletWithExternalSigner for tss EdDSA MPCv2 coin', async function () {
      const result = await eddsaMPCv2Wallets.generateWalletWithExternalSigner({
        label: 'EdDSA MPCv2 TSS Wallet',
        multisigType: 'tss',
        enterprise: 'enterprise-id',
        eddsaMPCv2Callbacks,
      });

      result.responseType.should.equal('WalletWithKeychains');
      assert.strictEqual((eddsaMPCv2Wallets as any).generateMpcWalletWithExternalSigner.calledOnce, true);
    });

    it('should route to EddsaMPCv2Utils.createKeychainsWithExternalSigner when eddsaMPCv2Callbacks provided', async function () {
      sinon.restore();
      eddsaMPCv2MockBaseCoin.getMPCAlgorithm = sinon.stub().returns('eddsa');

      const keychainsTriplet = {
        userKeychain: { id: 'user-key-id', commonKeychain, type: 'tss' },
        backupKeychain: { id: 'backup-key-id', commonKeychain, type: 'tss' },
        bitgoKeychain: { id: 'bitgo-key-id', commonKeychain, type: 'tss' },
      };

      // createKeychainsWithExternalSigner is added by WCI-916; inject a stub here so the
      // routing logic can be tested before that PR lands.
      const createKeychainsStub = sinon.stub().resolves(keychainsTriplet);
      (EDDSAUtils.EddsaMPCv2Utils.prototype as any).createKeychainsWithExternalSigner = createKeychainsStub;

      const mockBitGoForIntegration = {
        post: sinon.stub().returns({
          send: sinon.stub().returns({ result: sinon.stub().resolves({ id: 'eddsampcv2-wallet-id' }) }),
        }),
        setRequestTracer: sinon.stub(),
      };

      const integrationWallets = new Wallets(mockBitGoForIntegration as any, eddsaMPCv2MockBaseCoin);

      await integrationWallets.generateWalletWithExternalSigner({
        label: 'EdDSA MPCv2 TSS Wallet',
        multisigType: 'tss',
        enterprise: 'enterprise-id',
        eddsaMPCv2Callbacks,
      });

      assert.strictEqual(createKeychainsStub.calledOnce, true);
      createKeychainsStub.firstCall.args[0].should.deepEqual({
        enterprise: 'enterprise-id',
        callbacks: eddsaMPCv2Callbacks,
      });

      delete (EDDSAUtils.EddsaMPCv2Utils.prototype as any).createKeychainsWithExternalSigner;
    });

    it('should reject when both eddsaMPCv2Callbacks and eddsaCallbacks are provided', async function () {
      sinon.restore();
      eddsaMPCv2MockBaseCoin.getMPCAlgorithm = sinon.stub().returns('eddsa');

      const eddsaCallbacks: EddsaKeyGenCallbacks = {
        initializeCallback: sinon.stub() as any,
        finalizeCallback: sinon.stub() as any,
      };

      await eddsaMPCv2Wallets
        .generateWalletWithExternalSigner({
          label: 'EdDSA MPCv2 Conflict Wallet',
          multisigType: 'tss',
          enterprise: 'enterprise-id',
          eddsaMPCv2Callbacks,
          eddsaCallbacks,
        })
        .should.be.rejectedWith(
          'eddsaMPCv2Callbacks and eddsaCallbacks cannot both be provided; use eddsaMPCv2Callbacks for EdDSA MPCv2'
        );
    });

    it('should reject without any eddsa callbacks for eddsa coin', async function () {
      sinon.restore();
      eddsaMPCv2MockBaseCoin.getMPCAlgorithm = sinon.stub().returns('eddsa');

      await eddsaMPCv2Wallets
        .generateWalletWithExternalSigner({
          label: 'EdDSA MPCv2 No Callbacks Wallet',
          multisigType: 'tss',
          enterprise: 'enterprise-id',
        })
        .should.be.rejectedWith('eddsaCallbacks is required for EdDSA TSS wallet generation with external signer');
    });

    it('should not call EddsaMPCv2Utils when eddsaCallbacks (MPCv1) is provided for eddsa coin', async function () {
      sinon.restore();
      eddsaMPCv2MockBaseCoin.getMPCAlgorithm = sinon.stub().returns('eddsa');

      const eddsaCallbacks: EddsaKeyGenCallbacks = {
        initializeCallback: sinon.stub() as any,
        finalizeCallback: sinon.stub() as any,
      };

      // createKeychainsWithExternalSigner is added by WCI-916; inject a stub here so the
      // routing logic can be tested before that PR lands.
      const mpcv2Stub = sinon.stub().resolves({
        userKeychain: { id: 'user-key-id', commonKeychain, type: 'tss' },
        backupKeychain: { id: 'backup-key-id', commonKeychain, type: 'tss' },
        bitgoKeychain: { id: 'bitgo-key-id', commonKeychain, type: 'tss' },
      });
      (EDDSAUtils.EddsaMPCv2Utils.prototype as any).createKeychainsWithExternalSigner = mpcv2Stub;

      const mpcv1Stub = sinon.stub(EDDSAUtils.default.prototype, 'createKeychainsWithExternalSigner').resolves({
        userKeychain: { id: 'user-key-id', commonKeychain, type: 'tss' },
        backupKeychain: { id: 'backup-key-id', commonKeychain, type: 'tss' },
        bitgoKeychain: { id: 'bitgo-key-id', commonKeychain, type: 'tss' },
      });

      const mockBitGoForIntegration = {
        post: sinon.stub().returns({
          send: sinon.stub().returns({ result: sinon.stub().resolves({ id: 'eddsa-wallet-id' }) }),
        }),
        setRequestTracer: sinon.stub(),
      };

      const integrationWallets = new Wallets(mockBitGoForIntegration as any, eddsaMPCv2MockBaseCoin);

      await integrationWallets.generateWalletWithExternalSigner({
        label: 'EdDSA MPCv1 TSS Wallet',
        multisigType: 'tss',
        enterprise: 'enterprise-id',
        eddsaCallbacks,
      });

      assert.strictEqual(mpcv2Stub.callCount, 0);
      assert.strictEqual(mpcv1Stub.calledOnce, true);

      delete (EDDSAUtils.EddsaMPCv2Utils.prototype as any).createKeychainsWithExternalSigner;
    });

    it('should include eddsaMPCv2Callbacks in hasMpcCallbacks check', async function () {
      const hasMpcCallbacks = !!(eddsaMPCv2Callbacks as any);

      await eddsaMPCv2Wallets
        .generateWalletWithExternalSigner({
          label: 'EdDSA MPCv2 No Callbacks Conflict',
          enterprise: 'enterprise-id',
          createKeychainCallback: sinon.stub() as any,
          eddsaMPCv2Callbacks,
        })
        .should.be.rejectedWith('createKeychainCallback cannot be used together with MPC TSS key generation callbacks');

      assert.ok(hasMpcCallbacks);
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
