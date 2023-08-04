import * as utxolib from '@bitgo/utxo-lib';

export type ParserTx = utxolib.bitgo.UtxoTransaction<bigint> | utxolib.bitgo.UtxoPsbt;
export type ParserTxInput =
  | utxolib.TxInput /* txinput has the TxOutPoint and also script and witness data */
  | utxolib.PsbtTxInput /* this is basically equivalent to TxOutPoint only */;
export type ParserTxOutput = utxolib.TxOutput<bigint> | utxolib.PsbtTxOutput;

export function getPrevOut(
  prevOutput: utxolib.bitgo.PsbtInput,
  prevOutpoint: utxolib.PsbtTxInput | number,
  network: utxolib.Network
):
  | {
      value: bigint;
      script: Buffer;
    }
  | undefined {
  if (prevOutput.witnessUtxo) {
    return prevOutput.witnessUtxo;
  }
  const outputIndex =
    typeof prevOutpoint === 'number' ? prevOutpoint : utxolib.bitgo.getOutputIdForInput(prevOutpoint).vout;
  if (prevOutput.nonWitnessUtxo) {
    const tx = utxolib.bitgo.createTransactionFromBuffer(prevOutput.nonWitnessUtxo, network, { amountType: 'bigint' });
    return tx.outs[outputIndex];
  }
  return undefined;
}

function getOutputSum(outputs: { value: bigint }[]): bigint {
  return outputs.reduce((sum, o) => sum + o.value, BigInt(0));
}

type ParserTxProperties = {
  format: 'network' | 'legacy' | 'psbt';
  complete: boolean;
  id: string;
  weight: number;
  inputs: ParserTxInput[];
  outputs: ParserTxOutput[];
  outputSum: bigint;
  inputSum: bigint | undefined;
  hasWitnesses: boolean;
};

export function getParserTxProperties(
  tx: ParserTx,
  prevOutputs: utxolib.TxOutput<bigint>[] | undefined
): ParserTxProperties {
  if (tx instanceof utxolib.bitgo.UtxoTransaction) {
    let complete = true;
    try {
      const txb = utxolib.bitgo.createTransactionBuilderFromTransaction(tx);
      txb.build();
    } catch (e) {
      complete = false;
    }
    return {
      format: complete ? 'network' : 'legacy',
      complete,
      id: tx.getId(),
      weight: tx.weight(),
      inputs: tx.ins,
      outputs: tx.outs,
      outputSum: getOutputSum(tx.outs),
      inputSum: prevOutputs ? getOutputSum(prevOutputs) : undefined,
      hasWitnesses: tx.hasWitnesses(),
    };
  }

  if (tx instanceof utxolib.bitgo.UtxoPsbt) {
    let signedTx;
    let complete = true;
    try {
      const clone = tx.clone();
      clone.finalizeAllInputs();
      signedTx = clone.extractTransaction();
    } catch (e) {
      complete = false;
      // ignore
    }

    const unsignedTx = tx.getUnsignedTx();

    return {
      format: 'psbt',
      complete,
      id: (signedTx ?? unsignedTx).getId(),
      weight: (signedTx ?? unsignedTx).weight(),
      inputs: tx.txInputs,
      outputs: tx.txOutputs,
      outputSum: getOutputSum(tx.txOutputs),
      inputSum: tx.data.inputs
        .map((input, i) => getPrevOut(input, tx.txInputs[i], tx.network)?.value)
        .reduce(
          (sum: bigint | undefined, v: bigint | undefined) =>
            sum === undefined || v === undefined ? undefined : sum + v,
          BigInt(0)
        ),
      hasWitnesses: tx.data.inputs.some((i) => i.witnessUtxo !== undefined),
    };
  }

  throw new Error('unknown transaction type');
}

export function getParserTxFromBytes(
  bytes: Buffer,
  params: {
    network: utxolib.Network;
    txid?: string;
    finalize?: boolean;
    prevOutputs?: utxolib.TxOutput<bigint>[];
  }
): ParserTx {
  let tx = utxolib.bitgo.isPsbt(bytes)
    ? utxolib.bitgo.createPsbtFromBuffer(bytes, params.network)
    : utxolib.bitgo.createTransactionFromBuffer(bytes, params.network, { amountType: 'bigint' });

  const properties = getParserTxProperties(tx, undefined);
  if (tx instanceof utxolib.bitgo.UtxoTransaction) {
    if (params.txid && properties.id !== params.txid) {
      throw new Error(`computed txid does not match txid argument`);
    }
  } else if (params.finalize) {
    tx.finalizeAllInputs();
    tx = tx.extractTransaction();
  }

  return tx;
}

export function getParserTxInputProperties(
  input: ParserTxInput,
  prevOut?: utxolib.bitgo.PsbtInput
): {
  txid: string;
  vout: number;
  sequence?: number;
  script?: Buffer;
  witness?: Buffer[];
} {
  const outputId = utxolib.bitgo.getOutputIdForInput(input);
  if ('sequence' in input && 'script' in input && 'witness' in input) {
    // full-signed or legacy case
    return {
      ...outputId,
      sequence: input.sequence,
      script: input.script,
      witness: input.witness,
    };
  }

  if (!prevOut) {
    throw new Error('missing prevOut');
  }
  return {
    ...outputId,
    sequence: input.sequence,
    script: prevOut.redeemScript,
    witness: prevOut.witnessScript ? [prevOut.witnessScript] : [],
  };
}
