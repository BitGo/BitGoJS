import * as assert from 'assert';
import * as bitcoin from '@bitgo/utxo-lib';
import { bip32, BIP32Interface } from '@bitgo/utxo-lib';
import {
  getInputWeight,
  getInputComponentsWeight,
  InputComponents,
  inputComponentsP2sh,
  inputComponentsP2shP2pk,
  inputComponentsP2shP2wsh,
  inputComponentsP2wsh,
  inputComponentsP2trScriptSpendLevel1,
  inputComponentsP2trScriptSpendLevel2,
} from '../../src/inputWeights';
import { pushdataEncodingLength } from '../../src/scriptSizes';
import { UnspentTypeP2shP2pk, UnspentTypeScript2of3 } from '../testutils';
import { TxCombo } from './txGen';

describe('Input Script Sizes (Worst-Case)', function () {
  const keys = [1, 2, 3].map((v) => bip32.fromSeed(Buffer.alloc(16, `test/${v}`)));

  function getLargestInputWithType(inputType: string, signKeys: BIP32Interface[], inputCount = 100): bitcoin.TxInput {
    return new TxCombo(
      keys,
      Array.from({ length: inputCount }).fill(inputType) as string[],
      [UnspentTypeScript2of3.p2sh],
      undefined,
      signKeys
    )
      .getSignedTx()
      .ins.reduce((a, b) => (getInputWeight(a) > getInputWeight(b) ? a : b));
  }

  function getInputComponents(input: bitcoin.TxInput): InputComponents {
    const decompiled = bitcoin.script.decompile(input.script);
    if (!decompiled) {
      throw new Error();
    }

    const script = decompiled.map((v) => {
      if (!Buffer.isBuffer(v)) {
        return { length: 1 };
      }
      return { length: v.length + pushdataEncodingLength(v.length) };
    });
    const witness = (input.witness || []).map((v) => ({ length: v.length }));

    const scriptSize = script.reduce((a, b) => a + b.length, 0);
    assert.strictEqual(scriptSize, input.script.length, bitcoin.script.toASM(decompiled));

    return {
      script: script.map((v) => v.length),
      witness: witness.map((v) => v.length),
    };
  }

  function runTestComponentSizes(inputType: string, signKeys: BIP32Interface[]) {
    const signKeysStr = signKeys.map((k) => ['user', 'backup', 'bitgo'][keys.indexOf(k)]).join(',');

    describe(`inputType=${inputType} signKeys=${signKeysStr}`, function () {
      it(`component sizes`, function () {
        this.timeout(10_000);
        let expectedComponents;
        switch (inputType) {
          case 'p2sh':
            expectedComponents = inputComponentsP2sh;
            break;
          case 'p2shP2wsh':
            expectedComponents = inputComponentsP2shP2wsh;
            break;
          case 'p2wsh':
            expectedComponents = inputComponentsP2wsh;
            break;
          case 'p2shP2pk':
            expectedComponents = inputComponentsP2shP2pk;
            break;
          case 'p2tr':
            if (signKeys[1] === keys[2]) {
              expectedComponents = inputComponentsP2trScriptSpendLevel1;
            } else if (signKeys[1] === keys[1]) {
              expectedComponents = inputComponentsP2trScriptSpendLevel2;
            } else {
              throw new Error(`unexpected cosigner`);
            }
            break;
          default:
            throw new Error(`invalid inputType ${inputType}`);
        }

        const input = getLargestInputWithType(inputType, signKeys, inputType === 'p2tr' ? 10 : 100);
        const components = getInputComponents(input);
        assert.deepStrictEqual(components, expectedComponents);
        assert.strictEqual(getInputComponentsWeight(components), getInputWeight(input));
      });
    });
  }

  [...Object.keys(UnspentTypeScript2of3), UnspentTypeP2shP2pk].forEach((inputType: string) => {
    runTestComponentSizes(inputType, inputType === 'p2shP2pk' ? [keys[0]] : [keys[0], keys[2]]);
    if (inputType !== 'p2shP2pk') {
      runTestComponentSizes(inputType, [keys[0], keys[1]]);
    }
  });
});
