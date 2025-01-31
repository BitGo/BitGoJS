import { TransactionBuilder } from './transactionBuilder';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionType } from '@bitgo/sdk-core';
import utils from '../utils';
import { TransactionPayload, TransactionPayloadEntryFunction } from '@aptos-labs/ts-sdk';
import { DigitalAssetTransfer } from '../transaction/digitalAssetTransfer';
import { DIGITAL_ASSET_TYPE_ARGUMENT } from '../constants';

export class DigitalAssetTransferBuilder extends TransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new DigitalAssetTransfer(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.SendNFT;
  }

  assetId(assetId: string): TransactionBuilder {
    this.validateAddress({ address: assetId });
    this.transaction.assetId = assetId;
    return this;
  }

  /** @inheritdoc */
  validateTransaction(transaction?: DigitalAssetTransfer): void {
    if (!transaction) {
      throw new Error('transaction not defined');
    }
    super.validateTransaction(transaction);
    this.validateAddress({ address: transaction.assetId });
  }

  protected isValidTransactionPayload(payload: TransactionPayload) {
    try {
      if (
        !(payload instanceof TransactionPayloadEntryFunction) ||
        payload.entryFunction.args.length !== 2 ||
        payload.entryFunction.type_args.length !== 1 ||
        DIGITAL_ASSET_TYPE_ARGUMENT !== payload.entryFunction.type_args[0].toString()
      ) {
        console.error('invalid transaction payload');
        return false;
      }
      const entryFunction = payload.entryFunction;
      const digitalAssetAddress = entryFunction.args[0].toString();
      const recipientAddress = entryFunction.args[1].toString();
      return utils.isValidAddress(recipientAddress) && utils.isValidAddress(digitalAssetAddress);
    } catch (e) {
      console.error('invalid transaction payload', e);
      return false;
    }
  }
}
