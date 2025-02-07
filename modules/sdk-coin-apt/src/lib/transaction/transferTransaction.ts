import { Transaction } from './transaction';
import { InvalidTransactionError, TransactionRecipient, TransactionType } from '@bitgo/sdk-core';
import {
  AccountAddress,
  Aptos,
  AptosConfig,
  Network,
  TransactionPayload,
  TransactionPayloadEntryFunction,
} from '@aptos-labs/ts-sdk';

import { BaseCoin as CoinConfig, NetworkType } from '@bitgo/statics';
import { APTOS_COIN, COIN_TRANSFER_FUNCTION } from '../constants';

export class TransferTransaction extends Transaction {
  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
    this._type = TransactionType.Send;
    this._assetId = APTOS_COIN;
  }

  protected parseTransactionPayload(payload: TransactionPayload): void {
    if (
      !(payload instanceof TransactionPayloadEntryFunction) ||
      payload.entryFunction.args.length !== 2 ||
      payload.entryFunction.type_args.length !== 1 ||
      payload.entryFunction.type_args[0].toString().length === 0
    ) {
      throw new InvalidTransactionError('Invalid transaction payload');
    }
    const entryFunction = payload.entryFunction;
    if (!this._recipient) {
      this._recipient = {} as TransactionRecipient;
    }
    this._assetId = entryFunction.type_args[0].toString();
    this._recipient.address = entryFunction.args[0].toString();
    const amountBuffer = Buffer.from(entryFunction.args[1].bcsToBytes());

    const low = BigInt(amountBuffer.readUint32LE());
    const high = BigInt(amountBuffer.readUint32LE(4));
    const amount = (high << BigInt(32)) + low;
    this._recipient.amount = amount.toString();
  }

  protected async buildRawTransaction(): Promise<void> {
    const network: Network = this._coinConfig.network.type === NetworkType.MAINNET ? Network.MAINNET : Network.TESTNET;
    const aptos = new Aptos(new AptosConfig({ network }));
    const senderAddress = AccountAddress.fromString(this._sender);
    const recipientAddress = AccountAddress.fromString(this._recipient.address);
    const simpleTxn = await aptos.transaction.build.simple({
      sender: senderAddress,
      data: {
        function: COIN_TRANSFER_FUNCTION,
        typeArguments: [this.assetId],
        functionArguments: [recipientAddress, this.recipient.amount],
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
