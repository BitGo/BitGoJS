import { fixedScriptWallet } from '@bitgo/wasm-utxo';
import { Triple } from '@bitgo/sdk-core';

import type { FixedScriptWalletOutput, Output, BitGoPsbt } from '../types.js';

import type { TransactionExplanationWasm } from './explainTransaction.js';

function scriptToAddress(script: Uint8Array): string {
  return `scriptPubKey:${Buffer.from(script).toString('hex')}`;
}

type ParsedWalletOutput = fixedScriptWallet.ParsedOutput & { scriptId: fixedScriptWallet.ScriptId };
type ParsedExternalOutput = fixedScriptWallet.ParsedOutput & { scriptId: null };

function isParsedWalletOutput(output: ParsedWalletOutput | ParsedExternalOutput): output is ParsedWalletOutput {
  return output.scriptId !== null;
}

function isParsedExternalOutput(output: ParsedWalletOutput | ParsedExternalOutput): output is ParsedExternalOutput {
  return output.scriptId === null;
}

function toChangeOutputBigInt(output: ParsedWalletOutput): FixedScriptWalletOutput<bigint> {
  return {
    address: output.address ?? scriptToAddress(output.script),
    amount: output.value,
    chain: output.scriptId.chain,
    index: output.scriptId.index,
    external: false,
  };
}

function toExternalOutputBigInt(output: ParsedExternalOutput): Output<bigint> {
  return {
    address: output.address ?? scriptToAddress(output.script),
    amount: output.value,
    external: true,
  };
}

interface ExplainPsbtWasmParams {
  replayProtection: {
    checkSignature?: boolean;
    publicKeys: Buffer[];
  };
  customChangeWalletXpubs?: Triple<string> | fixedScriptWallet.RootWalletKeys;
}

export interface ExplainedInput<TAmount = bigint> {
  address: string;
  value: TAmount;
}

export interface TransactionExplanationBigInt {
  id: string;
  inputs: ExplainedInput[];
  inputAmount: bigint;
  outputs: Output<bigint>[];
  changeOutputs: FixedScriptWalletOutput<bigint>[];
  customChangeOutputs: FixedScriptWalletOutput<bigint>[];
  outputAmount: bigint;
  changeAmount: bigint;
  customChangeAmount: bigint;
  fee: bigint;
}

export function explainPsbtWasmBigInt(
  psbt: BitGoPsbt,
  walletXpubs: Triple<string> | fixedScriptWallet.RootWalletKeys,
  params: ExplainPsbtWasmParams
): TransactionExplanationBigInt {
  const parsed = psbt.parseTransactionWithWalletKeys(walletXpubs, { replayProtection: params.replayProtection });

  const changeOutputs: FixedScriptWalletOutput<bigint>[] = [];
  const outputs: Output<bigint>[] = [];
  const parsedCustomChangeOutputs = params.customChangeWalletXpubs
    ? psbt.parseOutputsWithWalletKeys(params.customChangeWalletXpubs)
    : undefined;

  const customChangeOutputs: FixedScriptWalletOutput<bigint>[] = [];

  parsed.outputs.forEach((output, i) => {
    const parseCustomChangeOutput = parsedCustomChangeOutputs?.[i];
    if (isParsedWalletOutput(output)) {
      changeOutputs.push(toChangeOutputBigInt(output));
    } else if (parseCustomChangeOutput && isParsedWalletOutput(parseCustomChangeOutput)) {
      customChangeOutputs.push(toChangeOutputBigInt(parseCustomChangeOutput));
    } else if (isParsedExternalOutput(output)) {
      outputs.push(toExternalOutputBigInt(output));
    } else {
      throw new Error('Invalid output');
    }
  });

  const inputs = parsed.inputs.map((input) => ({ address: input.address, value: input.value }));
  const inputAmount = inputs.reduce((sum, input) => sum + input.value, 0n);
  const outputAmount = outputs.reduce((sum, output) => sum + output.amount, 0n);
  const changeAmount = changeOutputs.reduce((sum, output) => sum + output.amount, 0n);
  const customChangeAmount = customChangeOutputs.reduce((sum, output) => sum + output.amount, 0n);

  return {
    id: psbt.unsignedTxId(),
    inputs,
    inputAmount,
    outputs,
    changeOutputs,
    customChangeOutputs,
    outputAmount,
    changeAmount,
    customChangeAmount,
    fee: parsed.minerFee,
  };
}

function stringifyOutput(output: Output<bigint>): Output {
  return { ...output, amount: output.amount.toString() };
}

function stringifyChangeOutput(output: FixedScriptWalletOutput<bigint>): FixedScriptWalletOutput {
  return { ...output, amount: output.amount.toString() };
}

export function explainPsbtWasm(
  psbt: BitGoPsbt,
  walletXpubs: Triple<string> | fixedScriptWallet.RootWalletKeys,
  params: ExplainPsbtWasmParams
): TransactionExplanationWasm {
  const result = explainPsbtWasmBigInt(psbt, walletXpubs, params);
  return {
    id: result.id,
    inputs: result.inputs.map((i) => ({ address: i.address, value: i.value.toString() })),
    inputAmount: result.inputAmount.toString(),
    outputAmount: result.outputAmount.toString(),
    changeAmount: result.changeAmount.toString(),
    customChangeAmount: result.customChangeAmount.toString(),
    outputs: result.outputs.map(stringifyOutput),
    changeOutputs: result.changeOutputs.map(stringifyChangeOutput),
    customChangeOutputs: result.customChangeOutputs.map(stringifyChangeOutput),
    fee: result.fee.toString(),
  };
}

export interface AggregatedTransactionExplanation {
  inputCount: number;
  outputCount: number;
  changeOutputCount: number;
  inputAmount: bigint;
  outputAmount: bigint;
  changeAmount: bigint;
  fee: bigint;
}

export function aggregateTransactionExplanations(
  explanations: TransactionExplanationBigInt[]
): AggregatedTransactionExplanation {
  let inputCount = 0;
  let outputCount = 0;
  let changeOutputCount = 0;
  let fee = 0n;
  let inputAmount = 0n;
  let outputAmount = 0n;
  let changeAmount = 0n;

  for (const e of explanations) {
    inputCount += e.inputs.length;
    outputCount += e.outputs.length;
    changeOutputCount += e.changeOutputs.length;
    fee += e.fee;
    inputAmount += e.inputAmount;
    outputAmount += e.outputAmount;
    changeAmount += e.changeAmount;
  }

  return {
    inputCount,
    outputCount,
    changeOutputCount,
    inputAmount,
    outputAmount,
    changeAmount,
    fee,
  };
}
