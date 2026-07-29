import { toUncompressedPub, toCompressedPub, createLegacySafeOutputScript2of3 } from '../../../src/bitgo/legacysafe';
import { getKey, getKeyTriple, getUncompressedKeyTriple } from '../../../src/testutil';
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

  it('throws error for invalid public keys', function () {
    assert.throws(
      () => createLegacySafeOutputScript2of3([Buffer.alloc(10), Buffer.alloc(11), Buffer.alloc(12)], networks.bitcoin),
      /^Error: Unexpected key length 10, neither compressed nor uncompressed.$/
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

  it('creates deterministic uncompressed public keys and address for v1 safe wallet', function () {
    const uncompressedKeyPairs = getUncompressedKeyTriple([12414, 546456, 65856546]);
    const uncompressedPubKeys = uncompressedKeyPairs.map((keyPair) => keyPair.publicKey);
    const outputScript = createLegacySafeOutputScript2of3(uncompressedPubKeys, networks.testnet);

    assert.strictEqual(outputScript.scriptPubKey.length, 23);
    assert.strictEqual(outputScript.redeemScript.length, 201);
    assert.strictEqual(outputScript.scriptPubKey.toString('hex'), 'a9146e9fb0db60f4fc5974885c392815b58e6505a30d87');
    assert.strictEqual(
      outputScript.redeemScript.toString('hex'),
      '524104b9aea0bf6be18d3ed48d1cc3495e9af5e499ad90a84930990ba58b198ee81b5e83f6aa2f617c04401616e844f51802c0f1d827422efc1f3856dc222dd8beed16410435e9d7c48e3a5254d5881b60abf004cf6eedc6ab842393caa2fdd20d6d0ad170cc32c4664603de3e9b9d1fd01b070d192fad570fcbb3b185c034ec5a4a0b1fb44104466d7fcae563e5cb09a0d1870bb580344804617879a14949cf22285f1bae3f276728176c3c6431f8eeda4538dc37c865e2784f3a9e77d044f33e407797e1278a53ae'
    );

    const addressTestnet = fromOutputScript(outputScript.scriptPubKey, networks.testnet);
    assert.strictEqual(addressTestnet, '2N3L9cu9WN2Df7Xvb1Y8owokuDVj5Hdyv4i');
  });
});
