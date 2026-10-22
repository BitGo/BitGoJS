import 'should';
import {
  DERIVABLE_ED25519_CHAIN_CODE_BYTES,
  DERIVABLE_ED25519_PUB_LENGTH,
  algoMultisigAddress,
  decodeDerivableEd25519Pub,
  decodeEd25519ChainCode,
  decodeEd25519StrKeyPublicKey,
  decodeEd25519StrKeySecretSeed,
  encodeAlgoKey,
  encodeDerivableEd25519Pub,
  encodeEd25519ChainCode,
  encodeEd25519StrKeyPublicKey,
  encodeEd25519StrKeySecretSeed,
  encodeHbarPrivateKeyDer,
  encodeHbarPublicKeyDer,
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

    it('encodes a 32-byte chain code as 52-char base32 and rejects wrong lengths', function () {
      encodeEd25519ChainCode(CHAIN_CODE).should.match(/^[A-Z2-7]{52}$/);
      (() => encodeEd25519ChainCode(Buffer.alloc(31))).should.throw(/expected 32 bytes/);
    });

    it('decodes a canonical 52-char chain code and rejects non-canonical trailing bits', function () {
      decodeEd25519ChainCode(encodeEd25519ChainCode(CHAIN_CODE)).equals(CHAIN_CODE).should.equal(true);
      // same 32 bytes, different spelling of the 4 padding bits in the final char
      (() => decodeEd25519ChainCode('VOV2XK5LVOV2XK5LVOV2XK5LVOV2XK5LVOV2XK5LVOV2XK5LVOVR')).should.throw(
        /Invalid ed25519 chain code/
      );
      (() => decodeEd25519ChainCode('AA')).should.throw(/Invalid ed25519 chain code/);
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

    it('encodes a 32-byte seed as an S… StrKey and round-trips the fixture', function () {
      encodeEd25519StrKeySecretSeed(decodeEd25519StrKeySecretSeed(STRKEY_SEED)).should.equal(STRKEY_SEED);
      (() => encodeEd25519StrKeySecretSeed(Buffer.alloc(31))).should.throw(/32 bytes/);
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

  describe('coin child encodings', function () {
    // Golden vectors generated with the reference implementations (js-sha512 + hi-base32),
    // pinned here to prove the leaf's base32Encode + Node sha512-256 reproduce them byte-for-byte.
    const SEED = Buffer.alloc(32, 0x01);
    const PUB = Buffer.alloc(32, 0x02);
    const ALGO_SEED = 'AEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEA5RCDXMI';
    const ALGO_ADDRESS = 'AIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBMXPWWNQ';

    it('encodes Algorand seed and address as 58-char base32 with a sha512-256 checksum', function () {
      encodeAlgoKey(SEED).should.equal(ALGO_SEED);
      encodeAlgoKey(SEED).should.match(/^[A-Z2-7]{58}$/);
      encodeAlgoKey(PUB).should.equal(ALGO_ADDRESS);
      (() => encodeAlgoKey(Buffer.alloc(31))).should.throw(/32 bytes/);
    });

    it('computes Algorand multisig addresses matching algosdk golden vectors', function () {
      // Generated with algosdk.multisigAddress({ version: 1, threshold: 2, addrs: [encodeAddress(pk)...] })
      // so the leaf's pure preimage hash reproduces algosdk byte-for-byte.
      const p1 = Buffer.alloc(32, 0x01);
      const p2 = Buffer.alloc(32, 0x02);
      const p3 = Buffer.alloc(32, 0x03);
      algoMultisigAddress(1, 2, [p1, p2, p3]).should.equal(
        'KA6JJOIDCRLCG7TGB76BKSABV5FF43J6BOJ6ONIBLZ45KMP44NYT7AGRDI'
      );
      algoMultisigAddress(1, 2, [p1, p2]).should.equal('AUFVSAUUDXNCKKFQCIFOEMGUEKRXXKT7WMOMGWLK6KUTXNNWBXJ7CKHRUE');
      algoMultisigAddress(1, 2, [p1, p2, p3]).should.match(/^[A-Z2-7]{58}$/);
    });

    it('multisig addresses are order-sensitive and fail closed on bad params', function () {
      const p1 = Buffer.alloc(32, 0x01);
      const p2 = Buffer.alloc(32, 0x02);
      const p3 = Buffer.alloc(32, 0x03);
      algoMultisigAddress(1, 2, [p1, p3, p2]).should.not.equal(algoMultisigAddress(1, 2, [p1, p2, p3]));
      (() => algoMultisigAddress(2, 2, [p1, p2, p3])).should.throw(/multisig version/);
      (() => algoMultisigAddress(1, 0, [p1, p2, p3])).should.throw(/multisig threshold/);
      (() => algoMultisigAddress(1, 4, [p1, p2, p3])).should.throw(/multisig threshold/);
      (() => algoMultisigAddress(1, 2, [Buffer.alloc(31), p2, p3])).should.throw(/32 bytes/);
    });

    it('encodes Hedera public/private keys as DER-prefixed hex', function () {
      encodeHbarPublicKeyDer(PUB).should.equal('302a300506032b6570032100' + PUB.toString('hex'));
      encodeHbarPublicKeyDer(PUB).should.match(/^[0-9a-f]{88}$/);
      encodeHbarPrivateKeyDer(SEED).should.equal('302e020100300506032b657004220420' + SEED.toString('hex'));
      encodeHbarPrivateKeyDer(SEED).should.match(/^[0-9a-f]{96}$/);
      (() => encodeHbarPublicKeyDer(Buffer.alloc(31))).should.throw(/32 bytes/);
    });
  });
});
