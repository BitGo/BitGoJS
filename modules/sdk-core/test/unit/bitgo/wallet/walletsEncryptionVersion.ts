import * as assert from 'assert';
import * as sinon from 'sinon';
import 'should';
import { Wallets } from '../../../../src/bitgo/wallet/wallets';
import { Wallet } from '../../../../src/bitgo/wallet/wallet';

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

    it('passes encryptionVersion: 2 to encrypt on the multiUserKeyRotationRequired path', async function () {
      await wallets.bulkAcceptShare({
        walletShareIds: ['share-id'],
        userLoginPassword: 'login-password',
        encryptionVersion: 2,
      });

      assert.ok(mockBitGo.encrypt.called);
      const call = mockBitGo.encrypt.firstCall;
      assert.strictEqual(call.args[0].encryptionVersion, 2);
    });

    it('passes encryptionVersion: undefined when not set', async function () {
      await wallets.bulkAcceptShare({
        walletShareIds: ['share-id'],
        userLoginPassword: 'login-password',
      });

      assert.ok(mockBitGo.encrypt.called);
      const call = mockBitGo.encrypt.firstCall;
      assert.strictEqual(call.args[0].encryptionVersion, undefined);
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

      await wallets.bulkAcceptShare({
        walletShareIds: manyShares.map((s) => s.id),
        userLoginPassword: 'login-password',
      });

      // All 20 shares should have been encrypted (one encrypt call per share)
      assert.strictEqual(mockBitGo.encrypt.callCount, 20);
    });

    it('never runs more than 16 shares concurrently', async function () {
      let inFlight = 0;
      let maxInFlight = 0;

      mockBitGo.encrypt.callsFake(() => {
        inFlight++;
        maxInFlight = Math.max(maxInFlight, inFlight);
        return Promise.resolve('encrypted').then((r) => {
          inFlight--;
          return r;
        });
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
      assert.strictEqual(mockBitGo.encrypt.callCount, 20);
    });
  });

  describe('Wallet.shareWallet / createBulkWalletShare', function () {
    let wallet: Wallet;

    beforeEach(function () {
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

    it('shareWallet passes encryptionVersion to prepareSharedKeychain', async function () {
      const prepareStub = sinon.stub(wallet, 'prepareSharedKeychain').resolves({});
      mockBitGo.getSharingKey = sinon.stub().resolves({ userId: 'user-id', pubkey: 'recvPub', path: 'm/0' });
      mockBitGo.post.returns({ send: sinon.stub().returns({ result: sinon.stub().resolves({}) }) });

      await wallet.shareWallet({
        email: 'test@test.com',
        permissions: 'spend',
        walletPassphrase: 'passphrase',
        encryptionVersion: 2,
      });

      assert.ok(prepareStub.calledOnce, 'prepareSharedKeychain should be called');
      assert.strictEqual(prepareStub.firstCall.args[3], 2, 'encryptionVersion should be forwarded');
    });

    it('shareWallet passes encryptionVersion: undefined when not set', async function () {
      const prepareStub = sinon.stub(wallet, 'prepareSharedKeychain').resolves({});
      mockBitGo.getSharingKey = sinon.stub().resolves({ userId: 'user-id', pubkey: 'recvPub', path: 'm/0' });
      mockBitGo.post.returns({ send: sinon.stub().returns({ result: sinon.stub().resolves({}) }) });

      await wallet.shareWallet({
        email: 'test@test.com',
        permissions: 'spend',
        walletPassphrase: 'passphrase',
      });

      assert.ok(prepareStub.calledOnce);
      assert.strictEqual(prepareStub.firstCall.args[3], undefined);
    });

    it('createBulkWalletShare passes encryptionVersion to encryptPrvForUser', async function () {
      const encryptPrvStub = sinon
        .stub(wallet, 'encryptPrvForUser')
        .resolves({ encryptedPrv: 'enc', pub: 'pub', fromPubKey: 'fpk', toPubKey: 'tpk', path: 'm/0' });
      sinon
        .stub(wallet as any, 'getDecryptedKeychainForSharing')
        .resolves({ prv: 'prv', pub: 'pub', encryptedPrv: 'encPrv' });
      sinon.stub(wallet as any, 'createBulkKeyShares').resolves({ shares: [] });

      await wallet.createBulkWalletShare({
        walletPassphrase: 'passphrase',
        keyShareOptions: [{ userId: 'user-1', pubKey: 'pubKey', path: 'm/0', permissions: ['spend'] }],
        encryptionVersion: 2,
      });

      assert.ok(encryptPrvStub.calledOnce);
      assert.strictEqual(encryptPrvStub.firstCall.args[4], 2, 'encryptionVersion should be forwarded');
    });

    it('createBulkWalletShare passes encryptionVersion: undefined when not set', async function () {
      const encryptPrvStub = sinon
        .stub(wallet, 'encryptPrvForUser')
        .resolves({ encryptedPrv: 'enc', pub: 'pub', fromPubKey: 'fpk', toPubKey: 'tpk', path: 'm/0' });
      sinon
        .stub(wallet as any, 'getDecryptedKeychainForSharing')
        .resolves({ prv: 'prv', pub: 'pub', encryptedPrv: 'encPrv' });
      sinon.stub(wallet as any, 'createBulkKeyShares').resolves({ shares: [] });

      await wallet.createBulkWalletShare({
        walletPassphrase: 'passphrase',
        keyShareOptions: [{ userId: 'user-1', pubKey: 'pubKey', path: 'm/0', permissions: ['spend'] }],
      });

      assert.ok(encryptPrvStub.calledOnce);
      assert.strictEqual(encryptPrvStub.firstCall.args[4], undefined);
    });
  });
});
