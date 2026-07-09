import * as sinon from 'sinon';
import 'should';
import { Enterprise, Vaults } from '../../../../src';

describe('Vaults', function () {
  let vaults: Vaults;
  let mockBitGo: any;

  beforeEach(function () {
    mockBitGo = {
      url: sinon.stub().callsFake((path: string) => path),
    };
    vaults = new Vaults(mockBitGo, 'test-enterprise-id');
  });

  afterEach(function () {
    sinon.restore();
  });

  // Phase 2 (generateVault/initialize/createVaultKeys/finalize) and Phase 3 (list/get) are not yet
  // implemented — they are gated on WCN-1175 / WCN-1176 / WCN-1177. Assert the interface is wired
  // and stubbed for now.
  describe('unimplemented lifecycle methods', function () {
    it('generateVault throws (Phase 2)', async function () {
      await vaults
        .generateVault({ label: 'v', passphrase: 'p' })
        .should.be.rejectedWith(/not yet implemented .*Phase 2/);
    });

    it('initializeVault throws (Phase 2)', async function () {
      await vaults.initializeVault({ label: 'v' }).should.be.rejectedWith(/not yet implemented .*Phase 2/);
    });

    it('createVaultKeys throws (Phase 2)', async function () {
      await vaults
        .createVaultKeys({ label: 'v', passphrase: 'p', vaultId: 'vid' })
        .should.be.rejectedWith(/not yet implemented .*Phase 2/);
    });

    it('finalizeVault throws (Phase 2)', async function () {
      await vaults
        .finalizeVault('vid', {
          rootKeys: {
            secp256k1Multisig: ['u', 'b', 'g'],
            ecdsaMpc: ['u', 'b', 'g'],
            eddsaMpc: ['u', 'b', 'g'],
            ed25519Multisig: ['u', 'b', 'g'],
          },
        })
        .should.be.rejectedWith(/not yet implemented .*Phase 2/);
    });

    it('list throws (Phase 3)', async function () {
      await vaults.list().should.be.rejectedWith(/not yet implemented .*Phase 3/);
    });

    it('get throws (Phase 3)', async function () {
      await vaults.get({ id: 'vid' }).should.be.rejectedWith(/not yet implemented .*Phase 3/);
    });
  });

  describe('Enterprise.vaults() accessor', function () {
    it('returns a Vaults instance scoped to the enterprise', function () {
      const enterprise = new Enterprise(mockBitGo, {} as any, { id: 'ent-id', name: 'ent' });
      enterprise.vaults().should.be.instanceof(Vaults);
    });
  });
});
