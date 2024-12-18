import * as utxolib from '@bitgo/utxo-lib';
import { ITransactionRecipient } from '@bitgo/sdk-core';

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
import * as coreDescriptors from '../../core/descriptor';
import { ParsedOutput } from '../../core/descriptor/psbt/parse';
import { fromExtendedAddressFormatToScript, toExtendedAddressFormat } from '../recipient';

import { outputDifferencesWithExpected, OutputDifferenceWithExpected } from './outputDifference';

function toParsedOutput(recipient: ITransactionRecipient, network: utxolib.Network): ParsedOutput {
  return {
    address: recipient.address,
    value: BigInt(recipient.amount),
    script: fromExtendedAddressFormatToScript(recipient.address, network),
  };
}

type ParsedOutputs = OutputDifferenceWithExpected<ParsedOutput> & {
  outputs: ParsedOutput[];
  changeOutputs: ParsedOutput[];
};

function parseOutputsWithPsbt(
  psbt: utxolib.bitgo.UtxoPsbt,
  descriptorMap: coreDescriptors.DescriptorMap,
  recipientOutputs: ParsedOutput[]
): ParsedOutputs {
  const parsed = coreDescriptors.parse(psbt, descriptorMap, psbt.network);
  const externalOutputs = parsed.outputs.filter((o) => o.scriptId === undefined);
  const changeOutputs = parsed.outputs.filter((o) => o.scriptId !== undefined);
  const outputDiffs = outputDifferencesWithExpected(externalOutputs, recipientOutputs);
  return {
    outputs: parsed.outputs,
    changeOutputs,
    ...outputDiffs,
  };
}

function sumValues(arr: { value: bigint }[]): bigint {
  return arr.reduce((sum, e) => sum + e.value, BigInt(0));
}

function toBaseOutputs(outputs: ParsedOutput[], network: utxolib.Network): BaseOutput<bigint>[] {
  return outputs.map(
    (o): BaseOutput<bigint> => ({
      address: toExtendedAddressFormat(o.script, network),
      amount: BigInt(o.value),
      external: o.scriptId === undefined,
    })
  );
}

export type ParsedOutputsBigInt = BaseParsedTransactionOutputs<bigint, BaseOutput<bigint>>;

function toBaseParsedTransactionOutputs(
  { outputs, changeOutputs, explicitExternalOutputs, implicitExternalOutputs, missingOutputs }: ParsedOutputs,
  network: utxolib.Network
): ParsedOutputsBigInt {
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
      recipients.map((r) => toParsedOutput(r, psbt.network))
    ),
    network
  );
}

export type ParsedDescriptorTransaction<TAmount extends number | bigint> = BaseParsedTransaction<
  TAmount,
  BaseOutput<TAmount>
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
