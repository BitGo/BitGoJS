import { BIP32Interface } from 'bip32';
import * as assert from 'assert';
import { TxOutput } from 'bitcoinjs-lib';

import { networks, Network } from '../src';

import {
  createOutputScript2of3,
  createOutputScriptP2shP2pk,
  isScriptType2Of3,
  ScriptType2Of3,
} from '../src/bitgo/outputScripts';
import {
  isTriple,
  createPsbtFromBuffer,
  createPsbtFromTransaction,
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
  UtxoPsbt,
} from '../src/bitgo';
import { KeyTriple } from '../src/testutil';

import { createScriptPubKey } from './integration_local_rpc/generate/outputScripts.util';
import { fixtureKeys } from './integration_local_rpc/generate/fixtures';

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
  {
    inputs,
    amountType = 'number',
    version,
    roundTripPsbt = true,
  }: {
    inputs?: (TxOutPoint & TxOutput<TNumber>)[];
    amountType?: 'number' | 'bigint';
    version?: number;
    roundTripPsbt?: boolean;
  } = {}
): T {
  const tx = createTransactionFromBuffer<TNumber>(buf, network, { version, amountType });
  assert.strictEqual(tx.byteLength(), buf.length);
  assert.strictEqual(tx.toBuffer().toString('hex'), buf.toString('hex'));

  // Test `Transaction.clone()` implementation
  assert.strictEqual(tx.clone().toBuffer().toString('hex'), buf.toString('hex'));

  if (inputs) {
    const bigintTx = tx.clone<bigint>('bigint');
    const bigintInputs = inputs.map((input) => ({ ...input, value: BigInt(input.value) }));
    if (roundTripPsbt) {
      // Test UtxoPsbt.fromTransaction() implementation
      assert.strictEqual(
        UtxoPsbt.fromTransaction(bigintTx, bigintInputs)
          .finalizeAllInputs()
          .extractTransaction()
          .toBuffer()
          .toString('hex'),
        buf.toString('hex')
      );

      // Test UtxoPsbt.toBuffer() and UtxoPsbt.fromBuffer() implementation
      assert.strictEqual(
        createPsbtFromBuffer(createPsbtFromTransaction(bigintTx, bigintInputs).toBuffer(), network)
          .finalizeAllInputs()
          .extractTransaction()
          .toBuffer()
          .toString('hex'),
        buf.toString('hex')
      );
    }
    // Test `TransactionBuilder.fromTransaction()` implementation
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
  network: Network,
  vout = 0,
  {
    keys = fixtureKeys,
    prevTx,
  }: {
    keys?: KeyTriple;
    prevTx?: UtxoTransaction<TNumber> | boolean;
  } = {}
): PrevOutput<TNumber> {
  const script = isScriptType2Of3(scriptType)
    ? createOutputScript2of3(
        keys.map((k) => k.publicKey),
        scriptType
      ).scriptPubKey
    : createOutputScriptP2shP2pk(keys[0].publicKey).scriptPubKey;

  if (prevTx === true) {
    const txb = createTransactionBuilderForNetwork<TNumber>(network);
    txb.addInput(Buffer.alloc(32).fill(1), 0);
    txb.addOutput(script, value);
    prevTx = txb.buildIncomplete();
  }

  return {
    txid: prevTx ? prevTx.getId() : mockTransactionId(),
    vout,
    script,
    value,
    prevTx: prevTx ? prevTx.toBuffer() : undefined,
  };
}

export function getPrevOutputs<TNumber extends number | bigint = number>(
  scriptType: ScriptType2Of3 | 'p2shP2pk',
  value: TNumber,
  network: Network,
  { keys = fixtureKeys, prevTx }: { keys?: KeyTriple; prevTx?: boolean } = {}
): PrevOutput<TNumber>[] {
  return [getPrevOutput<TNumber>(scriptType, value, network, 0, { keys, prevTx })];
}

export type HalfSigner = {
  signer: BIP32Interface;
  cosigner?: BIP32Interface;
};

type TransactionUtilBuildOptions<TNumber extends number | bigint> = {
  amountType?: 'number' | 'bigint';
  outputAmount?: number | bigint | string;
  prevOutputs?: PrevOutput<TNumber>[];
};

export function getTransactionBuilder<TNumber extends number | bigint = number>(
  keys: KeyTriple,
  halfSigners: HalfSigner[],
  scriptType: ScriptType2Of3 | 'p2shP2pk',
  network: Network,
  {
    amountType = 'number',
    outputAmount = defaultTestOutputAmount,
    prevOutputs = getPrevOutputs<TNumber>(scriptType, toTNumber<TNumber>(outputAmount, amountType), network),
  }: TransactionUtilBuildOptions<TNumber> = {}
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
  params: TransactionUtilBuildOptions<TNumber> = {}
): UtxoTransaction<TNumber> {
  return getTransactionBuilder<TNumber>(keys, [], scriptType, network, params).buildIncomplete();
}

export function getHalfSignedTransaction2Of3<TNumber extends number | bigint = number>(
  keys: KeyTriple,
  signer1: BIP32Interface,
  signer2: BIP32Interface,
  scriptType: ScriptType2Of3 | 'p2shP2pk',
  network: Network,
  opts: TransactionUtilBuildOptions<TNumber> = {}
): UtxoTransaction<TNumber> {
  return getTransactionBuilder<TNumber>(
    keys,
    [{ signer: signer1, cosigner: signer2 }],
    scriptType,
    network,
    opts
  ).buildIncomplete();
}

export function getFullSignedTransactionP2shP2pk<TNumber extends number | bigint = number>(
  keys: KeyTriple,
  signer1: BIP32Interface,
  network: Network,
  opts: TransactionUtilBuildOptions<TNumber> = {}
): UtxoTransaction<TNumber> {
  return getTransactionBuilder<TNumber>(keys, [{ signer: signer1 }], 'p2shP2pk', network, opts).build();
}

export function getFullSignedTransaction2Of3<TNumber extends number | bigint = number>(
  keys: KeyTriple,
  signer1: BIP32Interface,
  signer2: BIP32Interface,
  scriptType: ScriptType2Of3 | 'p2shP2pk',
  network: Network,
  opts: TransactionUtilBuildOptions<TNumber> = {}
): UtxoTransaction<TNumber> {
  return getTransactionBuilder<TNumber>(
    keys,
    [
      { signer: signer1, cosigner: signer2 },
      { signer: signer2, cosigner: signer1 },
    ],
    scriptType,
    network,
    opts
  ).build();
}

export function getTransactionStages<TNumber extends number | bigint>(
  keys: KeyTriple,
  signer1: BIP32Interface,
  signer2: BIP32Interface,
  scriptType: ScriptType2Of3 | 'p2shP2pk',
  network: Network,
  opts: TransactionUtilBuildOptions<TNumber>
): {
  unsigned: UtxoTransaction<TNumber>;
  halfSigned: UtxoTransaction<TNumber>;
  fullSigned: UtxoTransaction<TNumber>;
} {
  const halfSigned = getHalfSignedTransaction2Of3(keys, signer1, signer2, scriptType, network, opts);
  const fullSigned =
    scriptType === 'p2shP2pk'
      ? halfSigned
      : getFullSignedTransaction2Of3(keys, signer1, signer2, scriptType, network, opts);

  return {
    unsigned: getUnsignedTransaction2Of3(keys, scriptType, network, opts),
    halfSigned,
    fullSigned,
  };
}
