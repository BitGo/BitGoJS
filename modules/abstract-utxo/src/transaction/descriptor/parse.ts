import * as utxolib from '@bitgo/utxo-lib';
import { ITransactionRecipient } from '@bitgo/sdk-core';
import * as coreDescriptors from '@bitgo/utxo-core/descriptor';

import {
  AbstractUtxoCoin,
  BaseOutput,
  BaseParsedTransaction,
  BaseParsedTransactionOutputs,
  ParseTransactionOptions,
} from '../../abstractUtxoCoin';
import { getKeySignatures, toBip32Triple, UtxoNamedKeychains } from '../../keychains';
import { getDescriptorMapFromWallet, getPolicyForEnv } from '../../descriptor';
import { IDescriptorWallet } from '../../descriptor/descriptorWallet';
import { fromExtendedAddressFormatToScript, toExtendedAddressFormat } from '../recipient';
import { outputDifferencesWithExpected, OutputDifferenceWithExpected } from '../outputDifference';

type ParsedOutput = coreDescriptors.ParsedOutput;

export type RecipientOutput = Omit<ParsedOutput, 'value'> & {
  value: bigint | 'max';
};

function toRecipientOutput(recipient: ITransactionRecipient, network: utxolib.Network): RecipientOutput {
  return {
    address: recipient.address,
    value: recipient.amount === 'max' ? 'max' : BigInt(recipient.amount),
    script: fromExtendedAddressFormatToScript(recipient.address, network),
  };
}

// TODO(BTC-1697): allow outputs with `value: 'max'` here
type ParsedOutputs = OutputDifferenceWithExpected<ParsedOutput, RecipientOutput> & {
  outputs: ParsedOutput[];
  changeOutputs: ParsedOutput[];
};

function parseOutputsWithPsbt(
  psbt: utxolib.bitgo.UtxoPsbt,
  descriptorMap: coreDescriptors.DescriptorMap,
  recipientOutputs: RecipientOutput[]
): ParsedOutputs {
  const parsed = coreDescriptors.parse(psbt, descriptorMap, psbt.network);
  const changeOutputs = parsed.outputs.filter((o) => o.scriptId !== undefined);
  const outputDiffs = outputDifferencesWithExpected(parsed.outputs, recipientOutputs);
  return {
    outputs: parsed.outputs,
    changeOutputs,
    ...outputDiffs,
  };
}

function sumValues(arr: { value: bigint }[]): bigint {
  return arr.reduce((sum, e) => sum + e.value, BigInt(0));
}

function toBaseOutputs(outputs: ParsedOutput[], network: utxolib.Network): BaseOutput<bigint>[];
function toBaseOutputs(outputs: RecipientOutput[], network: utxolib.Network): BaseOutput<bigint | 'max'>[];
function toBaseOutputs(
  outputs: (ParsedOutput | RecipientOutput)[],
  network: utxolib.Network
): BaseOutput<bigint | 'max'>[] {
  return outputs.map(
    (o): BaseOutput<bigint | 'max'> => ({
      address: toExtendedAddressFormat(o.script, network),
      amount: o.value === 'max' ? 'max' : BigInt(o.value),
      external: o.scriptId === undefined,
    })
  );
}

export type ParsedOutputsBigInt = BaseParsedTransactionOutputs<bigint, BaseOutput<bigint | 'max'>>;

function toBaseParsedTransactionOutputs(
  { outputs, changeOutputs, explicitOutputs, implicitOutputs, missingOutputs }: ParsedOutputs,
  network: utxolib.Network
): ParsedOutputsBigInt {
  const explicitExternalOutputs = explicitOutputs.filter((o) => o.scriptId === undefined);
  const implicitExternalOutputs = implicitOutputs.filter((o) => o.scriptId === undefined);
  return {
    outputs: toBaseOutputs(outputs, network),
    changeOutputs: toBaseOutputs(changeOutputs, network),
    explicitExternalOutputs: toBaseOutputs(explicitExternalOutputs, network),
    explicitExternalSpendAmount: sumValues(explicitExternalOutputs),
    implicitExternalOutputs: toBaseOutputs(implicitExternalOutputs, network),
    implicitExternalSpendAmount: sumValues(implicitExternalOutputs),
    missingOutputs: toBaseOutputs(missingOutputs, network),
  };
}

export function toBaseParsedTransactionOutputsFromPsbt(
  psbt: utxolib.bitgo.UtxoPsbt,
  descriptorMap: coreDescriptors.DescriptorMap,
  recipients: ITransactionRecipient[],
  network: utxolib.Network
): ParsedOutputsBigInt {
  return toBaseParsedTransactionOutputs(
    parseOutputsWithPsbt(
      psbt,
      descriptorMap,
      recipients.map((r) => toRecipientOutput(r, psbt.network))
    ),
    network
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
  if (!(psbt instanceof utxolib.bitgo.UtxoPsbt)) {
    throw new Error('expected psbt to be an instance of UtxoPsbt');
  }
  const walletKeys = toBip32Triple(keychains);
  const descriptorMap = getDescriptorMapFromWallet(wallet, walletKeys, getPolicyForEnv(params.wallet.bitgo.env));
  return {
    ...toBaseParsedTransactionOutputsFromPsbt(psbt, descriptorMap, recipients, psbt.network),
    keychains,
    keySignatures: getKeySignatures(wallet) ?? {},
    customChange: undefined,
    needsCustomChangeKeySignatureVerification: false,
  };
}
