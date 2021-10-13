import * as bip32 from 'bip32';
import * as crypto from 'crypto';
import { Network } from '../../../src/networkTypes';
import { Triple } from './types';
import {
  createOutputScript2of3,
  ScriptType2Of3,
  scriptType2Of3AsPrevOutType,
  scriptTypes2Of3,
} from '../../../src/bitgo/outputScripts';
import { isBitcoin, isBitcoinGold, isLitecoin } from '../../../src/coins';

import { Transaction } from 'bitcoinjs-lib';
import { createTransactionBuilderForNetwork, createTransactionFromBuffer, getDefaultSigHash } from '../../../src/bitgo';
import { UtxoTransaction } from '../../../src/bitgo/UtxoTransaction';
import { Output } from 'bitcoinjs-lib/types/transaction';

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
  // TODO: enable this when p2tr signing is implemented
  if (scriptType === 'p2tr') {
    return false;
  }
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
  keys: bip32.BIP32Interface[],
  scriptType: ScriptType2Of3,
  prevOutputs: [txid: string, index: number, value: number][],
  recipientScript: Buffer,
  network: Network,
  { signKeys = keys.slice(0, 2) } = {}
): T {
  if (signKeys.length !== 1 && signKeys.length !== 2) {
    throw new Error(`signKeys length must be 1 or 2`);
  }

  const txBuilder = createTransactionBuilderForNetwork(network);

  prevOutputs.forEach(([txid, vout]) => {
    txBuilder.addInput(txid, vout);
  });

  const inputSum = prevOutputs.reduce((sum, [, , value]) => sum + value, 0);
  const fee = 1000;

  txBuilder.addOutput(recipientScript, inputSum - fee);

  const { redeemScript, witnessScript } = createOutputScript2of3(
    keys.map((k) => k.publicKey),
    scriptType
  );

  prevOutputs.forEach(([, , value], vin) => {
    signKeys.forEach((key) => {
      txBuilder.sign({
        prevOutScriptType: scriptType2Of3AsPrevOutType(scriptType),
        vin,
        keyPair: Object.assign(key, { network: null }),
        redeemScript,
        hashType: getDefaultSigHash(network),
        witnessValue: value,
        witnessScript,
      });
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
  inputTxid: string,
  inputTxBuffer: Buffer,
  recipientScript: Buffer,
  network: Network
): Transaction {
  const inputTx = createTransactionFromBuffer(inputTxBuffer, network);
  if (inputTx.getId() !== inputTxid) {
    throw new Error(`txid mismatch ${inputTx.getId()} ${inputTxid}`);
  }

  const { scriptPubKey } = createOutputScript2of3(
    keys.map((k) => k.publicKey),
    scriptType as ScriptType2Of3
  );
  const matches = inputTx.outs
    .map((o, vout): [Output, number] => [o, vout])
    .filter(([o]) => scriptPubKey.equals(o.script));
  if (!matches.length) {
    throw new Error(`could not find matching outputs in funding transaction`);
  }

  return createSpendTransactionFromPrevOutputs(
    keys,
    scriptType,
    matches.map(([output, index]) => [inputTxid, index, output.value]),
    recipientScript,
    network
  );
}
