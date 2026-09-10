import 'should';
import {
  DERIVABLE_ED25519_CHAIN_CODE_LENGTH,
  DERIVABLE_ED25519_PUB_LENGTH,
  DERIVABLE_ED25519_PUB_SPLIT_OFFSET,
  decodeDerivableEd25519Pub,
  decodeEd25519StrKeySecretSeed,
  encodeDerivableEd25519Pub,
  encodeEd25519StrKeyPublicKey,
  isDerivableEd25519Pub,
  isValidEd25519ChainCode,
  isValidEd25519StrKeyPublicKey,
  generateEd25519ChainCodeBase32,
} from '../../../../src';

// Cross-repo fixture: byte-identical to
// packages/wallet-platform/test/unit/base/safes/fixtures/derivableEd25519Pub.json.
// Four independent implementations of this split will otherwise drift, and the failure mode is an
// unrecoverable wallet.
import * as fixture from './fixtures/derivableEd25519Pub.json';

describe('derivableEd25519Pub', function () {
  describe('format constants', function () {
    it('matches the constants pinned in the shared fixture', function () {
      DERIVABLE_ED25519_PUB_SPLIT_OFFSET.should.equal(fixture.splitOffset);
      DERIVABLE_ED25519_CHAIN_CODE_LENGTH.should.equal(fixture.chainCodeLength);
      DERIVABLE_ED25519_PUB_LENGTH.should.equal(fixture.compositeLength);
    });
  });

  describe('encodeDerivableEd25519Pub', function () {
    for (const v of fixture.valid) {
      it(`composes ${v.name}`, function () {
        encodeDerivableEd25519Pub(v.pub, v.chainCode).should.equal(v.composite);
      });
    }

    for (const v of fixture.invalidEncodeInputs) {
      it(`rejects ${v.name}`, function () {
        (() => encodeDerivableEd25519Pub(v.pub, v.chainCode)).should.throw(/Invalid derivable ed25519 pub/);
      });
    }
  });

  describe('decodeDerivableEd25519Pub', function () {
    for (const v of fixture.valid) {
      it(`splits ${v.name}`, function () {
        decodeDerivableEd25519Pub(v.composite).should.eql({ pub: v.pub, chainCode: v.chainCode });
      });
    }

    for (const v of fixture.invalidComposite) {
      it(`rejects ${v.name}`, function () {
        (() => decodeDerivableEd25519Pub(v.composite)).should.throw(/Invalid derivable ed25519 pub/);
        isDerivableEd25519Pub(v.composite).should.equal(false);
      });
    }
  });

  describe('round trip', function () {
    for (const v of fixture.valid) {
      it(`round-trips ${v.name}`, function () {
        const composite = encodeDerivableEd25519Pub(v.pub, v.chainCode);
        const decoded = decodeDerivableEd25519Pub(composite);
        decoded.should.eql({ pub: v.pub, chainCode: v.chainCode });
        encodeDerivableEd25519Pub(decoded.pub, decoded.chainCode).should.equal(composite);
        isDerivableEd25519Pub(composite).should.equal(true);
      });
    }
  });

  describe('isValidEd25519ChainCode', function () {
    const { chainCode } = fixture.valid[3];

    it('accepts 52 canonical base32 characters', function () {
      isValidEd25519ChainCode(chainCode).should.equal(true);
    });

    it('rejects lowercase', function () {
      isValidEd25519ChainCode(chainCode.toLowerCase()).should.equal(false);
    });

    it('rejects a chain code of the wrong length', function () {
      isValidEd25519ChainCode(chainCode.slice(0, 51)).should.equal(false);
      isValidEd25519ChainCode(chainCode + 'A').should.equal(false);
    });

    it('rejects a character outside the base32 alphabet', function () {
      // 0, 1, 8 and 9 are absent from the RFC 4648 alphabet.
      isValidEd25519ChainCode('0' + chainCode.slice(1)).should.equal(false);
    });

    it('rejects a non-canonical spelling whose padding bits are set', function () {
      // The 52nd character holds 1 significant bit and 4 padding bits, so 16 strings decode to the
      // same 32 bytes. Only the zero-padded one is the chain code.
      const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
      const bumped = chainCode.slice(0, 51) + BASE32[BASE32.indexOf(chainCode[51]) + 1];
      bumped.should.not.equal(chainCode);
      isValidEd25519ChainCode(bumped).should.equal(false);
    });

    it('accepts what the generator mints', function () {
      isValidEd25519ChainCode(generateEd25519ChainCodeBase32()).should.equal(true);
    });
  });

  describe('isValidEd25519StrKeyPublicKey', function () {
    for (const v of fixture.valid) {
      it(`accepts the pub half of ${v.name}`, function () {
        isValidEd25519StrKeyPublicKey(v.pub).should.equal(true);
      });
    }

    it('rejects a bad checksum', function () {
      // last character of a known-good pub flipped
      isValidEd25519StrKeyPublicKey('GA5WUJ54Z23KILLCUOUNAKTPBVZWKMQVO4O6EQ5GHLAERIMLLHNCSKYA').should.equal(false);
    });

    it('rejects a secret seed', function () {
      isValidEd25519StrKeyPublicKey('SA5WUJ54Z23KILLCUOUNAKTPBVZWKMQVO4O6EQ5GHLAERIMLLHNCSKYH').should.equal(false);
    });

    it('rejects a non-base32 character', function () {
      isValidEd25519StrKeyPublicKey('GA5WUJ54Z23KILLCUOUNAKTPBVZWKMQVO4O6EQ5GHLAERIMLLHNCSKY1').should.equal(false);
    });

    it('rejects the empty string and a composite pub', function () {
      isValidEd25519StrKeyPublicKey('').should.equal(false);
      isValidEd25519StrKeyPublicKey(fixture.valid[3].composite).should.equal(false);
    });
  });

  // Fixtures generated with stellar-sdk (Keypair.fromRawEd25519Seed) over a synthetic 32-byte seed;
  // the derivation itself is pinned in test/unit/bitgo/safe/safeDerivation.ts against published
  // SLIP-0010 vectors.
  const SEED_HEX = '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f';
  const SEED_STRKEY = 'SAAACAQDAQCQMBYIBEFAWDANBYHRAEISCMKBKFQXDAMRUGY4DUPB6NKI';

  describe('decodeEd25519StrKeySecretSeed', function () {
    it('decodes a valid secret seed to its 32 raw bytes', function () {
      decodeEd25519StrKeySecretSeed(SEED_STRKEY).toString('hex').should.equal(SEED_HEX);
    });

    it('rejects a public key', function () {
      (() => decodeEd25519StrKeySecretSeed(fixture.valid[0].pub)).should.throw(/Invalid ed25519 StrKey secret seed/);
    });

    it('rejects a bad checksum', function () {
      // last character of a known-good seed flipped (56 chars carry 280 bits with no padding)
      const corrupted = SEED_STRKEY.slice(0, 55) + (SEED_STRKEY[55] === 'I' ? 'J' : 'I');
      corrupted.should.not.equal(SEED_STRKEY);
      (() => decodeEd25519StrKeySecretSeed(corrupted)).should.throw(/checksum mismatch/);
    });

    it('rejects a wrong length', function () {
      (() => decodeEd25519StrKeySecretSeed(SEED_STRKEY.slice(1))).should.throw(/Invalid ed25519 StrKey secret seed/);
      (() => decodeEd25519StrKeySecretSeed(SEED_STRKEY + 'A')).should.throw(/Invalid ed25519 StrKey secret seed/);
    });

    it('rejects a non-base32 character', function () {
      // 0, 1, 8 and 9 are absent from the RFC 4648 alphabet.
      (() => decodeEd25519StrKeySecretSeed('S' + '0' + SEED_STRKEY.slice(2))).should.throw(
        /Invalid ed25519 StrKey secret seed/
      );
    });

    it('rejects the empty string', function () {
      (() => decodeEd25519StrKeySecretSeed('')).should.throw(/Invalid ed25519 StrKey secret seed/);
    });
  });

  describe('encodeEd25519StrKeyPublicKey', function () {
    // Raw public key of the m/0' derivation vector pinned in
    // test/unit/bitgo/safe/safeDerivation.ts; the StrKey encoding was generated by stellar-sdk.
    const PUB_HEX = 'a798f3c57940cc37fbe4a01e344d0a39c670726b3b14bc435b980715e4a56977';
    const PUB_STRKEY = 'GCTZR46FPFAMYN734SQB4NCNBI44M4DSNM5RJPCDLOMAOFPEUVUXPK7R';

    it('encodes 32 raw bytes to the expected StrKey public key', function () {
      encodeEd25519StrKeyPublicKey(Buffer.from(PUB_HEX, 'hex')).should.equal(PUB_STRKEY);
      isValidEd25519StrKeyPublicKey(PUB_STRKEY).should.equal(true);
    });

    it('round-trips against the composite decoder', function () {
      // The pub half of a composite splits back to the exact string the encoder emitted.
      const pub = encodeEd25519StrKeyPublicKey(Buffer.from(PUB_HEX, 'hex'));
      const { pub: pubHalf } = decodeDerivableEd25519Pub(`${pub}${fixture.valid[0].chainCode}`);
      pubHalf.should.equal(pub);
    });

    it('rejects a wrong payload length', function () {
      (() => encodeEd25519StrKeyPublicKey(Buffer.alloc(31))).should.throw(/must be 32 bytes/);
      (() => encodeEd25519StrKeyPublicKey(Buffer.alloc(33))).should.throw(/must be 32 bytes/);
      (() => encodeEd25519StrKeyPublicKey(Buffer.alloc(0))).should.throw(/must be 32 bytes/);
    });
  });
});
