import 'should';
import {
  DERIVABLE_ED25519_CHAIN_CODE_BYTES,
  DERIVABLE_ED25519_PUB_LENGTH,
  Ed25519BIP32,
  Eddsa,
  decodeDerivableEd25519Pub,
  decodeEd25519StrKeyPublicKey,
  decodeEd25519StrKeySecretSeed,
  encodeDerivableEd25519Pub,
  encodeEd25519StrKeyPublicKey,
  generateEd25519ChainCode,
  isChecksumValidStrKeyEd25519Pub,
  isDerivableEd25519Pub,
  isValidEd25519StrKeyPublicKey,
  softDeriveChildPubEd25519,
} from '../../../../src';

// Cross-repo fixture: byte-identical to wallet-platform
// test/unit/base/safes/fixtures/derivableEd25519Pub.json. Four independent implementations of this
// format will otherwise drift, and the failure mode is unrecoverable wallets.
import * as fixture from './fixtures/derivableEd25519Pub.json';

const PUBLIC_KEY = Buffer.alloc(32);
const CHAIN_CODE = Buffer.alloc(32, 0xab);
const ROOT_PUB = encodeDerivableEd25519Pub(PUBLIC_KEY, CHAIN_CODE);
const ROOT_KEYCHAIN = Buffer.concat([PUBLIC_KEY, CHAIN_CODE]).toString('hex');
const STRKEY_PUBLIC = 'GA5WUJ54Z23KILLCUOUNAKTPBVZWKMQVO4O6EQ5GHLAERIMLLHNCSKYH';
const STRKEY_SEED = 'SAAACAQDAQCQMBYIBEFAWDANBYHRAEISCMKBKFQXDAMRUGY4DUPB6NKI';

describe('derivableEd25519Pub', function () {
  describe('base32 root format', function () {
    it('encodes 32-byte public key plus 32-byte chain code', function () {
      DERIVABLE_ED25519_CHAIN_CODE_BYTES.should.equal(32);
      DERIVABLE_ED25519_PUB_LENGTH.should.equal(103);
      ROOT_PUB.should.match(/^[A-Z2-7]{103}$/);
      decodeDerivableEd25519Pub(ROOT_PUB).pub.equals(PUBLIC_KEY).should.equal(true);
      decodeDerivableEd25519Pub(ROOT_PUB).chainCode.equals(CHAIN_CODE).should.equal(true);
    });

    it('matches the constants pinned in the shared fixture', function () {
      DERIVABLE_ED25519_PUB_LENGTH.should.equal(fixture.rootPubBase32Length);
      DERIVABLE_ED25519_CHAIN_CODE_BYTES.should.equal(fixture.chainCodeBytes);
    });

    it('generates raw chain code for root composition', function () {
      generateEd25519ChainCode().length.should.equal(32);
    });
  });

  describe('fixture vectors', function () {
    for (const vector of fixture.valid) {
      it(`round-trips ${vector.name}`, function () {
        const composite = encodeDerivableEd25519Pub(
          Buffer.from(vector.pub, 'hex'),
          Buffer.from(vector.chainCode, 'hex')
        );
        composite.should.equal(vector.composite);
        const decoded = decodeDerivableEd25519Pub(vector.composite);
        decoded.pub.toString('hex').should.equal(vector.pub);
        decoded.chainCode.toString('hex').should.equal(vector.chainCode);
        isDerivableEd25519Pub(vector.composite).should.equal(true);
      });
    }

    for (const vector of fixture.invalidComposite) {
      it(`rejects ${vector.name}`, function () {
        isDerivableEd25519Pub(vector.composite).should.equal(false);
        (() => decodeDerivableEd25519Pub(vector.composite)).should.throw(/Invalid derivable ed25519 pub/);
      });
    }
  });

  describe('raw public soft derivation', function () {
    it('derives a deterministic public key and discards the child chain code', async function () {
      const eddsa = await Eddsa.initialize(await Ed25519BIP32.initialize());
      const derived = eddsa.deriveUnhardened(ROOT_KEYCHAIN, 'm/7');
      derived.length.should.equal(128);
      derived.slice(0, 64).should.match(/^[0-9a-f]{64}$/);
      derived.slice(64).should.match(/^[0-9a-f]{64}$/);
      (await softDeriveChildPubEd25519(ROOT_PUB, 7)).toString('hex').should.equal(derived.slice(0, 64));
    });

    // The golden vectors below pin the unhardened derivation output shared cross-repo with
    // wallet-platform: a divergent implementation derives co-signer keys nobody else can
    // reproduce, permanently bricking the wallets minted with it.
    for (const vector of fixture.softDerivation) {
      it(`derives the pinned golden child: ${vector.name}`, async function () {
        const child = await softDeriveChildPubEd25519(vector.composite, vector.index);
        child.toString('hex').should.equal(vector.childPub);
      });
    }

    it('rejects a hardened or out-of-range index', async function () {
      await softDeriveChildPubEd25519(ROOT_PUB, -1).should.be.rejectedWith(/non-hardened/);
      await softDeriveChildPubEd25519(ROOT_PUB, 0x80000000).should.be.rejectedWith(/non-hardened/);
      await softDeriveChildPubEd25519(ROOT_PUB, 1.5).should.be.rejectedWith(/non-hardened/);
    });

    it('rejects a malformed root', async function () {
      await softDeriveChildPubEd25519(fixture.invalidComposite[1].composite, 0).should.be.rejectedWith(
        /Invalid derivable ed25519 pub/
      );
      await softDeriveChildPubEd25519(STRKEY_PUBLIC, 0).should.be.rejectedWith(/Invalid derivable ed25519 pub/);
    });
  });

  describe('Stellar user-key codecs', function () {
    it('keeps Stellar encoding separate from the neutral root format', function () {
      isValidEd25519StrKeyPublicKey(STRKEY_PUBLIC).should.equal(true);
      encodeEd25519StrKeyPublicKey(decodeEd25519StrKeyPublicKey(STRKEY_PUBLIC)).should.equal(STRKEY_PUBLIC);
      decodeEd25519StrKeySecretSeed(STRKEY_SEED).length.should.equal(32);
      isDerivableEd25519Pub(STRKEY_PUBLIC).should.equal(false);
      isChecksumValidStrKeyEd25519Pub(STRKEY_PUBLIC).should.equal(true);
    });

    it('rejects a public key with a corrupted checksum', function () {
      isValidEd25519StrKeyPublicKey('GA5WUJ54Z23KILLCUOUNAKTPBVZWKMQVO4O6EQ5GHLAERIMLLHNCSKYA').should.equal(false);
    });

    it('rejects a secret seed where a public key is required', function () {
      isValidEd25519StrKeyPublicKey('SA5WUJ54Z23KILLCUOUNAKTPBVZWKMQVO4O6EQ5GHLAERIMLLHNCSKYH').should.equal(false);
      (() => decodeEd25519StrKeyPublicKey('SA5WUJ54Z23KILLCUOUNAKTPBVZWKMQVO4O6EQ5GHLAERIMLLHNCSKYH')).should.throw(
        /StrKey public key/
      );
    });

    it('rejects a non-base32 character, the empty string, and lowercase', function () {
      isValidEd25519StrKeyPublicKey('GA5WUJ54Z23KILLCUOUNAKTPBVZWKMQVO4O6EQ5GHLAERIMLLHNCSKY1').should.equal(false);
      isValidEd25519StrKeyPublicKey('').should.equal(false);
      isValidEd25519StrKeyPublicKey(STRKEY_PUBLIC.toLowerCase()).should.equal(false);
    });
  });
});
