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
  walletXpubs: Triple<string>,
  params: {
    replayProtection: {
      checkSignature?: boolean;
      outputScripts: Buffer[];
    };
  }
): TransactionExplanationWasm {
  const parsed = psbt.parseTransactionWithWalletKeys(walletXpubs, params.replayProtection);

  const changeOutputs: FixedScriptWalletOutput[] = [];
  const outputs: Output[] = [];

  parsed.outputs.forEach((output) => {
    if (isParsedWalletOutput(output)) {
      // This is a change output
      changeOutputs.push(toChangeOutput(output));
    } else if (isParsedExternalOutput(output)) {
      // This is an external output
      outputs.push(toExternalOutput(output));
    } else {
      throw new Error('Invalid output');
    }
  });

  const changeAmount = changeOutputs.reduce((sum, output) => sum + BigInt(output.amount), BigInt(0));
  const outputAmount = outputs.reduce((sum, output) => sum + BigInt(output.amount), BigInt(0));

  return {
    id: psbt.unsignedTxid(),
    outputAmount: outputAmount.toString(),
    changeAmount: changeAmount.toString(),
    outputs,
    changeOutputs,
    fee: parsed.minerFee.toString(),
  };
}
