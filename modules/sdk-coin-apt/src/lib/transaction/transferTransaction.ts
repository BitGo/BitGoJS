import { Transaction } from './transaction';
import { AptTransactionExplanation, TransferTxData } from '../iface';
import { TransactionRecipient, TransactionType } from '@bitgo/sdk-core';
import { generateSigningMessage, RAW_TRANSACTION_SALT } from '@aptos-labs/ts-sdk';

export class TransferTransaction extends Transaction {
  constructor(coinConfig) {
    super(coinConfig);
    this._type = TransactionType.Send;
  }

  public get signablePayload(): Buffer {
    return Buffer.from(generateSigningMessage(this._rawTransaction.bcsToBytes(), RAW_TRANSACTION_SALT));
  }

  /** @inheritDoc */
  explainTransaction(): AptTransactionExplanation {
    const displayOrder = [
      'id',
      'outputs',
      'outputAmount',
      'changeOutputs',
      'changeAmount',
      'fee',
      'withdrawAmount',
      'sender',
      'type',
    ];

    const outputs: TransactionRecipient[] = [this.recipient];
    const outputAmount = outputs[0].amount;
    return {
      displayOrder,
      id: this.id,
      outputs,
      outputAmount,
      changeOutputs: [],
      changeAmount: '0',
      fee: { fee: 'UNKNOWN' }, // TODO: fill fee value
      sender: this.sender,
      type: this.type,
    };
  }

  toJson(): TransferTxData {
    return {
      id: this.id,
      sender: this.sender,
      recipient: this.recipient,
      sequenceNumber: this.sequenceNumber,
      maxGasAmount: this.maxGasAmount,
      gasUnitPrice: this.gasUnitPrice,
      expirationTime: this.expirationTime,
    };
  }
}
