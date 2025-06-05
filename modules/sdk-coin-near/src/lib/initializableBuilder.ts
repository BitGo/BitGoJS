import { DelegateTransaction } from './delegateTransaction';
import { Transaction } from './transaction';

export interface InitializableBuilder {
  initBuilder(tx: Transaction | DelegateTransaction): void;
}
