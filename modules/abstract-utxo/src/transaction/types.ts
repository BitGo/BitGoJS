import type { UtxoNamedKeychains } from '../keychains';

import type { CustomChangeOptions } from './fixedScript';

export interface BaseOutput<TAmount = string | number> {
  address: string;
  amount: TAmount;
  // Even though this external flag is redundant with the chain property, it is necessary for backwards compatibility
  // with legacy transaction format.
  external?: boolean;
}

export interface FixedScriptWalletOutput<TAmount = string | number> extends BaseOutput<TAmount> {
  needsCustomChangeKeySignatureVerification?: boolean;
  chain: number;
  index: number;
}

export type Output<TAmount = string | number> = BaseOutput<TAmount> | FixedScriptWalletOutput<TAmount>;

export type BaseParsedTransactionOutputs<TNumber extends number | bigint, TOutput> = {
  /** all transaction outputs */
  outputs: TOutput[];
  /** transaction outputs that were specified as recipients but are missing from the transaction */
  missingOutputs: TOutput[];
  /** transaction outputs that were specified as recipients and are present in the transaction */
  explicitExternalOutputs: TOutput[];
  /** transaction outputs that were not specified as recipients but are present in the transaction */
  implicitExternalOutputs: TOutput[];
  /** transaction outputs that are change outputs */
  changeOutputs: TOutput[];
  /** sum of all explicit external outputs */
  explicitExternalSpendAmount: TNumber;
  /** sum of all implicit external outputs */
  implicitExternalSpendAmount: TNumber;
};

export type BaseParsedTransaction<TNumber extends number | bigint, TOutput> = BaseParsedTransactionOutputs<
  TNumber,
  TOutput
> /** Some extra properties that have nothing to do with an individual transaction */ & {
  keychains: UtxoNamedKeychains;
  keySignatures: {
    backupPub?: string;
    bitgoPub?: string;
  };
  needsCustomChangeKeySignatureVerification: boolean;
  customChange?: CustomChangeOptions;
};

/**
 * This type is a bit silly because it allows the type for the aggregate amounts to be different from the type of
 * individual amounts.
 */
export type ParsedTransaction<TNumber extends number | bigint = number> = BaseParsedTransaction<TNumber, Output>;
