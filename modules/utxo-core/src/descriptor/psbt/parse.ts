import { Descriptor } from '@bitgo/wasm-miniscript';
import * as utxolib from '@bitgo/utxo-lib';

import { DescriptorMap } from '../DescriptorMap';
import { getVirtualSize } from '../VirtualSize';

import { findDescriptorForInput, findDescriptorForOutput } from './findDescriptors';
import { assertSatisfiable } from './assertSatisfiable';

export type ScriptId = { descriptor: Descriptor; index: number | undefined };

export type ParsedInput = {
  address: string;
  value: bigint;
  scriptId: ScriptId;
};

export type ParsedOutput = {
  address?: string;
  script: Buffer;
  value: bigint;
  scriptId?: ScriptId;
};

export type ParsedDescriptorTransaction = {
  inputs: ParsedInput[];
  outputs: ParsedOutput[];
  spendAmount: bigint;
  minerFee: bigint;
  virtualSize: number;
};

function sum(...values: bigint[]): bigint {
  return values.reduce((a, b) => a + b, BigInt(0));
}

export function parse(
  psbt: utxolib.Psbt,
  descriptorMap: DescriptorMap,
  network: utxolib.Network
): ParsedDescriptorTransaction {
  const inputs = psbt.data.inputs.map((input, inputIndex): ParsedInput => {
    if (!input.witnessUtxo) {
      throw new Error('invalid input: no witnessUtxo');
    }
    if (!input.witnessUtxo.value) {
      throw new Error('invalid input: no value');
    }
    const scriptId = findDescriptorForInput(input, descriptorMap);
    if (!scriptId) {
      throw new Error('invalid input: no descriptor found');
    }
    assertSatisfiable(psbt, inputIndex, scriptId.descriptor);
    return {
      address: utxolib.address.fromOutputScript(input.witnessUtxo.script, network),
      value: input.witnessUtxo.value,
      scriptId,
    };
  });
  const outputs = psbt.txOutputs.map((output, i): ParsedOutput => {
    if (output.value === undefined) {
      throw new Error('invalid output: no value');
    }
    const scriptId = findDescriptorForOutput(output.script, psbt.data.outputs[i], descriptorMap);
    return {
      address: output.address,
      script: output.script,
      value: output.value,
      scriptId,
    };
  });
  const inputAmount = sum(...inputs.map((input) => input.value));
  const outputSum = sum(...outputs.map((output) => output.value));
  const spendAmount = sum(...outputs.filter((output) => !output.scriptId).map((output) => output.value));
  const minerFee = inputAmount - outputSum;
  return {
    inputs,
    outputs,
    spendAmount,
    minerFee,
    virtualSize: getVirtualSize({ inputs: inputs.map((i) => i.scriptId.descriptor), outputs }),
  };
}
