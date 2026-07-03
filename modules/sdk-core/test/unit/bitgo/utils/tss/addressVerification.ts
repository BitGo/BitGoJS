import * as assert from 'assert';
import 'should';
import { getDerivationPath } from '@bitgo/sdk-lib-mpc';
import { Ecdsa } from '../../../../../src/account-lib/mpc';
import { EDDSAMethods } from '../../../../../src/bitgo/tss';

function getAddressVerificationModule() {
  return require('../../../../../src/bitgo/utils/tss/addressVerification');
}

const getExtractCommonKeychain = () => getAddressVerificationModule().extractCommonKeychain;
const getVerifyEddsaTssWalletAddress = () => getAddressVerificationModule().verifyEddsaTssWalletAddress;
const getVerifyMPCWalletAddress = () => getAddressVerificationModule().verifyMPCWalletAddress;
const getDeriveMPCWalletAddress = () => getAddressVerificationModule().deriveMPCWalletAddress;

// RFC 8032 test vector: known valid Ed25519 public key + arbitrary chaincode = 128 hex chars.
const TEST_PK = 'd75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a';
const TEST_CHAINCODE = 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';
const TEST_KEYCHAIN = TEST_PK + TEST_CHAINCODE;

// secp256k1 generator point G (compressed, 33 bytes = 66 hex) + same chaincode = 130 hex chars.
const ECDSA_PK = '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798';
const ECDSA_KEYCHAIN = ECDSA_PK + TEST_CHAINCODE;

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

describe('verifyEddsaTssWalletAddress', function () {
  const keychains = [
    { commonKeychain: TEST_KEYCHAIN },
    { commonKeychain: TEST_KEYCHAIN },
    { commonKeychain: TEST_KEYCHAIN },
  ];
  const isValidAddress = (addr: string) => addr.length === 64;
  const getAddressFromPublicKey = (pk: string) => pk;

  describe('MPCv2 wallets (BIP32-Ed25519 formula)', function () {
    it('verifies a correct address at index 0', async function () {
      const verifyEddsaTssWalletAddress = getVerifyEddsaTssWalletAddress();
      const expectedAddress = (await EDDSAMethods.getInitializedMpcInstance())
        .deriveUnhardened(TEST_KEYCHAIN, 'm/0')
        .slice(0, 64);

      const result = await verifyEddsaTssWalletAddress(
        { address: expectedAddress, keychains, index: 0, multisigTypeVersion: 'MPCv2' },
        isValidAddress,
        getAddressFromPublicKey
      );
      result.should.be.true();
    });

    it('verifies a correct address at index 1', async function () {
      const verifyEddsaTssWalletAddress = getVerifyEddsaTssWalletAddress();
      const expectedAddress = (await EDDSAMethods.getInitializedMpcInstance())
        .deriveUnhardened(TEST_KEYCHAIN, 'm/1')
        .slice(0, 64);

      const result = await verifyEddsaTssWalletAddress(
        { address: expectedAddress, keychains, index: 1, multisigTypeVersion: 'MPCv2' },
        isValidAddress,
        getAddressFromPublicKey
      );
      result.should.be.true();
    });

    it('rejects an address derived at a different index', async function () {
      const verifyEddsaTssWalletAddress = getVerifyEddsaTssWalletAddress();
      const addressFromIndex0 = (await EDDSAMethods.getInitializedMpcInstance())
        .deriveUnhardened(TEST_KEYCHAIN, 'm/0')
        .slice(0, 64);

      const result = await verifyEddsaTssWalletAddress(
        { address: addressFromIndex0, keychains, index: 1, multisigTypeVersion: 'MPCv2' },
        isValidAddress,
        getAddressFromPublicKey
      );
      result.should.be.false();
    });

    it('rejects a random address that was not derived from the keychain', async function () {
      const verifyEddsaTssWalletAddress = getVerifyEddsaTssWalletAddress();
      const randomAddress = 'ab'.repeat(32); // 64 hex chars, wrong address

      const result = await verifyEddsaTssWalletAddress(
        { address: randomAddress, keychains, index: 0, multisigTypeVersion: 'MPCv2' },
        isValidAddress,
        getAddressFromPublicKey
      );
      result.should.be.false();
    });

    it('verifies a correct MPCv2 address for SMC wallet using derivedFromParentWithSeed', async function () {
      const verifyEddsaTssWalletAddress = getVerifyEddsaTssWalletAddress();
      const seed = 'smc-seed-123';
      const prefix = getDerivationPath(seed);
      const expectedAddress = (await EDDSAMethods.getInitializedMpcInstance())
        .deriveUnhardened(TEST_KEYCHAIN, `${prefix}/0`)
        .slice(0, 64);

      const result = await verifyEddsaTssWalletAddress(
        {
          address: expectedAddress,
          keychains,
          index: 0,
          multisigTypeVersion: 'MPCv2',
          derivedFromParentWithSeed: seed,
        },
        isValidAddress,
        getAddressFromPublicKey
      );
      result.should.be.true();
    });

    it('rejects an MPCv2 address derived at the wrong index when derivedFromParentWithSeed is set', async function () {
      const verifyEddsaTssWalletAddress = getVerifyEddsaTssWalletAddress();
      const seed = 'smc-seed-123';
      const prefix = getDerivationPath(seed);
      const addressAtIndex1 = (await EDDSAMethods.getInitializedMpcInstance())
        .deriveUnhardened(TEST_KEYCHAIN, `${prefix}/1`)
        .slice(0, 64);

      const result = await verifyEddsaTssWalletAddress(
        {
          address: addressAtIndex1,
          keychains,
          index: 0,
          multisigTypeVersion: 'MPCv2',
          derivedFromParentWithSeed: seed,
        },
        isValidAddress,
        getAddressFromPublicKey
      );
      result.should.be.false();
    });
  });

  describe('legacy Silence Labs formula', function () {
    it('rejects an address derived with the old Silence Labs single-HMAC formula', async function () {
      const verifyEddsaTssWalletAddress = getVerifyEddsaTssWalletAddress();
      // The Silence Labs and BIP32-Ed25519 formulas produce different addresses for the same keychain.
      // Addresses derived with the old formula no longer verify against the current derivation.
      const { deriveUnhardenedMps: deriveSL } = await import('@bitgo/sdk-lib-mpc');
      const silenceLabsAddress = deriveSL(TEST_KEYCHAIN, 'm/0').slice(0, 64);

      const result = await verifyEddsaTssWalletAddress(
        { address: silenceLabsAddress, keychains, index: 0 },
        isValidAddress,
        getAddressFromPublicKey
      );

      result.should.be.false();
    });
  });
});

