import * as utxolib from '@bitgo/utxo-lib';
import { ITransactionRecipient, VerifyTransactionOptions } from '@bitgo/sdk-core';

import { DescriptorMap } from '../../core/descriptor';
import { AbstractUtxoCoin, BaseOutput, BaseParsedTransactionOutputs } from '../../abstractUtxoCoin';

import { ParsedOutputsBigInt, toBaseParsedTransactionOutputsFromPsbt } from './parse';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
  }

  static formatOutputs(outputs: { address: string }[]): string {
    return outputs.map((o) => o.address).join(', ');
  }
}

export class ErrorMissingOutputs extends ValidationError {
  constructor(public missingOutputs: BaseOutput<bigint | 'max'>[]) {
    super(`missing outputs (${ValidationError.formatOutputs(missingOutputs)})`);
  }
}

export class ErrorImplicitExternalOutputs extends ValidationError {
  constructor(public implicitExternalOutputs: BaseOutput<bigint | 'max'>[]) {
    super(`unexpected implicit external outputs (${ValidationError.formatOutputs(implicitExternalOutputs)})`);
  }
}

export class AggregateValidationError extends ValidationError {
  static formatParsedOutputs(parsedOutputs: ParsedOutputsBigInt): string {
    return (
      `outputs=${parsedOutputs.outputs.length}, ` +
      `changeOutputs=${parsedOutputs.changeOutputs.length}, ` +
      `explicitExternalOutputs=${parsedOutputs.explicitExternalOutputs.length}, ` +
      `implicitExternalOutputs=${parsedOutputs.implicitExternalOutputs.length}, ` +
      `missingOutputs=${parsedOutputs.missingOutputs.length}`
    );
  }

  static formatRecipients(recipients: { address: string }[]): string {
    return recipients.map((r) => r.address).join(', ');
  }

  constructor(
    public parsedOutputs: ParsedOutputsBigInt,
    public recipients: { address: string }[],
    public errors: ValidationError[]
  ) {
    super(
      `aggregate validation error (` +
        `parsedOutputs=[${AggregateValidationError.formatParsedOutputs(parsedOutputs)}], ` +
        `recipients=${AggregateValidationError.formatRecipients(recipients)}, ` +
        `count=${errors.length})`
    );
  }
}

export function getValidationErrors(
  parsedOutputs: BaseParsedTransactionOutputs<bigint, BaseOutput<bigint | 'max'>>
): ValidationError[] {
  const errors: ValidationError[] = [];
  if (parsedOutputs.missingOutputs.length > 0) {
    errors.push(new ErrorMissingOutputs(parsedOutputs.missingOutputs));
  }
  if (parsedOutputs.implicitExternalOutputs.length > 0) {
    // FIXME: for paygo we need to relax this a little bit
    errors.push(new ErrorImplicitExternalOutputs(parsedOutputs.implicitExternalOutputs));
  }
  return errors;
}

export function assertValidTransaction(
  psbt: utxolib.bitgo.UtxoPsbt,
  descriptors: DescriptorMap,
  recipients: ITransactionRecipient[],
  network: utxolib.Network
): void {
  const parsed = toBaseParsedTransactionOutputsFromPsbt(psbt, descriptors, recipients, network);
  const errors = getValidationErrors(parsed);
  if (errors.length > 0) {
    throw new AggregateValidationError(parsed, recipients, errors);
  }
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
