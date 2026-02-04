import { TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { fromBase64 } from '@cosmjs/encoding';

import * as constants from './constants';
import { CosmosTransactionMessage, ExecuteContractMessage, MessageData } from './iface';
import { CosmosTransactionBuilder } from './transactionBuilder';
import { CosmosUtils } from './utils';

export class ContractCallBuilder<CustomMessage = never> extends CosmosTransactionBuilder<CustomMessage> {
  protected _utils: CosmosUtils<CustomMessage>;

  constructor(_coinConfig: Readonly<CoinConfig>, utils: CosmosUtils<CustomMessage>) {
    super(_coinConfig, utils);
    this._utils = utils;
  }

  protected get transactionType(): TransactionType {
    return TransactionType.ContractCall;
  }

  /** @inheritdoc */
  messages(messages: (CosmosTransactionMessage<CustomMessage> | MessageData<CustomMessage>)[]): this {
    this._messages = messages.map((message) => {
      const msg = message as MessageData<CustomMessage>;
      const { typeUrl, value } = msg;

      // Handle pre-encoded messages (base64 string input)
      if (typeUrl && typeof value === 'string') {
        try {
          return { typeUrl, value: fromBase64(value) } as MessageData<CustomMessage>;
        } catch (err: unknown) {
          throw new Error(`Invalid base64 string in message value: ${String(err)}`);
        }
      }

      // Handle already-encoded messages (Uint8Array from deserialization)
      if (typeUrl && value instanceof Uint8Array) {
        return { typeUrl, value } as MessageData<CustomMessage>;
      }

      // Handle typed ExecuteContractMessage
      const executeContractMessage = message as ExecuteContractMessage;
      this._utils.validateExecuteContractMessage(executeContractMessage, this.transactionType);
      return {
        typeUrl: constants.executeContractMsgTypeUrl,
        value: executeContractMessage,
      };
    });
    return this;
  }
}