describe('verifyMPCWalletAddress - ECDSA (secp256k1)', function () {
  const ecdsaKeychains = [
    { commonKeychain: ECDSA_KEYCHAIN },
    { commonKeychain: ECDSA_KEYCHAIN },
    { commonKeychain: ECDSA_KEYCHAIN },
  ];
  // secp256k1 compressed public key is 33 bytes = 66 hex chars
  const isValidEcdsaAddress = (addr: string) => addr.length === 66;
  const getAddressFromPublicKey = (pk: string) => pk;

  it('ignores multisigTypeVersion MPCv2 and uses Ecdsa derivation for secp256k1 wallets', async function () {
    const verifyMPCWalletAddress = getVerifyMPCWalletAddress();
    const expectedAddress = new Ecdsa().deriveUnhardened(ECDSA_KEYCHAIN, 'm/0').slice(0, 66);

    const result = await verifyMPCWalletAddress(
      {
        address: expectedAddress,
        keychains: ecdsaKeychains,
        index: 0,
        multisigTypeVersion: 'MPCv2',
        keyCurve: 'secp256k1',
      },
      isValidEcdsaAddress,
      getAddressFromPublicKey
    );
    result.should.be.true();
  });

  it('verifies a correct secp256k1 address at index 1', async function () {
    const verifyMPCWalletAddress = getVerifyMPCWalletAddress();
    const expectedAddress = new Ecdsa().deriveUnhardened(ECDSA_KEYCHAIN, 'm/1').slice(0, 66);

    const result = await verifyMPCWalletAddress(
      { address: expectedAddress, keychains: ecdsaKeychains, index: 1, keyCurve: 'secp256k1' },
      isValidEcdsaAddress,
      getAddressFromPublicKey
    );
    result.should.be.true();
  });

  it('rejects an address derived at a different index', async function () {
    const verifyMPCWalletAddress = getVerifyMPCWalletAddress();
    const addressAtIndex0 = new Ecdsa().deriveUnhardened(ECDSA_KEYCHAIN, 'm/0').slice(0, 66);

    const result = await verifyMPCWalletAddress(
      { address: addressAtIndex0, keychains: ecdsaKeychains, index: 1, keyCurve: 'secp256k1' },
      isValidEcdsaAddress,
      getAddressFromPublicKey
    );
    result.should.be.false();
  });
});

