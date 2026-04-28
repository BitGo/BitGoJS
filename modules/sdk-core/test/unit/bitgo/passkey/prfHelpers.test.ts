import * as assert from 'assert';
import { buildEvalByCredential, matchDeviceByCredentialId } from '../../../../src/bitgo/passkey/prfHelpers';
import { KeychainWebauthnDevice } from '../../../../src/bitgo/keychain/iKeychains';

const device1: KeychainWebauthnDevice = {
  otpDeviceId: 'oid-1',
  authenticatorInfo: { credID: 'cred-aaa', fmt: 'none', publicKey: 'pk-1' },
  prfSalt: 'salt-aaa',
  encryptedPrv: 'enc-prv-1',
};

const device2: KeychainWebauthnDevice = {
  otpDeviceId: 'oid-2',
  authenticatorInfo: { credID: 'cred-bbb', fmt: 'none', publicKey: 'pk-2' },
  prfSalt: 'salt-bbb',
  encryptedPrv: 'enc-prv-2',
};

describe('buildEvalByCredential', function () {
  it('maps each device credID to its prfSalt in evalByCredential', function () {
    const { evalByCredential } = buildEvalByCredential([device1, device2]);
    assert.deepStrictEqual(evalByCredential, {
      'cred-aaa': 'salt-aaa',
      'cred-bbb': 'salt-bbb',
    });
  });

  it('populates credIdToDevice with both devices', function () {
    const { credIdToDevice } = buildEvalByCredential([device1, device2]);
    assert.strictEqual(credIdToDevice.get('cred-aaa'), device1);
    assert.strictEqual(credIdToDevice.get('cred-bbb'), device2);
  });

  it('returns empty maps for an empty device list', function () {
    const { evalByCredential, credIdToDevice } = buildEvalByCredential([]);
    assert.deepStrictEqual(evalByCredential, {});
    assert.strictEqual(credIdToDevice.size, 0);
  });

  it('skips devices with empty prfSalt', function () {
    const deviceNoPrf = { ...device1, prfSalt: '' };
    const { evalByCredential, credIdToDevice } = buildEvalByCredential([deviceNoPrf, device2]);
    assert.deepStrictEqual(evalByCredential, { 'cred-bbb': 'salt-bbb' });
    assert.strictEqual(credIdToDevice.has('cred-aaa'), false);
  });

  it('skips devices with undefined prfSalt', function () {
    const deviceNoPrf = { ...device1, prfSalt: undefined as unknown as string };
    const { evalByCredential, credIdToDevice } = buildEvalByCredential([deviceNoPrf, device2]);
    assert.deepStrictEqual(evalByCredential, { 'cred-bbb': 'salt-bbb' });
    assert.strictEqual(credIdToDevice.has('cred-aaa'), false);
  });
});

describe('matchDeviceByCredentialId', function () {
  it('returns the matching device', function () {
    const result = matchDeviceByCredentialId([device1, device2], 'cred-bbb');
    assert.strictEqual(result, device2);
  });

  it('returns the first device when it matches', function () {
    const result = matchDeviceByCredentialId([device1, device2], 'cred-aaa');
    assert.strictEqual(result, device1);
  });

  it('throws with the retail error message when no device matches', function () {
    assert.throws(
      () => matchDeviceByCredentialId([device1, device2], 'cred-unknown'),
      (err: Error) => {
        assert.strictEqual(err.message, 'Could not identify which passkey device was used');
        return true;
      }
    );
  });

  it('throws when the device list is empty', function () {
    assert.throws(() => matchDeviceByCredentialId([], 'cred-aaa'), Error);
  });
});
