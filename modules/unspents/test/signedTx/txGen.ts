/* eslint-disable @typescript-eslint/ban-ts-comment */

import * as utxolib from '@bitgo/utxo-lib';
import { bip32, BIP32Interface } from '@bitgo/utxo-lib';
import _ from 'lodash';
import 'lodash.combinations';
import { Dimensions } from '../../src';
import {
  InputScriptType,
  TestUnspentType,
  UnspentTypeOpReturn,
  UnspentTypeP2shP2pk,
  UnspentTypePubKeyHash,
  UnspentTypeScript2of3,
} from '../testutils';

interface IUnspent {
  scriptPubKey: Buffer;
  redeemScript?: Buffer;
  witnessScript?: Buffer;
  value: number;
  inputType: utxolib.bitgo.outputScripts.ScriptType;
}

function createUnspent(pubkeys: Buffer[], inputType: string, value: number): IUnspent {
  let spendableScript;
  const scriptType = inputType === 'taprootKeyPathSpend' ? 'p2trMusig2' : inputType;
  if (scriptType === UnspentTypeP2shP2pk) {
    spendableScript = utxolib.bitgo.outputScripts.createOutputScriptP2shP2pk(pubkeys[0]);
  } else if (utxolib.bitgo.outputScripts.isScriptType2Of3(scriptType)) {
    spendableScript = utxolib.bitgo.outputScripts.createOutputScript2of3(pubkeys, scriptType);
  } else {
    throw new Error(`unexpected inputType ${scriptType}`);
  }

  return {
    ...spendableScript,
    value,
    inputType: scriptType,
  };
}

/**
 *
 * @param keys - Pubkeys to use for generating the address.
 *               If unspentType is one of UnspentTypePubKeyHash is used, the first key will be used.
 * @param unspentType {String} - one of UnspentTypeScript2of3 or UnspentTypePubKeyHash
 * @return {String} address
 */
export const createScriptPubKey = (keys: BIP32Interface[], unspentType: TestUnspentType): Buffer => {
  const pubkeys = keys.map((key) => key.publicKey);
  if (typeof unspentType === 'string' && unspentType in UnspentTypeScript2of3) {
    return createUnspent(pubkeys, unspentType, 0).scriptPubKey;
  }

  const pkHash = utxolib.crypto.hash160(pubkeys[0]);
  switch (unspentType) {
    case UnspentTypePubKeyHash.p2pkh:
      return utxolib.payments.p2pkh({ hash: pkHash }).output!;
    case UnspentTypePubKeyHash.p2wpkh:
      return utxolib.payments.p2wpkh({ hash: pkHash }).output!;
  }

  if (unspentType instanceof UnspentTypeOpReturn) {
    const payload = Buffer.alloc(unspentType.size).fill(pubkeys[0]);
    return utxolib.script.compile([0x6a, payload]);
  }

  throw new Error(`unsupported output type ${unspentType}`);
};

const createInputTx = (unspents: any[], inputValue: number) => {
  const txInputBuilder = new utxolib.bitgo.UtxoTransactionBuilder(utxolib.networks.bitcoin);
  txInputBuilder.addInput(Array(32).fill('01').join(''), 0);
  unspents.forEach(({ scriptPubKey }) => txInputBuilder.addOutput(scriptPubKey, inputValue));
  return txInputBuilder.buildIncomplete();
};

function signInput(
  txBuilder: utxolib.bitgo.UtxoTransactionBuilder,
  index: number,
  walletKeys: BIP32Interface[],
  unspent: IUnspent,
  signKeys: BIP32Interface[] = unspent.inputType === 'p2shP2pk' ? [walletKeys[0]] : [walletKeys[0], walletKeys[2]]
) {
  signKeys.forEach((keyPair) => {
    if (unspent.inputType === 'p2shP2pk') {
      utxolib.bitgo.signInputP2shP2pk(txBuilder, index, keyPair);
    } else {
      if (signKeys.length !== 2) {
        throw new Error(`invalid signKeys length`);
      }
      const cosigner = keyPair === signKeys[0] ? signKeys[1] : signKeys[0];
      utxolib.bitgo.signInput2Of3(
        txBuilder,
        index,
        unspent.inputType,
        walletKeys.map((k) => k.publicKey) as utxolib.bitgo.Triple<Buffer>,
        keyPair,
        cosigner.publicKey,
        unspent.value
      );
    }
  });
}

class TxCombo {
  public unspents: IUnspent[];
  public inputTx: any;

  constructor(
    public walletKeys: BIP32Interface[],
    public inputTypes: string[],
    public outputTypes: TestUnspentType[],
    public expectedDims: Readonly<Dimensions> = Dimensions.ZERO,
    public signKeys?: BIP32Interface[],
    public inputValue: number = 10
  ) {
    this.unspents = inputTypes.map((inputType) =>
      createUnspent(
        walletKeys.map((key) => key.publicKey),
        inputType,
        this.inputValue
      )
    );
    this.inputTx = createInputTx(this.unspents, inputValue);
  }

  public getBuilderWithUnsignedTx(): utxolib.bitgo.UtxoTransactionBuilder {
    const txBuilder = utxolib.bitgo.createTransactionBuilderForNetwork(utxolib.networks.bitcoin);
    this.inputTx.outs.forEach(({}, i: number) => txBuilder.addInput(this.inputTx, i));
    this.outputTypes.forEach((unspentType) =>
      txBuilder.addOutput(createScriptPubKey(this.walletKeys, unspentType), this.inputValue)
    );
    return txBuilder;
  }

