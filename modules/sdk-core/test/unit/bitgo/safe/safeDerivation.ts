import 'should';
import { buildSafeBip44Path, deriveSafeChildEd25519Hardened, deriveSafeChildHardenedFromXprv } from '../../../../src';

// Deliberate guard: re-derives through sdk-core's public barrel (which re-exports from
// @bitgo/sdk-lib-safes) to prove the re-export and byte-for-byte output hold end-to-end.
// The secp256k1 ROOT_XPRV vector is secret and lives only here; the leaf's own
// test/unit/safeDerivation.ts pins a public BIP32 vector instead.

// 32-byte synthetic root seed. The StrKey spelling was generated with stellar-sdk
// (Keypair.fromRawEd25519Seed); the leaf pins the same seed at the same BIP44 path.
const ROOT_SEED_STRKEY = 'SAAACAQDAQCQMBYIBEFAWDANBYHRAEISCMKBKFQXDAMRUGY4DUPB6NKI';

const ROOT_XPRV =
  'xprv9s21ZrQH143K3hekyNj7TciR4XNYe1kMj68W2ipjJGNHETWP7o42AjDnSPgKhdZ4x8NBAvaL72RrXjuXNdmkMqLERZza73oYugGtbLFXG8g';

describe('safeDerivation', function () {
  describe('deriveSafeChildHardenedFromXprv', function () {
    it("derives m/44'/0'/1'/0' from the root xprv", function () {
      const child = deriveSafeChildHardenedFromXprv(ROOT_XPRV, buildSafeBip44Path(0, 'secp256k1Multisig', 0));
      child.derivationPath.should.equal("m/44'/0'/1'/0'");
      child.pub.should.equal(
        'xpub6DpagSiper5rGnEAK4gGmRJPdgDQCzmWZSY59iJ63NUw6BecfdX71APcU5Wfrq3rCcaFoah1dh7ot2fp1nt5AJMJysxSouPCT5xuHtptAaz'
      );
      child.prv.should.equal(
        'xprv9zqEGwBvpUXZ4J9hD39GQHMf5eNuoY3fCDcUMKtUV2wxDPKU86CrTN58cpUVsjJFu4XqVDZS8SFFX11kZfoRxY7pgaHL2NCqPye1oVPDuad'
      );
    });
  });

  describe('deriveSafeChildEd25519Hardened', function () {
    it("derives m/44'/148'/2'/0' to the pinned SLIP-0010 vector", function () {
      deriveSafeChildEd25519Hardened(ROOT_SEED_STRKEY, buildSafeBip44Path(148, 'ed25519Multisig', 0)).should.eql({
        prv: '855e8d991b48037b3e0161fd57f1643044878d6afe0db0243719b5201e2e4f69',
        pub: 'GDD3VVFKM64URLG6PO2UFWQXJH67N5UDOV5HZ23M5FJJT5G4LUO7RJWG',
        derivationPath: "m/44'/148'/2'/0'",
      });
    });

    it('rejects a malformed root seed', function () {
      const path = buildSafeBip44Path(148, 'ed25519Multisig', 0);
      (() => deriveSafeChildEd25519Hardened(ROOT_SEED_STRKEY.slice(0, 55), path)).should.throw(
        /Invalid ed25519 StrKey secret seed/
      );
      (() => deriveSafeChildEd25519Hardened(ROOT_XPRV, path)).should.throw(/Invalid ed25519 StrKey secret seed/);
    });
  });
});
