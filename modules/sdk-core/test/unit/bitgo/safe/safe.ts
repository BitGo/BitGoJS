import * as sinon from 'sinon';
import 'should';
import { SafeData } from '@bitgo/public-types';
import { Safe } from '../../../../src';

describe('Safe', function () {
  let safe: Safe;
  let mockBitGo: any;
  let safeData: SafeData;
  // wire-shaped SafeData (timestamps as ISO strings) for mocked REST responses that get decoded
  let safeDataWire: any;

  beforeEach(function () {
    mockBitGo = {
      url: sinon.stub().callsFake((path: string) => path),
      post: sinon.stub(),
    };
    safeData = {
      id: 'test-safe-id',
      enterpriseId: 'test-enterprise-id',
      label: 'my safe',
      status: 'active',
      creator: 'creator-id',
      users: [{ userId: 'creator-id', permissions: ['admin', 'spend'] }],
      createdAt: new Date('2026-07-07T00:00:00.000Z'),
    };
    safeDataWire = {
      id: 'test-safe-id',
      enterpriseId: 'test-enterprise-id',
      label: 'my safe',
      status: 'active',
      creator: 'creator-id',
      users: [{ userId: 'creator-id', permissions: ['admin', 'spend'] }],
      createdAt: '2026-07-07T00:00:00.000Z',
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

  describe('member/share methods are stubbed (WCN-1203 / WCN-1204)', function () {
    it('createWallet throws not-implemented (WCN-1203)', async function () {
      await safe.createWallet({ coin: 'tbtc', label: 'w' }).should.be.rejectedWith(/WCN-1203/);
    });

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
});
