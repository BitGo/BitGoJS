import * as assert from 'assert';
import * as sinon from 'sinon';
import 'should';
import { Wallets } from '../../../../src/bitgo/wallet/wallets';
import { Wallet } from '../../../../src/bitgo/wallet/wallet';
import { makeRandomKey } from '../../../../src/bitgo/bitcoin';
import { HIGH_ENTROPY_ENCRYPTION_VERSION } from '../../../../src/api';

describe('Wallets - encryptionVersion threading', function () {
  let wallets: Wallets;
  let mockBitGo: any;
  let mockBaseCoin: any;
  let mockKeychains: any;

  const userPrv = 'xprvSomeUserPrivateKey';
  const userPub =
    'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8';

  beforeEach(function () {
    mockKeychains = {
      create: sinon.stub().returns({ pub: userPub, prv: userPrv }),
      add: sinon.stub().resolves({ id: 'user-key-id', pub: userPub, encryptedPrv: 'encrypted-prv' }),
    };

    mockBitGo = {
      encrypt: sinon
        .stub()
        .callsFake(async ({ password, input }: { password: string; input: string }) => `enc:${password}:${input}`),
      decrypt: sinon.stub().resolves('decryptedPrv'),
      createEncryptionSession: sinon.stub().callsFake(async (password: string, encryptionVersion?: 1 | 2) => ({
        encrypt: sinon
          .stub()
          .callsFake(async (input: string) => `session-enc:${password}:${encryptionVersion}:${input}`),
        decrypt: sinon.stub().resolves('session-decrypted'),
        destroy: sinon.stub(),
      })),
      get: sinon.stub().returns({ result: sinon.stub(), query: sinon.stub().returnsThis() }),
      post: sinon.stub().returns({ send: sinon.stub().returns({ result: sinon.stub().resolves({}) }) }),
      put: sinon.stub().returns({
        send: sinon
          .stub()
          .returns({ result: sinon.stub().resolves({ acceptedWalletShares: [], walletShareUpdateErrors: [] }) }),
      }),
      getECDHKeychain: sinon.stub().resolves({ encryptedXprv: 'encXprv' }),
      setRequestTracer: sinon.stub(),
      url: sinon.stub().returns('/test/url'),
    };

    mockBaseCoin = {
      keychains: sinon.stub().returns(mockKeychains),
      url: sinon.stub().callsFake((path: string) => path),
      getFamily: sinon.stub().returns('btc'),
      getChain: sinon.stub().returns('btc'),
      supportsTss: sinon.stub().returns(false),
      getMPCAlgorithm: sinon.stub().returns('ecdsa'),
    };

    wallets = new Wallets(mockBitGo, mockBaseCoin);
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('acceptShare', function () {
    it('passes encryptionVersion: 2 to encrypt on the multiUserKeyRotationRequired path', async function () {
      mockBitGo.get.returns({
        result: sinon.stub().resolves({
          userMultiKeyRotationRequired: true,
          keychain: null,
          permissions: ['spend'],
          wallet: 'wallet-id',
        }),
      });

      await wallets.acceptShare({
        walletShareId: 'share-id',
        userPassword: 'my-password',
        encryptionVersion: 2,
      });

      assert.ok(mockBitGo.encrypt.called, 'encrypt should have been called');
      const call = mockBitGo.encrypt.firstCall;
      assert.strictEqual(call.args[0].encryptionVersion, 2);
    });

    it('passes encryptionVersion: undefined when not set', async function () {
      mockBitGo.get.returns({
        result: sinon.stub().resolves({
          userMultiKeyRotationRequired: true,
          keychain: null,
          permissions: ['spend'],
          wallet: 'wallet-id',
        }),
      });

      await wallets.acceptShare({
        walletShareId: 'share-id',
        userPassword: 'my-password',
      });

      assert.ok(mockBitGo.encrypt.called);
      const call = mockBitGo.encrypt.firstCall;
      assert.strictEqual(call.args[0].encryptionVersion, undefined);
    });
  });

  describe('bulkAcceptShare', function () {
    const walletSharesList = {
      incoming: [
        {
          id: 'share-id',
          userMultiKeyRotationRequired: true,
          keychain: null,
          permissions: ['spend'],
        },
      ],
      outgoing: [],
    };

    beforeEach(function () {
      mockBitGo.get.returns({ result: sinon.stub().resolves(walletSharesList) });
    });

    it('passes encryptionVersion: 2 to the encryption session', async function () {
      await wallets.bulkAcceptShare({
        walletShareIds: ['share-id'],
        userLoginPassword: 'login-password',
        encryptionVersion: 2,
      });

      assert.ok(mockBitGo.createEncryptionSession.called);
      const call = mockBitGo.createEncryptionSession.firstCall;
      assert.strictEqual(call.args[1], 2);
    });

    it('passes encryptionVersion: undefined to the encryption session when not set', async function () {
      await wallets.bulkAcceptShare({
        walletShareIds: ['share-id'],
        userLoginPassword: 'login-password',
      });

      assert.ok(mockBitGo.createEncryptionSession.called);
      const call = mockBitGo.createEncryptionSession.firstCall;
      assert.strictEqual(call.args[1], undefined);
    });

    it('processes shares in batches of 16 to avoid WASM memory exhaustion', async function () {
      // 20 shares → 2 batches (16 + 4), verifying the batch boundary is crossed
      const manyShares = Array.from({ length: 20 }, (_, i) => ({
        id: `share-${i}`,
        userMultiKeyRotationRequired: true,
        keychain: null,
        permissions: ['spend'],
      }));
      mockBitGo.get.returns({
        result: sinon.stub().resolves({ incoming: manyShares, outgoing: [] }),
      });

      // Capture the session so we can inspect its encrypt call count
      const sessionEncryptStub = sinon.stub().callsFake(async (input: string) => `session-enc:${input}`);
      mockBitGo.createEncryptionSession = sinon.stub().resolves({
        encrypt: sessionEncryptStub,
        decrypt: sinon.stub(),
        destroy: sinon.stub(),
      });

      await wallets.bulkAcceptShare({
        walletShareIds: manyShares.map((s) => s.id),
        userLoginPassword: 'login-password',
      });

      // Session created once, session.encrypt called once per share
      assert.strictEqual(mockBitGo.createEncryptionSession.callCount, 1);
      assert.strictEqual(sessionEncryptStub.callCount, 20);
    });

    it('never runs more than 16 shares concurrently', async function () {
      let inFlight = 0;
      let maxInFlight = 0;

      const sessionEncryptStub = sinon.stub().callsFake(() => {
        inFlight++;
        maxInFlight = Math.max(maxInFlight, inFlight);
        return Promise.resolve('encrypted').then((r) => {
          inFlight--;
          return r;
        });
      });
      mockBitGo.createEncryptionSession = sinon.stub().resolves({
        encrypt: sessionEncryptStub,
        decrypt: sinon.stub(),
        destroy: sinon.stub(),
      });

      const manyShares = Array.from({ length: 20 }, (_, i) => ({
        id: `share-${i}`,
        userMultiKeyRotationRequired: true,
        keychain: null,
        permissions: ['spend'],
      }));
      mockBitGo.get.returns({
        result: sinon.stub().resolves({ incoming: manyShares, outgoing: [] }),
      });

      await wallets.bulkAcceptShare({
        walletShareIds: manyShares.map((s) => s.id),
        userLoginPassword: 'login-password',
      });

      assert.ok(maxInFlight <= 16, `expected max concurrency <= 16, got ${maxInFlight}`);
      assert.strictEqual(sessionEncryptStub.callCount, 20);
    });
  });

  describe('Wallet.shareWallet / createBulkWalletShare', function () {
    let wallet: Wallet;
    let recipientPubKey: string;

    beforeEach(function () {
      recipientPubKey = makeRandomKey().publicKey.toString('hex');
      const mockWalletData = {
        id: 'wallet-id',
        keys: ['key-1', 'key-2', 'key-3'],
        coin: 'btc',
        label: 'Test Wallet',
        users: [],
        multisigType: 'onchain',
        type: 'hot',
      };
      mockBaseCoin.supportsTss = sinon.stub().returns(false);
      mockBaseCoin.getMPCAlgorithm = sinon.stub().returns('ecdsa');
      wallet = new Wallet(mockBitGo, mockBaseCoin, mockWalletData);
    });

    it('encryptPrvForUser encrypts to the ECDH secret at the high-entropy version', async function () {
      await wallet.encryptPrvForUser('prv', 'pub', recipientPubKey, 'm/0', 2);

      assert.ok(mockBitGo.encrypt.calledOnce, 'encrypt should have been called');
      assert.strictEqual(mockBitGo.encrypt.firstCall.args[0].encryptionVersion, HIGH_ENTROPY_ENCRYPTION_VERSION);
    });

    it('preserves the encryptionVersion position before a pre-decrypted keychain', async function () {
      await wallet.prepareSharedKeychain(undefined, recipientPubKey, 'm/0', 2, {
        prv: 'prv',
        pub: 'pub',
      });

      assert.strictEqual(mockBitGo.encrypt.firstCall.args[0].input, 'prv');
      assert.strictEqual(mockBitGo.encrypt.firstCall.args[0].encryptionVersion, HIGH_ENTROPY_ENCRYPTION_VERSION);
    });

    it('shareWallet ignores a caller-supplied encryptionVersion for the shared keychain', async function () {
      sinon.stub(wallet, 'getDecryptedKeychainForSharing').resolves({ prv: 'prv', pub: 'pub' });
      mockBitGo.getSharingKey = sinon.stub().resolves({ userId: 'user-id', pubkey: recipientPubKey, path: 'm/0' });
      mockBitGo.post.returns({ send: sinon.stub().returns({ result: sinon.stub().resolves({}) }) });

      await wallet.shareWallet({
        email: 'test@test.com',
        permissions: 'spend',
        walletPassphrase: 'passphrase',
        encryptionVersion: 2,
      });

      assert.ok(mockBitGo.encrypt.calledOnce, 'encrypt should have been called');
      assert.strictEqual(
        mockBitGo.encrypt.firstCall.args[0].encryptionVersion,
        HIGH_ENTROPY_ENCRYPTION_VERSION,
        'the ECDH-keyed share must not be encrypted at the caller-requested version'
      );
    });

    it('createBulkWalletShare ignores a caller-supplied encryptionVersion for every share', async function () {
      sinon.stub(wallet, 'getDecryptedKeychainForSharing').resolves({ prv: 'prv', pub: 'pub' });
      sinon.stub(wallet, 'createBulkKeyShares').resolves({ shares: [] });

      await wallet.createBulkWalletShare({
        walletPassphrase: 'passphrase',
        keyShareOptions: [
          { userId: 'user-1', pubKey: recipientPubKey, path: 'm/0', permissions: ['spend'] },
          { userId: 'user-2', pubKey: recipientPubKey, path: 'm/1', permissions: ['spend'] },
        ],
        encryptionVersion: 2,
      });

      assert.strictEqual(mockBitGo.encrypt.callCount, 2, 'each recipient gets its own encryption');
      for (const call of mockBitGo.encrypt.getCalls()) {
        assert.strictEqual(call.args[0].encryptionVersion, HIGH_ENTROPY_ENCRYPTION_VERSION);
      }
    });
  });

  describe('Wallets.generateWallet', function () {
    it('keeps human-passphrase encryption at the requested version and pins recovery encryption', async function () {
      mockKeychains.createBackup = sinon.stub().resolves({ id: 'backup-key-id', pub: 'backup-pub' });
      mockKeychains.createBitGo = sinon.stub().resolves({ id: 'bitgo-key-id', pub: 'bitgo-pub' });
      mockBitGo.post.returns({ send: sinon.stub().returns({ result: sinon.stub().resolves({ id: 'wallet-id' }) }) });
      mockBaseCoin.getDefaultMultisigType = sinon.stub().returns('onchain');
      mockBaseCoin.isEVM = sinon.stub().returns(false);
      mockBaseCoin.isValidMofNSetup = sinon.stub().returns(true);
      mockBaseCoin.supplementGenerateWallet = sinon.stub().callsFake(async (params: unknown) => params);
      mockBaseCoin.signMessage = sinon.stub().resolves(Buffer.from('aabbcc', 'hex'));

      await wallets.generateWallet({
        label: 'Test Wallet',
        passphrase: 'wallet-passphrase',
        passcodeEncryptionCode: 'recovery-code',
        encryptionVersion: 2,
      });

      assert.strictEqual(mockBitGo.encrypt.callCount, 2);
      assert.strictEqual(mockBitGo.encrypt.firstCall.args[0].encryptionVersion, 2);
      assert.strictEqual(mockBitGo.encrypt.secondCall.args[0].encryptionVersion, HIGH_ENTROPY_ENCRYPTION_VERSION);
    });
  });
});
