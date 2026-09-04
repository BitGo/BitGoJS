/**
 * @prettier
 *
 * Safe-wallet SPEND sharing. Mirrors test/unit/bitgo/wallet/safeGetUserPrv.ts (sinon-stubbed,
 * no nock) for the sharing analogue: a safe owner's children are pub-only, so the share path
 * must re-derive the child prv from the root — never the root material.
 */
import 'should';
import * as sinon from 'sinon';
import {
  IncorrectPasswordError,
  SafeDerivedPublicKeyMismatchError,
  SafeShareNotImplementedError,
  Wallet,
  deriveSafeChildHardenedFromXprv,
} from '../../../../src';
import { BaseCoin } from '../../../../src/bitgo/baseCoin';
import { getSharedSecret } from '../../../../src/bitgo/ecdh';
import { makeRandomKey } from '../../../../src/bitgo/bitcoin';

require('should-sinon');

describe('Safe wallet spend sharing', function () {
  const prv =
    'xprv9s21ZrQH143K3hekyNj7TciR4XNYe1kMj68W2ipjJGNHETWP7o42AjDnSPgKhdZ4x8NBAvaL72RrXjuXNdmkMqLERZza73oYugGtbLFXG8g';
  const hardened = deriveSafeChildHardenedFromXprv(prv, '123');
  const passphrase = 'test-passphrase';
  const rootKeyId = 'root-key-id';
  const SHAREE_PUB = '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798';

  let mockBitGo: any;
  let mockBaseCoin: any;
  let keychainsGetStub: sinon.SinonStub;
  let encryptStub: sinon.SinonStub;
  let decryptStub: sinon.SinonStub;
  let createShareStub: sinon.SinonStub;
  let createBulkKeySharesStub: sinon.SinonStub;

  const baseWalletData = {
    id: 'wallet-id',
    coin: 'tbtc',
    keys: ['user-key', 'backup-key', 'bitgo-key'],
    type: 'hot',
    multisigType: 'onchain',
    enterprise: 'ent-id',
  };

  const childKeychain = (id: string) => ({
    id,
    pub: hardened.pub,
    type: 'independent' as const,
    parent: rootKeyId,
    derivedFromParentWithHardenedPath: "m/123'",
  });
  const publicOnlyKeychain = (id: string) => ({ id, pub: 'pub-' + id, type: 'independent' as const });
  const rootKeychain = {
    id: rootKeyId,
    source: 'user' as const,
    encryptedPrv: `enc:${prv}`,
    type: 'independent' as const,
    pub: 'root-pub',
  };

  beforeEach(function () {
    keychainsGetStub = sinon.stub();
    encryptStub = sinon.stub();
    decryptStub = sinon.stub();

    mockBitGo = {
      encrypt: encryptStub,
      decrypt: decryptStub,
      url: sinon.stub().returns('https://test.bitgo.com/'),
      setRequestTracer: sinon.stub(),
      getSharingKey: sinon.stub().resolves({ userId: 'sharee-id', pubkey: SHAREE_PUB, path: 'm/0' }),
    };

    mockBaseCoin = {
      getChain: sinon.stub().returns('tbtc'),
      getFamily: sinon.stub().returns('btc'),
      getFullName: sinon.stub().returns('Test Bitcoin'),
      keychains: sinon.stub().returns({
        get: keychainsGetStub,
        getKeysForSigning: sinon.stub().resolves([]),
      }),
      deriveKeyWithSeed: sinon.stub(),
      url: sinon.stub().callsFake((path: string) => `https://test.bitgo.com/api/v2/tbtc${path}`),
      supportsStaking: sinon.stub().returns(false),
      supportsTss: sinon.stub().returns(false),
      getMPCAlgorithm: sinon.stub(),
      keyIdsForSigning: sinon.stub().returns([0, 1, 2]),
    };

    keychainsGetStub.callsFake(({ id }: { id: string }) =>
      Promise.resolve(id === rootKeyId ? rootKeychain : id === 'user-key' ? childKeychain(id) : publicOnlyKeychain(id))
    );

    // Reversible encrypt: `shared:<password>:<input>` so tests can verify the ECDH secret and
    // that the payload encrypts the CHILD prv, not the root.
    encryptStub.callsFake(({ input, password }: { input: string; password: string }) =>
      Promise.resolve(`shared:${password}:${input}`)
    );

    decryptStub.callsFake(({ input, password }: { input: string; password: string }) => {
      if (password !== passphrase) return null;
      if (typeof input === 'string' && input.startsWith('enc:')) return input.slice(4);
      return null;
    });

    createShareStub = sinon.stub(Wallet.prototype, 'createShare').resolves({});
    createBulkKeySharesStub = sinon.stub(Wallet.prototype, 'createBulkKeyShares').resolves({ shares: [] });
  });

  afterEach(function () {
    sinon.restore();
  });

  function makeWallet(overrides: Record<string, unknown> = {}): Wallet {
    return new Wallet(mockBitGo, mockBaseCoin as unknown as BaseCoin, {
      ...baseWalletData,
      ...overrides,
    });
  }

  async function getShareOptions(wallet: Wallet, params: Record<string, unknown> = {}) {
    await wallet.shareWallet({
      email: 'shareto@test.com',
      permissions: 'spend',
      walletPassphrase: passphrase,
      ...params,
    });
    return createShareStub.firstCall.args[0];
  }

  describe('hot safe wallet, spend share', function () {
    it('derives child material, uses the registered child pub, and never ships root material', async function () {
      const wallet = makeWallet({ safe: 'safe-id-1' });
      const options = await getShareOptions(wallet);

      options.skipKeychain.should.equal(false);
      options.keychain.should.be.ok();
      options.keychain.pub.should.equal(hardened.pub);

      const json = JSON.stringify(options.keychain);
      json.should.not.containEql(prv); // root xprv never leaves
      json.should.not.containEql('root-pub'); // root pub never leaves
    });

    it('the encrypted prv ECDH-decrypts (sharee side) to the CHILD prv', async function () {
      const shareeKey = makeRandomKey();
      const shareePub = shareeKey.publicKey.toString('hex');
      mockBitGo.getSharingKey = sinon.stub().resolves({ userId: 'sharee-id', pubkey: shareePub, path: 'm/0' });

      const wallet = makeWallet({ safe: 'safe-id-1' });
      const options = await getShareOptions(wallet);

      const shareeSecret = getSharedSecret(shareeKey, Buffer.from(options.keychain.fromPubKey, 'hex')).toString('hex');
      options.keychain.encryptedPrv.should.equal(`shared:${shareeSecret}:${hardened.prv}`);
    });

    it('a view-only share needs no keychain and does not fetch the root', async function () {
      const wallet = makeWallet({ safe: 'safe-id-1' });
      await wallet.shareWallet({ email: 'shareto@test.com', permissions: 'view', walletPassphrase: passphrase });

      createShareStub.firstCall.args[0].skipKeychain.should.equal(true);
      createShareStub.firstCall.args[0].should.have.property('keychain', undefined);
      keychainsGetStub.notCalled.should.equal(true);
    });

    it('a wrong passphrase rejects with IncorrectPasswordError and posts nothing', async function () {
      const wallet = makeWallet({ safe: 'safe-id-1' });
      await wallet
        .shareWallet({ email: 'shareto@test.com', permissions: 'spend', walletPassphrase: 'wrong-passphrase' })
        .should.be.rejectedWith(IncorrectPasswordError);
      createShareStub.notCalled.should.equal(true);
    });

    it('a missing passphrase throws instead of silently skipKeychain', async function () {
      const wallet = makeWallet({ safe: 'safe-id-1' });
      await wallet
        .shareWallet({ email: 'shareto@test.com', permissions: 'spend' })
        .should.be.rejectedWith(/Missing walletPassphrase argument/);
      createShareStub.notCalled.should.equal(true);
    });

    it('fails closed when the derived pub does not match the registered child pub', async function () {
      const wallet = makeWallet({ safe: 'safe-id-1' });
      keychainsGetStub.callsFake(({ id }: { id: string }) =>
        Promise.resolve(
          id === rootKeyId
            ? rootKeychain
            : id === 'user-key'
            ? { ...childKeychain(id), pub: 'wrong-child-pub', derivedFromParentWithHardenedPath: "m/123'" }
            : publicOnlyKeychain(id)
        )
      );
      await wallet
        .shareWallet({ email: 'shareto@test.com', permissions: 'spend', walletPassphrase: passphrase })
        .should.be.rejectedWith(SafeDerivedPublicKeyMismatchError);
    });
  });

  describe('unsupported safe slots', function () {
    it('TSS safe wallet throws SafeShareNotImplementedError without fetching the root', async function () {
      const wallet = makeWallet({ safe: 'safe-id-1', multisigType: 'tss' });
      await wallet
        .shareWallet({ email: 'shareto@test.com', permissions: 'spend', walletPassphrase: passphrase })
        .should.be.rejectedWith(SafeShareNotImplementedError);
      // child fetched (safe branch), root never fetched (guard fires first)
      keychainsGetStub.calledOnce.should.equal(true);
      keychainsGetStub.firstCall.args[0].should.deepEqual({ id: 'user-key' });
    });

    it('ed25519 onchain safe wallet throws SafeShareNotImplementedError', async function () {
      const wallet = makeWallet({ safe: 'safe-id-1', coin: 'txlm' });
      mockBaseCoin.getFamily.returns('xlm');
      await wallet
        .shareWallet({ email: 'shareto@test.com', permissions: 'spend', walletPassphrase: passphrase })
        .should.be.rejectedWith(SafeShareNotImplementedError);
      keychainsGetStub.calledOnce.should.equal(true);
    });
  });

  describe('regression: non-safe and sharee paths', function () {
    it('a genuine cold wallet still yields skipKeychain', async function () {
      const wallet = makeWallet({ type: 'cold' });
      const options = await getShareOptions(wallet);
      options.skipKeychain.should.equal(true);
      options.should.have.property('keychain', undefined);
    });

    it('a sharee re-sharing (child has encryptedPrv) takes the ordinary path and never fetches the root', async function () {
      const wallet = makeWallet({ safe: 'safe-id-1' });
      const shareeChild = {
        id: 'user-key',
        pub: 'sharee-pub',
        type: 'independent' as const,
        encryptedPrv: `enc:sharee-prv`,
      };
      keychainsGetStub.callsFake(({ id }: { id: string }) =>
        Promise.resolve(id === 'user-key' ? shareeChild : publicOnlyKeychain(id))
      );
      const options = await getShareOptions(wallet);
      options.skipKeychain.should.equal(false);
      options.keychain.pub.should.equal('sharee-pub');
      // root (safe-owner detour) must never be reached for a sharee with an encrypted child prv
      keychainsGetStub
        .getCalls()
        .filter((c) => c.args?.[0]?.id === rootKeyId)
        .length.should.equal(0);
    });

    it('a malformed safe wallet (child with no parent) fails closed instead of cold-skipping', async function () {
      const wallet = makeWallet({ safe: 'safe-id-1' });
      keychainsGetStub.callsFake(({ id }: { id: string }) =>
        Promise.resolve(id === 'user-key' ? publicOnlyKeychain(id) : publicOnlyKeychain(id))
      );
      await wallet
        .shareWallet({ email: 'shareto@test.com', permissions: 'spend', walletPassphrase: passphrase })
        .should.be.rejectedWith(/safe child could not be resolved/);
      createShareStub.notCalled.should.equal(true);
    });

    it('a non-safe hot wallet spend share is unchanged', async function () {
      const wallet = makeWallet({});
      const userKeychain = {
        id: 'user-key',
        pub: 'hot-pub',
        type: 'independent' as const,
        encryptedPrv: `enc:hot-prv`,
      };
      keychainsGetStub.callsFake(({ id }: { id: string }) =>
        Promise.resolve(id === 'user-key' ? userKeychain : publicOnlyKeychain(id))
      );
      const options = await getShareOptions(wallet);
      options.skipKeychain.should.equal(false);
      options.keychain.pub.should.equal('hot-pub');
    });

    it('an lnbtc wallet takes the userAuth path and never enters the safe branch', async function () {
      const wallet = makeWallet({ safe: 'safe-id-1', coin: 'lbtc' });
      mockBaseCoin.getFamily.returns('lnbtc');
      const safeChildSpy = sinon.spy(wallet as any, 'getSafeOwnerChildKeychain');
      // stubbing the private keychain fetch so lnbtc resolves a keychain without full lightning mocks
      sinon.stub(wallet as any, 'getEncryptedWalletKeychainForWalletSharing').resolves({
        id: 'user-key',
        pub: 'ln-pub',
        encryptedPrv: `enc:ln-prv`,
        type: 'independent',
      });
      const options = await getShareOptions(wallet);
      options.keychain.pub.should.equal('ln-pub');
      safeChildSpy.notCalled.should.equal(true);
    });
  });

  describe('createBulkWalletShare on a safe wallet', function () {
    const bulkParams = {
      walletPassphrase: passphrase,
      keyShareOptions: [
        { userId: 'u1', pubKey: SHAREE_PUB, path: 'm/0', permissions: 'spend' },
        { userId: 'u2', pubKey: SHAREE_PUB, path: 'm/0', permissions: 'spend' },
      ],
    } as any;

    it('derives the child once (one root decrypt) and fans it out per user', async function () {
      const wallet = makeWallet({ safe: 'safe-id-1' });
      await wallet.createBulkWalletShare(bulkParams);

      createBulkKeySharesStub.calledOnce.should.equal(true);
      const options = createBulkKeySharesStub.firstCall.args[0];
      options.length.should.equal(2);
      options.forEach((o: any) => o.keychain.pub.should.equal(hardened.pub));
      // child + root exactly once (single root decrypt)
      const rootCalls = keychainsGetStub.getCalls().filter((c) => c.args?.[0]?.id === rootKeyId);
      rootCalls.length.should.equal(1);
    });

    it('the real error propagates instead of shareOptions cannot be empty', async function () {
      const wallet = makeWallet({ safe: 'safe-id-1', multisigType: 'tss' });
      await wallet.createBulkWalletShare(bulkParams).should.be.rejectedWith(SafeShareNotImplementedError);
      createBulkKeySharesStub.notCalled.should.equal(true);
    });
  });
});
