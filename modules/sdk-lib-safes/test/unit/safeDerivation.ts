import 'should';
import { bip32 } from '@bitgo/utxo-lib';
import {
  buildSafeBip44Path,
  deriveAndSelfCheckSafeChildHardened,
  deriveSafeChildEd25519Hardened,
  deriveSafeChildHardenedFromXprv,
  deriveSafeChildTriplet,
  DerivedFromParentWithHardenedPath,
  DerivedFromParentWithSoftPath,
  getSafeBip44CoinType,
  isDerivedFromParentWithHardenedPath,
  isDerivedFromParentWithSoftPath,
  parseSafeBip44Path,
  toSoftTwinPath,
} from '../../src';

// BIP32 test vector 1 seed. The m/44'/0'/1'/0' pub below was cross-checked against chained
// deriveHardened(44).deriveHardened(0).deriveHardened(1).deriveHardened(0).
const BIP32_VECTOR_1_SEED = '000102030405060708090a0b0c0d0e0f';
const BIP32_VECTOR_1_BIP44_PUB =
  'xpub6FAmCnN5quzdacVrq9uYbn68tEPZkScW6G2iDYRYsT6fGWqLKt5S1CfZdyppz139P8DJxpoRZMjTRZZfqD3FutJTd538WYrSxs77srFyGnJ';

// 32-byte synthetic root seed (StrKey generated with stellar-sdk). The deriver reproduces the
// published SLIP-0010 ed25519 vector 1 at the 5-level m/0'/1'/2'/2'/1000000000'.
const ROOT_SEED_STRKEY = 'SAAACAQDAQCQMBYIBEFAWDANBYHRAEISCMKBKFQXDAMRUGY4DUPB6NKI';

const asHardened = (path: string) => path as DerivedFromParentWithHardenedPath;

