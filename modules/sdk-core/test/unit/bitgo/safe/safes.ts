import * as sinon from 'sinon';
import 'should';
import { Enterprise, Safes } from '../../../../src';

describe('Safes', function () {
  let safes: Safes;
  let mockBitGo: any;

  beforeEach(function () {
    mockBitGo = {
      url: sinon.stub().callsFake((path: string) => path),
    };
    safes = new Safes(mockBitGo, 'test-enterprise-id');
  });

  afterEach(function () {
    sinon.restore();
  });

  // Phase 2 (generateSafe/initialize/createSafeKeys/finalize) and Phase 3 (list/get) are not yet
  // implemented — they are gated on WCN-1175 / WCN-1176 / WCN-1177. Assert the interface is wired
  // and stubbed for now.
  describe('unimplemented lifecycle methods', function () {
    it('generateSafe throws (Phase 2)', async function () {
      await safes.generateSafe({ label: 'v', passphrase: 'p' }).should.be.rejectedWith(/not yet implemented .*Phase 2/);
    });

    it('initializeSafe throws (Phase 2)', async function () {
      await safes.initializeSafe({ label: 'v' }).should.be.rejectedWith(/not yet implemented .*Phase 2/);
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
