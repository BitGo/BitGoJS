import * as utxolib from '@bitgo/utxo-lib';

import type { PsbtParsedScriptType } from './signPsbtUtxolib';

type Unspent<TNumber extends number | bigint = number> = utxolib.bitgo.Unspent<TNumber>;

export class InputSigningError<TNumber extends number | bigint = number> extends Error {
  static expectedWalletUnspent<TNumber extends number | bigint>(
    inputIndex: number,
    inputType: PsbtParsedScriptType | null, // null for legacy transaction format
    unspent: Unspent<TNumber> | { id: string }
  ): InputSigningError<TNumber> {
    return new InputSigningError(
      inputIndex,
      inputType,
      unspent,
      `not a wallet unspent, not a replay protection unspent`
    );
  }

  constructor(
    public inputIndex: number,
    public inputType: PsbtParsedScriptType | null, // null for legacy transaction format
    public unspent: Unspent<TNumber> | { id: string },
    public reason: Error | string
  ) {
    super(`signing error at input ${inputIndex}: type=${inputType} unspentId=${unspent.id}: ${reason}`);
  }
}

export class BulkSigningError extends Error {
  constructor(public reason: Error | string) {
    const reasonMessage = reason instanceof Error ? reason.message : reason;
    super(`bulk signing error: ${reasonMessage}`);
  }
}

export class TransactionSigningError<TNumber extends number | bigint = number> extends Error {
  constructor(signErrors: InputSigningError<TNumber>[], verifyError: InputSigningError<TNumber>[]) {
    super(
      `sign errors at inputs: [${signErrors.join(',')}], ` +
        `verify errors at inputs: [${verifyError.join(',')}], see log for details`
    );
  }
}
