import { UtxoPsbt } from './UtxoPsbt';
import { createTransactionFromBuffer } from './transaction';

export function getTransactionAmountsFromPsbt(psbt: UtxoPsbt): {
  inputCount: number;
  outputCount: number;
  inputAmount: bigint;
  outputAmount: bigint;
  fee: bigint;
} {
  const inputCount = psbt.data.inputs.length;
  const outputCount = psbt.data.outputs.length;
  const txInputs = psbt.txInputs;
  const txOutputs = psbt.txOutputs;
  const inputAmount = psbt.data.inputs.reduce((acc, input, inputIndex) => {
    if (input.witnessUtxo) {
      return acc + BigInt(input.witnessUtxo.value);
    } else if (input.nonWitnessUtxo) {
      const tx = createTransactionFromBuffer(input.nonWitnessUtxo, psbt.network, { amountType: 'bigint' });
      return acc + tx.outs[txInputs[inputIndex].index].value;
    } else {
      throw new Error('missing witnessUtxo and nonWitnessUtxo');
    }
  }, BigInt(0));
  const outputAmount = psbt.data.outputs.reduce(
    (acc, output, outputIndex) => acc + txOutputs[outputIndex].value,
    BigInt(0)
  );
  const fee = inputAmount - outputAmount;
  return {
    inputCount,
    outputCount,
    inputAmount,
    outputAmount,
    fee,
  };
}
