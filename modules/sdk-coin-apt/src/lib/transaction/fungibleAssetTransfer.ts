import { Transaction } from './transaction';
import {
  AccountAddress,
  EntryFunctionABI,
  InputGenerateTransactionPayloadData,
  parseTypeTag,
  TransactionPayload,
  TransactionPayloadEntryFunction,
  TypeTagAddress,
  TypeTagU64,
} from '@aptos-labs/ts-sdk';
import { InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import {
  FUNGIBLE_ASSET_TYPE_ARGUMENT,
  FUNGIBLE_ASSET_TRANSFER_FUNCTION,
  FUNGIBLE_ASSET_BATCH_TRANSFER_FUNCTION,
} from '../constants';
import utils from '../utils';

export class FungibleAssetTransfer extends Transaction {
  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
    this._type = TransactionType.SendToken;
  }

  protected parseTransactionPayload(payload: TransactionPayload): void {
    if (!this.isValidPayload(payload)) {
      throw new InvalidTransactionError('Invalid transaction payload');
    }
    const entryFunction = (payload as TransactionPayloadEntryFunction).entryFunction;
    this._assetId = entryFunction.args[0].toString();
    const addressArg = entryFunction.args[1];
    const amountArg = entryFunction.args[2];
    this.recipients = utils.parseRecipients(addressArg, amountArg);
  }

  protected getTransactionPayloadData(): InputGenerateTransactionPayloadData {
    const fungibleTokenAddress = this._assetId;
    const faTransferAbi: EntryFunctionABI = {
      typeParameters: [{ constraints: [] }],
      parameters: [parseTypeTag('0x1::object::Object'), new TypeTagAddress(), new TypeTagU64()],
    };

    if (this.recipients.length > 1) {
      return {
        function: FUNGIBLE_ASSET_BATCH_TRANSFER_FUNCTION,
        typeArguments: [],
        functionArguments: [
          fungibleTokenAddress,
          this.recipients.map((recipient) => AccountAddress.fromString(recipient.address)),
          this.recipients.map((recipient) => recipient.amount),
        ],
      };
    }
    return {
      function: FUNGIBLE_ASSET_TRANSFER_FUNCTION,
      typeArguments: [FUNGIBLE_ASSET_TYPE_ARGUMENT],
      functionArguments: [
        fungibleTokenAddress,
        AccountAddress.fromString(this.recipients[0].address),
        this.recipients[0].amount,
      ],
      abi: faTransferAbi,
    };
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
