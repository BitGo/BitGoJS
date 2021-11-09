import * as bip32 from 'bip32';
import * as crypto from 'crypto';
import { Network } from '../../../src/networkTypes';
import { createOutputScript2of3, ScriptType2Of3, scriptTypes2Of3 } from '../../../src/bitgo/outputScripts';
import { isTriple, Triple } from '../../../src/bitgo/types';
import { isBitcoin, isBitcoinGold, isLitecoin } from '../../../src/coins';

import { Transaction, TxOutput } from 'bitcoinjs-lib';
import { createTransactionBuilderForNetwork, createTransactionFromBuffer, signInput2Of3 } from '../../../src/bitgo';
import { UtxoTransaction } from '../../../src/bitgo/UtxoTransaction';

const utxolib = require('../../../src');

export const scriptTypesSingleSig = ['p2pkh', 'p2wkh'] as const;
export type ScriptTypeSingleSig = typeof scriptTypesSingleSig[number];

export const scriptTypes = [...scriptTypesSingleSig, ...scriptTypes2Of3];
export type ScriptType = ScriptType2Of3 | ScriptTypeSingleSig;

export function requiresSegwit(scriptType: ScriptType): boolean {
  return scriptType === 'p2wkh' || scriptType === 'p2wsh' || scriptType === 'p2shP2wsh';
}

export type KeyTriple = Triple<bip32.BIP32Interface>;

function getKey(seed: string): bip32.BIP32Interface {
  return bip32.fromSeed(crypto.createHash('sha256').update(seed).digest());
}

export function getKeyTriple(seed: string): KeyTriple {
  return [getKey(seed + '.0'), getKey(seed + '.1'), getKey(seed + '.2')];
}

export function getDefaultCosigner(pubkeys: Triple<Buffer>, signer: Buffer): Buffer {
  const [user, backup, bitgo] = pubkeys;
  if (signer.equals(user)) {
    return bitgo;
  }
  if (signer.equals(backup)) {
    return bitgo;
  }
  if (signer.equals(bitgo)) {
    return user;
  }
  throw new Error(`signer not in pubkeys`);
}

export function supportsSegwit(network: Network): boolean {
  return isBitcoin(network) || isLitecoin(network) || isBitcoinGold(network);
}

export function supportsTaproot(network: Network): boolean {
  // TODO: add litecoin once taproot activates
  return isBitcoin(network);
}

export function isSupportedDepositType(network: Network, scriptType: ScriptType): boolean {
  return scriptType === 'p2tr' ? supportsTaproot(network) : !requiresSegwit(scriptType) || supportsSegwit(network);
}

export function isSupportedSpendType(network: Network, scriptType: ScriptType): boolean {
  if (!scriptTypes2Of3.includes(scriptType as ScriptType2Of3)) {
    return false;
  }

  return isSupportedDepositType(network, scriptType);
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
      return utxolib.payments.p2pkh({ pubkey: keys[0].publicKey }).output;
    case 'p2wkh':
      return utxolib.payments.p2wpkh({ pubkey: keys[0].publicKey }).output;
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
  { signKeys = [keys[0], keys[2]] } = {}
): T {
  if (signKeys.length !== 1 && signKeys.length !== 2) {
    throw new Error(`signKeys length must be 1 or 2`);
  }

  const txBuilder = createTransactionBuilderForNetwork(network);

  prevOutputs.forEach(({ txid, index, script, value }, i) => {
    txBuilder.addInput(txid, index, undefined, script, value);
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

export type TxOutPoint = {
  txid: string;
  index: number;
};

export function createSpendTransaction(
  keys: KeyTriple,
  scriptType: ScriptType2Of3,
  inputTxs: Buffer[],
  recipientScript: Buffer,
  network: Network
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
            index: vout,
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

  return createSpendTransactionFromPrevOutputs(keys, scriptType, matches, recipientScript, network);
}
