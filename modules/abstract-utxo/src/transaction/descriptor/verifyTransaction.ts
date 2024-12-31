import * as utxolib from '@bitgo/utxo-lib';
import { ITransactionRecipient, VerifyTransactionOptions } from '@bitgo/sdk-core';

import { DescriptorMap } from '../../core/descriptor';
import { AbstractUtxoCoin, BaseOutput, BaseParsedTransactionOutputs } from '../../abstractUtxoCoin';

import { toBaseParsedTransactionOutputsFromPsbt } from './parse';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class ErrorMissingOutputs extends ValidationError {
  constructor(public missingOutputs: BaseOutput<bigint | 'max'>[]) {
    super(`missing outputs (count=${missingOutputs.length})`);
  }
}

export class ErrorImplicitExternalOutputs extends ValidationError {
  constructor(public implicitExternalOutputs: BaseOutput<bigint | 'max'>[]) {
    super(`unexpected implicit external outputs (count=${implicitExternalOutputs.length})`);
  }
}

export class AggregateValidationError extends ValidationError {
  constructor(public errors: ValidationError[]) {
    super(`aggregate validation error (count=${errors.length})`);
  }
}

export function assertExpectedOutputDifference(
  parsedOutputs: BaseParsedTransactionOutputs<bigint, BaseOutput<bigint | 'max'>>
): void {
  const errors: ValidationError[] = [];
  if (parsedOutputs.missingOutputs.length > 0) {
    errors.push(new ErrorMissingOutputs(parsedOutputs.missingOutputs));
  }
  if (parsedOutputs.implicitExternalOutputs.length > 0) {
    // FIXME: for paygo we need to relax this a little bit
    errors.push(new ErrorImplicitExternalOutputs(parsedOutputs.implicitExternalOutputs));
  }
  if (errors.length > 0) {
    // FIXME(BTC-1688): enable ES2021
    // throw new AggregateError(errors);
    throw new AggregateValidationError(errors);
  }
}

export function assertValidTransaction(
  psbt: utxolib.bitgo.UtxoPsbt,
  descriptors: DescriptorMap,
  recipients: ITransactionRecipient[],
  network: utxolib.Network
): void {
  assertExpectedOutputDifference(toBaseParsedTransactionOutputsFromPsbt(psbt, descriptors, recipients, network));
}

/**
 * Wrapper around assertValidTransaction that returns a boolean instead of throwing.
 *
 * We follow the AbstractUtxoCoin interface here which is a bit confused - the return value is a boolean but we
 * also throw errors (because we actually want to know what went wrong).
 *
 * @param coin
 * @param params
 * @param descriptorMap
 */
export async function verifyTransaction(
  coin: AbstractUtxoCoin,
  params: VerifyTransactionOptions,
  descriptorMap: DescriptorMap
): Promise<boolean> {
  const tx = coin.decodeTransactionFromPrebuild(params.txPrebuild);
  if (!(tx instanceof utxolib.bitgo.UtxoPsbt)) {
    throw new Error('unexpected transaction type');
  }
  assertValidTransaction(tx, descriptorMap, params.txParams.recipients ?? [], tx.network);
  return true;
}
