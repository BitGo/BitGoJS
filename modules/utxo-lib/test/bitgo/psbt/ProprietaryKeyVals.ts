import * as assert from 'assert';
import { constructPsbt } from '../../../src/testutil';
import { bip32, BIP32Interface, networks, testutil } from '../../../src';
import { RootWalletKeys, PSBT_PROPRIETARY_IDENTIFIER } from '../../../src/bitgo';
import { checkForInput, checkForOutput } from 'bip174/src/lib/utils';
import {
  addProprietaryKeyValuesFromUnknownKeyValues,
  deleteProprietaryKeyValuesFromUnknownKeyValues,
  getProprietaryKeyValuesFromUnknownKeyValues,
  updateProprietaryKeyValuesFromUnknownKeyValues,
} from '../../../src/bitgo/ProprietaryKeyValUtils';

const network = networks.bitcoin;
const keys = [1, 2, 3].map((v) => bip32.fromSeed(Buffer.alloc(16, `test/2/${v}`), network)) as BIP32Interface[];
const rootWalletKeys = new RootWalletKeys([keys[0], keys[1], keys[2]]);
const dummyKey1 = rootWalletKeys.deriveForChainAndIndex(50, 200);
const dummyTapOutputKey = dummyKey1.user.publicKey.subarray(1, 33);
const dummyTapInternalKey = dummyKey1.bitgo.publicKey.subarray(1, 33);

const invalidTapOutputKey = Buffer.alloc(1);
const psbtInputs = testutil.inputScriptTypes.map((scriptType) => ({
  scriptType,
  value: BigInt(1000),
}));
const psbtOutputs = testutil.outputScriptTypes.map((scriptType) => ({
  scriptType,
  value: BigInt(900),
}));

describe('Proprietary key value helper functions', () => {
  it('addProprietaryKeyValues to PSBT input unknown key vals', function () {
    const psbt = constructPsbt(psbtInputs, psbtOutputs, network, rootWalletKeys, 'unsigned');
    const key = {
      identifier: 'DUMMY',
      subtype: 100,
      keydata: dummyTapOutputKey,
    };
    const input = checkForInput(psbt.data.inputs, 0);
    addProprietaryKeyValuesFromUnknownKeyValues(psbt, 'input', 0, { key, value: dummyTapInternalKey });
    const keyVal = getProprietaryKeyValuesFromUnknownKeyValues(input);
    assert.strictEqual(keyVal[0].key.identifier, 'DUMMY');
  });

  it('addProprietaryKeyValues to PSBT output unknown key vals', function () {
    const psbt = constructPsbt(psbtInputs, psbtOutputs, network, rootWalletKeys, 'unsigned');
    const key = {
      identifier: 'DUMMY',
      subtype: 100,
      keydata: dummyTapOutputKey,
    };
    const output = checkForOutput(psbt.data.outputs, 0);
    addProprietaryKeyValuesFromUnknownKeyValues(psbt, 'output', 0, { key, value: dummyTapInternalKey });
    const keyVal = getProprietaryKeyValuesFromUnknownKeyValues(output);
    assert.strictEqual(keyVal[0].key.identifier, 'DUMMY');
  });

  it('addOrUpdateProprietaryKeyValues to PSBT input unknown key vals', () => {
    const psbt = constructPsbt(psbtInputs, psbtOutputs, network, rootWalletKeys, 'unsigned');
    const key = {
      identifier: 'DUMMY',
      subtype: 100,
      keydata: dummyTapOutputKey,
    };
    const input = checkForInput(psbt.data.inputs, 0);
    addProprietaryKeyValuesFromUnknownKeyValues(psbt, 'input', 0, { key, value: dummyTapInternalKey });
    updateProprietaryKeyValuesFromUnknownKeyValues({ key, value: invalidTapOutputKey }, input);
    const keyVal = getProprietaryKeyValuesFromUnknownKeyValues(input);
    assert.strictEqual(keyVal[0].value, invalidTapOutputKey);
  });

  it('addOrUpdateProprietaryKeyValues to PSBT output unknown key vals', () => {
    const psbt = constructPsbt(psbtInputs, psbtOutputs, network, rootWalletKeys, 'unsigned');
    const key = {
      identifier: 'DUMMY',
      subtype: 100,
      keydata: dummyTapOutputKey,
    };
    const output = checkForOutput(psbt.data.outputs, 0);
    addProprietaryKeyValuesFromUnknownKeyValues(psbt, 'output', 0, { key, value: dummyTapInternalKey });
    updateProprietaryKeyValuesFromUnknownKeyValues({ key, value: invalidTapOutputKey }, output);
    const keyVal = getProprietaryKeyValuesFromUnknownKeyValues(output);
    assert.strictEqual(keyVal[0].value, invalidTapOutputKey);
  });

  it('deleteProprietaryKeyValues in PSBT input unknown key vals', () => {
    const psbt = constructPsbt(psbtInputs, psbtOutputs, network, rootWalletKeys, 'unsigned');
    const key = {
      identifier: 'DUMMY',
      subtype: 100,
      keydata: dummyTapOutputKey,
    };
    const input = checkForInput(psbt.data.inputs, 0);
    addProprietaryKeyValuesFromUnknownKeyValues(psbt, 'input', 0, { key, value: dummyTapInternalKey });
    deleteProprietaryKeyValuesFromUnknownKeyValues(input, { identifier: PSBT_PROPRIETARY_IDENTIFIER });
    const keyVal = getProprietaryKeyValuesFromUnknownKeyValues(input);
    assert.strictEqual(keyVal[0].key.identifier, 'DUMMY');
  });

  it('deleteProprietaryKeyValues in PSBT output unknown key vals', () => {
    const psbt = constructPsbt(psbtInputs, psbtOutputs, network, rootWalletKeys, 'unsigned');
    const key = {
      identifier: 'DUMMY',
      subtype: 100,
      keydata: dummyTapOutputKey,
    };
    const key2 = {
      identifier: 'OTHER_DUMMY',
      subtype: 200,
      keydata: dummyTapOutputKey,
    };
    const output = checkForOutput(psbt.data.outputs, 0);
    addProprietaryKeyValuesFromUnknownKeyValues(psbt, 'output', 0, { key, value: dummyTapInternalKey });
    addProprietaryKeyValuesFromUnknownKeyValues(psbt, 'output', 0, { key: key2, value: dummyTapInternalKey });
    deleteProprietaryKeyValuesFromUnknownKeyValues(output, { identifier: 'DUMMY' });
    const keyVal = getProprietaryKeyValuesFromUnknownKeyValues(output);
    assert.strictEqual(keyVal[0].key.identifier, 'OTHER_DUMMY');
  });
});