  public getUnsignedTx(): utxolib.bitgo.UtxoTransaction {
    return this.getBuilderWithUnsignedTx().buildIncomplete();
  }

  public getSignedTx(): utxolib.Transaction {
    const txBuilder = this.getBuilderWithUnsignedTx();
    this.unspents.forEach((unspent, i) => {
      signInput(txBuilder, i, this.walletKeys, unspent, this.signKeys);
    });
    return txBuilder.build();
  }
}

const runCombinations = (
  {
    inputTypes,
    maxNInputs,
    outputTypes,
    maxNOutputs,
  }: {
    inputTypes: InputScriptType[];
    maxNInputs: number;
    outputTypes: TestUnspentType[];
    maxNOutputs: number;
  },
  callback: (inputCombo: InputScriptType[], outputCombo: TestUnspentType[]) => void
): void => {
  // Create combinations of different input and output types. Length between 1 and 3.
  const inputCombinations = _.flatten(
    // @ts-ignore
    [...Array(maxNInputs)].map((__, i) => _.combinations(inputTypes, i + 1))
  );
  const outputCombinations = _.flatten(
    // @ts-ignore
    [...Array(maxNOutputs)].map((__, i) => _.combinations(outputTypes, i + 1))
  );

  inputCombinations.forEach((inputTypeCombo) =>
    outputCombinations.forEach((outputTypeCombo) => {
      callback(inputTypeCombo, outputTypeCombo);
    })
  );
};

class Histogram {
  public total = 0;

  constructor(public map: Map<number, number> = new Map()) {}

  public add(size: number): void {
    this.map.set(size, (this.map.get(size) || 0) + 1);
    this.total++;
  }

  public asSortedArray(): number[][] {
    return [...this.map.entries()].sort(([a], [b]) => a - b);
  }

  public asFullSortedArray(): number[][] {
    return _.range(this.getPercentile(0), this.getPercentile(1)).map((v) => [v, this.map.get(v) || 0]);
  }

  public getPercentile(p: number): number {
    if (0 > p || p > 1) {
      throw new Error(`p must be between 0 and 1`);
    }

    let sum = 0;
    for (const [k, v] of this.asSortedArray()) {
      sum += v;
      if (sum / this.total >= p) {
        return k;
      }
    }

    throw new Error('could not find percentile');
  }

  public toString(): string {
    const keys = [...this.map.keys()].sort((a, b) => a - b);
    return `[${keys.map((k) => `[${k}, ${this.map.get(k)}]`).join(' ')}]`;
  }
}

const getKeyTriplets = (prefix: string, count: number) =>
  [...Array(count)].map((v, i) =>
    [1, 2, 3].map((j) => bip32.fromSeed(Buffer.alloc(16, `${prefix}/${i}/${j}`), utxolib.networks.bitcoin))
  );

/**
 *
 * Calls `callback` with a variety of signed txs, based on input parameters
 * Callback arguments are
 *   inputType, inputCount, outputType, txs
 *  where `txs` implements `forEach()`
 *
 * @param inputTypes - input types to test
 * @param nInputKeyTriplets - number of different input key triples to cycle through
 * @param outputTypes - output types to test
 * @param nOutputKeyTriplets - number of different output key triplets to cycle through
 * @param callback
 */
const runSignedTransactions = (
  {
    inputTypes,
    nInputKeyTriplets,
    outputTypes,
    nOutputKeyTriplets,
  }: {
    inputTypes: Array<{ inputType: string; count: number }>;
    nInputKeyTriplets: number;
    outputTypes: TestUnspentType[];
    nOutputKeyTriplets: number;
  },
  callback: (inputType: string, inputCount: number, outputType: TestUnspentType, txs: any) => void
): void => {
  const inputKeyTriplets = getKeyTriplets('test/input/', nInputKeyTriplets);
  const outputKeyTriplets = getKeyTriplets('test/output/', nOutputKeyTriplets);
  const outputValue = 1e8;

  inputTypes.forEach(({ inputType, count: inputCount }) => {
    const inputTxs = inputKeyTriplets.map((inputKeys) => {
      const unspents = [...Array(inputCount)].map(() =>
        createUnspent(
          inputKeys.map((key) => key.publicKey),
          inputType,
          outputValue
        )
      );
      const inputTx = createInputTx(unspents, outputValue);
      return { inputKeys, unspents, inputTx };
    });

    outputTypes.forEach((outputType) => {
      const outputs = outputKeyTriplets.map((outputKeys) => createScriptPubKey(outputKeys, outputType));

      const txs = {
        forEach(cb: (tx: utxolib.Transaction) => void) {
          inputTxs.forEach(({ inputKeys, unspents, inputTx }) => {
            outputs.forEach((scriptPubKey) => {
              const txBuilder = utxolib.bitgo.createTransactionBuilderForNetwork(utxolib.networks.bitcoin);
              inputTx.outs.forEach((v: any, i: number) => txBuilder.addInput(inputTx, i));
              txBuilder.addOutput(scriptPubKey, outputValue);
              unspents.forEach((unspent, i) => {
                signInput(txBuilder, i, inputKeys, unspent);
              });

              cb(txBuilder.build());
            });
          });
        },
      };

      callback(inputType, inputCount, outputType, txs);
    });
  });
};

export { TxCombo, Histogram, runCombinations, runSignedTransactions };
