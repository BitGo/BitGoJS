import 'should';
import { bip32 } from '@bitgo/utxo-lib';
import {
  deriveAndSelfCheckSafeChildHardened,
  deriveSafeChildEd25519Hardened,
  deriveSafeChildHardenedFromXprv,
  getSafeHardenedDerivationPath,
  parseDerivedFromParentWithHardenedPath,
  parseSafeDerivationIndex,
} from '../../src';

// BIP32 test vector 1 (public): seed 000102...0f → master → m/0'. The child pub is the published
// vector; the prv is asserted structurally (round-trips to the pub) rather than hardcoded.
const BIP32_VECTOR_1_SEED = '000102030405060708090a0b0c0d0e0f';
const BIP32_VECTOR_1_M0_PUB =
  'xpub68Gmy5EdvgibQVfPdqkBBCHxA5htiqg55crXYuXoQRKfDBFA1WEjWgP6LHhwBZeNK1VTsfTFUHCdrfp1bgwQ9xv5ski8PX9rL2dZXvgGDnw';

// 32-byte synthetic root seed. The StrKey spelling was generated with stellar-sdk; the pinned
// SLIP-0010 outputs below match sdk-core's safeDerivation test vectors.
const ROOT_SEED_STRKEY = 'SAAACAQDAQCQMBYIBEFAWDANBYHRAEISCMKBKFQXDAMRUGY4DUPB6NKI';

describe('safeDerivation', function () {
  describe('parseSafeDerivationIndex', function () {
    it('accepts numbers and digit strings', function () {
      parseSafeDerivationIndex(0).should.equal(0);
      parseSafeDerivationIndex(7).should.equal(7);
      parseSafeDerivationIndex('42').should.equal(42);
      parseSafeDerivationIndex(0x7fffffff).should.equal(0x7fffffff);
    });

    it('rejects negatives, non-integers, and out-of-range values', function () {
      (() => parseSafeDerivationIndex(-1)).should.throw(/Invalid safe derivation index/);
      (() => parseSafeDerivationIndex(1.5)).should.throw(/Invalid safe derivation index/);
      (() => parseSafeDerivationIndex(0x80000000)).should.throw(/Invalid safe derivation index/);
    });

    it('rejects non-numeric strings', function () {
      (() => parseSafeDerivationIndex("0'")).should.throw(/Invalid safe derivation index/);
      (() => parseSafeDerivationIndex('m/0')).should.throw(/Invalid safe derivation index/);
      (() => parseSafeDerivationIndex('')).should.throw(/Invalid safe derivation index/);
    });
  });

  describe('getSafeHardenedDerivationPath', function () {
    it('formats m/<index> with hardened apostrophe', function () {
      getSafeHardenedDerivationPath(0).should.equal("m/0'");
      getSafeHardenedDerivationPath('7').should.equal("m/7'");
      getSafeHardenedDerivationPath('007').should.equal("m/7'");
    });
  });

  describe('parseDerivedFromParentWithHardenedPath', function () {
    it('parses m/<n> primed paths', function () {
      parseDerivedFromParentWithHardenedPath("m/0'").should.equal(0);
      parseDerivedFromParentWithHardenedPath("m/123'").should.equal(123);
    });

    it('rejects unhardened and malformed paths', function () {
      (() => parseDerivedFromParentWithHardenedPath('m/0')).should.throw(/derivedFromParentWithHardenedPath/);
      (() => parseDerivedFromParentWithHardenedPath('m/999999/a/b')).should.throw(/derivedFromParentWithHardenedPath/);
      (() => parseDerivedFromParentWithHardenedPath("not-a-path'")).should.throw(/derivedFromParentWithHardenedPath/);
      (() => parseDerivedFromParentWithHardenedPath("m/0''")).should.throw(/derivedFromParentWithHardenedPath/);
    });
  });

  describe('deriveSafeChildHardenedFromXprv', function () {
    it('derives m/0 from the BIP32 vector 1 master', function () {
      const root = bip32.fromSeed(Buffer.from(BIP32_VECTOR_1_SEED, 'hex'));
      const child = deriveSafeChildHardenedFromXprv(root.toBase58(), 0);
      child.derivationPath.should.equal("m/0'");
      child.pub.should.equal(BIP32_VECTOR_1_M0_PUB);
      bip32.fromBase58(child.prv).neutered().toBase58().should.equal(child.pub);
    });

    it('self-check returns the same deterministic child', function () {
      const root = bip32.fromSeed(Buffer.from(BIP32_VECTOR_1_SEED, 'hex'));
      const child = deriveAndSelfCheckSafeChildHardened(root.toBase58(), 0);
      child.derivationPath.should.equal("m/0'");
      child.pub.should.equal(BIP32_VECTOR_1_M0_PUB);
      bip32.fromBase58(child.prv).neutered().toBase58().should.equal(child.pub);
    });
  });

  describe('deriveSafeChildEd25519Hardened', function () {
    it('derives m/0 to the pinned SLIP-0010 vector', function () {
      deriveSafeChildEd25519Hardened(ROOT_SEED_STRKEY, 0).should.eql({
        prv: 'b127eb5092011c085345c8ce0bfeda6064f9e1249e29cc238c1d64bf2e587ce7',
        pub: 'GCTZR46FPFAMYN734SQB4NCNBI44M4DSNM5RJPCDLOMAOFPEUVUXPK7R',
        derivationPath: "m/0'",
      });
    });

    it('derives m/7 to the pinned SLIP-0010 vector', function () {
      deriveSafeChildEd25519Hardened(ROOT_SEED_STRKEY, '7').should.eql({
        prv: 'd54701e221cf51e9e208a7c59e3fe3e4cfbb6b91fd3f35ce092a471c35228217',
        pub: 'GC2Y5EU2XA22SOSCRSZRNDEY3UAA4OJSLZ5NQUFUZDBQSLMVCIZCBHIN',
        derivationPath: "m/7'",
      });
    });

    it('rejects a malformed root seed', function () {
      (() => deriveSafeChildEd25519Hardened(ROOT_SEED_STRKEY.slice(0, 55), 0)).should.throw(
        /Invalid ed25519 StrKey secret seed/
      );
    });

    it('rejects an invalid index', function () {
      (() => deriveSafeChildEd25519Hardened(ROOT_SEED_STRKEY, -1)).should.throw(/Invalid safe derivation index/);
    });
  });
});
