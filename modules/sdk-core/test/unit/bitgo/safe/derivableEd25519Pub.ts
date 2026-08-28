import * as assert from 'assert';
import {
  decodeDerivableEd25519Pub,
  encodeDerivableEd25519Pub,
} from '../../../../src/bitgo/safe/derivableEd25519Pub';
import vectors from '../../../resources/derivableEd25519Pub.json';

describe('derivable ed25519 public key', function () {
  for (const vector of vectors) {
    it('round-trips the shared fixture', function () {
      const composite = encodeDerivableEd25519Pub(vector.pub, vector.chainCode);
      assert.strictEqual(composite, vector.compositePub);
      assert.deepStrictEqual(decodeDerivableEd25519Pub(composite), {
        pub: vector.pub,
        chainCode: vector.chainCode,
      });
    });
  }

  it('rejects malformed composite public keys', function () {
    const valid = vectors[0].compositePub;
    for (const value of [
      vectors[0].pub,
      '',
      valid.slice(0, -1),
      valid.slice(0, 56) + 'g'.repeat(64),
      valid.slice(0, 56) + 'A'.repeat(64),
      'X' + valid.slice(1),
    ]) {
      assert.throws(() => decodeDerivableEd25519Pub(value));
    }
  });

  it('rejects malformed input halves', function () {
    const { pub, chainCode } = vectors[0];
    assert.throws(() => encodeDerivableEd25519Pub(pub.slice(0, -1), chainCode));
    assert.throws(() => encodeDerivableEd25519Pub(pub, chainCode.slice(0, -1)));
    assert.throws(() => encodeDerivableEd25519Pub(pub, chainCode.toUpperCase()));
  });
});
