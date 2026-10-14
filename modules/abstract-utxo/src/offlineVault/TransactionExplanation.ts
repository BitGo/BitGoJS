import { UtxoCoinName } from '../names';

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
  /* PSBT nLockTime — the operator must verify it against the PoX-5 unlock height before co-signing a CLTV spend */
  locktime: number;
}

export function getTransactionExplanation(coinName: UtxoCoinName, tx: unknown): TransactionExplanation<string> {
  if (!OfflineVaultSignable.is(tx)) {
    throw new Error('not a signable transaction');
  }
  if (DescriptorTransaction.is(tx)) {
    return getTransactionExplanationFromPsbt(tx, coinName);
  }

  throw new Error('unsupported transaction type');
}
