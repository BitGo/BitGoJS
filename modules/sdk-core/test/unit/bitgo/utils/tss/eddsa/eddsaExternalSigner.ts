import * as assert from 'assert';
import * as sinon from 'sinon';
import { EddsaUtils, EddsaKeyGenCallbacks } from '../../../../../../src';
import { bitgoGpgKey } from '../ecdsa/gpgKeys';

describe('EddsaUtils.createKeychainsWithExternalSigner', function () {
  let utils: EddsaUtils;
  let callbacks: EddsaKeyGenCallbacks;
  let mockCoin: any;
  const enterprise = 'enterprise-id';
  const commonKeychain = 'eddsa-common-keychain';

  const keyShare = (pub: string, prv: string, proof: string) => ({
    publicShare: pub,
    privateShare: prv,
    privateShareProof: proof,
    vssProof: `${proof}-vss`,
    gpgKey: `${pub}-gpg`,
  });
  const userToBitgoKeyShare = keyShare('upub', 'uprv-enc', 'uproof');
  const backupToBitgoKeyShare = keyShare('bpub', 'bprv-enc', 'bproof');
  const backupCounterPartyKeyShare = keyShare('ucp-pub', 'ucp-prv', 'ucp-proof');
  const userState = { encryptedData: 'u-data', encryptedDataKey: 'u-data-key' };
  const backupState = { encryptedData: 'b-data', encryptedDataKey: 'b-data-key' };
  const bitgoKeychain = { id: 'bitgo-key-id', commonKeychain, source: 'bitgo', type: 'tss' };

  const initResult = {
    userGpgPublicKey: 'user-gpg-pub',
    backupGpgPublicKey: 'backup-gpg-pub',
    userToBitgoKeyShare,
    backupToBitgoKeyShare,
    userState,
    backupState,
    backupCounterPartyKeyShare,
  };

  beforeEach(function () {
    callbacks = {
      initializeCallback: sinon.stub().resolves(initResult),
      finalizeCallback: sinon.stub().callsFake(async ({ source }: { source: 'user' | 'backup' }) => ({
        commonKeychain,
        counterpartyKeyShare: source === 'user' ? keyShare('bcp-pub', 'bcp-prv', 'bcp-proof') : undefined,
      })),
    };

    const mockKeychains = {
      add: sinon.stub().callsFake((params: any) => {
        if (params.source === 'bitgo') return Promise.resolve(bitgoKeychain);
        return Promise.resolve({ id: `${params.source}-key-id`, commonKeychain, source: params.source, type: 'tss' });
      }),
    };

    const mockBitGo = {
      getEnv: sinon.stub().returns('dev'),
      fetchConstants: sinon.stub().resolves({
        mpc: { bitgoPublicKey: bitgoGpgKey.public },
      }),
    } as any;

    mockCoin = {
      getChain: sinon.stub().returns('tsol'),
      keychains: sinon.stub().returns(mockKeychains),
    } as any;

    utils = new EddsaUtils(mockBitGo, mockCoin);
  });

  afterEach(function () {
    sinon.restore();
  });

  it('should call initialize before finalize, and finalize user before backup (sequential)', async function () {
    const callOrder: string[] = [];
    (callbacks.initializeCallback as sinon.SinonStub).callsFake(async () => {
      callOrder.push('initialize');
      return initResult;
    });
    (callbacks.finalizeCallback as sinon.SinonStub).callsFake(async ({ source }: { source: 'user' | 'backup' }) => {
      callOrder.push(`finalize-${source}`);
      return {
        commonKeychain,
        counterpartyKeyShare: source === 'user' ? keyShare('bcp-pub', 'bcp-prv', 'bcp-proof') : undefined,
      };
    });

    await utils.createKeychainsWithExternalSigner({ enterprise, callbacks });

    assert.deepStrictEqual(callOrder, ['initialize', 'finalize-user', 'finalize-backup']);
  });

  it('should return user, backup, and bitgo keychains', async function () {
    const result = await utils.createKeychainsWithExternalSigner({ enterprise, callbacks });

    assert.ok(result.userKeychain);
    assert.ok(result.backupKeychain);
    assert.ok(result.bitgoKeychain);
    assert.strictEqual(result.bitgoKeychain.commonKeychain, commonKeychain);
  });

  it('should pass bitgoKeychain and counterparty context to finalizeCallback for both sources', async function () {
    await utils.createKeychainsWithExternalSigner({ enterprise, callbacks });

    const userCall = (callbacks.finalizeCallback as sinon.SinonStub).getCall(0).args[0];
    const backupCall = (callbacks.finalizeCallback as sinon.SinonStub).getCall(1).args[0];

    assert.strictEqual(userCall.source, 'user');
    assert.strictEqual(userCall.coin, 'tsol');
    assert.deepStrictEqual(userCall.bitgoKeychain, bitgoKeychain);
    assert.strictEqual(userCall.counterPartyGPGKey, 'backup-gpg-pub');
    assert.deepStrictEqual(userCall.counterPartyKeyShare, backupCounterPartyKeyShare);
    assert.deepStrictEqual(userCall.state, userState);

    assert.strictEqual(backupCall.source, 'backup');
    assert.strictEqual(backupCall.coin, 'tsol');
    assert.deepStrictEqual(backupCall.bitgoKeychain, bitgoKeychain);
    assert.strictEqual(backupCall.counterPartyGPGKey, 'user-gpg-pub');
    // backup receives the counterparty share produced by user finalize
    assert.ok(backupCall.counterPartyKeyShare);
    assert.deepStrictEqual(backupCall.state, backupState);
  });

  it('should reject when user finalize does not produce a counterparty key share', async function () {
    (callbacks.finalizeCallback as sinon.SinonStub).callsFake(async () => ({ commonKeychain }));

    await assert.rejects(
      () => utils.createKeychainsWithExternalSigner({ enterprise, callbacks }),
      /User finalize did not produce a counterparty key share/
    );
  });

  it('should reject when user finalizeCallback returns mismatched commonKeychain', async function () {
    (callbacks.finalizeCallback as sinon.SinonStub).callsFake(async ({ source }: { source: 'user' | 'backup' }) => ({
      commonKeychain: source === 'user' ? 'wrong-keychain' : commonKeychain,
      counterpartyKeyShare: source === 'user' ? keyShare('bcp-pub', 'bcp-prv', 'bcp-proof') : undefined,
    }));

    await assert.rejects(
      () => utils.createKeychainsWithExternalSigner({ enterprise, callbacks }),
      /User common keychain does not match BitGo/
    );
  });

  it('should reject when backup finalizeCallback returns mismatched commonKeychain', async function () {
    (callbacks.finalizeCallback as sinon.SinonStub).callsFake(async ({ source }: { source: 'user' | 'backup' }) => ({
      commonKeychain: source === 'backup' ? 'wrong-keychain' : commonKeychain,
      counterpartyKeyShare: source === 'user' ? keyShare('bcp-pub', 'bcp-prv', 'bcp-proof') : undefined,
    }));

    await assert.rejects(
      () => utils.createKeychainsWithExternalSigner({ enterprise, callbacks }),
      /Backup common keychain does not match BitGo/
    );
  });
});
