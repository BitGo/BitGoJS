import { Transaction } from './transaction';
import { AptTransactionExplanation, TransferTxData } from '../iface';
import { TransactionRecipient, TransactionType } from '@bitgo/sdk-core';
import {
  AccountAddress,
  FeePayerRawTransaction,
  generateSigningMessage,
  RAW_TRANSACTION_WITH_DATA_SALT,
} from '@aptos-labs/ts-sdk';

export class TransferTransaction extends Transaction {
  constructor(coinConfig) {
    super(coinConfig);
    this._type = TransactionType.Send;
  }

  public get signablePayload(): Buffer {
    const feePayerRawTxn = new FeePayerRawTransaction(
      this._rawTransaction,
      [],
      AccountAddress.fromString(this._feePayerAddress)
    );
    return Buffer.from(generateSigningMessage(feePayerRawTxn.bcsToBytes(), RAW_TRANSACTION_WITH_DATA_SALT));
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
      fee: { fee: this.getFee() },
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
      gasUsed: this.gasUsed,
      expirationTime: this.expirationTime,
      feePayer: this.feePayerAddress,
    };
  }
}
