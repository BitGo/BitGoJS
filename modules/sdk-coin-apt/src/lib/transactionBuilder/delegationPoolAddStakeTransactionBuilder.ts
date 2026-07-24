import { TransactionBuilder } from './transactionBuilder';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionType } from '@bitgo/sdk-core';
import utils from '../utils';
import { TransactionPayload, TransactionPayloadEntryFunction } from '@aptos-labs/ts-sdk';
import { DelegationPoolAddStakeTransaction } from '../transaction/delegationPoolAddStakeTransaction';

export class DelegationPoolAddStakeTransactionBuilder extends TransactionBuilder {
  protected override _transaction: DelegationPoolAddStakeTransaction;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this.transaction = new DelegationPoolAddStakeTransaction(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.StakingDelegate;
  }

  assetId(_assetId: string): TransactionBuilder {
    this.transaction.assetId = _assetId;
    return this;
  }

  validator(validatorAddress: string, amount: string): TransactionBuilder {
    this._transaction.validatorAddress = validatorAddress;
    this._transaction.amount = amount;
    return this;
  }

  protected isValidTransactionPayload(payload: TransactionPayload): boolean {
    try {
      if (!this.isValidPayload(payload)) {
        return false;
      }
      const { entryFunction } = payload;
      const addressArg = entryFunction.args[0];
      const amountArg = entryFunction.args[1];
      return utils.fetchAndValidateRecipients(addressArg, amountArg).isValid;
    } catch (e) {
      return false;
    }
  }

  private isValidPayload(payload: TransactionPayload): payload is TransactionPayloadEntryFunction {
    return (
      payload instanceof TransactionPayloadEntryFunction &&
      payload.entryFunction.args.length === 2 &&
      payload.entryFunction.type_args.length === 0
    );
  }
}
