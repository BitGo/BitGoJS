import { getNetworkFromChain } from '../names';

import { OfflineVaultSignable } from './OfflineVaultSignable';
import { DescriptorTransaction, getTransactionExplanationFromPsbt } from './descriptor';

export interface ExplanationOutput {
  address: string;
  amount: string | number;
}

export interface TransactionExplanation<TFee> {
  outputs: ExplanationOutput[];
  changeOutputs: ExplanationOutput[];
  fee: {
    /* network fee */
    fee: TFee;
    payGoFeeString: string | number | undefined;
    payGoFeeAddress: string | undefined;
  };
}

export function getTransactionExplanation(coin: string, tx: unknown): TransactionExplanation<string> {
  if (!OfflineVaultSignable.is(tx)) {
    throw new Error('not a signable transaction');
  }
  if (DescriptorTransaction.is(tx)) {
    return getTransactionExplanationFromPsbt(tx, getNetworkFromChain(coin));
  }

  throw new Error('unsupported transaction type');
}
