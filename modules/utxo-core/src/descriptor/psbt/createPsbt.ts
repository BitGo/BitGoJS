import * as utxolib from '@bitgo/utxo-lib';
import { Descriptor } from '@bitgo/wasm-miniscript';

import { DerivedDescriptorWalletOutput, WithOptDescriptor } from '../Output';
import { Output } from '../../Output';

import { toUtxoPsbt, toWrappedPsbt } from './wrap';
import { assertSatisfiable } from './assertSatisfiable';

/**
 * Non-Final (Replaceable)
 * Reference: https://github.com/bitcoin/bitcoin/blob/v25.1/src/rpc/rawtransaction_util.cpp#L49
 * */
export const MAX_BIP125_RBF_SEQUENCE = 0xffffffff - 2;

function updateInputsWithDescriptors(psbt: utxolib.bitgo.UtxoPsbt, descriptors: Descriptor[]) {
  if (psbt.txInputs.length !== descriptors.length) {
    throw new Error(`Input count mismatch (psbt=${psbt.txInputs.length}, descriptors=${descriptors.length})`);
  }
  const wrappedPsbt = toWrappedPsbt(psbt);
  for (const [inputIndex, descriptor] of descriptors.entries()) {
    assertSatisfiable(psbt, inputIndex, descriptor);
    wrappedPsbt.updateInputWithDescriptor(inputIndex, descriptor);
  }
  const unwrappedPsbt = toUtxoPsbt(wrappedPsbt, psbt.network);
  for (const inputIndex in psbt.txInputs) {
    psbt.data.inputs[inputIndex] = unwrappedPsbt.data.inputs[inputIndex];
  }
}

function updateOutputsWithDescriptors(psbt: utxolib.bitgo.UtxoPsbt, descriptors: WithOptDescriptor<Output>[]) {
  const wrappedPsbt = toWrappedPsbt(psbt);
  for (const [outputIndex, { descriptor }] of descriptors.entries()) {
    if (descriptor) {
      wrappedPsbt.updateOutputWithDescriptor(outputIndex, descriptor);
    }
  }
  const unwrappedPsbt = toUtxoPsbt(wrappedPsbt, psbt.network);
  for (const outputIndex in psbt.txOutputs) {
    psbt.data.outputs[outputIndex] = unwrappedPsbt.data.outputs[outputIndex];
  }
}

export type PsbtParams = {
  network: utxolib.Network;
  version?: number;
  locktime?: number;
  sequence?: number;
};

export function createPsbt(
  params: PsbtParams,
  inputs: DerivedDescriptorWalletOutput[],
  outputs: WithOptDescriptor<Output>[]
): utxolib.bitgo.UtxoPsbt {
  const psbt = utxolib.bitgo.UtxoPsbt.createPsbt({ network: params.network });
  psbt.setVersion(params.version ?? 2);
  psbt.setLocktime(params.locktime ?? 0);
  psbt.addInputs(inputs.map((i) => ({ ...i, sequence: params.sequence ?? MAX_BIP125_RBF_SEQUENCE })));
  psbt.addOutputs(outputs);
  updateInputsWithDescriptors(
    psbt,
    inputs.map((i) => i.descriptor)
  );
  updateOutputsWithDescriptors(psbt, outputs);
  return psbt;
}
