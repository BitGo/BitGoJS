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
  isDerivableEd25519Pub,
  isValidEd25519StrKeyPublicKey,
} from '../../../../src';

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

    it('rejects non-canonical and wrong-length material', function () {
      isDerivableEd25519Pub(ROOT_PUB.toLowerCase()).should.equal(false);
      (() => encodeDerivableEd25519Pub(PUBLIC_KEY.subarray(0, 31), CHAIN_CODE)).should.throw(/32-byte/);
      (() => decodeDerivableEd25519Pub(`${ROOT_PUB}A`)).should.throw(/64 bytes/);
    });

    it('generates raw chain code for root composition', function () {
      generateEd25519ChainCode().length.should.equal(32);
    });
  });

  describe('raw public soft derivation', function () {
    it('derives a deterministic public key and child chain code', async function () {
      const eddsa = await Eddsa.initialize(await Ed25519BIP32.initialize());
      const derived = eddsa.deriveUnhardened(ROOT_KEYCHAIN, 'm/7');
      derived.length.should.equal(128);
      derived.slice(0, 64).should.match(/^[0-9a-f]{64}$/);
      derived.slice(64).should.match(/^[0-9a-f]{64}$/);
    });
  });

  describe('Stellar user-key codecs', function () {
    it('keeps Stellar encoding separate from the neutral root format', function () {
      isValidEd25519StrKeyPublicKey(STRKEY_PUBLIC).should.equal(true);
      encodeEd25519StrKeyPublicKey(decodeEd25519StrKeyPublicKey(STRKEY_PUBLIC)).should.equal(STRKEY_PUBLIC);
      decodeEd25519StrKeySecretSeed(STRKEY_SEED).length.should.equal(32);
      isDerivableEd25519Pub(STRKEY_PUBLIC).should.equal(false);
    });
  });
});
