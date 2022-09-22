import { BIP32Interface } from 'bip32';
import * as assert from 'assert';
import { TxOutput } from 'bitcoinjs-lib';

import { networks, Network } from '../src';

import { createOutputScript2of3, isScriptType2Of3, ScriptType2Of3 } from '../src/bitgo/outputScripts';
import {
  isTriple,
  createTransactionBuilderForNetwork,
  createTransactionBuilderFromTransaction,
  createTransactionFromBuffer,
  signInput2Of3,
  signInputP2shP2pk,
  TxOutPoint,
  UtxoTransaction,
  UtxoTransactionBuilder,
  PrevOutput,
  toTNumber,
} from '../src/bitgo';

import { createScriptPubKey } from './integration_local_rpc/generate/outputScripts.util';
import { fixtureKeys } from './integration_local_rpc/generate/fixtures';
import { KeyTriple } from './testutil';

export function getSignKeyCombinations(length: number): BIP32Interface[][] {
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

export function parseTransactionRoundTrip<TNumber extends number | bigint, T extends UtxoTransaction<TNumber>>(
  buf: Buffer,
  network: Network,
  inputs?: (TxOutPoint & TxOutput<TNumber>)[],
  amountType: 'number' | 'bigint' = 'number'
): T {
  const tx = createTransactionFromBuffer<TNumber>(buf, network, {}, amountType);
  assert.strictEqual(tx.byteLength(), buf.length);
  assert.strictEqual(tx.toBuffer().toString('hex'), buf.toString('hex'));

  // Test `Transaction.clone()` implementation
  assert.strictEqual(tx.clone().toBuffer().toString('hex'), buf.toString('hex'));

  // Test `TransactionBuilder.fromTransaction()` implementation
  if (inputs) {
    assert.strictEqual(
      createTransactionBuilderFromTransaction<TNumber>(tx, inputs).build().toBuffer().toString('hex'),
      buf.toString('hex')
    );
  }

  return tx as T;
}

export const defaultTestOutputAmount = 1e8;

export function mockTransactionId(v = 0xff): string {
  return Buffer.alloc(32).fill(v).toString('hex');
}

export function getPrevOutput<TNumber extends number | bigint = number>(
  scriptType: ScriptType2Of3 | 'p2shP2pk',
  value: TNumber,
  vout = 0,
  keys: KeyTriple = fixtureKeys
): PrevOutput<TNumber> {
  return {
    txid: mockTransactionId(),
    vout,
    script: isScriptType2Of3(scriptType)
      ? createOutputScript2of3(
          keys.map((k) => k.publicKey),
          scriptType
        ).scriptPubKey
      : Buffer.from([]),
    value,
  };
}

export function getPrevOutputs<TNumber extends number | bigint = number>(
  scriptType: ScriptType2Of3 | 'p2shP2pk',
  value: TNumber,
  keys: KeyTriple = fixtureKeys
): PrevOutput<TNumber>[] {
  return [getPrevOutput<TNumber>(scriptType, value, 0, keys)];
}

export type HalfSigner = {
  signer: BIP32Interface;
  cosigner?: BIP32Interface;
};

export function getTransactionBuilder<TNumber extends number | bigint = number>(
  keys: KeyTriple,
  halfSigners: HalfSigner[],
  scriptType: ScriptType2Of3 | 'p2shP2pk',
  network: Network,
  amountType: 'number' | 'bigint' = 'number',
  {
    outputAmount = defaultTestOutputAmount,
    prevOutputs = getPrevOutputs<TNumber>(scriptType, toTNumber<TNumber>(outputAmount, amountType)),
  }: {
    outputAmount?: number | bigint | string;
    prevOutputs?: PrevOutput<TNumber>[];
  } = {}
): UtxoTransactionBuilder<TNumber> {
  const txBuilder = createTransactionBuilderForNetwork<TNumber>(network);

  prevOutputs.forEach(({ txid, vout }) => {
    txBuilder.addInput(txid, vout);
  });

  const recipientScript = createScriptPubKey(fixtureKeys, 'p2pkh', networks.bitcoin);
  txBuilder.addOutput(recipientScript, toTNumber<TNumber>(BigInt(outputAmount) - BigInt(1000), amountType));

  const pubkeys = keys.map((k) => k.publicKey);
  assert(isTriple(pubkeys));

  prevOutputs.forEach(({ value }, vin) => {
    halfSigners.forEach(({ signer, cosigner }) => {
      if (scriptType === 'p2shP2pk') {
        signInputP2shP2pk(txBuilder, vin, signer);
      } else {
        if (!cosigner) {
          throw new Error(`must set cosigner`);
        }
        signInput2Of3(txBuilder, vin, scriptType as ScriptType2Of3, pubkeys, signer, cosigner.publicKey, value);
      }
    });
  });

  return txBuilder;
}

export function getUnsignedTransaction2Of3<TNumber extends number | bigint = number>(
  keys: KeyTriple,
  scriptType: ScriptType2Of3 | 'p2shP2pk',
  network: Network,
  amountType: 'number' | 'bigint' = 'number'
): UtxoTransaction<TNumber> {
  return getTransactionBuilder<TNumber>(keys, [], scriptType, network, amountType).buildIncomplete();
}

export function getHalfSignedTransaction2Of3<TNumber extends number | bigint = number>(
  keys: KeyTriple,
  signer1: BIP32Interface,
  signer2: BIP32Interface,
  scriptType: ScriptType2Of3,
  network: Network,
  amountType: 'number' | 'bigint' = 'number'
): UtxoTransaction<TNumber> {
  return getTransactionBuilder<TNumber>(
    keys,
    [{ signer: signer1, cosigner: signer2 }],
    scriptType,
    network,
    amountType
  ).buildIncomplete();
}

export function getFullSignedTransactionP2shP2pk<TNumber extends number | bigint = number>(
  keys: KeyTriple,
  signer1: BIP32Interface,
  network: Network,
  amountType: 'number' | 'bigint' = 'number'
): UtxoTransaction<TNumber> {
  return getTransactionBuilder<TNumber>(keys, [{ signer: signer1 }], 'p2shP2pk', network, amountType).build();
}

export function getFullSignedTransaction2Of3<TNumber extends number | bigint = number>(
  keys: KeyTriple,
  signer1: BIP32Interface,
  signer2: BIP32Interface,
  scriptType: ScriptType2Of3,
  network: Network,
  amountType: 'number' | 'bigint' = 'number'
): UtxoTransaction<TNumber> {
  return getTransactionBuilder<TNumber>(
    keys,
    [
      { signer: signer1, cosigner: signer2 },
      { signer: signer2, cosigner: signer1 },
    ],
    scriptType,
    network,
    amountType
  ).build();
}
