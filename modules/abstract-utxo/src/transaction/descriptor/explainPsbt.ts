import { ITransactionRecipient } from '@bitgo/sdk-core';
import { Psbt, descriptorWallet } from '@bitgo/wasm-utxo';

import type { TransactionExplanationDescriptor } from '../fixedScript/explainTransaction';
import { UtxoCoinName } from '../../names';
import { sumValues } from '../../wasmUtil';

function toRecipient(output: descriptorWallet.ParsedOutput, coinName: UtxoCoinName): ITransactionRecipient {
  const address = output.address ?? `scriptPubKey:${Buffer.from(output.script).toString('hex')}`;
  return {
    address,
    amount: output.value.toString(),
  };
}

function getInputSignaturesForInputIndex(psbt: Psbt, inputIndex: number): number {
  if (!psbt.hasPartialSignatures(inputIndex)) {
    return 0;
  }
  const partialSigs = psbt.getPartialSignatures(inputIndex);
  return partialSigs.reduce((agg, p) => {
    const valid = psbt.validateSignatureAtInput(inputIndex, p.pubkey);
    return agg + (valid ? 1 : 0);
  }, 0);
}

function getInputSignatures(psbt: Psbt): number[] {
  return Array.from({ length: psbt.inputCount() }, (_, i) => getInputSignaturesForInputIndex(psbt, i));
}

export function explainPsbt(
  psbt: Psbt,
  descriptors: descriptorWallet.DescriptorMap,
  coinName: UtxoCoinName
): TransactionExplanationDescriptor {
  const parsedTransaction = descriptorWallet.parse(psbt, descriptors, coinName);
  const { inputs, outputs } = parsedTransaction;
  const externalOutputs = outputs.filter((o) => o.scriptId === undefined);
  const changeOutputs = outputs.filter((o) => o.scriptId !== undefined);
  const fee = sumValues(inputs) - sumValues(outputs);
  const inputSignatures = getInputSignatures(psbt);
  return {
    inputSignatures,
    signatures: inputSignatures.reduce((a, b) => Math.min(a, b), Infinity),
    locktime: psbt.lockTime(),
    id: psbt.unsignedTxId(),
    outputs: externalOutputs.map((o) => toRecipient(o, coinName)),
    outputAmount: sumValues(externalOutputs).toString(),
    changeOutputs: changeOutputs.map((o) => toRecipient(o, coinName)),
    changeAmount: sumValues(changeOutputs).toString(),
    fee: fee.toString(),
  };
}
