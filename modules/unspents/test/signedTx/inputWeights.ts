import * as assert from 'assert';

import * as mocha from 'mocha';
import * as utxolib from '@bitgo/utxo-lib';
import { bip32, BIP32Interface } from '@bitgo/utxo-lib';
import {
  getInputComponentsWeight,
  getInputWeight,
  InputComponents,
  inputComponentsP2sh,
  inputComponentsP2shP2pk,
  inputComponentsP2shP2wsh,
  inputComponentsP2trKeySpend,
  inputComponentsP2trScriptSpendLevel1,
  inputComponentsP2trScriptSpendLevel2,
  inputComponentsP2wsh,
} from '../../src/inputWeights';
import { pushdataEncodingLength } from '../../src/scriptSizes';
import {
  getInputScriptTypes,
  getSignedTransaction,
  InputScriptType,
  TestUnspentType,
  UnspentTypeScript2of3,
} from '../testutils';

describe('Input Script Sizes (Worst-Case)', function () {
  const keys = [1, 2, 3].map((v) => bip32.fromSeed(Buffer.alloc(16, `test/${v}`))) as BIP32Interface[];
  const rootWalletKeys = new utxolib.bitgo.RootWalletKeys([keys[0], keys[1], keys[2]]);

  function getLargestInputWithType(
    inputType: string,
    signKeys: utxolib.bitgo.KeyName[],
    inputCount = 100
  ): utxolib.TxInput {
    const signerName = signKeys[0];
    const cosignerName = signKeys.length > 1 ? signKeys[1] : signerName;
    const inputScriptTypes = Array.from({ length: inputCount }).fill(inputType) as InputScriptType[];
    const outputScriptTypes = [UnspentTypeScript2of3.p2sh] as TestUnspentType[];
    return getSignedTransaction(
      rootWalletKeys,
      signerName,
      cosignerName,
      inputScriptTypes,
      outputScriptTypes
    ).ins.reduce((a, b) => (getInputWeight(a) > getInputWeight(b) ? a : b));
  }

  function getInputComponents(input: utxolib.TxInput): InputComponents {
    const decompiled = utxolib.script.decompile(input.script);
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
    assert.strictEqual(scriptSize, input.script.length, utxolib.script.toASM(decompiled));

    return {
      script: script.map((v) => v.length),
      witness: witness.map((v) => v.length),
    };
  }

  function runTestComponentSizes(inputType: string, signKeys: utxolib.bitgo.KeyName[]) {
    const signKeysStr = signKeys.join(',');

    describe(`inputType=${inputType} signKeys=${signKeysStr}`, function () {
      it(`component sizes`, function (this: mocha.Context) {
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
            if (signKeys[1] === 'bitgo') {
              expectedComponents = inputComponentsP2trScriptSpendLevel1;
            } else if (signKeys[1] === 'backup') {
              expectedComponents = inputComponentsP2trScriptSpendLevel2;
            } else {
              throw new Error(`unexpected cosigner`);
            }
            break;
          case 'p2trMusig2':
            // assumes only script path
            expectedComponents = inputComponentsP2trScriptSpendLevel1;
            break;
          case 'taprootKeyPathSpend':
            expectedComponents = inputComponentsP2trKeySpend;
            break;
          default:
            throw new Error(`invalid inputType ${inputType}`);
        }

        const input = getLargestInputWithType(
          inputType,
          signKeys,
          inputType === 'p2tr' || inputType === 'p2trMusig2' || inputType === 'taprootKeyPathSpend' ? 10 : 100
        );
        const components = getInputComponents(input);
        assert.deepStrictEqual(components, expectedComponents);
        assert.strictEqual(getInputComponentsWeight(components), getInputWeight(input));
      });
    });
  }

  getInputScriptTypes().forEach((inputType: string) => {
    if (inputType !== 'p2trMusig2') {
      runTestComponentSizes(inputType, inputType === 'p2shP2pk' ? ['user'] : ['user', 'bitgo']);
    }
    if (inputType !== 'p2shP2pk' && inputType !== 'taprootKeyPathSpend') {
      runTestComponentSizes(inputType, ['user', 'backup']);
    }
  });
});
