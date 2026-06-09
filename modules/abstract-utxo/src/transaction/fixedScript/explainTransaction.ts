import { ITransactionExplanation as BaseTransactionExplanation } from '@bitgo/sdk-core';

import type { Bip322Message } from '../../abstractUtxoCoin';
import type { Output, FixedScriptWalletOutput } from '../types';

// ===== Transaction Explanation Type Definitions =====

export interface AbstractUtxoTransactionExplanation<TFee = string, TChangeOutput extends Output = Output>
  extends BaseTransactionExplanation<TFee, string> {
  /** NOTE: this actually only captures external outputs */
  outputs: Output[];
  changeOutputs: TChangeOutput[];
  customChangeOutputs?: TChangeOutput[];
  customChangeAmount?: string;

  /**
   * BIP322 messages extracted from the transaction inputs.
   * These messages are used for verifying the transaction against the BIP322 standard.
   */
  messages?: Bip322Message[];
}

/** @deprecated - the signature fields are not very useful */
interface TransactionExplanationWithSignatures<TFee = string, TChangeOutput extends Output = Output>
  extends AbstractUtxoTransactionExplanation<TFee, TChangeOutput> {
  /** @deprecated - unused outside of tests */
  locktime?: number;

  /**
   * Number of input signatures per input.
   * @deprecated - this is not very useful without knowing who signed each input.
   */
  inputSignatures: number[];

  /**
   * Highest input signature count for the transaction
   * @deprecated - this is not very useful without knowing who signed each input.
   */
  signatures: number;
}

/** For our wasm backend, we do not return the deprecated fields. We set TFee to string for backwards compatibility. */
export type TransactionExplanationWasm = AbstractUtxoTransactionExplanation<string, FixedScriptWalletOutput> & {
  inputs: Array<{ address: string; value: string; signedBy: { [key: string]: boolean } }>;
  inputAmount: string;
};

/** When parsing a PSBT, we can infer the fee so we set TFee to string. */
export type TransactionExplanationUtxolibPsbt = TransactionExplanationWithSignatures<string>;

export type TransactionExplanationDescriptor = TransactionExplanationWithSignatures<string, Output>;

export type TransactionExplanation = TransactionExplanationUtxolibPsbt | TransactionExplanationWasm;
