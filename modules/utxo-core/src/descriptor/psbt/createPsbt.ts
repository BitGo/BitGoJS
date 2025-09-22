import { TapLeafScript } from 'bip174/src/lib/interfaces';
import * as utxolib from '@bitgo-beta/utxo-lib';
import { Descriptor, Miniscript } from '@bitgo/wasm-miniscript';

import { DerivedDescriptorWalletOutput, WithOptDescriptor } from '../Output';
import { Output } from '../../Output';

import { toUtxoPsbt, toWrappedPsbt } from './wrap';
import { assertSatisfiable } from './assertSatisfiable';

/**
 * Non-Final (Replaceable)
 * Reference: https://github.com/bitcoin/bitcoin/blob/v25.1/src/rpc/rawtransaction_util.cpp#L49
 * */
export const MAX_BIP125_RBF_SEQUENCE = 0xffffffff - 2;

export function findTapLeafScript(input: TapLeafScript[], script: Buffer | Miniscript): TapLeafScript {
  if (!Buffer.isBuffer(script)) {
    script = Buffer.from(script.encode());
  }
  const matches = input.filter((leaf) => {
    return leaf.script.equals(script);
  });
  if (matches.length === 0) {
    throw new Error(`No tapLeafScript found for script: ${script.toString('hex')}`);
  }
  if (matches.length > 1) {
    throw new Error(`Multiple tapLeafScripts found for script: ${script.toString('hex')}`);
  }
  return matches[0];
}

function updateInputsWithDescriptors(
  psbt: utxolib.bitgo.UtxoPsbt,
  inputParams: Array<{ descriptor: Descriptor; selectTapLeafScript?: Miniscript }>
) {
  if (psbt.txInputs.length !== inputParams.length) {
    throw new Error(`Input count mismatch (psbt=${psbt.txInputs.length}, inputParams=${inputParams.length})`);
  }
  const wrappedPsbt = toWrappedPsbt(psbt);
  for (const [inputIndex, v] of inputParams.entries()) {
    assertSatisfiable(psbt, inputIndex, v.descriptor);
    wrappedPsbt.updateInputWithDescriptor(inputIndex, v.descriptor);
  }
  const unwrappedPsbt = toUtxoPsbt(wrappedPsbt, psbt.network);
  for (const inputIndex in psbt.txInputs) {
    const preparedInput = unwrappedPsbt.data.inputs[inputIndex];
    const v = inputParams[inputIndex];
    if (v.selectTapLeafScript && preparedInput.tapLeafScript) {
      const selected = findTapLeafScript(preparedInput.tapLeafScript, v.selectTapLeafScript);
      preparedInput.tapLeafScript = [selected];
    }
    psbt.data.inputs[inputIndex] = preparedInput;
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

export type DerivedDescriptorTransactionInput = DerivedDescriptorWalletOutput & {
  selectTapLeafScript?: Miniscript;
  sequence?: number;
};

export function createPsbt(
  params: PsbtParams,
  inputs: DerivedDescriptorTransactionInput[],
  outputs: WithOptDescriptor<Output>[]
): utxolib.bitgo.UtxoPsbt {
  const psbt = utxolib.bitgo.UtxoPsbt.createPsbt({ network: params.network });
  psbt.setVersion(params.version ?? 2);
  psbt.setLocktime(params.locktime ?? 0);
  psbt.addInputs(inputs.map((i) => ({ ...i, sequence: i.sequence ?? params.sequence ?? MAX_BIP125_RBF_SEQUENCE })));
  psbt.addOutputs(outputs);
  updateInputsWithDescriptors(
    psbt,
    inputs.map(({ descriptor, selectTapLeafScript }) => ({
      descriptor,
      selectTapLeafScript,
    }))
  );
  updateOutputsWithDescriptors(psbt, outputs);
  return psbt;
}
