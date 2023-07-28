import { toUncompressedPub, toCompressedPub, createLegacySafeOutputScript2of3 } from '../../../src/bitgo/legacysafe';
import { getKey, getKeyTriple } from '../../../src/testutil';
import * as assert from 'assert';
import { networks } from '../../../src';
import { fromOutputScript } from '../../../src/address';

describe('public key conversion', function () {
  const compressedKeyPair = getKey('utxo');
  const uncompressedPublicKeyHex =
    '048b9c36721d4c9d9c46c796039ccab17cb89df246ff991720fb119990cbc049969445c874ae1272aa0d3f94087cd2f210c90036aff09d3bc521b01098f7cce3b5';

  it('converts compressed to uncompressed', function () {
    const uncompressedPub = toUncompressedPub(compressedKeyPair.publicKey);
    assert.strictEqual(uncompressedPub.length, 65);
    assert.strictEqual(uncompressedPub.toString('hex'), uncompressedPublicKeyHex);
  });

  it('keeps compressed as compressed', function () {
    const compressedPub = toCompressedPub(compressedKeyPair.publicKey);
    assert.strictEqual(compressedPub.length, 33);
    assert.strictEqual(compressedPub.toString('hex'), compressedKeyPair.publicKey.toString('hex'));
  });

  it('converts uncompressed to compressed', function () {
    const uncompressedPub = toUncompressedPub(compressedKeyPair.publicKey);
    const compressedPub = toCompressedPub(uncompressedPub);
    assert.strictEqual(compressedPub.length, 33);
    assert.strictEqual(compressedPub.toString('hex'), compressedKeyPair.publicKey.toString('hex'));
  });
});

describe('legacy safe scripts creation', function () {
  const compressedKeyPairs = getKeyTriple('utxo');
  const compressedPubKeys = compressedKeyPairs.map((keyPair) => keyPair.publicKey);

  it('throws error for compressed public keys', function () {
    assert.throws(
      () => createLegacySafeOutputScript2of3(compressedPubKeys, networks.bitcoin),
      /^Error: Unexpected key length 33. Must use uncompressed keys.$/
    );
  });

  it('creates output script for legacy safe wallet', function () {
    const uncompressedKeyPairs = compressedKeyPairs.map((keyPair) => toUncompressedPub(keyPair.publicKey));
    const uncompressedPubKeysAddress = '3B8ySJRmah2bSFin39kkTz7Fe8soVJx9Vf';
    const uncompressedPubKeysScriptSize = 201; // bytes;

    const script = createLegacySafeOutputScript2of3(uncompressedKeyPairs, networks.bitcoin);

    assert.strictEqual(script.redeemScript.length, uncompressedPubKeysScriptSize); // bytes
    assert.strictEqual(script.scriptPubKey.length, 23); // bytes;
    assert.strictEqual(fromOutputScript(script.scriptPubKey, networks.bitcoin), uncompressedPubKeysAddress);
  });
});
