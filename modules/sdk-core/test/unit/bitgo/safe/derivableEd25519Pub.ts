import 'should';
import {
  DERIVABLE_ED25519_CHAIN_CODE_LENGTH,
  DERIVABLE_ED25519_PUB_LENGTH,
  DERIVABLE_ED25519_PUB_SPLIT_OFFSET,
  decodeDerivableEd25519Pub,
  encodeDerivableEd25519Pub,
  isDerivableEd25519Pub,
  isValidEd25519ChainCode,
  isValidEd25519StrKeyPublicKey,
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

    it('accepts 64 lowercase hex characters', function () {
      isValidEd25519ChainCode(chainCode).should.equal(true);
    });

    it('rejects uppercase hex', function () {
      isValidEd25519ChainCode(chainCode.toUpperCase()).should.equal(false);
    });

    it('rejects a chain code of the wrong length', function () {
      isValidEd25519ChainCode(chainCode.slice(0, 63)).should.equal(false);
      isValidEd25519ChainCode(chainCode + '0').should.equal(false);
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
});
