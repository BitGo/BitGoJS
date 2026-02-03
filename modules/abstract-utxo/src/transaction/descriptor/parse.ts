import { ITransactionRecipient } from '@bitgo/sdk-core';
import { Psbt, descriptorWallet } from '@bitgo/wasm-utxo';

import { AbstractUtxoCoin, ParseTransactionOptions } from '../../abstractUtxoCoin';
import { BaseOutput, BaseParsedTransaction, BaseParsedTransactionOutputs } from '../types';
import { getKeySignatures, toBip32Triple, UtxoNamedKeychains } from '../../keychains';
import { getDescriptorMapFromWallet, getPolicyForEnv } from '../../descriptor';
import { IDescriptorWallet } from '../../descriptor/descriptorWallet';
import { fromExtendedAddressFormatToScript, toExtendedAddressFormat } from '../recipient';
import { outputDifferencesWithExpected, OutputDifferenceWithExpected } from '../outputDifference';
import { UtxoCoinName } from '../../names';
import { sumValues, toWasmPsbt, UtxoLibPsbt } from '../../wasmUtil';

type ParsedOutput = Omit<descriptorWallet.ParsedOutput, 'script'> & { script: Buffer };

export type RecipientOutput = Omit<ParsedOutput, 'value'> & {
  value: bigint | 'max';
};

function toRecipientOutput(recipient: ITransactionRecipient, coinName: UtxoCoinName): RecipientOutput {
  return {
    address: recipient.address,
    value: recipient.amount === 'max' ? 'max' : BigInt(recipient.amount),
    script: fromExtendedAddressFormatToScript(recipient.address, coinName),
    scriptId: undefined, // Recipients are external outputs
  };
}

// TODO(BTC-1697): allow outputs with `value: 'max'` here
type ParsedOutputs = OutputDifferenceWithExpected<ParsedOutput, RecipientOutput> & {
  outputs: ParsedOutput[];
  changeOutputs: ParsedOutput[];
};

function parseOutputsWithPsbt(
  psbt: Psbt,
  descriptorMap: descriptorWallet.DescriptorMap,
  recipientOutputs: RecipientOutput[],
  coinName: UtxoCoinName
): ParsedOutputs {
  const parsed = descriptorWallet.parse(psbt, descriptorMap, coinName);
  const outputs: ParsedOutput[] = parsed.outputs.map((output) => ({
    ...output,
    script: Buffer.from(output.script),
  }));
  const changeOutputs = outputs.filter((o) => o.scriptId !== undefined);
  const outputDiffs = outputDifferencesWithExpected(outputs, recipientOutputs);
  return {
    outputs,
    changeOutputs,
    ...outputDiffs,
  };
}

function toBaseOutputs(outputs: ParsedOutput[], coinName: UtxoCoinName): BaseOutput<bigint>[];
function toBaseOutputs(outputs: RecipientOutput[], coinName: UtxoCoinName): BaseOutput<bigint | 'max'>[];
function toBaseOutputs(
  outputs: (ParsedOutput | RecipientOutput)[],
  coinName: UtxoCoinName
): BaseOutput<bigint | 'max'>[] {
  return outputs.map(
    (o): BaseOutput<bigint | 'max'> => ({
      address: toExtendedAddressFormat(o.script, coinName),
      amount: o.value === 'max' ? 'max' : BigInt(o.value),
      external: o.scriptId === undefined,
    })
  );
}

export type ParsedOutputsBigInt = BaseParsedTransactionOutputs<bigint, BaseOutput<bigint | 'max'>>;

function toBaseParsedTransactionOutputs(
  { outputs, changeOutputs, explicitOutputs, implicitOutputs, missingOutputs }: ParsedOutputs,
  coinName: UtxoCoinName
): ParsedOutputsBigInt {
  const explicitExternalOutputs = explicitOutputs.filter((o) => o.scriptId === undefined);
  const implicitExternalOutputs = implicitOutputs.filter((o) => o.scriptId === undefined);
  return {
    outputs: toBaseOutputs(outputs, coinName),
    changeOutputs: toBaseOutputs(changeOutputs, coinName),
    explicitExternalOutputs: toBaseOutputs(explicitExternalOutputs, coinName),
    explicitExternalSpendAmount: sumValues(explicitExternalOutputs),
    implicitExternalOutputs: toBaseOutputs(implicitExternalOutputs, coinName),
    implicitExternalSpendAmount: sumValues(implicitExternalOutputs),
    missingOutputs: toBaseOutputs(missingOutputs, coinName),
  };
}

export function toBaseParsedTransactionOutputsFromPsbt(
  psbt: Psbt | UtxoLibPsbt | Uint8Array,
  descriptorMap: descriptorWallet.DescriptorMap,
  recipients: ITransactionRecipient[],
  coinName: UtxoCoinName
): ParsedOutputsBigInt {
  const wasmPsbt = toWasmPsbt(psbt);
  return toBaseParsedTransactionOutputs(
    parseOutputsWithPsbt(
      wasmPsbt,
      descriptorMap,
      recipients.map((r) => toRecipientOutput(r, coinName)),
      coinName
    ),
    coinName
  );
}

export type ParsedDescriptorTransaction<TAmount extends number | bigint> = BaseParsedTransaction<
  TAmount,
  BaseOutput<TAmount | 'max'>
>;

export function parse(
  coin: AbstractUtxoCoin,
  wallet: IDescriptorWallet,
  params: ParseTransactionOptions<number | bigint>
): ParsedDescriptorTransaction<bigint> {
  if (params.txParams.allowExternalChangeAddress) {
    throw new Error('allowExternalChangeAddress is not supported for descriptor wallets');
  }
  if (params.txParams.changeAddress) {
    throw new Error('changeAddress is not supported for descriptor wallets');
  }
  const keychains = params.verification?.keychains;
  if (!keychains || !UtxoNamedKeychains.is(keychains)) {
    throw new Error('keychain is required for descriptor wallets');
  }
  const { recipients } = params.txParams;
  if (!recipients) {
    throw new Error('recipients is required');
  }
  const psbt = coin.decodeTransactionFromPrebuild(params.txPrebuild);
  let wasmPsbt: Psbt;
  try {
    wasmPsbt = toWasmPsbt(psbt as Psbt | UtxoLibPsbt | Uint8Array);
  } catch (e) {
    throw new Error(`expected psbt to be a wasm-utxo or utxo-lib PSBT: ${e instanceof Error ? e.message : e}`);
  }
  const walletKeys = toBip32Triple(keychains);
  const descriptorMap = getDescriptorMapFromWallet(wallet, walletKeys, getPolicyForEnv(params.wallet.bitgo.env));
  return {
    ...toBaseParsedTransactionOutputsFromPsbt(wasmPsbt, descriptorMap, recipients, coin.name),
    keychains,
    keySignatures: getKeySignatures(wallet) ?? {},
    customChange: undefined,
    needsCustomChangeKeySignatureVerification: false,
  };
}
