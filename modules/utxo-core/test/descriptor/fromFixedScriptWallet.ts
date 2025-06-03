import * as assert from 'node:assert/strict';

import * as utxolib from '@bitgo/utxo-lib';
import { Descriptor } from '@bitgo/wasm-miniscript';

import {
  getDescriptorForScriptType,
  getNamedDescriptorsForRootWalletKeys,
} from '../../src/descriptor/fromFixedScriptWallet';

function getRootWalletKeys(derivationPrefixes?: utxolib.bitgo.Triple<string>): utxolib.bitgo.RootWalletKeys {
  // This is a fixed script wallet, so we use a fixed key triple.
  // In practice, this would be derived from the wallet's root keys.
  return new utxolib.bitgo.RootWalletKeys(utxolib.testutil.getKeyTriple('fixedScript'), derivationPrefixes);
}

const customPrefixes: (utxolib.bitgo.Triple<string> | undefined)[] = [
  undefined,
  ['1/2', '1/2', '1/2'], // Custom prefixes for testing
  ['1/2', '3/4', '5/6'], // Different custom prefixes
];
const scriptTypes = ['p2sh', 'p2shP2wsh', 'p2wsh'] as const;
const scope = ['external', 'internal'] as const;
const index = [0, 1, 2];

/** Get the expected max weight to satisfy the descriptor */
function getExpectedMaxWeightToSatisfy(scriptType: utxolib.bitgo.outputScripts.ScriptType2Of3) {
  switch (scriptType) {
    case 'p2sh':
      return 256;
    case 'p2shP2wsh':
      return 99;
    case 'p2wsh':
      return 64;
    default:
      throw new Error('unexpected script type');
  }
}

/** Compute the total size of the input, including overhead */
function getTotalInputSize(vSize: number) {
  const sizeOpPushData1 = 1;
  const sizeOpPushData2 = 2;
  return 32 /* txid */ + 4 /* vout */ + 4 /* nSequence */ + (vSize < 255 ? sizeOpPushData1 : sizeOpPushData2) + vSize;
}

/** Get the full expected vSize of the input including overhead */
function getExpectedVSize(scriptType: utxolib.bitgo.outputScripts.ScriptType2Of3) {
  // https://github.com/BitGo/BitGoJS/blob/master/modules/unspents/docs/input-costs.md
  switch (scriptType) {
    case 'p2sh':
      return 298;
    case 'p2shP2wsh':
      return 140;
    case 'p2wsh':
      return 105;
    default:
      throw new Error('unexpected script type');
  }
}

function runTestGetDescriptorWithScriptType(
  customPrefix: utxolib.bitgo.Triple<string> | undefined,
  scriptType: 'p2sh' | 'p2shP2wsh' | 'p2wsh',
  index: number,
  scope: 'internal' | 'external'
) {
  describe(`customPrefix=${customPrefix}, scriptType=${scriptType}, index=${index}, scope=${scope}`, function () {
    const rootWalletKeys = getRootWalletKeys(customPrefix);
    const chainCode =
      scope === 'external'
        ? utxolib.bitgo.getExternalChainCode(scriptType)
        : utxolib.bitgo.getInternalChainCode(scriptType);
    const derivedKeys = rootWalletKeys.deriveForChainAndIndex(chainCode, index);
    const scriptUtxolib = utxolib.bitgo.outputScripts.createOutputScript2of3(
      derivedKeys.publicKeys,
      scriptType
    ).scriptPubKey;

    let descriptor: Descriptor;

    before(function () {
      descriptor = getDescriptorForScriptType(rootWalletKeys, scriptType, scope);
    });

    it('address should match descriptor', function () {
      const scriptFromDescriptor = Buffer.from(descriptor.atDerivationIndex(index).scriptPubkey());
      assert.deepStrictEqual(scriptUtxolib.toString('hex'), scriptFromDescriptor.toString('hex'));
    });

    it('should have expected weights', function () {
      assert.ok(Number.isInteger(descriptor.maxWeightToSatisfy()));
      const vSize = Math.ceil(descriptor.maxWeightToSatisfy() / 4);
      assert.equal(vSize, getExpectedMaxWeightToSatisfy(scriptType));
      assert.equal(getTotalInputSize(vSize), getExpectedVSize(scriptType));
    });
  });
}

function runTestGetDescriptorMap(customPrefix: utxolib.bitgo.Triple<string> | undefined) {
  describe(`getNamedDescriptorsForRootWalletKeys with customPrefix=${customPrefix}`, function () {
    const rootWalletKeys = getRootWalletKeys(customPrefix);
    const descriptorMap = getNamedDescriptorsForRootWalletKeys(rootWalletKeys);

    it('should return a map with the correct number of entries', function () {
      assert.equal(descriptorMap.size, scriptTypes.length * scope.length);
    });

    scriptTypes.forEach((scriptType) => {
      scope.forEach((s) => {
        const key = `${scriptType}/${s}`;
        it(`should have a correct descriptor for ${key}`, function () {
          const descriptorFromMap = descriptorMap.get(key);
          assert.ok(descriptorFromMap, `Descriptor for ${key} should exist`);
          const expectedDescriptor = getDescriptorForScriptType(rootWalletKeys, scriptType, s);
          assert.equal(descriptorFromMap.toString(), expectedDescriptor.toString());
        });
      });
    });
  });
}

customPrefixes.forEach((customPrefix) => {
  scriptTypes.forEach((scriptType) => {
    index.forEach((index) => {
      scope.forEach((scope) => {
        runTestGetDescriptorWithScriptType(customPrefix, scriptType, index, scope);
      });
    });
  });

  runTestGetDescriptorMap(customPrefix);
});
