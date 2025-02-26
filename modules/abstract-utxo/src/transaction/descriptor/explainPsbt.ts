import * as utxolib from '@bitgo/utxo-lib';
import { ITransactionRecipient } from '@bitgo/sdk-core';
import * as coreDescriptors from '@bitgo/utxo-core/descriptor';

import { toExtendedAddressFormat } from '../recipient';
import { TransactionExplanation } from '../../abstractUtxoCoin';

function toRecipient(output: coreDescriptors.ParsedOutput, network: utxolib.Network): ITransactionRecipient {
  return {
    address: toExtendedAddressFormat(output.script, network),
    amount: output.value.toString(),
  };
}

function sumValues(arr: { value: bigint }[]): bigint {
  return arr.reduce((sum, e) => sum + e.value, BigInt(0));
}

function getInputSignaturesForInputIndex(psbt: utxolib.bitgo.UtxoPsbt, inputIndex: number): number {
  const { partialSig } = psbt.data.inputs[inputIndex];
  if (!partialSig) {
    return 0;
  }
  return partialSig.reduce((agg, p) => {
    const valid = psbt.validateSignaturesOfInputCommon(inputIndex, p.pubkey);
    return agg + (valid ? 1 : 0);
  }, 0);
}

function getInputSignatures(psbt: utxolib.bitgo.UtxoPsbt): number[] {
  return psbt.data.inputs.map((_, i) => getInputSignaturesForInputIndex(psbt, i));
}

export function explainPsbt(
  psbt: utxolib.bitgo.UtxoPsbt,
  descriptors: coreDescriptors.DescriptorMap
): TransactionExplanation {
  const parsedTransaction = coreDescriptors.parse(psbt, descriptors, psbt.network);
  const { inputs, outputs } = parsedTransaction;
  const externalOutputs = outputs.filter((o) => o.scriptId === undefined);
  const changeOutputs = outputs.filter((o) => o.scriptId !== undefined);
  const fee = sumValues(inputs) - sumValues(outputs);
  const inputSignatures = getInputSignatures(psbt);
  return {
    inputSignatures,
    signatures: inputSignatures.reduce((a, b) => Math.min(a, b), Infinity),
    locktime: psbt.locktime,
    id: psbt.getUnsignedTx().getId(),
    outputs: externalOutputs.map((o) => toRecipient(o, psbt.network)),
    outputAmount: sumValues(externalOutputs).toString(),
    changeOutputs: changeOutputs.map((o) => toRecipient(o, psbt.network)),
    changeAmount: sumValues(changeOutputs).toString(),
    fee: fee.toString(),
  };
}
