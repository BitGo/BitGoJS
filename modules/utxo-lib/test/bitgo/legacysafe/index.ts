import { convertToUncompressedPub, convertToCompressedPub } from '../../../src/bitgo/legacysafe';
import { getKey } from '../../../src/testutil';
import * as assert from 'assert';

describe('pub key conversion', function () {
  const compressedKeyPair = getKey('utxo');
  const uncompressedPublicKeyHex =
    '048b9c36721d4c9d9c46c796039ccab17cb89df246ff991720fb119990cbc049969445c874ae1272aa0d3f94087cd2f210c90036aff09d3bc521b01098f7cce3b5';

  it('converts compressed to uncompressed', function () {
    const uncompressedPub = convertToUncompressedPub(compressedKeyPair.publicKey);
    assert.strictEqual(uncompressedPub.length, 65);
    assert.strictEqual(uncompressedPub.toString('hex'), uncompressedPublicKeyHex);
  });

  it('keeps compressed as compressed', function () {
    const compressedPub = convertToCompressedPub(compressedKeyPair.publicKey);
    assert.strictEqual(compressedPub.length, 33);
    assert.strictEqual(compressedPub.toString('hex'), compressedKeyPair.publicKey.toString('hex'));
  });

  it('converts uncompressed to compressed', function () {
    const uncompressedPub = convertToUncompressedPub(compressedKeyPair.publicKey);
    const compressedPub = convertToCompressedPub(uncompressedPub);
    assert.strictEqual(compressedPub.length, 33);
    assert.strictEqual(compressedPub.toString('hex'), compressedKeyPair.publicKey.toString('hex'));
  });
});
