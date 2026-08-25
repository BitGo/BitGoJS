import * as sinon from 'sinon';
import 'should';
import { SafeData } from '@bitgo/public-types';
import { IncorrectPasswordError, Safe, deriveSafeChildHardenedFromXprv } from '../../../../src';

const ROOT_XPRV =
  'xprv9s21ZrQH143K3hekyNj7TciR4XNYe1kMj68W2ipjJGNHETWP7o42AjDnSPgKhdZ4x8NBAvaL72RrXjuXNdmkMqLERZza73oYugGtbLFXG8g';

describe('Safe', function () {
  let safe: Safe;
  let mockBitGo: any;
  let safeData: SafeData;
  // wire-shaped SafeData (timestamps as ISO strings) for mocked REST responses that get decoded
  let safeDataWire: any;

  const secp256k1Multisig: [string, string, string] = ['user-root-id', 'backup-root-id', 'bitgo-root-id'];
  const ecdsaMpc: [string, string, string] = ['ecdsa-user', 'ecdsa-backup', 'ecdsa-bitgo'];
  const eddsaMpc: [string, string, string] = ['eddsa-user', 'eddsa-backup', 'eddsa-bitgo'];
  const ed25519Multisig: [string, string, string] = ['ed-user', 'ed-backup', 'ed-bitgo'];
  const rootKeys = {
    hot: {
      secp256k1Multisig,
      ecdsaMpc,
      eddsaMpc,
      ed25519Multisig,
    },
  };

  beforeEach(function () {
    mockBitGo = {
      url: sinon.stub().callsFake((path: string) => path),
      post: sinon.stub(),
      get: sinon.stub(),
    };
    safeData = {
      id: 'test-safe-id',
      enterpriseId: 'test-enterprise-id',
      label: 'my safe',
      status: 'active',
      creator: 'creator-id',
      users: [{ userId: 'creator-id', permissions: ['admin', 'spend'] }],
      createdAt: new Date('2026-07-07T00:00:00.000Z'),
      rootKeys,
    };
    safeDataWire = {
      id: 'test-safe-id',
      enterpriseId: 'test-enterprise-id',
      label: 'my safe',
      status: 'active',
      creator: 'creator-id',
      users: [{ userId: 'creator-id', permissions: ['admin', 'spend'] }],
      createdAt: '2026-07-07T00:00:00.000Z',
      rootKeys,
    };
    safe = new Safe(mockBitGo, safeData);
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('getters', function () {
    it('exposes id/enterpriseId/label/status', function () {
      safe.id().should.equal('test-safe-id');
      safe.enterpriseId().should.equal('test-enterprise-id');
      safe.label().should.equal('my safe');
      safe.status().should.equal('active');
    });

    it('toJSON returns the underlying data', function () {
      safe.toJSON().should.equal(safeData);
    });
  });

  describe('url', function () {
    it('builds the enterprise-scoped v2 path', function () {
      safe.url().should.equal('/enterprise/test-enterprise-id/safes/test-safe-id');
      safe.url('/freeze').should.equal('/enterprise/test-enterprise-id/safes/test-safe-id/freeze');
      mockBitGo.url.calledWith('/enterprise/test-enterprise-id/safes/test-safe-id', 2).should.be.true();
    });
  });

  describe('freeze / archive REST plumbing', function () {
    function stubPost(response: unknown) {
      const resultStub = sinon.stub().resolves(response);
      const sendStub = sinon.stub().returns({ result: resultStub });
      mockBitGo.post.returns({ send: sendStub });
      return { sendStub };
    }

    it('freeze posts the encoded body to the freeze route and decodes SafeData', async function () {
      const frozen = { ...safeDataWire, freeze: { reason: 'incident' } };
      const { sendStub } = stubPost(frozen);
      const result = await safe.freeze({ reason: 'incident' });
      mockBitGo.post.calledWith('/enterprise/test-enterprise-id/safes/test-safe-id/freeze').should.be.true();
      sendStub.calledWith({ reason: 'incident' }).should.be.true();
      result.freeze!.reason!.should.equal('incident');
      result.createdAt.should.be.instanceof(Date);
    });

    it('archive posts an empty body to the archive route and decodes SafeData', async function () {
      const archived = { ...safeDataWire, status: 'archived' as const };
      const { sendStub } = stubPost(archived);
      const result = await safe.archive();
      mockBitGo.post.calledWith('/enterprise/test-enterprise-id/safes/test-safe-id/archive').should.be.true();
      sendStub.calledWithExactly().should.be.true();
      result.status.should.equal('archived');
    });
  });

  describe('member/share methods are stubbed (WCN-1204)', function () {
    it('addMember throws not-implemented (WCN-1204)', async function () {
      await safe.addMember({ userId: 'u', permissions: ['view'] }).should.be.rejectedWith(/WCN-1204/);
    });

    it('addMemberToWallet throws not-implemented (WCN-1204)', async function () {
      await safe.addMemberToWallet({ walletId: 'w', walletPassphrase: 'p' }).should.be.rejectedWith(/WCN-1204/);
    });

    it('listShares throws not-implemented (WCN-1204)', async function () {
      await safe.listShares().should.be.rejectedWith(/WCN-1204/);
    });

    it('acceptShare throws not-implemented (WCN-1204)', async function () {
      await safe.acceptShare({ safeShareId: 's' }).should.be.rejectedWith(/WCN-1204/);
    });
  });

  describe('createWallet (WCN-1203)', function () {
    const childAt0 = deriveSafeChildHardenedFromXprv(ROOT_XPRV, 0);
    const childAt7 = deriveSafeChildHardenedFromXprv(ROOT_XPRV, 7);
    let keychainsAdd: sinon.SinonStub;
    let keychainsGet: sinon.SinonStub;
    let derivationQuery: sinon.SinonStub;
    let mintSend: sinon.SinonStub;

    function stubCoin(chain: string, opts: { getDefaultMultisigType?: string } = {}) {
      keychainsGet = sinon.stub().resolves({
        id: 'user-root-id',
        source: 'user',
        encryptedPrv: `enc:${ROOT_XPRV}`,
        pub: 'root-xpub',
        type: 'independent',
      });
      keychainsAdd = sinon.stub().resolves({ id: 'child-key-id', pub: childAt0.pub, type: 'independent' });
      mockBitGo.coin = sinon.stub().returns({
        getChain: sinon.stub().returns(chain),
        getDefaultMultisigType: sinon.stub().returns(opts.getDefaultMultisigType),
        supportsTss: sinon.stub().returns(false),
        keychains: sinon.stub().returns({ get: keychainsGet, add: keychainsAdd }),
      });
    }

    beforeEach(function () {
      stubCoin('tbtc');
      mockBitGo.decrypt = sinon.stub().callsFake(({ input, password }: { input: string; password: string }) => {
        if (password !== 'pw') {
          throw new Error('bad password');
        }
        if (input.startsWith('enc:')) {
          return Promise.resolve(input.slice(4));
        }
        throw new Error('bad ciphertext');
      });
      derivationQuery = sinon.stub().returns({
        result: sinon.stub().resolves({ slot: 'secp256k1Multisig', index: 0 }),
      });
      mockBitGo.get.returns({ query: derivationQuery });
      const mintResult = sinon.stub().resolves({
        id: 'wallet-id',
        coin: 'tbtc',
        keys: ['child-key-id', 'backup-child', 'bitgo-child'],
        type: 'hot',
        multisigType: 'onchain',
        enterprise: 'test-enterprise-id',
        safe: 'test-safe-id',
      });
      mintSend = sinon.stub().returns({ result: mintResult });
      mockBitGo.post.returns({ send: mintSend });
    });

    it('peeks the index, registers a public-only user child, and mints', async function () {
      const wallet = await safe.createWallet({ coin: 'tbtc', label: 'desk 1', passphrase: 'pw' });

      derivationQuery.calledOnceWithExactly({ slot: 'secp256k1Multisig' }).should.be.true();
      keychainsGet.calledOnceWithExactly({ id: 'user-root-id' }).should.be.true();
      keychainsAdd.calledOnce.should.be.true();
      const addArgs = keychainsAdd.firstCall.args[0];
      addArgs.should.eql({
        pub: childAt0.pub,
        source: 'user',
        keyType: 'independent',
        parent: 'user-root-id',
        safeId: 'test-safe-id',
        derivedFromParentWithHardenedPath: "m/0'",
      });
      addArgs.should.not.have.property('encryptedPrv');
      addArgs.should.not.have.property('derivedFromParentWithSeed');
      addArgs.should.not.have.property('path');

      mockBitGo.post.calledWith('/enterprise/test-enterprise-id/safes/test-safe-id/wallets').should.be.true();
      mintSend.firstCall.args[0].should.eql({
        coin: 'tbtc',
        label: 'desk 1',
        type: 'hot',
        multisigType: 'onchain',
        keys: ['child-key-id'],
      });
      wallet.id().should.equal('wallet-id');
      const mintedSafeId = wallet.safeId();
      if (mintedSafeId === undefined) {
        throw new Error('expected minted wallet to include safeId');
      }
      mintedSafeId.should.equal('test-safe-id');
    });

    it('registers the child with derivedFromParentWithHardenedPath at a non-zero mint index', async function () {
      derivationQuery.returns({
        result: sinon.stub().resolves({ slot: 'secp256k1Multisig', index: 7 }),
      });
      keychainsAdd.resolves({ id: 'child-key-id', pub: childAt7.pub, type: 'independent' });

      await safe.createWallet({ coin: 'tbtc', label: 'desk 8', passphrase: 'pw' });

      const addArgs = keychainsAdd.firstCall.args[0];
      addArgs.pub.should.equal(childAt7.pub);
      addArgs.derivedFromParentWithHardenedPath.should.equal("m/7'");
      addArgs.should.not.have.property('path');
      addArgs.should.not.have.property('derivedFromParentWithSeed');
    });

    it('rejects TSS minting', async function () {
      await safe
        .createWallet({ coin: 'hteth', label: 'evm', passphrase: 'pw', multisigType: 'tss' })
        .should.be.rejectedWith(/MPC safe wallet minting is not yet implemented/);
    });

    it('rejects a TSS-default coin even without multisigType tss', async function () {
      stubCoin('hteth', { getDefaultMultisigType: 'tss' });
      await safe
        .createWallet({ coin: 'hteth', label: 'evm', passphrase: 'pw' })
        .should.be.rejectedWith(/MPC safe wallet minting is not yet implemented/);
    });

    it('rejects a peeked derivation index for the wrong slot', async function () {
      derivationQuery.returns({
        result: sinon.stub().resolves({ slot: 'ecdsaMpc', index: 0 }),
      });
      await safe
        .createWallet({ coin: 'tbtc', label: 'desk 1', passphrase: 'pw' })
        .should.be.rejectedWith(/returned slot 'ecdsaMpc'/);
    });

    it('rejects ed25519 onchain coins', async function () {
      stubCoin('txlm');
      await safe
        .createWallet({ coin: 'txlm', label: 'xlm', passphrase: 'pw' })
        .should.be.rejectedWith(/ed25519 coin safe wallet minting is not yet supported/);
    });

    it('rejects an empty passphrase', async function () {
      await safe
        .createWallet({ coin: 'tbtc', label: 'w', passphrase: '' })
        .should.be.rejectedWith(/passphrase is required/);
    });

    it('rejects a wrong passphrase', async function () {
      await safe
        .createWallet({ coin: 'tbtc', label: 'w', passphrase: 'nope' })
        .should.be.rejectedWith(IncorrectPasswordError);
    });
  });
});
