import { fixedScriptWallet } from '@bitgo/wasm-utxo';
import { Triple } from '@bitgo/sdk-core';

import type { FixedScriptWalletOutput, Output } from '../types';

import type { TransactionExplanationWasm } from './explainTransaction';

function scriptToAddress(script: Uint8Array): string {
  return `scriptPubKey:${Buffer.from(script).toString('hex')}`;
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
    const address = output.address ?? scriptToAddress(output.script);

    if (output.scriptId) {
      // This is a change output
      changeOutputs.push({
        address,
        amount: output.value.toString(),
        chain: output.scriptId.chain,
        index: output.scriptId.index,
        external: false,
      });
    } else {
      // This is an external output
      outputs.push({
        address,
        amount: output.value.toString(),
        external: true,
      });
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
