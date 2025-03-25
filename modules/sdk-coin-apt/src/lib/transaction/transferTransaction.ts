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
import utils from '../utils';

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
    this._assetId = entryFunction.type_args[0].toString();
    this.recipients = [
      {
        address: entryFunction.args[0].toString(),
        amount: utils.getAmountFromPayloadArgs(entryFunction.args[1].bcsToBytes()),
      },
    ] as TransactionRecipient[];
  }

  protected async buildRawTransaction(): Promise<void> {
    const network: Network = this._coinConfig.network.type === NetworkType.MAINNET ? Network.MAINNET : Network.TESTNET;
    const aptos = new Aptos(new AptosConfig({ network }));
    const senderAddress = AccountAddress.fromString(this._sender);
    const recipientAddress = AccountAddress.fromString(this.recipients[0].address);
    const simpleTxn = await aptos.transaction.build.simple({
      sender: senderAddress,
      data: {
        function: COIN_TRANSFER_FUNCTION,
        typeArguments: [this.assetId],
        functionArguments: [recipientAddress, this.recipients[0].amount],
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
