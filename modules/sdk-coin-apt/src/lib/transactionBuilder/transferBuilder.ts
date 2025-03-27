import { TransactionBuilder } from './transactionBuilder';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionType } from '@bitgo/sdk-core';
import { TransferTransaction } from '../transaction/transferTransaction';
import utils from '../utils';
import { TransactionPayload, TransactionPayloadEntryFunction } from '@aptos-labs/ts-sdk';

export class TransferBuilder extends TransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this.transaction = new TransferTransaction(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Send;
  }

  validatePartsOfAssetId(assetId: string): void {
    const parts = assetId.split('::');
    if (parts.length !== 3 || ('0x1' !== parts[0] && !utils.isValidAddress(parts[0]))) {
      throw new Error('Invalid asset ID');
    }
  }

  assetId(assetId: string): TransactionBuilder {
    this.validatePartsOfAssetId(assetId);
    this.transaction.assetId = assetId;
    return this;
  }

  protected isValidTransactionPayload(payload: TransactionPayload): boolean {
    try {
      if (!this.isValidPayload(payload)) {
        console.error('invalid transaction payload');
        return false;
      }
      const entryFunction = (payload as TransactionPayloadEntryFunction).entryFunction;
      this.validatePartsOfAssetId(entryFunction.type_args[0].toString());
      return utils.fetchAndValidateRecipients(entryFunction.args[0], entryFunction.args[1]).isValid;
    } catch (e) {
      console.error('invalid transaction payload', e);
      return false;
    }
  }

  private isValidPayload(payload: TransactionPayload): boolean {
    return (
      payload instanceof TransactionPayloadEntryFunction &&
      payload.entryFunction.args.length === 2 &&
      payload.entryFunction.type_args.length === 1 &&
      payload.entryFunction.type_args[0].toString().length > 0
    );
  }
}
