import { MoveFunctionId } from '@aptos-labs/ts-sdk';
import { TransactionType } from '@bitgo/sdk-core';

import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { DELEGATION_POOL_UNLOCK_FUNCTION } from '../constants';
import { AbstractDelegationPoolAmountBasedTransaction } from './abstractDelegationPoolAmountBasedTransaction';
import { InputsAndOutputs } from './transaction';

export class DelegationPoolUnlockTransaction extends AbstractDelegationPoolAmountBasedTransaction {
  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
    this._type = TransactionType.StakingUnlock;
  }

  override moveFunctionId(): MoveFunctionId {
    return DELEGATION_POOL_UNLOCK_FUNCTION;
  }

  override inputsAndOutputs(): InputsAndOutputs {
    return {
      inputs: [],
      outputs: [],
      externalOutputs: [],
    };
  }
}
