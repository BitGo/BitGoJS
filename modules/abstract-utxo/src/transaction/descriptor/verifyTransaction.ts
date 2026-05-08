import { ITransactionRecipient, TxIntentMismatchError, IBaseCoin } from '@bitgo/sdk-core';
import type { Psbt, descriptorWallet } from '@bitgo/wasm-utxo';

import { AbstractUtxoCoin, VerifyTransactionOptions } from '../../abstractUtxoCoin';
import { BaseOutput, BaseParsedTransactionOutputs } from '../types';
import { UtxoCoinName } from '../../names';
import { toWasmPsbt, UtxoLibPsbt } from '../../wasmUtil';

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
  psbt: Psbt | UtxoLibPsbt | Uint8Array,
  descriptors: descriptorWallet.DescriptorMap,
  recipients: ITransactionRecipient[],
  coinName: UtxoCoinName
): void {
  assertExpectedOutputDifference(toBaseParsedTransactionOutputsFromPsbt(psbt, descriptors, recipients, coinName));
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
 */
export async function verifyTransaction<TNumber extends number | bigint>(
  coin: AbstractUtxoCoin,
  params: VerifyTransactionOptions<TNumber>,
  descriptorMap: descriptorWallet.DescriptorMap
): Promise<boolean> {
  const tx = coin.decodeTransactionFromPrebuild(params.txPrebuild);
  let psbt: Psbt;
  try {
    psbt = toWasmPsbt(tx as Psbt | UtxoLibPsbt | Uint8Array);
  } catch (e) {
    const txExplanation = await TxIntentMismatchError.tryGetTxExplanation(
      coin as unknown as IBaseCoin,
      params.txPrebuild
    );
    const errorDetail = e instanceof Error ? e.message : String(e);
    throw new TxIntentMismatchError(
      `unexpected transaction type: ${errorDetail}`,
      params.reqId,
      [params.txParams],
      params.txPrebuild.txHex,
      txExplanation
    );
  }

  assertValidTransaction(psbt, descriptorMap, params.txParams.recipients ?? [], coin.name);

  return true;
}
