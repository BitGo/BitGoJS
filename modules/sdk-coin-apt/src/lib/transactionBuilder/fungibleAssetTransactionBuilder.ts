import { TransactionBuilder } from './transactionBuilder';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { FungibleAssetTransaction } from '../transaction/fungibleAssetTransaction';
import { TransactionType } from '@bitgo/sdk-core';
import BigNumber from 'bignumber.js';
import utils from '../utils';
import { TransactionPayload, TransactionPayloadEntryFunction } from '@aptos-labs/ts-sdk';
import { FUNGIBLE_ASSET_TYPE_ARGUMENT } from '../constants';

export class FungibleAssetTransactionBuilder extends TransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new FungibleAssetTransaction(_coinConfig);
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
  validateTransaction(transaction?: FungibleAssetTransaction): void {
    if (!transaction) {
      throw new Error('fungible asset transaction not defined');
    }
    super.validateTransaction(transaction);
    this.validateAddress({ address: transaction.assetId });
  }

  protected isValidTransactionPayload(payload: TransactionPayload) {
    try {
      if (
        !(payload instanceof TransactionPayloadEntryFunction) ||
        payload.entryFunction.args.length !== 3 ||
        payload.entryFunction.type_args.length !== 1 ||
        FUNGIBLE_ASSET_TYPE_ARGUMENT !== payload.entryFunction.type_args[0].toString()
      ) {
        console.error('invalid transaction payload');
        return false;
      }
      const entryFunction = payload.entryFunction;
      const fungibleTokenAddress = entryFunction.args[0].toString();
      const recipientAddress = entryFunction.args[1].toString();
      const amountBuffer = Buffer.from(entryFunction.args[2].bcsToBytes());
      const recipientAmount = new BigNumber(amountBuffer.readBigUint64LE().toString());
      return (
        utils.isValidAddress(recipientAddress) &&
        utils.isValidAddress(fungibleTokenAddress) &&
        !recipientAmount.isLessThan(0)
      );
    } catch (e) {
      console.error('invalid transaction payload', e);
      return false;
    }
  }
}
