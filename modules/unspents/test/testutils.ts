import * as unspents from '../src';
import * as utxolib from '@bitgo/utxo-lib';
import assert from 'assert';
import { createScriptPubKey } from './signedTx/txGen';

/**
 * makeEnum('a', 'b') returns `{ a: 'a', b: 'b' }`
 *
 * @param args
 * @return map with string keys and symbol values
 */
const makeEnum = (...args: string[]): any => args.reduce((obj, key) => Object.assign(obj, { [key]: key }), {});

export const UnspentTypeP2shP2pk = 'p2shP2pk';

// p2trMusig2 is assumed to be script path only. taprootKeyPathSpend is for p2trMusig2 key path
export const UnspentTypeScript2of3: {
  p2sh: string;
  p2shP2wsh: string;
  p2wsh: string;
  p2tr: string;
  p2trMusig2: string;
  taprootKeyPathSpend: string;
} = makeEnum('p2sh', 'p2shP2wsh', 'p2wsh', 'p2tr', 'p2trMusig2', 'taprootKeyPathSpend');

export const UnspentTypePubKeyHash: {
  p2pkh: 'p2pkh';
  p2wpkh: 'p2wpkh';
} = makeEnum('p2pkh', 'p2wpkh');

export type TestUnspentType = string | UnspentTypeOpReturn;

export class UnspentTypeOpReturn {
  constructor(public size: number) {}

  public toString(): string {
    return `opReturn(${this.size})`;
  }
}

export type InputScriptType = utxolib.bitgo.outputScripts.ScriptType | 'taprootKeyPathSpend';

export function getInputScriptTypes(): InputScriptType[] {
  return [...utxolib.bitgo.outputScripts.scriptTypes2Of3, 'p2shP2pk', 'taprootKeyPathSpend'];
}

/**
 * Return the input dimensions based on unspent type
 * @param unspentType - one of UnspentTypeScript2of3
 * @return Dimensions
 */
export const getInputDimensionsForUnspentType = (unspentType: TestUnspentType): unspents.Dimensions => {
  switch (unspentType) {
    case UnspentTypeScript2of3.p2sh:
      return unspents.Dimensions.sum({ nP2shInputs: 1 });
    case UnspentTypeScript2of3.p2shP2wsh:
      return unspents.Dimensions.sum({ nP2shP2wshInputs: 1 });
    case UnspentTypeScript2of3.p2wsh:
      return unspents.Dimensions.sum({ nP2wshInputs: 1 });
    case UnspentTypeScript2of3.p2tr:
    case UnspentTypeScript2of3.p2trMusig2:
      return unspents.Dimensions.sum({ nP2trScriptPathLevel1Inputs: 1 });
    case UnspentTypeScript2of3.taprootKeyPathSpend:
      return unspents.Dimensions.sum({ nP2trKeypathInputs: 1 });
    case UnspentTypeP2shP2pk:
      return unspents.Dimensions.sum({ nP2shP2pkInputs: 1 });
  }
  throw new Error(`no input dimensions for ${unspentType}`);
};

export const getOutputDimensionsForUnspentType = (unspentType: TestUnspentType): unspents.Dimensions => {
  /* The values here are validated in the test 'calculates output dimensions dynamically' */
  switch (unspentType) {
    case UnspentTypeScript2of3.p2sh:
    case UnspentTypeScript2of3.p2shP2wsh:
    case UnspentTypeP2shP2pk:
      return unspents.Dimensions.fromOutputScriptLength(23);
    case UnspentTypeScript2of3.p2wsh:
      return unspents.Dimensions.fromOutputScriptLength(34);
    case UnspentTypeScript2of3.p2tr:
    case UnspentTypeScript2of3.p2trMusig2:
    case UnspentTypeScript2of3.taprootKeyPathSpend:
      return unspents.Dimensions.fromOutputScriptLength(34);
    case UnspentTypePubKeyHash.p2pkh:
      return unspents.Dimensions.fromOutputScriptLength(25);
    case UnspentTypePubKeyHash.p2wpkh:
      return unspents.Dimensions.fromOutputScriptLength(22);
    default:
      if (unspentType instanceof UnspentTypeOpReturn) {
        return unspents.Dimensions.fromOutputScriptLength(1 + unspentType.size);
      }
      throw new TypeError(`unknown unspentType ${unspentType}`);
  }
};

function getDefaultSignerNames(
  inputType: InputScriptType,
  signers?: { signerName: utxolib.bitgo.KeyName; cosignerName: utxolib.bitgo.KeyName }
): utxolib.bitgo.KeyName[] {
  if (signers) {
    return [signers.signerName, signers.cosignerName];
  }
  if (inputType === 'p2shP2pk') {
    return ['user'];
  }
  if (inputType === 'p2trMusig2') {
    return ['user', 'backup'];
  }
  return ['user', 'bitgo'];
}

export function constructPsbt(
  keys: utxolib.bitgo.RootWalletKeys,
  inputTypes: InputScriptType[],
  outputTypes: TestUnspentType[],
  signatureStatus: 'unsigned' | 'halfsigned' | 'fullysigned',
  signers?: { signerName: utxolib.bitgo.KeyName; cosignerName: utxolib.bitgo.KeyName }
): utxolib.bitgo.UtxoPsbt<utxolib.bitgo.UtxoTransaction<bigint>> {
  const psbt = utxolib.bitgo.createPsbtForNetwork({ network: utxolib.networks.bitcoin });

  inputTypes.forEach((t, i) => {
    if (t === 'p2shP2pk') {
      const signer = keys[getDefaultSignerNames(t, signers)[0]];
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
      const signerNames = getDefaultSignerNames(t, signers);
      utxolib.bitgo.addWalletUnspentToPsbt(psbt, unspent, keys, signerNames[0], signerNames[1]);
    }
  });

  outputTypes.forEach((t, index) => {
    psbt.addOutput({
      script: createScriptPubKey(keys.triple, t),
      value: BigInt(10),
    });
  });

  if (signatureStatus === 'unsigned') {
    return psbt;
  }

  psbt.setAllInputsMusig2NonceHD(keys['user']);
  psbt.setAllInputsMusig2NonceHD(keys['bitgo']);

  inputTypes.forEach((t, i) => {
    const signerNames = getDefaultSignerNames(t, signers);
    if (t === 'p2shP2pk') {
      if (signatureStatus === 'fullysigned') {
        psbt.signInput(i, keys[signerNames[0]]);
      }
    } else {
      psbt.signInputHD(i, keys[signerNames[0]]);
      if (signatureStatus === 'fullysigned') {
        psbt.signInputHD(i, keys[signerNames[1]]);
      }
    }
  });
  if (signatureStatus === 'fullysigned') {
    assert.ok(psbt.validateSignaturesOfAllInputs());
  }
  return psbt;
}

export function getSignedTransaction(
  keys: utxolib.bitgo.RootWalletKeys,
  signerName: utxolib.bitgo.KeyName,
  cosignerName: utxolib.bitgo.KeyName,
  inputTypes: InputScriptType[],
  outputTypes: TestUnspentType[]
): utxolib.bitgo.UtxoTransaction {
  const psbt = constructPsbt(keys, inputTypes, outputTypes, 'fullysigned', { signerName, cosignerName });
  psbt.finalizeAllInputs();
  return (psbt.extractTransaction() as utxolib.bitgo.UtxoTransaction<bigint>).clone<number>('number');
}
