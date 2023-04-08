import * as assert from 'assert';
import * as utxolib from '@bitgo/utxo-lib';
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
  inputComponentsP2trKeySpend,
} from '../../src/inputWeights';
import { pushdataEncodingLength } from '../../src/scriptSizes';
import { UnspentTypeScript2of3 } from '../testutils';
import { createScriptPubKey } from './txGen';
import { Triple } from '@bitgo/sdk-core';

type InputScriptType = utxolib.bitgo.outputScripts.ScriptType | 'taprootKeyPathSpend';
type OutputScriptType = utxolib.bitgo.outputScripts.ScriptType;

function getInputScriptTypes(): InputScriptType[] {
  // return ['p2shP2pk'];
  return [...utxolib.bitgo.outputScripts.scriptTypes2Of3, 'p2shP2pk', 'taprootKeyPathSpend'];
}

function getSignedTransaction(
  keys: utxolib.bitgo.RootWalletKeys,
  signerName: utxolib.bitgo.KeyName,
  cosignerName: utxolib.bitgo.KeyName,
  inputTypes: InputScriptType[],
  outputTypes: OutputScriptType[]
): utxolib.bitgo.UtxoTransaction {
  const psbt = utxolib.bitgo.createPsbtForNetwork({ network: utxolib.networks.bitcoin });

  const signer = keys[signerName];
  const cosigner = keys[cosignerName];

  inputTypes.forEach((t, i) => {
    if (t === 'p2shP2pk') {
      const unspent = utxolib.testutil.mockReplayProtectionUnspent(utxolib.networks.bitcoin, BigInt(10), {
        key: signer,
        vout: i,
      });
      const { redeemScript } = utxolib.bitgo.outputScripts.createOutputScriptP2shP2pk(signer.publicKey);
      assert.ok(redeemScript);
      utxolib.bitgo.addReplayProtectionUnspentToPsbt(psbt, unspent, redeemScript);
    } else {
      const unspent = utxolib.testutil.mockWalletUnspent(utxolib.networks.bitcoin, BigInt(10), {
        keys,
        chain: utxolib.bitgo.getExternalChainCode(t === 'taprootKeyPathSpend' ? 'p2trMusig2' : t),
        vout: i,
        index: i,
      });
      utxolib.bitgo.addWalletUnspentToPsbt(psbt, unspent, keys, signerName, cosignerName);
    }
  });

  outputTypes.forEach((t, index) => {
    psbt.addOutput({
      script: createScriptPubKey(keys.triple, t),
      value: BigInt(10),
    });
  });

  psbt.setMusig2Nonces(signer);
  psbt.setMusig2Nonces(cosigner);

  inputTypes.forEach((t, i) => {
    if (t === 'p2shP2pk') {
      psbt.signInput(i, signer);
    } else {
      psbt.signInputHD(i, signer);
      psbt.signInputHD(i, cosigner);
    }
  });
  assert.ok(psbt.validateSignaturesOfAllInputs());
  psbt.finalizeAllInputs();
  return (psbt.extractTransaction() as utxolib.bitgo.UtxoTransaction<bigint>).clone<number>('number');
}

describe('Input Script Sizes (Worst-Case)', function () {
  const keys = [1, 2, 3].map((v) => bip32.fromSeed(Buffer.alloc(16, `test/${v}`))) as Triple<BIP32Interface>;
  const rootWalletKeys = new utxolib.bitgo.RootWalletKeys(keys);

  function getLargestInputWithType(
    inputType: string,
    signKeys: utxolib.bitgo.KeyName[],
    inputCount = 100
  ): utxolib.TxInput {
    const signerName = signKeys[0];
    const cosignerName = signKeys.length > 1 ? signKeys[1] : signerName;
    const inputScriptTypes = Array.from({ length: inputCount }).fill(inputType) as InputScriptType[];
    const outputScriptTypes = [UnspentTypeScript2of3.p2sh] as OutputScriptType[];
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
    runTestComponentSizes(
      inputType,
      inputType === 'p2shP2pk' ? ['user'] : inputType === 'p2trMusig2' ? ['user', 'backup'] : ['user', 'bitgo']
    );
    if (inputType !== 'p2shP2pk' && inputType !== 'taprootKeyPathSpend') {
      runTestComponentSizes(inputType, ['user', 'backup']);
    }
  });
});
