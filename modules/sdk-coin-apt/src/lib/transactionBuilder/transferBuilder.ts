import { TransactionBuilder } from './transactionBuilder';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionType } from '@bitgo/sdk-core';
import { TransferTransaction } from '../transaction/transferTransaction';
import BigNumber from 'bignumber.js';
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

  protected isValidTransactionPayload(payload: TransactionPayload) {
    try {
      if (!(payload instanceof TransactionPayloadEntryFunction)) {
        console.error('invalid transaction payload');
        return false;
      }
      const entryFunction = payload.entryFunction;
      const recipientAddress = entryFunction.args[0].toString();
      const amountBuffer = Buffer.from(entryFunction.args[1].bcsToBytes());
      const recipientAmount = new BigNumber(amountBuffer.readBigUint64LE().toString());
      return utils.isValidAddress(recipientAddress) && !recipientAmount.isLessThan(0);
    } catch (e) {
      console.error('invalid transaction payload', e);
      return false;
    }
  }
}
