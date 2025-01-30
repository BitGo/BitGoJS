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

export class TransferTransaction extends Transaction {
  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
    this._type = TransactionType.Send;
  }

  protected parseTransactionPayload(payload: TransactionPayload): void {
    if (!(payload instanceof TransactionPayloadEntryFunction)) {
      throw new InvalidTransactionError('Invalid transaction payload');
    }
    const entryFunction = payload.entryFunction;
    if (!this._recipient) {
      this._recipient = {} as TransactionRecipient;
    }
    this._recipient.address = entryFunction.args[0].toString();
    const amountBuffer = Buffer.from(entryFunction.args[1].bcsToBytes());
    this._recipient.amount = amountBuffer.readBigUint64LE().toString();
  }

  protected async buildRawTransaction(): Promise<void> {
    const network: Network = this._coinConfig.network.type === NetworkType.MAINNET ? Network.MAINNET : Network.TESTNET;
    const aptos = new Aptos(new AptosConfig({ network }));
    const senderAddress = AccountAddress.fromString(this._sender);
    const recipientAddress = AccountAddress.fromString(this._recipient.address);

    const simpleTxn = await aptos.transaction.build.simple({
      sender: senderAddress,
      data: {
        function: '0x1::aptos_account::transfer_coins',
        typeArguments: ['0x1::aptos_coin::AptosCoin'],
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
