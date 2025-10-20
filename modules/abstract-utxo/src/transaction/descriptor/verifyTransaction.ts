import * as utxolib from '@bitgo/utxo-lib';
import {
  IRequestTracer,
  ITransactionRecipient,
  MismatchedRecipient,
  TxIntentMismatchError,
  TxIntentMismatchRecipientError,
  VerifyTransactionOptions,
} from '@bitgo/sdk-core';
import { DescriptorMap } from '@bitgo/utxo-core/descriptor';

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
 * Convert ValidationError to TxIntentMismatchRecipientError with structured data
 *
 * This preserves the structured error information from the original ValidationError
 * by extracting the mismatched outputs and converting them to the standardized format.
 * The original error is preserved as the `cause` for debugging purposes.
 */
function convertValidationErrorToTxIntentMismatch(
  error: AggregateValidationError,
  reqId: string | IRequestTracer | undefined,
  txParams: VerifyTransactionOptions['txParams'],
  txHex: string | undefined
): TxIntentMismatchRecipientError {
  const mismatchedRecipients: MismatchedRecipient[] = [];

  for (const err of error.errors) {
    if (err instanceof ErrorMissingOutputs) {
      mismatchedRecipients.push(
        ...err.missingOutputs.map((output) => ({
          address: output.address,
          amount: output.amount.toString(),
        }))
      );
    } else if (err instanceof ErrorImplicitExternalOutputs) {
      mismatchedRecipients.push(
        ...err.implicitExternalOutputs.map((output) => ({
          address: output.address,
          amount: output.amount.toString(),
        }))
      );
    }
  }

  const txIntentError = new TxIntentMismatchRecipientError(
    error.message,
    reqId,
    [txParams],
    txHex,
    mismatchedRecipients
  );
  // Preserve the original structured error as the cause for debugging
  // See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause
  (txIntentError as Error & { cause?: Error }).cause = error;
  return txIntentError;
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
 * @returns {boolean} True if verification passes
 * @throws {TxIntentMismatchError} if transaction validation fails
 * @throws {TxIntentMismatchRecipientError} if transaction recipients don't match user intent
 */
export async function verifyTransaction(
  coin: AbstractUtxoCoin,
  params: VerifyTransactionOptions,
  descriptorMap: DescriptorMap
): Promise<boolean> {
  const tx = coin.decodeTransactionFromPrebuild(params.txPrebuild);
  if (!(tx instanceof utxolib.bitgo.UtxoPsbt)) {
    throw new TxIntentMismatchError(
      'unexpected transaction type',
      params.reqId,
      [params.txParams],
      params.txPrebuild.txHex
    );
  }

  try {
    assertValidTransaction(tx, descriptorMap, params.txParams.recipients ?? [], tx.network);
  } catch (error) {
    if (error instanceof AggregateValidationError) {
      throw convertValidationErrorToTxIntentMismatch(error, params.reqId, params.txParams, params.txPrebuild.txHex);
    }
    throw error;
  }

  return true;
}
