import * as assert from 'assert';
import {
  createOutputScriptP2shP2pk,
  ScriptType,
  ScriptType2Of3,
  scriptTypeP2shP2pk,
  scriptTypes2Of3,
} from '../bitgo/outputScripts';
import {
  addReplayProtectionUnspentToPsbt,
  addWalletOutputToPsbt,
  addWalletUnspentToPsbt,
  createPsbtForNetwork,
  getExternalChainCode,
  isWalletUnspent,
  KeyName,
  RootWalletKeys,
  Unspent,
  UtxoPsbt,
} from '../bitgo';
import { Network } from '../networks';
import { mockReplayProtectionUnspent, mockWalletUnspent } from './mock';
import { getInternalChainCode } from '../bitgo';

/**
 * input script type and value.
 * use p2trMusig2 for p2trMusig2 script path.
 * use taprootKeyPathSpend for p2trMusig2 key path.
 */
export type InputScriptType = ScriptType | 'taprootKeyPathSpend';
export type OutputScriptType = ScriptType2Of3;

/**
 * output script type and value
 */
export interface Input {
  scriptType: InputScriptType;
  value: bigint;
}

/**
 * set isInternalAddress=true for internal output address
 */
export interface Output {
  scriptType: OutputScriptType;
  value: bigint;
  isInternalAddress?: boolean;
}

/**
 * array of supported input script types.
 * use p2trMusig2 for p2trMusig2 script path.
 * use taprootKeyPathSpend for p2trMusig2 key path.
 */
export const inputTypes = [...scriptTypes2Of3, 'taprootKeyPathSpend', scriptTypeP2shP2pk] as const;

/**
 * array of supported output script types.
 */
export const outputTypes = scriptTypes2Of3;

/**
 * create unspent object from input script type, index, network and root wallet key.
 */
export function toUnspent(
  input: Input,
  index: number,
  network: Network,
  rootWalletKeys: RootWalletKeys
): Unspent<bigint> {
  if (input.scriptType === 'p2shP2pk') {
    return mockReplayProtectionUnspent(network, input.value, { key: rootWalletKeys['user'], vout: index });
  } else {
    const chain = getInternalChainCode(input.scriptType === 'taprootKeyPathSpend' ? 'p2trMusig2' : input.scriptType);
    return mockWalletUnspent(network, input.value, {
      chain,
      vout: index,
      keys: rootWalletKeys,
      index,
    });
  }
}

/**
 * returns signer and cosigner names for InputScriptType.
 * user and undefined as signer and cosigner respectively for p2shP2pk.
 * user and backup as signer and cosigner respectively for p2trMusig2.
 * user and bitgo as signer and cosigner respectively for other input script types.
 */
export function getSigners(inputType: InputScriptType): { signerName: KeyName; cosignerName?: KeyName } {
  return {
    signerName: 'user',
    cosignerName: inputType === 'p2shP2pk' ? undefined : inputType === 'p2trMusig2' ? 'backup' : 'bitgo',
  };
}

/**
 * signs with first or second signature for single input.
 * p2shP2pk is signed only with first sign.
 */
export function signPsbtInput(
  psbt: UtxoPsbt,
  input: Input,
  inputIndex: number,
  rootWalletKeys: RootWalletKeys,
  sign: 'halfsigned' | 'fullsigned'
): void {
  const { signerName, cosignerName } = getSigners(input.scriptType);
  if (sign === 'halfsigned') {
    if (input.scriptType === 'p2shP2pk') {
      psbt.signInput(inputIndex, rootWalletKeys[signerName]);
    } else {
      psbt.signInputHD(inputIndex, rootWalletKeys[signerName]);
    }
  }
  if (sign === 'fullsigned' && cosignerName) {
    psbt.signInputHD(inputIndex, rootWalletKeys[cosignerName]);
  }
}

/**
 * signs with first or second signature for all inputs.
 * p2shP2pk is signed only with first sign.
 */
export function signAllPsbtInputs(
  psbt: UtxoPsbt,
  inputs: Input[],
  rootWalletKeys: RootWalletKeys,
  sign: 'halfsigned' | 'fullsigned'
): void {
  inputs.forEach((input, index) => {
    signPsbtInput(psbt, input, index, rootWalletKeys, sign);
  });
}

/**
 * construct psbt for given inputs, outputs, network and root wallet keys.
 */
export function constructPsbt(
  inputs: Input[],
  outputs: Output[],
  network: Network,
  rootWalletKeys: RootWalletKeys,
  sign: 'unsigned' | 'halfsigned' | 'fullsigned'
): UtxoPsbt {
  const totalInputAmount = inputs.reduce((sum, input) => sum + input.value, BigInt(0));
  const outputInputAmount = outputs.reduce((sum, output) => sum + output.value, BigInt(0));
  assert(totalInputAmount >= outputInputAmount, 'total output can not exceed total input');

  const psbt = createPsbtForNetwork({ network });
  const unspents = inputs.map((input, i) => toUnspent(input, i, network, rootWalletKeys));

  unspents.forEach((u, i) => {
    const { signerName, cosignerName } = getSigners(inputs[i].scriptType);
    if (isWalletUnspent(u) && cosignerName) {
      addWalletUnspentToPsbt(psbt, u, rootWalletKeys, signerName, cosignerName);
    } else {
      const { redeemScript } = createOutputScriptP2shP2pk(rootWalletKeys[signerName].publicKey);
      assert(redeemScript);
      addReplayProtectionUnspentToPsbt(psbt, u, redeemScript);
    }
  });

  outputs.forEach((output, i) => {
    addWalletOutputToPsbt(
      psbt,
      rootWalletKeys,
      output.isInternalAddress ? getInternalChainCode(output.scriptType) : getExternalChainCode(output.scriptType),
      i,
      output.value
    );
  });

  if (sign === 'unsigned') {
    return psbt;
  }

  psbt.setMusig2NoncesHD(rootWalletKeys['user']);
  psbt.setMusig2NoncesHD(rootWalletKeys['bitgo']);

  signAllPsbtInputs(psbt, inputs, rootWalletKeys, 'halfsigned');

  if (sign === 'fullsigned') {
    signAllPsbtInputs(psbt, inputs, rootWalletKeys, sign);
  }

  return psbt;
}
