import { ITransactionRecipient } from '@bitgo/sdk-core';
import { Psbt, descriptorWallet } from '@bitgo/wasm-utxo';

import { AbstractUtxoCoin, ParseTransactionOptions } from '../../abstractUtxoCoin';
import { BaseOutput, BaseParsedTransaction, BaseParsedTransactionOutputs } from '../types';
import { getKeySignatures, toBip32Triple, UtxoNamedKeychains } from '../../keychains';
import { getDescriptorMapFromWallet, getPolicyForEnv } from '../../descriptor';
import { IDescriptorWallet } from '../../descriptor/descriptorWallet';
import { AddressCodec } from '../recipient';
import { outputDifferencesWithExpected, OutputDifferenceWithExpected } from '../outputDifference';
import { decodeDescriptorPsbt } from '../decode';

function sumValues(arr: { value: bigint }[]): bigint {
  return arr.reduce((sum, e) => sum + e.value, 0n);
}

type ParsedOutput = Omit<descriptorWallet.ParsedOutput, 'script'> & { script: Buffer };

export type RecipientOutput = Omit<ParsedOutput, 'value'> & {
  value: bigint | 'max';
};

function toRecipientOutput(recipient: ITransactionRecipient, addressCodec: AddressCodec): RecipientOutput {
  return {
    address: recipient.address,
    value: recipient.amount === 'max' ? 'max' : BigInt(recipient.amount),
    script: addressCodec.fromExtendedAddressFormatToScript(recipient.address),
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
  addressCodec: AddressCodec
): ParsedOutputs {
  const parsed = descriptorWallet.parse(psbt, descriptorMap, addressCodec.coinName);
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

function toBaseOutputs(outputs: ParsedOutput[], addressCodec: AddressCodec): BaseOutput<bigint>[];
function toBaseOutputs(outputs: RecipientOutput[], addressCodec: AddressCodec): BaseOutput<bigint | 'max'>[];
function toBaseOutputs(
  outputs: (ParsedOutput | RecipientOutput)[],
  addressCodec: AddressCodec
): BaseOutput<bigint | 'max'>[] {
  return outputs.map(
    (o): BaseOutput<bigint | 'max'> => ({
      address: addressCodec.toExtendedAddressFormat(o.script),
      amount: o.value === 'max' ? 'max' : BigInt(o.value),
      external: o.scriptId === undefined,
    })
  );
}

export type ParsedOutputsBigInt = BaseParsedTransactionOutputs<bigint, BaseOutput<bigint | 'max'>>;

function toBaseParsedTransactionOutputs(
  { outputs, changeOutputs, explicitOutputs, implicitOutputs, missingOutputs }: ParsedOutputs,
  addressCodec: AddressCodec
): ParsedOutputsBigInt {
  const explicitExternalOutputs = explicitOutputs.filter((o) => o.scriptId === undefined);
  const implicitExternalOutputs = implicitOutputs.filter((o) => o.scriptId === undefined);
  return {
    outputs: toBaseOutputs(outputs, addressCodec),
    changeOutputs: toBaseOutputs(changeOutputs, addressCodec),
    explicitExternalOutputs: toBaseOutputs(explicitExternalOutputs, addressCodec),
    explicitExternalSpendAmount: sumValues(explicitExternalOutputs),
    implicitExternalOutputs: toBaseOutputs(implicitExternalOutputs, addressCodec),
    implicitExternalSpendAmount: sumValues(implicitExternalOutputs),
    missingOutputs: toBaseOutputs(missingOutputs, addressCodec),
  };
}

export function toBaseParsedTransactionOutputsFromPsbt(
  psbt: Psbt | Uint8Array,
  descriptorMap: descriptorWallet.DescriptorMap,
  recipients: ITransactionRecipient[],
  addressCodec: AddressCodec
): ParsedOutputsBigInt {
  const wasmPsbt = psbt instanceof Psbt ? psbt : Psbt.deserialize(psbt);
  return toBaseParsedTransactionOutputs(
    parseOutputsWithPsbt(
      wasmPsbt,
      descriptorMap,
      recipients.map((r) => toRecipientOutput(r, addressCodec)),
      addressCodec
    ),
    addressCodec
  );
}

export type ParsedDescriptorTransaction<TAmount extends number | bigint> = BaseParsedTransaction<
  TAmount,
  BaseOutput<TAmount | 'max'>
>;

export function parse(
  coin: AbstractUtxoCoin,
  wallet: IDescriptorWallet,
  params: ParseTransactionOptions<number | bigint>,
  addressCodec: AddressCodec = new AddressCodec(coin.name)
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
  const wasmPsbt = decodeDescriptorPsbt(params.txPrebuild);
  const walletKeys = toBip32Triple(keychains);
  const descriptorMap = getDescriptorMapFromWallet(wallet, walletKeys, getPolicyForEnv(params.wallet.bitgo.env));
  return {
    ...toBaseParsedTransactionOutputsFromPsbt(wasmPsbt, descriptorMap, recipients, addressCodec),
    keychains,
    keySignatures: getKeySignatures(wallet) ?? {},
    customChange: undefined,
    needsCustomChangeKeySignatureVerification: false,
  };
}
