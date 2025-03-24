import { Transaction } from './transaction';
import {
  AccountAddress,
  Aptos,
  AptosConfig,
  EntryFunctionABI,
  Network,
  parseTypeTag,
  TransactionPayload,
  TransactionPayloadEntryFunction,
  TypeTagAddress,
  TypeTagU64,
} from '@aptos-labs/ts-sdk';
import { InvalidTransactionError, TransactionRecipient, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig, NetworkType } from '@bitgo/statics';
import { FUNGIBLE_ASSET_TYPE_ARGUMENT, FUNGIBLE_ASSET_TRANSFER_FUNCTION } from '../constants';
import utils from '../utils';

export class FungibleAssetTransfer extends Transaction {
  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
    this._type = TransactionType.SendToken;
  }

  protected parseTransactionPayload(payload: TransactionPayload): void {
    if (
      !(payload instanceof TransactionPayloadEntryFunction) ||
      payload.entryFunction.args.length !== 3 ||
      payload.entryFunction.type_args.length !== 1 ||
      FUNGIBLE_ASSET_TYPE_ARGUMENT !== payload.entryFunction.type_args[0].toString()
    ) {
      throw new InvalidTransactionError('Invalid transaction payload');
    }
    const entryFunction = payload.entryFunction;
    if (!this._recipient) {
      this._recipient = {} as TransactionRecipient;
    }
    this._assetId = entryFunction.args[0].toString();
    this._recipient.address = entryFunction.args[1].toString();
    this._recipient.amount = utils.getAmountFromPayloadArgs(entryFunction.args[2].bcsToBytes());
  }

  protected async buildRawTransaction(): Promise<void> {
    const network: Network = this._coinConfig.network.type === NetworkType.MAINNET ? Network.MAINNET : Network.TESTNET;
    const aptos = new Aptos(new AptosConfig({ network }));
    const senderAddress = AccountAddress.fromString(this._sender);
    const recipientAddress = AccountAddress.fromString(this._recipient.address);
    const fungibleTokenAddress = this._assetId;

    const faTransferAbi: EntryFunctionABI = {
      typeParameters: [{ constraints: [] }],
      parameters: [parseTypeTag('0x1::object::Object'), new TypeTagAddress(), new TypeTagU64()],
    };

    const simpleTxn = await aptos.transaction.build.simple({
      sender: senderAddress,
      data: {
        function: FUNGIBLE_ASSET_TRANSFER_FUNCTION,
        typeArguments: [FUNGIBLE_ASSET_TYPE_ARGUMENT],
        functionArguments: [fungibleTokenAddress, recipientAddress, this.recipient.amount],
        abi: faTransferAbi,
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
