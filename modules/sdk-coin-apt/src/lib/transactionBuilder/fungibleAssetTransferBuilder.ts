import { TransactionBuilder } from './transactionBuilder';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { FungibleAssetTransfer } from '../transaction/fungibleAssetTransfer';
import { TransactionType } from '@bitgo/sdk-core';
import utils from '../utils';
import { TransactionPayload, TransactionPayloadEntryFunction } from '@aptos-labs/ts-sdk';
import { FUNGIBLE_ASSET_TYPE_ARGUMENT } from '../constants';

export class FungibleAssetTransferBuilder extends TransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new FungibleAssetTransfer(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.SendToken;
  }
  //TODO: Ticket: COIN-2941 : Check Statics based asset validation and if possible, implement it
  assetId(assetId: string): TransactionBuilder {
    this.validateAddress({ address: assetId });
    this.transaction.assetId = assetId;
    return this;
  }

  /** @inheritdoc */
  validateTransaction(transaction?: FungibleAssetTransfer): void {
    if (!transaction) {
      throw new Error('fungible asset transaction not defined');
    }
    super.validateTransaction(transaction);
    this.validateAddress({ address: transaction.assetId });
  }

  protected isValidTransactionPayload(payload: TransactionPayload) {
    try {
      if (!this.isValidPayload(payload)) {
        console.error('invalid transaction payload');
        return false;
      }
      const entryFunction = (payload as TransactionPayloadEntryFunction).entryFunction;
      const fungibleTokenAddress = entryFunction.args[0].toString();
      const addressArg = entryFunction.args[1];
      const amountArg = entryFunction.args[2];
      return (
        utils.isValidAddress(fungibleTokenAddress) && utils.fetchAndValidateRecipients(addressArg, amountArg).isValid
      );
    } catch (e) {
      console.error('invalid transaction payload', e);
      return false;
    }
  }

  private isValidPayload(payload: TransactionPayload) {
    return (
      payload instanceof TransactionPayloadEntryFunction &&
      payload.entryFunction.args.length === 3 &&
      (payload.entryFunction.type_args.length === 0 ||
        (payload.entryFunction.type_args.length === 1 &&
          FUNGIBLE_ASSET_TYPE_ARGUMENT === payload.entryFunction.type_args[0].toString()))
    );
  }
}
