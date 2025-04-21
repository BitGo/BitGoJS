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
  TypeTagVector,
} from '@aptos-labs/ts-sdk';

import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { APTOS_COIN, COIN_BATCH_TRANSFER_FUNCTION, COIN_TRANSFER_FUNCTION } from '../constants';
import utils from '../utils';

export class TransferTransaction extends Transaction {
  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
    this._type = TransactionType.Send;
    this._assetId = APTOS_COIN;
  }

  protected parseTransactionPayload(payload: TransactionPayload): void {
    if (!this.isValidPayload(payload)) {
      throw new InvalidTransactionError('Invalid transaction payload');
    }
    const entryFunction = (payload as TransactionPayloadEntryFunction).entryFunction;
    this._assetId = entryFunction.type_args[0].toString();
    const addressArg = entryFunction.args[0];
    const amountArg = entryFunction.args[1];
    this.recipients = utils.parseRecipients(addressArg, amountArg);
  }

  protected getTransactionPayloadData(): InputGenerateTransactionPayloadData {
    if (this.recipients.length > 1) {
      return {
        function: COIN_BATCH_TRANSFER_FUNCTION,
        typeArguments: [this.assetId],
        functionArguments: [
          this.recipients.map((recipient) => AccountAddress.fromString(recipient.address)),
          this.recipients.map((recipient) => recipient.amount),
        ],
        abi: this.batchCoinTransferAbi,
      };
    }
    return {
      function: COIN_TRANSFER_FUNCTION,
      typeArguments: [this.assetId],
      functionArguments: [AccountAddress.fromString(this.recipients[0].address), this.recipients[0].amount],
      abi: this.coinTransferAbi,
    };
  }

  private isValidPayload(payload: TransactionPayload): boolean {
    return (
      payload instanceof TransactionPayloadEntryFunction &&
      payload.entryFunction.args.length === 2 &&
      payload.entryFunction.type_args.length === 1 &&
      payload.entryFunction.type_args[0].toString().length > 0
    );
  }

  private coinTransferAbi: EntryFunctionABI = {
    typeParameters: [{ constraints: [] }],
    parameters: [new TypeTagAddress(), new TypeTagU64()],
  };

  private batchCoinTransferAbi: EntryFunctionABI = {
    typeParameters: [{ constraints: [] }],
    parameters: [new TypeTagVector(new TypeTagAddress()), new TypeTagVector(new TypeTagU64())],
  };
}
