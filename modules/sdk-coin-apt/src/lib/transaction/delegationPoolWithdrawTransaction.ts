import { MoveFunctionId } from '@aptos-labs/ts-sdk';
import { TransactionType } from '@bitgo/sdk-core';

import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { DELEGATION_POOL_WITHDRAW_FUNCTION } from '../constants';
import { AbstractDelegationPoolAmountBasedTransaction } from './abstractDelegationPoolAmountBasedTransaction';
import { InputsAndOutputs } from './transaction';

export class DelegationPoolWithdrawTransaction extends AbstractDelegationPoolAmountBasedTransaction {
  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
    this._type = TransactionType.StakingWithdraw;
  }

  override moveFunctionId(): MoveFunctionId {
    return DELEGATION_POOL_WITHDRAW_FUNCTION;
  }

  override inputsAndOutputs(): InputsAndOutputs {
    const { sender, validatorAddress, amount } = this;
    if (sender === undefined) throw new Error('sender is undefined');
    if (validatorAddress === undefined) throw new Error('validatorAddress is undefined');
    if (amount === undefined) throw new Error('amount is undefined');
    return {
      inputs: [
        {
          address: validatorAddress,
          value: amount,
          coin: this._coinConfig.name,
        },
      ],
      outputs: [
        {
          address: sender,
          value: amount,
          coin: this._coinConfig.name,
        },
      ],
      externalOutputs: [],
    };
  }
}
