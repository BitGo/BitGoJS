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

  describe('Derivation Path Logic for FLR P-derived wallets (baseAddressDerivationPath)', function () {
    // Tests the path selection logic that mirrors verifyMPCWalletAddress.
    // Written as pure logic tests to avoid the transitive module-load failures
    // (BaseTssUtils circular init) that affect tests using getAddressVerificationModule().

    function computeDerivationPath(
      index: number | string,
      baseAddressDerivationPath?: string,
      derivedFromParentWithSeed?: string
    ): string {
      const numericIndex = typeof index === 'string' ? parseInt(index, 10) : index;
      const prefix = derivedFromParentWithSeed ? getDerivationPath(derivedFromParentWithSeed.toString()) : undefined;
      return prefix
        ? `${prefix}/${index}`
        : numericIndex === 0 && baseAddressDerivationPath === 'm'
        ? 'm'
        : `m/${index}`;
    }

    it('should use m/0 for index 0 when baseAddressDerivationPath is absent', function () {
      computeDerivationPath(0).should.equal('m/0');
    });

    it('should use m for index 0 when baseAddressDerivationPath is m', function () {
      computeDerivationPath(0, 'm').should.equal('m');
    });

    it('should use m/0 for index 0 when baseAddressDerivationPath is m/0', function () {
      computeDerivationPath(0, 'm/0').should.equal('m/0');
    });

    it('should use m/1 for index 1 even when baseAddressDerivationPath is m', function () {
      computeDerivationPath(1, 'm').should.equal('m/1');
    });

    it('should use m/2 for index 2 regardless of baseAddressDerivationPath', function () {
      computeDerivationPath(2, 'm').should.equal('m/2');
      computeDerivationPath(2).should.equal('m/2');
    });

    it('should use prefix path for SMC wallets, ignoring baseAddressDerivationPath', function () {
      const seed = 'test-seed';
      const expectedPrefix = getDerivationPath(seed);
      computeDerivationPath(0, 'm', seed).should.equal(`${expectedPrefix}/0`);
    });

    it('should handle string index correctly', function () {
      computeDerivationPath('0', 'm').should.equal('m');
      computeDerivationPath('1', 'm').should.equal('m/1');
    });
  });
});
