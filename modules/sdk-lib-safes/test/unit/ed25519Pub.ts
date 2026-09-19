import 'should';
import {
  DERIVABLE_ED25519_CHAIN_CODE_BYTES,
  DERIVABLE_ED25519_PUB_LENGTH,
  decodeDerivableEd25519Pub,
  decodeEd25519StrKeyPublicKey,
  decodeEd25519StrKeySecretSeed,
  encodeDerivableEd25519Pub,
  encodeEd25519StrKeyPublicKey,
  generateEd25519ChainCode,
  isChecksumValidStrKeyEd25519Pub,
  isDerivableEd25519Pub,
  isValidEd25519StrKeyPublicKey,
} from '../../src';

const PUBLIC_KEY = Buffer.alloc(32);
const CHAIN_CODE = Buffer.alloc(32, 0xab);
const ROOT_PUB = encodeDerivableEd25519Pub(PUBLIC_KEY, CHAIN_CODE);
const STRKEY_PUBLIC = 'GA5WUJ54Z23KILLCUOUNAKTPBVZWKMQVO4O6EQ5GHLAERIMLLHNCSKYH';
const STRKEY_SEED = 'SAAACAQDAQCQMBYIBEFAWDANBYHRAEISCMKBKFQXDAMRUGY4DUPB6NKI';

describe('ed25519Pub', function () {
  describe('base32 root format', function () {
    it('encodes 32-byte public key plus 32-byte chain code', function () {
      DERIVABLE_ED25519_CHAIN_CODE_BYTES.should.equal(32);
      DERIVABLE_ED25519_PUB_LENGTH.should.equal(103);
      ROOT_PUB.should.match(/^[A-Z2-7]{103}$/);
      decodeDerivableEd25519Pub(ROOT_PUB).pub.equals(PUBLIC_KEY).should.equal(true);
      decodeDerivableEd25519Pub(ROOT_PUB).chainCode.equals(CHAIN_CODE).should.equal(true);
    });

    it('generates raw chain code for root composition', function () {
      generateEd25519ChainCode().length.should.equal(32);
    });

    it('rejects malformed composite values', function () {
      isDerivableEd25519Pub('not-a-root').should.equal(false);
      (() => decodeDerivableEd25519Pub('not-a-root')).should.throw(/Invalid derivable ed25519 pub/);
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
