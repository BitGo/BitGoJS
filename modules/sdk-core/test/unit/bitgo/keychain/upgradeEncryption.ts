import 'should';
import { shouldUpgradeEncryption } from '../../../../src';

describe('shouldUpgradeEncryption', function () {
  const enabled = { isUpgradeEncryptionOnSignEnabled: () => true };
  const disabled = { isUpgradeEncryptionOnSignEnabled: () => false };

  it('follows the constructor setting when no per-call value is given', function () {
    shouldUpgradeEncryption(enabled).should.equal(true);
    shouldUpgradeEncryption(disabled).should.equal(false);
    shouldUpgradeEncryption(enabled, undefined).should.equal(true);
    shouldUpgradeEncryption(disabled, undefined).should.equal(false);
  });

  it('lets a per-call value override the constructor setting', function () {
    shouldUpgradeEncryption(enabled, false).should.equal(false);
    shouldUpgradeEncryption(disabled, true).should.equal(true);
    shouldUpgradeEncryption(enabled, true).should.equal(true);
    shouldUpgradeEncryption(disabled, false).should.equal(false);
  });
});