describe('safeDerivation', function () {
  describe('path brands', function () {
    const cases: { path: string; soft: boolean; hardened: boolean }[] = [
      { path: "m/44'/60'/3'/0'", soft: false, hardened: true },
      { path: "m/44'/0'/1'/2147483647'", soft: false, hardened: true },
      { path: "m/44'/2147483647'/4'/0'", soft: false, hardened: true },
      { path: 'm/44/60/3/0', soft: true, hardened: false },
      { path: 'm/44/0/1/2147483647', soft: true, hardened: false },
      // single level (the retired scheme)
      { path: "m/0'", soft: false, hardened: false },
      { path: 'm/0', soft: false, hardened: false },
      // wrong depth
      { path: "m/44'/60'/3'", soft: false, hardened: false },
      { path: "m/44'/60'/3'/0'/0'", soft: false, hardened: false },
      { path: 'm/44/60/3/0/0', soft: false, hardened: false },
      // wrong purpose
      { path: "m/45'/60'/3'/0'", soft: false, hardened: false },
      { path: "m/0'/60'/3'/0'", soft: false, hardened: false },
      { path: 'm/45/60/3/0', soft: false, hardened: false },
      // slot outside the statics ordinals
      { path: "m/44'/60'/0'/0'", soft: false, hardened: false },
      { path: "m/44'/60'/5'/0'", soft: false, hardened: false },
      { path: 'm/44/60/5/0', soft: false, hardened: false },
      // mixed flags
      { path: "m/44/0'/1'/0'", soft: false, hardened: false },
      { path: "m/44'/60'/3'/0", soft: false, hardened: false },
      { path: "m/44'/60/3'/0'", soft: false, hardened: false },
      // non-canonical (leading zeros alias the canonical path)
      { path: "m/44'/060'/3'/0'", soft: false, hardened: false },
      { path: 'm/44/60/3/00', soft: false, hardened: false },
      // index at or above 2^31
      { path: "m/44'/2147483648'/3'/0'", soft: false, hardened: false },
      { path: 'm/44/60/3/2147483648', soft: false, hardened: false },
      // malformed
      { path: '', soft: false, hardened: false },
      { path: 'm', soft: false, hardened: false },
      { path: 'm//0', soft: false, hardened: false },
      { path: 'M/44/60/3/0', soft: false, hardened: false },
      { path: 'm/44h/60h/3h/0h', soft: false, hardened: false },
      { path: "m/44''/60'/3'/0'", soft: false, hardened: false },
      { path: 'm/44/-1/3/0', soft: false, hardened: false },
      { path: 'm/44/1.5/3/0', soft: false, hardened: false },
      { path: "m/44'/60'/3'/0'\n", soft: false, hardened: false },
    ];

    for (const { path, soft, hardened } of cases) {
      it(`${JSON.stringify(path)}: soft=${soft}, hardened=${hardened}`, function () {
        isDerivedFromParentWithSoftPath(path).should.equal(soft);
        isDerivedFromParentWithHardenedPath(path).should.equal(hardened);
        DerivedFromParentWithSoftPath.decode(path)._tag.should.equal(soft ? 'Right' : 'Left');
        DerivedFromParentWithHardenedPath.decode(path)._tag.should.equal(hardened ? 'Right' : 'Left');
      });
    }

    it('rejects non-string inputs', function () {
      DerivedFromParentWithSoftPath.decode(0)._tag.should.equal('Left');
      DerivedFromParentWithHardenedPath.decode(undefined)._tag.should.equal('Left');
    });
  });

  describe('getSafeBip44CoinType', function () {
    it('resolves the coin family value; testnets and tokens inherit', function () {
      getSafeBip44CoinType('btc').should.equal(0);
      getSafeBip44CoinType('tbtc').should.equal(0);
      getSafeBip44CoinType('eth').should.equal(60);
      getSafeBip44CoinType('usdc').should.equal(60);
    });

    it('rejects coins that cannot derive a safe child', function () {
      (() => getSafeBip44CoinType('ofcbtc')).should.throw(/has no BIP44 coin type/);
      (() => getSafeBip44CoinType('not-a-coin')).should.throw();
    });
  });

  describe('buildSafeBip44Path', function () {
    it("builds m/44'/<coinType>'/<slot>'/<account>' with the statics slot ordinal", function () {
      buildSafeBip44Path(60, 'ecdsaMpc', 0).should.equal("m/44'/60'/3'/0'");
      buildSafeBip44Path(0, 'secp256k1Multisig', 1).should.equal("m/44'/0'/1'/1'");
      buildSafeBip44Path(148, 'ed25519Multisig', 7).should.equal("m/44'/148'/2'/7'");
      buildSafeBip44Path(501, 'eddsaMpc', 0x7fffffff).should.equal("m/44'/501'/4'/2147483647'");
    });

    it('rejects a coinType or account that is not a BIP32 index', function () {
      for (const bad of [-1, 1.5, Number.NaN, Infinity, 0x80000000, 1e21]) {
        (() => buildSafeBip44Path(bad, 'ecdsaMpc', 0)).should.throw(/Invalid safe BIP44 path segments/);
        (() => buildSafeBip44Path(60, 'ecdsaMpc', bad)).should.throw(/Invalid safe BIP44 path segments/);
      }
    });
  });

  describe('parseSafeBip44Path / toSoftTwinPath', function () {
    it('reads the segments back from a hardened path', function () {
      parseSafeBip44Path(buildSafeBip44Path(60, 'ecdsaMpc', 9)).should.eql({
        coinType: 60,
        slotOrdinal: 3,
        account: 9,
      });
    });

    it('strips hardening from every level', function () {
      const soft = toSoftTwinPath(buildSafeBip44Path(60, 'ecdsaMpc', 0));
      soft.should.equal('m/44/60/3/0');
      isDerivedFromParentWithSoftPath(soft).should.be.true();
    });

    it('rejects cast single-level and soft paths', function () {
      (() => parseSafeBip44Path(asHardened("m/0'"))).should.throw(/Invalid safe BIP44 path/);
      (() => parseSafeBip44Path(asHardened('m/44/60/3/0'))).should.throw(/Invalid safe BIP44 path/);
    });
  });

  describe('deriveSafeChildHardenedFromXprv', function () {
    const root = bip32.fromSeed(Buffer.from(BIP32_VECTOR_1_SEED, 'hex'));
    const path = buildSafeBip44Path(0, 'secp256k1Multisig', 0);

    it("derives m/44'/0'/1'/0' from the BIP32 vector 1 master", function () {
      const child = deriveSafeChildHardenedFromXprv(root.toBase58(), path);
      child.derivationPath.should.equal("m/44'/0'/1'/0'");
      child.pub.should.equal(BIP32_VECTOR_1_BIP44_PUB);
      bip32.fromBase58(child.prv).neutered().toBase58().should.equal(child.pub);
    });

    it('self-check returns the same deterministic child', function () {
      deriveAndSelfCheckSafeChildHardened(root.toBase58(), path).pub.should.equal(BIP32_VECTOR_1_BIP44_PUB);
    });

    it('rejects cast soft, single-level, and mixed paths', function () {
      for (const bad of ['m/44/0/1/0', "m/0'", "m/44/0'/1'/0'"]) {
        (() => deriveSafeChildHardenedFromXprv(root.toBase58(), asHardened(bad))).should.throw(
          /Invalid safe child path/
        );
      }
    });

    it('rejects a non-master root', function () {
      const child = root.deriveHardened(0).toBase58();
      (() => deriveSafeChildHardenedFromXprv(child, path)).should.throw(/Expected master/);
    });
  });

  describe('deriveSafeChildEd25519Hardened', function () {
    it("derives m/44'/148'/2'/0' to the pinned SLIP-0010 output", function () {
      deriveSafeChildEd25519Hardened(ROOT_SEED_STRKEY, buildSafeBip44Path(148, 'ed25519Multisig', 0)).should.eql({
        prv: '855e8d991b48037b3e0161fd57f1643044878d6afe0db0243719b5201e2e4f69',
        pub: 'GDD3VVFKM64URLG6PO2UFWQXJH67N5UDOV5HZ23M5FJJT5G4LUO7RJWG',
        derivationPath: "m/44'/148'/2'/0'",
      });
    });

    it("derives m/44'/148'/2'/7' to the pinned SLIP-0010 output", function () {
      deriveSafeChildEd25519Hardened(ROOT_SEED_STRKEY, buildSafeBip44Path(148, 'ed25519Multisig', 7)).should.eql({
        prv: '3790123d377fec4805f52cbd0aa6e4f5277ed2ef75dbdbc0bf723370d10c4a82',
        pub: 'GBQ52JFLZ3BEAF3XL3CZKYJ4H67OLMXZ5MNWNMRI57HR7ZPK4PK7UEEY',
        derivationPath: "m/44'/148'/2'/7'",
      });
    });

    it('rejects a malformed root seed', function () {
      (() =>
        deriveSafeChildEd25519Hardened(
          ROOT_SEED_STRKEY.slice(0, 55),
          buildSafeBip44Path(148, 'ed25519Multisig', 0)
        )).should.throw(/Invalid ed25519 StrKey secret seed/);
    });

    it('rejects a cast non-BIP44 path', function () {
      (() => deriveSafeChildEd25519Hardened(ROOT_SEED_STRKEY, asHardened("m/7'"))).should.throw(
        /Invalid safe child path/
      );
    });
  });

  describe('deriveSafeChildTriplet', function () {
    const userRoot = bip32.fromSeed(Buffer.from(BIP32_VECTOR_1_SEED, 'hex'));
    const backupRoot = bip32.fromSeed(Buffer.alloc(16, 1));
    const bitgoRoot = bip32.fromSeed(Buffer.alloc(16, 2));
    const roots = { user: userRoot.toBase58(), backup: backupRoot.toBase58(), bitgo: bitgoRoot.neutered().toBase58() };
    const path = buildSafeBip44Path(0, 'secp256k1Multisig', 3);

    it('derives the user child hardened and the co-signers at the soft twin', function () {
      const triplet = deriveSafeChildTriplet(roots, path);
      triplet.user.pub.should.equal(deriveSafeChildHardenedFromXprv(roots.user, path).pub);
      // co-signers must be derivable from the root xpubs alone, so the server can verify them
      triplet.backup.pub.should.equal(backupRoot.neutered().derivePath('m/44/0/1/3').toBase58());
      triplet.bitgo.pub.should.equal(bitgoRoot.neutered().derivePath('m/44/0/1/3').toBase58());
      bip32.fromBase58(triplet.backup.prv).neutered().toBase58().should.equal(triplet.backup.pub);
    });

    it('rejects public user/backup roots and a private bitgo root', function () {
      (() => deriveSafeChildTriplet({ ...roots, user: userRoot.neutered().toBase58() }, path)).should.throw(
        /must be private/
      );
      (() => deriveSafeChildTriplet({ ...roots, backup: backupRoot.neutered().toBase58() }, path)).should.throw(
        /must be private/
      );
      (() => deriveSafeChildTriplet({ ...roots, bitgo: bitgoRoot.toBase58() }, path)).should.throw(/must be public/);
    });
  });
});
