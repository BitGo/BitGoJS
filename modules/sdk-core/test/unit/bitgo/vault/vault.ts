import * as sinon from 'sinon';
import 'should';
import { Vault, VaultData } from '../../../../src';

describe('Vault', function () {
  let vault: Vault;
  let mockBitGo: any;
  let vaultData: VaultData;
  // wire-shaped VaultData (timestamps as ISO strings) for mocked REST responses that get decoded
  let vaultDataWire: any;

  beforeEach(function () {
    mockBitGo = {
      url: sinon.stub().callsFake((path: string) => path),
      post: sinon.stub(),
    };
    vaultData = {
      id: 'test-vault-id',
      enterpriseId: 'test-enterprise-id',
      label: 'my vault',
      status: 'active',
      creator: 'creator-id',
      users: [{ userId: 'creator-id', permissions: ['admin', 'spend'] }],
      createdAt: new Date('2026-07-07T00:00:00.000Z'),
    };
    vaultDataWire = {
      id: 'test-vault-id',
      enterpriseId: 'test-enterprise-id',
      label: 'my vault',
      status: 'active',
      creator: 'creator-id',
      users: [{ userId: 'creator-id', permissions: ['admin', 'spend'] }],
      createdAt: '2026-07-07T00:00:00.000Z',
    };
    vault = new Vault(mockBitGo, vaultData);
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('constructor', function () {
    it('throws when vaultData is not an object', function () {
      (() => new Vault(mockBitGo, undefined as unknown as VaultData)).should.throw('vaultData has to be an object');
    });

    it('throws when id is not a string', function () {
      (() => new Vault(mockBitGo, { ...vaultData, id: 123 as unknown as string })).should.throw(
        'vault id has to be a string'
      );
    });

    it('throws when enterpriseId is not a string', function () {
      (() =>
        new Vault(mockBitGo, {
          ...vaultData,
          enterpriseId: undefined as unknown as string,
        })).should.throw('vault enterpriseId has to be a string');
    });
  });

  describe('getters', function () {
    it('exposes id/enterpriseId/label/status', function () {
      vault.id().should.equal('test-vault-id');
      vault.enterpriseId().should.equal('test-enterprise-id');
      vault.label().should.equal('my vault');
      vault.status().should.equal('active');
    });

    it('toJSON returns the underlying data', function () {
      vault.toJSON().should.equal(vaultData);
    });
  });

  describe('url', function () {
    it('builds the enterprise-scoped v2 path', function () {
      vault.url().should.equal('/enterprise/test-enterprise-id/vaults/test-vault-id');
      vault.url('/freeze').should.equal('/enterprise/test-enterprise-id/vaults/test-vault-id/freeze');
      mockBitGo.url.calledWith('/enterprise/test-enterprise-id/vaults/test-vault-id', 2).should.be.true();
    });
  });

  describe('freeze / archive REST plumbing', function () {
    function stubPost(response: unknown) {
      const resultStub = sinon.stub().resolves(response);
      const sendStub = sinon.stub().returns({ result: resultStub });
      mockBitGo.post.returns({ send: sendStub });
      return { sendStub };
    }

    it('freeze posts the encoded body to the freeze route and decodes VaultData', async function () {
      const frozen = { ...vaultDataWire, freeze: { reason: 'incident' } };
      const { sendStub } = stubPost(frozen);
      const result = await vault.freeze({ duration: 3600 });
      mockBitGo.post.calledWith('/enterprise/test-enterprise-id/vaults/test-vault-id/freeze').should.be.true();
      sendStub.calledWith({ duration: 3600 }).should.be.true();
      result.freeze!.reason!.should.equal('incident');
      result.createdAt.should.be.instanceof(Date);
    });

    it('archive posts an empty body to the archive route and decodes VaultData', async function () {
      const archived = { ...vaultDataWire, status: 'archived' as const };
      const { sendStub } = stubPost(archived);
      const result = await vault.archive();
      mockBitGo.post.calledWith('/enterprise/test-enterprise-id/vaults/test-vault-id/archive').should.be.true();
      sendStub.calledWithExactly().should.be.true();
      result.status.should.equal('archived');
    });
  });

  describe('member/share methods are stubbed (WCN-1203 / WCN-1204)', function () {
    it('createWallet throws not-implemented (WCN-1203)', async function () {
      await vault.createWallet({ coin: 'tbtc', label: 'w' }).should.be.rejectedWith(/WCN-1203/);
    });

    it('addMember throws not-implemented (WCN-1204)', async function () {
      await vault.addMember({ userId: 'u', permissions: ['view'] }).should.be.rejectedWith(/WCN-1204/);
    });

    it('addMemberToWallet throws not-implemented (WCN-1204)', async function () {
      await vault.addMemberToWallet({ walletId: 'w', walletPassphrase: 'p' }).should.be.rejectedWith(/WCN-1204/);
    });

    it('listShares throws not-implemented (WCN-1204)', async function () {
      await vault.listShares().should.be.rejectedWith(/WCN-1204/);
    });

    it('acceptShare throws not-implemented (WCN-1204)', async function () {
      await vault.acceptShare({ vaultShareId: 's' }).should.be.rejectedWith(/WCN-1204/);
    });
  });
});
