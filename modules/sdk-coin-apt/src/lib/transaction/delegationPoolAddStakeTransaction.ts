import { Transaction } from './transaction';
import { InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import {
  AccountAddress,
  EntryFunctionABI,
  InputGenerateTransactionPayloadData,
  TransactionPayload,
  TransactionPayloadEntryFunction,
  TypeTagAddress,
  TypeTagU64,
} from '@aptos-labs/ts-sdk';

import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { APTOS_COIN, DELEGATION_POOL_ADD_STAKE_FUNCTION } from '../constants';
import utils from '../utils';

export class DelegationPoolAddStakeTransaction extends Transaction {
  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
    this._type = TransactionType.StakingDelegate;
    this._assetId = APTOS_COIN;
  }

  protected parseTransactionPayload(payload: TransactionPayload): void {
    if (!this.isValidPayload(payload)) {
      throw new InvalidTransactionError('Invalid transaction payload');
    }
    const { entryFunction } = payload;
    const addressArg = entryFunction.args[0];
    const amountArg = entryFunction.args[1];
    this.recipients = utils.parseRecipients(addressArg, amountArg);
  }

  protected getTransactionPayloadData(): InputGenerateTransactionPayloadData {
    return {
      function: DELEGATION_POOL_ADD_STAKE_FUNCTION,
      typeArguments: [],
      functionArguments: [AccountAddress.fromString(this.recipients[0].address), this.recipients[0].amount],
      abi: this.abi,
    };
  }

  private isValidPayload(payload: TransactionPayload): payload is TransactionPayloadEntryFunction {
    return (
      payload instanceof TransactionPayloadEntryFunction &&
      payload.entryFunction.args.length === 2 &&
      payload.entryFunction.type_args.length === 0
    );
  }

  private abi: EntryFunctionABI = {
    typeParameters: [],
    parameters: [new TypeTagAddress(), new TypeTagU64()],
  };
}
