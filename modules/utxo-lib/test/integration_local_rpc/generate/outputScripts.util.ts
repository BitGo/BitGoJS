import * as bip32 from 'bip32';
import { Transaction, TxOutput } from 'bitcoinjs-lib';
import * as utxolib from '../../../src';
import {
  createOutputScript2of3,
  isScriptType2Of3,
  isSupportedScriptType,
  ScriptType2Of3,
  scriptTypes2Of3,
} from '../../../src/bitgo/outputScripts';

import {
  isTriple,
  createTransactionBuilderForNetwork,
  createTransactionFromBuffer,
  signInput2Of3,
  TxOutPoint,
  UtxoTransaction,
} from '../../../src/bitgo';
import { getDefaultCosigner, KeyTriple } from '../../testutil';

export const scriptTypesSingleSig = ['p2pkh', 'p2wkh'] as const;
export type ScriptTypeSingleSig = typeof scriptTypesSingleSig[number];

export const scriptTypes = [...scriptTypesSingleSig, ...scriptTypes2Of3];
export type ScriptType = ScriptType2Of3 | ScriptTypeSingleSig;

type Network = utxolib.Network;

export function isSupportedDepositType(network: Network, scriptType: ScriptType): boolean {
  if (scriptType === 'p2pkh') {
    return true;
  }

  if (scriptType === 'p2wkh') {
    return utxolib.supportsSegwit(network);
  }

  return isSupportedScriptType(network, scriptType);
}

export function isSupportedSpendType(network: Network, scriptType: ScriptType): boolean {
  return isScriptType2Of3(scriptType) && isSupportedScriptType(network, scriptType);
}

/**
 *
 * @param keys - Pubkeys to use for generating the address.
 *               If scriptType is single-sig, the first key will be used.
 * @param scriptType
 * @param network
 * @return {Buffer} scriptPubKey
 */
export function createScriptPubKey(keys: KeyTriple, scriptType: ScriptType, network: Network): Buffer {
  const pubkeys = keys.map((k) => k.publicKey);

  switch (scriptType) {
    case 'p2sh':
    case 'p2shP2wsh':
    case 'p2wsh':
    case 'p2tr':
      return createOutputScript2of3(pubkeys, scriptType).scriptPubKey;
    case 'p2pkh':
      return utxolib.payments.p2pkh({ pubkey: keys[0].publicKey }).output as Buffer;
    case 'p2wkh':
      return utxolib.payments.p2wpkh({ pubkey: keys[0].publicKey }).output as Buffer;
    default:
      throw new Error(`unsupported output type ${scriptType}`);
  }
}

export function createSpendTransactionFromPrevOutputs<T extends UtxoTransaction>(
  keys: KeyTriple,
  scriptType: ScriptType2Of3,
  prevOutputs: (TxOutPoint & TxOutput)[],
  recipientScript: Buffer,
  network: Network,
  { signKeys = [keys[0], keys[2]], version }: { signKeys?: bip32.BIP32Interface[]; version?: number } = {}
): T {
  if (signKeys.length !== 1 && signKeys.length !== 2) {
    throw new Error(`signKeys length must be 1 or 2`);
  }

  const txBuilder = createTransactionBuilderForNetwork(network, { version });

  prevOutputs.forEach(({ txid, vout, script, value }, i) => {
    txBuilder.addInput(txid, vout, undefined, script, value);
  });

  const inputSum = prevOutputs.reduce((sum, { value }) => sum + value, 0);
  const fee = 1000;

  txBuilder.addOutput(recipientScript, inputSum - fee);

  const publicKeys = keys.map((k) => k.publicKey);
  if (!isTriple(publicKeys)) {
    throw new Error();
  }

  prevOutputs.forEach(({ value }, vin) => {
    signKeys.forEach((key) => {
      signInput2Of3(txBuilder, vin, scriptType, publicKeys, key, getDefaultCosigner(publicKeys, key.publicKey), value);
    });
  });

  if (signKeys.length === 1) {
    return txBuilder.buildIncomplete() as T;
  }
  return txBuilder.build() as T;
}

export function createSpendTransaction(
  keys: KeyTriple,
  scriptType: ScriptType2Of3,
  inputTxs: Buffer[],
  recipientScript: Buffer,
  network: Network,
  version?: number
): Transaction {
  const matches: (TxOutPoint & TxOutput)[] = inputTxs
    .map((inputTxBuffer): (TxOutPoint & TxOutput)[] => {
      const inputTx = createTransactionFromBuffer(inputTxBuffer, network);

      const { scriptPubKey } = createOutputScript2of3(
        keys.map((k) => k.publicKey),
        scriptType as ScriptType2Of3
      );

      return inputTx.outs
        .map((o, vout): (TxOutPoint & TxOutput) | undefined => {
          if (!scriptPubKey.equals(o.script)) {
            return;
          }
          return {
            txid: inputTx.getId(),
            vout,
            value: o.value,
            script: o.script,
          };
        })
        .filter((v): v is TxOutPoint & TxOutput => v !== undefined);
    })
    .reduce((all, matches) => [...all, ...matches]);

  if (!matches.length) {
    throw new Error(`could not find matching outputs in funding transaction`);
  }

  return createSpendTransactionFromPrevOutputs(keys, scriptType, matches, recipientScript, network, { version });
}
