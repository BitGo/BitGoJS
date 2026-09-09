import 'should';
import {
  deriveSafeChildEd25519Hardened,
  deriveSafeChildHardenedFromXprv,
  getSafeHardenedDerivationPath,
  parseSafeDerivationIndex,
} from '../../../../src';

// 32-byte synthetic root seed. The StrKey spelling was generated with stellar-sdk
// (Keypair.fromRawEd25519Seed); the derivation vectors below were generated with an independent
// SLIP-0010 implementation written from the spec and cross-checked against published vectors
// (SLIP-0010 test vector 1 seed 000102...0f derives m/0' to 68e0fe46...dade7a3).
const ROOT_SEED_STRKEY = 'SAAACAQDAQCQMBYIBEFAWDANBYHRAEISCMKBKFQXDAMRUGY4DUPB6NKI';

const ROOT_XPRV =
  'xprv9s21ZrQH143K3hekyNj7TciR4XNYe1kMj68W2ipjJGNHETWP7o42AjDnSPgKhdZ4x8NBAvaL72RrXjuXNdmkMqLERZza73oYugGtbLFXG8g';

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

  describe('deriveSafeChildHardenedFromXprv', function () {
    it('derives m/0 from the root xprv', function () {
      const child = deriveSafeChildHardenedFromXprv(ROOT_XPRV, 0);
      child.derivationPath.should.equal("m/0'");
      child.pub.should.equal(
        'xpub69PbR6HB6ZaW3Q9CWAzNsmWXC8TBDq1VEmd25XkwUgrU3PVGAbj6bksqPnGWcFdAodXWRpWMXJ5KGim45n55cZjXeW7FDw4BqahtxTEN4wB'
      );
      child.prv.should.equal(
        'xprv9vQF1akHGC2Cpv4jQ9TNWdZne6cgpNHdsYhRH9MKvMKVAbA7d4Qr3xZMYXqAS35V4damCDP2hYohCLViHzcGhX4Tr7djjCBruAX73SsjCiC'
      );
    });
  });

  describe('deriveSafeChildEd25519Hardened', function () {
    it('derives m/0 to the pinned SLIP-0010 vector', function () {
      const child = deriveSafeChildEd25519Hardened(ROOT_SEED_STRKEY, 0);
      child.should.eql({
        prv: 'b127eb5092011c085345c8ce0bfeda6064f9e1249e29cc238c1d64bf2e587ce7',
        pub: 'GCTZR46FPFAMYN734SQB4NCNBI44M4DSNM5RJPCDLOMAOFPEUVUXPK7R',
        derivationPath: "m/0'",
      });
    });

    it('derives m/7 to the pinned SLIP-0010 vector', function () {
      const child = deriveSafeChildEd25519Hardened(ROOT_SEED_STRKEY, '7');
      child.should.eql({
        prv: 'd54701e221cf51e9e208a7c59e3fe3e4cfbb6b91fd3f35ce092a471c35228217',
        pub: 'GC2Y5EU2XA22SOSCRSZRNDEY3UAA4OJSLZ5NQUFUZDBQSLMVCIZCBHIN',
        derivationPath: "m/7'",
      });
    });

    it('rejects a malformed root seed', function () {
      (() => deriveSafeChildEd25519Hardened(ROOT_SEED_STRKEY.slice(0, 55), 0)).should.throw(
        /Invalid ed25519 StrKey secret seed/
      );
      (() => deriveSafeChildEd25519Hardened(ROOT_XPRV, 0)).should.throw(/Invalid ed25519 StrKey secret seed/);
    });

    it('rejects an invalid index', function () {
      (() => deriveSafeChildEd25519Hardened(ROOT_SEED_STRKEY, -1)).should.throw(/Invalid safe derivation index/);
    });
  });
});
