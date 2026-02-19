import { fixedScriptWallet } from '@bitgo/wasm-utxo';
import { Triple } from '@bitgo/sdk-core';

import type { FixedScriptWalletOutput, Output } from '../types';

import type { TransactionExplanationWasm } from './explainTransaction';

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

function toChangeOutput(output: ParsedWalletOutput): FixedScriptWalletOutput {
  return {
    address: output.address ?? scriptToAddress(output.script),
    amount: output.value.toString(),
    chain: output.scriptId.chain,
    index: output.scriptId.index,
    external: false,
  };
}

function toExternalOutput(output: ParsedExternalOutput): Output {
  return {
    address: output.address ?? scriptToAddress(output.script),
    amount: output.value.toString(),
    external: true,
  };
}

export function explainPsbtWasm(
  psbt: fixedScriptWallet.BitGoPsbt,
  walletXpubs: Triple<string> | fixedScriptWallet.RootWalletKeys,
  params: {
    replayProtection: {
      checkSignature?: boolean;
      publicKeys: Buffer[];
    };
    customChangeWalletXpubs?: Triple<string> | fixedScriptWallet.RootWalletKeys;
  }
): TransactionExplanationWasm {
  const parsed = psbt.parseTransactionWithWalletKeys(walletXpubs, { replayProtection: params.replayProtection });

  const changeOutputs: FixedScriptWalletOutput[] = [];
  const outputs: Output[] = [];
  const parsedCustomChangeOutputs = params.customChangeWalletXpubs
    ? psbt.parseOutputsWithWalletKeys(params.customChangeWalletXpubs)
    : undefined;

  const customChangeOutputs: FixedScriptWalletOutput[] = [];

  parsed.outputs.forEach((output, i) => {
    const parseCustomChangeOutput = parsedCustomChangeOutputs?.[i];
    if (isParsedWalletOutput(output)) {
      // This is a change output
      changeOutputs.push(toChangeOutput(output));
    } else if (parseCustomChangeOutput && isParsedWalletOutput(parseCustomChangeOutput)) {
      customChangeOutputs.push(toChangeOutput(parseCustomChangeOutput));
    } else if (isParsedExternalOutput(output)) {
      outputs.push(toExternalOutput(output));
    } else {
      throw new Error('Invalid output');
    }
  });

  const outputAmount = outputs.reduce((sum, output) => sum + BigInt(output.amount), BigInt(0));
  const changeAmount = changeOutputs.reduce((sum, output) => sum + BigInt(output.amount), BigInt(0));
  const customChangeAmount = customChangeOutputs.reduce((sum, output) => sum + BigInt(output.amount), BigInt(0));

  return {
    id: psbt.unsignedTxid(),
    outputAmount: outputAmount.toString(),
    changeAmount: changeAmount.toString(),
    customChangeAmount: customChangeAmount.toString(),
    outputs,
    changeOutputs,
    customChangeOutputs,
    fee: parsed.minerFee.toString(),
  };
}
