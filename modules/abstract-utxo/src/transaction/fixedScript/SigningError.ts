import type { Unspent } from '../../unspent';

export type PsbtParsedScriptType =
  | 'p2sh'
  | 'p2wsh'
  | 'p2shP2wsh'
  | 'p2shP2pk'
  | 'taprootKeyPathSpend'
  | 'taprootScriptPathSpend'
  | 'p2trLegacy'
  | 'p2trMusig2ScriptPath'
  | 'p2trMusig2KeyPath';

export class InputSigningError<TNumber extends number | bigint = number> extends Error {
  static expectedWalletUnspent<TNumber extends number | bigint>(
    inputIndex: number,
    inputType: PsbtParsedScriptType | null,
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
    public inputType: PsbtParsedScriptType | null,
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
