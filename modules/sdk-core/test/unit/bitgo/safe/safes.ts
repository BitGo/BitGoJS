import * as sinon from 'sinon';
import 'should';
import { Enterprise, Safe, Safes } from '../../../../src';

describe('Safes', function () {
  let safes: Safes;
  let mockBitGo: any;
  const safeDataWire = {
    id: 'test-safe-id',
    enterpriseId: 'test-enterprise-id',
    label: 'my safe',
    status: 'active',
    creator: 'creator-id',
    users: [{ userId: 'creator-id', permissions: ['admin', 'spend'] }],
    createdAt: '2026-07-07T00:00:00.000Z',
  };

  beforeEach(function () {
    mockBitGo = {
      url: sinon.stub().callsFake((path: string) => path),
      post: sinon.stub(),
    };
    safes = new Safes(mockBitGo, 'test-enterprise-id');
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('initializeSafe', function () {
    it('POSTs to the safes collection URL and returns a Safe', async function () {
      const send = sinon.stub().returns({ result: sinon.stub().resolves(safeDataWire) });
      mockBitGo.post.returns({ send });

      const result = await safes.initializeSafe({ label: 'my safe' });

      result.should.be.instanceof(Safe);
      result.id().should.equal('test-safe-id');
      result.enterpriseId().should.equal('test-enterprise-id');
      sinon.assert.calledWith(mockBitGo.post, '/enterprise/test-enterprise-id/safes');
      sinon.assert.calledWith(send, { label: 'my safe' });
    });
  });

  // generateSafe/createSafeKeys/finalize and list/get are not yet implemented — gated on
  // WCN-1175 / WCN-1176 / WCN-1177.
  describe('unimplemented lifecycle methods', function () {
    it('generateSafe throws (Phase 2)', async function () {
      await safes.generateSafe({ label: 'v', passphrase: 'p' }).should.be.rejectedWith(/not yet implemented .*Phase 2/);
    });

    it('createSafeKeys throws (Phase 2)', async function () {
      await safes
        .createSafeKeys({ label: 'v', passphrase: 'p', safeId: 'vid' })
        .should.be.rejectedWith(/not yet implemented .*Phase 2/);
    });

    it('finalizeSafe throws (Phase 2)', async function () {
      await safes
        .finalizeSafe('vid', {
          rootKeys: {
            hot: {
              secp256k1Multisig: ['u', 'b', 'g'],
              ecdsaMpc: ['u', 'b', 'g'],
              eddsaMpc: ['u', 'b', 'g'],
              ed25519Multisig: ['u', 'b', 'g'],
            },
          },
        })
        .should.be.rejectedWith(/not yet implemented .*Phase 2/);
    });

    it('list throws (Phase 3)', async function () {
      await safes.list().should.be.rejectedWith(/not yet implemented .*Phase 3/);
    });

    it('get throws (Phase 3)', async function () {
      await safes.get({ id: 'vid' }).should.be.rejectedWith(/not yet implemented .*Phase 3/);
    });
  });

  describe('Enterprise.safes() accessor', function () {
    it('returns a Safes instance scoped to the enterprise', function () {
      const enterprise = new Enterprise(mockBitGo, {} as any, { id: 'ent-id', name: 'ent' });
      enterprise.safes().should.be.instanceof(Safes);
    });
  });
});
