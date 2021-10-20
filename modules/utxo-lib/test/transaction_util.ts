import * as bip32 from 'bip32';
import * as assert from 'assert';
import * as networks from '../src/networks';
import { Network } from '../src/networkTypes';
import { UtxoTransaction } from '../src/bitgo/UtxoTransaction';
import {
  createTransactionBuilderForNetwork,
  createTransactionBuilderFromTransaction,
  createTransactionFromBuffer,
  getDefaultSigHash,
  UtxoTransactionBuilder,
} from '../src/bitgo';
import { createScriptPubKey, KeyTriple } from './integration_local_rpc/generate/outputScripts.util';
import { fixtureKeys } from './integration_local_rpc/generate/fixtures';
import {
  createOutputScript2of3,
  createOutputScriptP2shP2pk,
  isScriptType2Of3,
  ScriptType2Of3,
  scriptType2Of3AsPrevOutType,
} from '../src/bitgo/outputScripts';

export function getSignKeyCombinations(length: number): bip32.BIP32Interface[][] {
  if (length === 0) {
    return [];
  }
  if (length === 1) {
    return fixtureKeys.map((k) => [k]);
  }
  return getSignKeyCombinations(length - 1)
    .map((head) => fixtureKeys.filter((k) => !head.includes(k)).map((k) => [...head, k]))
    .reduce((all, keys) => [...all, ...keys]);
}

export function parseTransactionRoundTrip<T extends UtxoTransaction>(
  buf: Buffer,
  network: Network,
  inputs?: [txid: string, index: number, value: number][]
): T {
  const tx = createTransactionFromBuffer(buf, network);
  assert.strictEqual(tx.byteLength(), buf.length);
  assert.strictEqual(tx.toBuffer().toString('hex'), buf.toString('hex'));

  // Test `Transaction.clone()` implementation
  assert.strictEqual(tx.clone().toBuffer().toString('hex'), buf.toString('hex'));

  // Test `TransactionBuilder.fromTransaction()` implementation
  if (inputs) {
    inputs.forEach(([txid, index, value], i) => {
      (tx.ins[i] as any).value = value;
    });
    assert.strictEqual(
      createTransactionBuilderFromTransaction(tx).build().toBuffer().toString('hex'),
      buf.toString('hex')
    );
  }

  return tx as T;
}

export const defaultTestOutputAmount = 1e8;

type PrevOutput = [txid: string, index: number, amount: number];

export function getTransactionBuilder(
  keys: KeyTriple,
  signKeys: bip32.BIP32Interface[],
  scriptType: ScriptType2Of3 | 'p2shP2pk',
  network: Network,
  {
    outputAmount = defaultTestOutputAmount,
    prevOutputs = [[Buffer.alloc(32).fill(0xff).toString('hex'), 0, outputAmount]],
  }: {
    outputAmount?: number;
    prevOutputs?: PrevOutput[];
  } = {}
): UtxoTransactionBuilder {
  const txBuilder = createTransactionBuilderForNetwork(network);

  prevOutputs.forEach(([txid, vout]) => {
    txBuilder.addInput(txid, vout);
  });

  const recipientScript = createScriptPubKey(fixtureKeys, 'p2pkh', networks.bitcoin);
  txBuilder.addOutput(recipientScript, outputAmount - 1000);

  const pubkeys = keys.map((k) => k.publicKey);

  const { redeemScript, witnessScript } = isScriptType2Of3(scriptType)
    ? createOutputScript2of3(pubkeys, scriptType)
    : createOutputScriptP2shP2pk(pubkeys[0]);

  const prevOutScriptType = isScriptType2Of3(scriptType) ? scriptType2Of3AsPrevOutType(scriptType) : 'p2sh-p2pk';

  prevOutputs.forEach(([, , value], vin) => {
    signKeys.forEach((key, i) => {
      txBuilder.sign({
        prevOutScriptType,
        vin,
        keyPair: Object.assign(key, { network }),
        redeemScript,
        hashType: getDefaultSigHash(network),
        witnessValue: scriptType === 'p2shP2pk' ? undefined : value,
        witnessScript,
      });
    });
  });

  return txBuilder;
}
