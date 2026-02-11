import { TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';

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
  messages(messages: (CosmosTransactionMessage<CustomMessage> | Partial<MessageData<CustomMessage>>)[]): this {
    this._messages = messages.map((message) => {
      const executeContractMessage = message as ExecuteContractMessage;

      if (!executeContractMessage.msg) {
        // Pre-encoded message from deserialization round-trip
        return message as MessageData<CustomMessage>;
      }

      if (CosmosUtils.isGroupProposal(executeContractMessage)) {
        return {
          typeUrl: constants.groupProposalMsgTypeUrl,
          value: executeContractMessage.msg,
        } as MessageData<CustomMessage>;
      }

      if (CosmosUtils.isGroupVote(executeContractMessage)) {
        return {
          typeUrl: constants.groupVoteMsgTypeUrl,
          value: executeContractMessage.msg,
        } as MessageData<CustomMessage>;
      }

      this._utils.validateExecuteContractMessage(executeContractMessage, this.transactionType);
      return { typeUrl: constants.executeContractMsgTypeUrl, value: executeContractMessage };
    });
    return this;
  }
}
