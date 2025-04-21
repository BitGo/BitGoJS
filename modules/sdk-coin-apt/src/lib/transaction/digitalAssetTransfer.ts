import { Transaction } from './transaction';
import {
  AccountAddress,
  EntryFunctionABI,
  InputGenerateTransactionPayloadData,
  MoveAbility,
  objectStructTag,
  TransactionPayload,
  TransactionPayloadEntryFunction,
  TypeTagAddress,
  TypeTagGeneric,
  TypeTagStruct,
} from '@aptos-labs/ts-sdk';
import { InvalidTransactionError, TransactionRecipient, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import {
  DIGITAL_ASSET_TYPE_ARGUMENT,
  DIGITAL_ASSET_TRANSFER_FUNCTION,
  DIGITAL_ASSET_TRANSFER_AMOUNT,
} from '../constants';

export class DigitalAssetTransfer extends Transaction {
  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
    this._type = TransactionType.SendNFT;
  }

  protected parseTransactionPayload(payload: TransactionPayload): void {
    if (
      !(payload instanceof TransactionPayloadEntryFunction) ||
      payload.entryFunction.args.length !== 2 ||
      payload.entryFunction.type_args.length !== 1 ||
      DIGITAL_ASSET_TYPE_ARGUMENT !== payload.entryFunction.type_args[0].toString()
    ) {
      throw new InvalidTransactionError('Invalid transaction payload');
    }
    const entryFunction = payload.entryFunction;
    this._assetId = entryFunction.args[0].toString();
    this.recipients = [
      {
        address: entryFunction.args[1].toString(),
        amount: DIGITAL_ASSET_TRANSFER_AMOUNT,
      },
    ] as TransactionRecipient[];
  }

  protected getTransactionPayloadData(): InputGenerateTransactionPayloadData {
    const recipientAddress = AccountAddress.fromString(this.recipients[0].address);
    const digitalAssetAddress = AccountAddress.fromString(this._assetId);

    return {
      function: DIGITAL_ASSET_TRANSFER_FUNCTION,
      typeArguments: [DIGITAL_ASSET_TYPE_ARGUMENT],
      functionArguments: [digitalAssetAddress, recipientAddress],
      abi: this.transferDigitalAssetAbi,
    };
  }

  private transferDigitalAssetAbi: EntryFunctionABI = {
    typeParameters: [{ constraints: [MoveAbility.KEY] }],
    parameters: [new TypeTagStruct(objectStructTag(new TypeTagGeneric(0))), new TypeTagAddress()],
  };
}
