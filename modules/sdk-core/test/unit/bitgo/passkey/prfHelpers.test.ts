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
  it('maps each device authenticatorInfo.credID to its prfSalt', function () {
    const result = buildEvalByCredential([device1, device2]);
    assert.deepStrictEqual(result, {
      'cred-aaa': 'salt-aaa',
      'cred-bbb': 'salt-bbb',
    });
  });

  it('returns an empty object for an empty device list', function () {
    assert.deepStrictEqual(buildEvalByCredential([]), {});
  });

  it('returns a single-entry map for one device', function () {
    const result = buildEvalByCredential([device1]);
    assert.deepStrictEqual(result, { 'cred-aaa': 'salt-aaa' });
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

  it('throws a descriptive error when no device matches', function () {
    assert.throws(
      () => matchDeviceByCredentialId([device1, device2], 'cred-unknown'),
      (err: Error) => {
        assert.ok(err.message.includes('cred-unknown'));
        assert.ok(err.message.includes('cred-aaa'));
        assert.ok(err.message.includes('cred-bbb'));
        return true;
      }
    );
  });

  it('throws when the device list is empty', function () {
    assert.throws(() => matchDeviceByCredentialId([], 'cred-aaa'), Error);
  });
});
