import * as assert from 'assert';
import * as sinon from 'sinon';
import { EcdsaUtils } from '../../../../../../src/bitgo/utils/tss/ecdsa/ecdsa';
import { BitGoBase, IBaseCoin } from '../../../../../../src';

/**
 * Regression tests for the ECDSA MPCv1 createKeychains encryptionVersion bug.
 *
 * Previously, EcdsaUtils.createKeychains dropped `encryptionVersion` silently —
 * it was not declared in the params and was never forwarded to createUserKeychain
 * or createBackupKeychain, causing a version mismatch within a wallet: v2 for
 * encryptedWalletPassphrase but v1 for the user/backup keychains.
 */
describe('EcdsaUtils.createKeychains - encryptionVersion forwarding', function () {
  let ecdsaUtils: EcdsaUtils;
  let createUserKeychainStub: sinon.SinonStub;
  let createBackupKeychainStub: sinon.SinonStub;

  const fakeKeychain = { id: 'key-id', pub: 'pub', commonKeychain: 'ckc', type: 'tss' as const };
  const fakeGpgKey = { publicKey: 'pub', privateKey: 'prv' };
  const fakeKeyShare = { userHeldKeyShare: {} };

  beforeEach(function () {
    const mockBitgo = { getEnv: sinon.stub().returns('test') } as unknown as BitGoBase;
    const mockCoin = {} as unknown as IBaseCoin;

    ecdsaUtils = new EcdsaUtils(mockBitgo, mockCoin);

    createUserKeychainStub = sinon.stub(ecdsaUtils, 'createUserKeychain').resolves(fakeKeychain);
    createBackupKeychainStub = sinon.stub(ecdsaUtils, 'createBackupKeychain').resolves(fakeKeychain);
    sinon.stub(ecdsaUtils, 'createBitgoKeychain').resolves(fakeKeychain);
    sinon.stub(ecdsaUtils, 'createBackupKeyShares').resolves(fakeKeyShare as any);
    sinon.stub(ecdsaUtils, 'getBitgoGpgPubkeyBasedOnFeatureFlags').resolves({ mpcv2PublicKey: undefined } as any);

    sinon.stub(ecdsaUtils as any, 'getBackupGpgPubKey').resolves(fakeGpgKey);
    sinon.stub(require('../../../../../../src/bitgo/utils/opengpgUtils'), 'generateGPGKeyPair').resolves(fakeGpgKey);
  });

  afterEach(function () {
    sinon.restore();
  });

  it('forwards encryptionVersion: 2 to createUserKeychain', async function () {
    await ecdsaUtils.createKeychains({ passphrase: 'pass', encryptionVersion: 2 });

    assert.ok(createUserKeychainStub.calledOnce);
    const userParams = createUserKeychainStub.firstCall.args[0];
    assert.strictEqual(userParams.encryptionVersion, 2);
  });

  it('forwards encryptionVersion: 2 to createBackupKeychain', async function () {
    await ecdsaUtils.createKeychains({ passphrase: 'pass', encryptionVersion: 2 });

    assert.ok(createBackupKeychainStub.calledOnce);
    const backupParams = createBackupKeychainStub.firstCall.args[0];
    assert.strictEqual(backupParams.encryptionVersion, 2);
  });

  it('forwards encryptionVersion: undefined when not set', async function () {
    await ecdsaUtils.createKeychains({ passphrase: 'pass' });

    assert.ok(createUserKeychainStub.calledOnce);
    assert.ok(createBackupKeychainStub.calledOnce);
    assert.strictEqual(createUserKeychainStub.firstCall.args[0].encryptionVersion, undefined);
    assert.strictEqual(createBackupKeychainStub.firstCall.args[0].encryptionVersion, undefined);
  });

  it('forwards encryptionVersion: 1 explicitly', async function () {
    await ecdsaUtils.createKeychains({ passphrase: 'pass', encryptionVersion: 1 });

    assert.strictEqual(createUserKeychainStub.firstCall.args[0].encryptionVersion, 1);
    assert.strictEqual(createBackupKeychainStub.firstCall.args[0].encryptionVersion, 1);
  });
});
