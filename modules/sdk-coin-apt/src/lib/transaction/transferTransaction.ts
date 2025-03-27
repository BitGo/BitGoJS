import { Transaction } from './transaction';
import { InvalidTransactionError, TransactionRecipient, TransactionType } from '@bitgo/sdk-core';
import {
  AccountAddress,
  Aptos,
  AptosConfig,
  EntryFunctionArgument,
  InputGenerateTransactionPayloadData,
  Network,
  TransactionPayload,
  TransactionPayloadEntryFunction,
} from '@aptos-labs/ts-sdk';

import { BaseCoin as CoinConfig, NetworkType } from '@bitgo/statics';
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
    this.recipients = this.parseRecipients(addressArg, amountArg);
  }

  protected async buildRawTransaction(): Promise<void> {
    const network: Network = this._coinConfig.network.type === NetworkType.MAINNET ? Network.MAINNET : Network.TESTNET;
    const aptos = new Aptos(new AptosConfig({ network }));
    const senderAddress = AccountAddress.fromString(this._sender);

    const simpleTxn = await aptos.transaction.build.simple({
      sender: senderAddress,
      data: this.buildData(this.recipients) as InputGenerateTransactionPayloadData,
      options: {
        maxGasAmount: this.maxGasAmount,
        gasUnitPrice: this.gasUnitPrice,
        expireTimestamp: this.expirationTime,
        accountSequenceNumber: this.sequenceNumber,
      },
    });
    this._rawTransaction = simpleTxn.rawTransaction;
  }

  private isValidPayload(payload: TransactionPayload): boolean {
    return (
      payload instanceof TransactionPayloadEntryFunction &&
      payload.entryFunction.args.length === 2 &&
      payload.entryFunction.type_args.length === 1 &&
      payload.entryFunction.type_args[0].toString().length > 0
    );
  }

  private parseRecipients(addressArg: EntryFunctionArgument, amountArg: EntryFunctionArgument): TransactionRecipient[] {
    const { recipients, isValid } = utils.fetchAndValidateRecipients(addressArg, amountArg);
    if (!isValid) {
      throw new InvalidTransactionError('Invalid transaction recipients');
    }
    return recipients.deserializedAddresses.map((address, index) => ({
      address,
      amount: utils.getAmountFromPayloadArgs(recipients.deserializedAmounts[index]),
    })) as TransactionRecipient[];
  }

  private buildData(recipients: TransactionRecipient[]): InputGenerateTransactionPayloadData {
    if (recipients.length > 1) {
      return {
        function: COIN_BATCH_TRANSFER_FUNCTION,
        typeArguments: [this.assetId],
        functionArguments: [
          recipients.map((recipient) => AccountAddress.fromString(recipient.address)),
          recipients.map((recipient) => recipient.amount),
        ],
      };
    } else {
      return {
        function: COIN_TRANSFER_FUNCTION,
        typeArguments: [this.assetId],
        functionArguments: [AccountAddress.fromString(recipients[0].address), recipients[0].amount],
      };
    }
  }
}
