/**
 * @prettier
 */
import 'should';
import { bip32, BIP32Interface } from '@bitgo/utxo-lib';
import { sanitizeLegacyPath, bitcoin } from '@bitgo/sdk-core';
import { getSeed } from '@bitgo/sdk-test';
const { HDNode, hdPath } = bitcoin;
type Derivable = bitcoin.Derivable;

describe('bip32util', function () {
  const seed = getSeed('bip32test');

  const testKeyBip32Master = bip32.fromSeed(seed);
  const testKeyBip32Child = testKeyBip32Master.derivePath('m/0');

  const testKeyHDPathMaster = HDNode.fromSeedBuffer(seed);
  const testKeyHDPathChild = testKeyHDPathMaster.derivePath('m/0');

  /**
   * Asserts that all inputs convert to the same reference path.
   * Asserts that
   *    refBIP32.derivePath(refPath) === refHDPath.derive(fromLegacyPath(p))
   *
   * @param inputs - array of paths that are equivalent. The first element is the reference path.
   * @param refBIP32 - bip32 node
   * @param refHDPath - `hdPath()` helper node
   */
  function runTest(inputs: string[], refBIP32: BIP32Interface, refHDPath: Derivable) {
    if (!refHDPath) {
      throw new Error(`invalid state`);
    }

    if (inputs.length === 0) {
      throw new Error(`invalid argument`);
    }

    const refPath = inputs[0];

    inputs.forEach((p) => {
      sanitizeLegacyPath(p).should.eql(
        refPath,
        `sanitizeLegacyPath(${p})=${sanitizeLegacyPath(p)}, refPath=${refPath}`
      );
      refBIP32
        .derivePath(refPath)
        .toBase58() //
        .should.eql(refHDPath.derive(p).toBase58());

      refBIP32
        .derivePath(refPath)
        .publicKey.toString('hex')
        .should.eql(refHDPath.deriveKey(p).getPublicKeyBuffer().toString('hex'));
    });
  }

  function runTestDerivePublic(inputs: string[]) {
    runTest(inputs, testKeyBip32Master.neutered(), hdPath(testKeyHDPathMaster.neutered()));
    runTest(inputs, testKeyBip32Child.neutered(), hdPath(testKeyHDPathChild.neutered()));
  }

  function runTestDerivePrivate(inputs: string[]) {
    runTest(inputs, testKeyBip32Master, hdPath(testKeyHDPathMaster));
    runTest(inputs, testKeyBip32Child, hdPath(testKeyHDPathChild));
  }

  it('sanitizeLegacyPath', function () {
    // public derivation is much too tolerant of invalid segments
    runTestDerivePublic(['0', '/0', '////m/0', '0m', 'lol', 'm/0', 'm/m', 'm/lol', '0x10']);
    runTestDerivePublic(['0/0', '/0/0', '0////0', '0/m', '/0/m', '0/0m']);
    runTestDerivePublic(['0/0/0', '/0//0//0', 'm/m/m/m', '/0/0m/0m']);
    runTestDerivePublic(['1', '1lol']);

    // private derivation follows a somewhat different codepath that doesn't attempt to cast
    // every path component to base10
    runTestDerivePrivate(["0'", "m/0'", "//m//0'"]);
    runTestDerivePrivate(["1'", "m/1'", "//m//1'"]);
  });
});
