import 'should';
import { bip32 } from '@bitgo/utxo-lib';
import {
  deriveAndSelfCheckSafeChildHardened,
  deriveSafeChildEd25519Hardened,
  deriveSafeChildHardenedFromXprv,
  deriveSafeSecp256k1MultisigTriplet,
  getSafeHardenedDerivationPath,
  parseDerivedFromParentWithHardenedPath,
  parseSafeDerivationIndex,
} from '../../src';

// BIP32 test vector 1 (public): seed 000102...0f → master → m/0'. The child pub is the published
// vector; the prv is asserted structurally (round-trips to the pub) rather than hardcoded.
const BIP32_VECTOR_1_SEED = '000102030405060708090a0b0c0d0e0f';
const BIP32_VECTOR_1_M0_PUB =
  'xpub68Gmy5EdvgibQVfPdqkBBCHxA5htiqg55crXYuXoQRKfDBFA1WEjWgP6LHhwBZeNK1VTsfTFUHCdrfp1bgwQ9xv5ski8PX9rL2dZXvgGDnw';
const SECP256K1_TRIPLET_PUBLIC_VECTORS = [
  {
    index: 0,
    user: BIP32_VECTOR_1_M0_PUB,
    backup:
      'xpub68YxEXm6MzDfDNxMgxAWL5SKgtrrRhW9SYd4LCgP5GKNNemcdKZGoiU7V51zYjB7UZ4rdPpNrmgvCDjUrbUGb5SAofxstu7qxrDmMrxqV61',
    bitgo:
      'xpub687FEQo7o7DuVC9qPhkmoSSUbHuKvuWWhbs9CgRPZKAZ27oSWMrPDQPU9fe6wAP5jwzMWPuLtTFJVPbZVYe1EG7ub3ucFLsESKeaJB1t8PP',
  },
  {
    index: 1,
    user: 'xpub68Gmy5EdvgibUN4mNXdMAcCZh4jpWiebYvh9WkKTkqvGD6tu4ZtXUAwuKSyF5DFZVmotf9UHFTGqSXo9qyDBSn47RkaN6Aedt9JbL7zcgSL',
    backup:
      'xpub68YxEXm6MzDfGe5ER7y35vVg8JJRY2WLRWExPNbzoB6aCk1VuqK7PYGZEGKM9BPwH6WhA1JUhgMSPKw6C5fn34FCy1zQCQR9QtX9PnZ53ww',
    bitgo:
      'xpub687FEQo7o7DuVgeFdizaRUU2jhFCZcqPRnXWu7fX53ueveisfRzMQrPxQ56AMhUFBwUyqB8pJngQBYPD4xfp3wGEePqgPPaftPawwkBsCKr',
  },
  {
    index: 999,
    user: 'xpub68Gmy5EdvgjMJhzRpW22GYfmwmpq4akLBvu6Z4PPq2L4RBZ6Nb7g6puhW5yhfru6oKGvThy9eSkvS9w4jowaCc93qovhFos1Ea2s2reuUrF',
    backup:
      'xpub68YxEXm6MzER6qMSqgQSKcD8bk7ngWx1QJgoUwf77KfmgM7kmEJKUzZSL6GvTBFC43djxkgX326UPpVkNvVuZkUGPGcnvynqiaETXECGcTm',
    bitgo:
      'xpub687FEQo7o7EfNS18VHgmmZkYf1hUhM17kqWscMskC5ZGTP6BxVsHfrm1Kfij3HdqnTfJr2meAe7fRBKKQBxBZULjdHLeVKvu9bvQXB88NtH',
  },
] as const;

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

  describe('deriveSafeSecp256k1MultisigTriplet', function () {
    const BACKUP_ROOT_SEED = '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f';
    const BITGO_ROOT_SEED = '1f1e1d1c1b1a191817161514131211100f0e0d0c0b0a09080706050403020100';

    const userRoot = () => bip32.fromSeed(Buffer.from(BIP32_VECTOR_1_SEED, 'hex'));
    const backupRoot = () => bip32.fromSeed(Buffer.from(BACKUP_ROOT_SEED, 'hex'));
    const bitgoRoot = () => bip32.fromSeed(Buffer.from(BITGO_ROOT_SEED, 'hex'));

    const deriveTriplet = (index: string | number) =>
      deriveSafeSecp256k1MultisigTriplet({
        userRootXprv: userRoot().toBase58(),
        backupRootXprv: backupRoot().toBase58(),
        bitgoRootXpub: bitgoRoot().neutered().toBase58(),
        index,
      });

    it('derives the user child hardened at m/n', function () {
      const triplet = deriveTriplet(0);
      triplet.index.should.equal(0);
      triplet.user.pub.should.equal(BIP32_VECTOR_1_M0_PUB);
      bip32.fromBase58(triplet.user.prv).neutered().toBase58().should.equal(triplet.user.pub);
    });

    it('derives the backup child soft', function () {
      const backup = backupRoot();
      const triplet = deriveTriplet(0);
      bip32.fromBase58(triplet.backup.prv).neutered().toBase58().should.equal(triplet.backup.pub);
      triplet.backup.pub.should.equal(backup.derive(0).neutered().toBase58());
      triplet.backup.pub.should.not.equal(backup.deriveHardened(0).neutered().toBase58());
    });

    it('derives the bitgo child public-only from the xpub', function () {
      const bitgo = bitgoRoot();
      const triplet = deriveTriplet(0);
      triplet.bitgo.should.eql({ pub: bitgo.derive(0).neutered().toBase58() });
    });

    it('matches pinned public vectors at indices 0, 1, and 999', function () {
      for (const vector of SECP256K1_TRIPLET_PUBLIC_VECTORS) {
        const triplet = deriveTriplet(vector.index);
        triplet.index.should.equal(vector.index);
        triplet.user.pub.should.equal(vector.user);
        triplet.backup.pub.should.equal(vector.backup);
        triplet.bitgo.pub.should.equal(vector.bitgo);
        bip32.fromBase58(triplet.user.prv).neutered().toBase58().should.equal(vector.user);
        bip32.fromBase58(triplet.backup.prv).neutered().toBase58().should.equal(vector.backup);
      }
    });

    it('emits xprv/xpub from BitGo-format roots', function () {
      const triplet = deriveTriplet(999);
      triplet.user.prv.startsWith('xprv').should.equal(true);
      triplet.user.pub.startsWith('xpub').should.equal(true);
      triplet.backup.prv.startsWith('xprv').should.equal(true);
      triplet.backup.pub.startsWith('xpub').should.equal(true);
      triplet.bitgo.pub.startsWith('xpub').should.equal(true);
    });

    it('fails closed when a public root is passed as backupRootXprv', function () {
      (() =>
        deriveSafeSecp256k1MultisigTriplet({
          userRootXprv: userRoot().toBase58(),
          backupRootXprv: backupRoot().neutered().toBase58(),
          bitgoRootXpub: bitgoRoot().neutered().toBase58(),
          index: 0,
        })).should.throw(/root has no private key/);
    });

    it('fails closed when a private root is passed as bitgoRootXpub', function () {
      (() =>
        deriveSafeSecp256k1MultisigTriplet({
          userRootXprv: userRoot().toBase58(),
          backupRootXprv: backupRoot().toBase58(),
          bitgoRootXpub: bitgoRoot().toBase58(),
          index: 0,
        })).should.throw(/root has a private key/);
    });

    it('rejects an invalid index', function () {
      (() => deriveTriplet(-1)).should.throw(/Invalid safe derivation index/);
    });
  });
});
