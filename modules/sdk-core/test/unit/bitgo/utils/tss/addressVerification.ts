import * as assert from 'assert';
import 'should';
import { getDerivationPath } from '@bitgo/sdk-lib-mpc';

function getAddressVerificationModule() {
  return require('../../../../../src/bitgo/utils/tss/addressVerification');
}

const getExtractCommonKeychain = () => getAddressVerificationModule().extractCommonKeychain;

describe('TSS Address Verification - Derivation Path with Prefix', function () {
  const commonKeychain =
    '8ea32ecacfc83effbd2e2790ee44fa7c59b4d86c29a12f09fb613d8195f93f4e21875cad3b98adada40c040c54c3569467df41a020881a6184096378701862bd';

  describe('extractCommonKeychain', function () {
    it('should extract commonKeychain from keychains array', function () {
      const extractCommonKeychain = getExtractCommonKeychain();
      const keychains = [{ commonKeychain }, { commonKeychain }, { commonKeychain }];

      const result = extractCommonKeychain(keychains);
      result.should.equal(commonKeychain);
    });

    it('should throw error if keychains are missing', function () {
      const extractCommonKeychain = getExtractCommonKeychain();
      assert.throws(() => extractCommonKeychain([]), /missing required param keychains/);
      assert.throws(() => extractCommonKeychain(undefined as any), /missing required param keychains/);
    });

    it('should throw error if commonKeychain is missing', function () {
      const extractCommonKeychain = getExtractCommonKeychain();
      const keychains = [{ id: '1' }];
      assert.throws(() => extractCommonKeychain(keychains as any), /missing required param commonKeychain/);
    });

    it('should throw error if keychains have mismatched commonKeychains', function () {
      const extractCommonKeychain = getExtractCommonKeychain();
      const keychains = [{ commonKeychain }, { commonKeychain: 'different-keychain' }];
      assert.throws(() => extractCommonKeychain(keychains), /all keychains must have the same commonKeychain/);
    });
  });

  describe('Derivation Path Format Validation', function () {
    it('should produce correct derivation path format', function () {
      const testSeeds = ['seed1', 'seed-2', '12345', 'test_seed_123'];

      testSeeds.forEach((seed) => {
        const path = getDerivationPath(seed);

        // Expected format: "m/999999/{part1}/{part2}"
        path.should.match(/^m\/999999\/\d+\/\d+$/);

        path.should.startWith('m/');

        // Should have exactly 3 parts
        const parts = path.split('/');
        parts.length.should.equal(4);
        parts[0].should.equal('m');
        parts[1].should.equal('999999');
      });
    });
  });
});