describe('deriveMPCWalletAddress', function () {
  const getAddressFromPublicKey = (pk: string) => pk;

  describe('ed25519 (MPCv2)', function () {
    const keychains = [{ commonKeychain: TEST_KEYCHAIN }, { commonKeychain: TEST_KEYCHAIN }];

    it('derives the address and path for the simple m/{index} path', async function () {
      const deriveMPCWalletAddress = getDeriveMPCWalletAddress();
      const expectedAddress = (await EDDSAMethods.getInitializedMpcInstance())
        .deriveUnhardened(TEST_KEYCHAIN, 'm/3')
        .slice(0, 64);

      const result = await deriveMPCWalletAddress(
        { keychains, index: 3, multisigTypeVersion: 'MPCv2', keyCurve: 'ed25519' },
        getAddressFromPublicKey
      );

      result.address.should.equal(expectedAddress);
      result.derivationPath.should.equal('m/3');
    });

    it('uses the SMC prefix path when derivedFromParentWithSeed is set', async function () {
      const deriveMPCWalletAddress = getDeriveMPCWalletAddress();
      const seed = 'smc-seed-123';
      const prefix = getDerivationPath(seed);
      const expectedAddress = (await EDDSAMethods.getInitializedMpcInstance())
        .deriveUnhardened(TEST_KEYCHAIN, `${prefix}/0`)
        .slice(0, 64);

      const result = await deriveMPCWalletAddress(
        { keychains, index: 0, multisigTypeVersion: 'MPCv2', derivedFromParentWithSeed: seed, keyCurve: 'ed25519' },
        getAddressFromPublicKey
      );

      result.address.should.equal(expectedAddress);
      result.derivationPath.should.equal(`${prefix}/0`);
    });
  });

  describe('secp256k1', function () {
    const ecdsaKeychains = [{ commonKeychain: ECDSA_KEYCHAIN }, { commonKeychain: ECDSA_KEYCHAIN }];

    it('derives the secp256k1 address (33-byte pubkey)', async function () {
      const deriveMPCWalletAddress = getDeriveMPCWalletAddress();
      const expectedAddress = new Ecdsa().deriveUnhardened(ECDSA_KEYCHAIN, 'm/2').slice(0, 66);

      const result = await deriveMPCWalletAddress(
        { keychains: ecdsaKeychains, index: 2, keyCurve: 'secp256k1' },
        getAddressFromPublicKey
      );

      result.address.should.equal(expectedAddress);
      result.derivationPath.should.equal('m/2');
    });
  });

  describe('round-trip with verifyMPCWalletAddress', function () {
    it('an address produced by deriveMPCWalletAddress verifies as true', async function () {
      const deriveMPCWalletAddress = getDeriveMPCWalletAddress();
      const verifyMPCWalletAddress = getVerifyMPCWalletAddress();
      const ecdsaKeychains = [{ commonKeychain: ECDSA_KEYCHAIN }, { commonKeychain: ECDSA_KEYCHAIN }];
      const isValidEcdsaAddress = (addr: string) => addr.length === 66;

      const { address } = await deriveMPCWalletAddress(
        { keychains: ecdsaKeychains, index: 7, keyCurve: 'secp256k1' },
        getAddressFromPublicKey
      );

      const verified = await verifyMPCWalletAddress(
        { address, keychains: ecdsaKeychains, index: 7, keyCurve: 'secp256k1' },
        isValidEcdsaAddress,
        getAddressFromPublicKey
      );

      verified.should.be.true();
    });
  });
});
