import { DelegationPoolTxData } from '../iface';
import { Transaction } from './transaction';
import { BaseCoin } from '@bitgo/statics';

/**
 * This is for transactions where one delegator participates in a delegation pool.
 */
export abstract class AbstractDelegationPoolTransaction extends Transaction {
  public validatorAddress?: string = undefined;
  public amount?: string = undefined;

  constructor(coinConfig: Readonly<BaseCoin>) {
    super(coinConfig);
  }

  override toJson(): DelegationPoolTxData {
    return {
      ...super.toJson(),
      validatorAddress: this.validatorAddress ?? null,
      amount: this.amount ?? null,
    };
  }
}
