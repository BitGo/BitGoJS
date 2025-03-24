import { Transaction } from './transaction';
import {
  AccountAddress,
  Aptos,
  AptosConfig,
  EntryFunctionABI,
  MoveAbility,
  Network,
  objectStructTag,
  TransactionPayload,
  TransactionPayloadEntryFunction,
  TypeTagAddress,
  TypeTagGeneric,
  TypeTagStruct,
} from '@aptos-labs/ts-sdk';
import { InvalidTransactionError, TransactionRecipient, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig, NetworkType } from '@bitgo/statics';
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
    if (!this._recipient) {
      this._recipient = {} as TransactionRecipient;
    }
    this._assetId = entryFunction.args[0].toString();
    this._recipient.address = entryFunction.args[1].toString();
    this._recipient.amount = DIGITAL_ASSET_TRANSFER_AMOUNT;
  }

  protected async buildRawTransaction(): Promise<void> {
    const network: Network = this._coinConfig.network.type === NetworkType.MAINNET ? Network.MAINNET : Network.TESTNET;
    const aptos = new Aptos(new AptosConfig({ network }));
    const senderAddress = AccountAddress.fromString(this._sender);
    const recipientAddress = AccountAddress.fromString(this._recipient.address);
    const digitalAssetAddress = AccountAddress.fromString(this._assetId);

    const transferDigitalAssetAbi: EntryFunctionABI = {
      typeParameters: [{ constraints: [MoveAbility.KEY] }],
      parameters: [new TypeTagStruct(objectStructTag(new TypeTagGeneric(0))), new TypeTagAddress()],
    };

    const simpleTxn = await aptos.transaction.build.simple({
      sender: senderAddress,
      data: {
        function: DIGITAL_ASSET_TRANSFER_FUNCTION,
        typeArguments: [DIGITAL_ASSET_TYPE_ARGUMENT],
        functionArguments: [digitalAssetAddress, recipientAddress],
        abi: transferDigitalAssetAbi,
      },
      options: {
        maxGasAmount: this.maxGasAmount,
        gasUnitPrice: this.gasUnitPrice,
        expireTimestamp: this.expirationTime,
        accountSequenceNumber: this.sequenceNumber,
      },
    });
    this._rawTransaction = simpleTxn.rawTransaction;
  }
}
