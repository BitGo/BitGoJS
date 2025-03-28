import { epochingtx } from '@babylonlabs-io/babylon-proto-ts';
import { DecodedTxRaw } from '@cosmjs/proto-signing';
import { Coin } from '@cosmjs/stargate';
import BigNumber from 'bignumber.js';
import { Any } from 'cosmjs-types/google/protobuf/any';
import { CosmosUtils, MessageData } from '@bitgo/abstract-cosmos';
import { InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import * as constants from './constants';

export class Utils extends CosmosUtils {
  protected wrappedMsgTypeUrls = new Set<string>([
    constants.wrappedDelegateMsgTypeUrl,
    constants.wrappedUndelegateMsgTypeUrl,
    constants.wrappedBeginRedelegateTypeUrl,
  ]);

  constructor() {
    super();
    this.registry.register(constants.wrappedDelegateMsgTypeUrl, epochingtx.MsgWrappedDelegate);
    this.registry.register(constants.wrappedUndelegateMsgTypeUrl, epochingtx.MsgWrappedUndelegate);
    this.registry.register(constants.wrappedBeginRedelegateTypeUrl, epochingtx.MsgWrappedBeginRedelegate);
  }

  /** @inheritdoc */
  getDelegateOrUndelegateMessageDataFromDecodedTx(decodedTx: DecodedTxRaw): MessageData[] {
    return decodedTx.body.messages.map((message) => {
      const value = this.registry.decode(message).msg;
      return {
        typeUrl: message.typeUrl,
        value: {
          delegatorAddress: value.delegatorAddress,
          validatorAddress: value.validatorAddress,
          amount: value.amount,
        },
      };
    });
  }

  /** @inheritdoc */
  getRedelegateMessageDataFromDecodedTx(decodedTx: DecodedTxRaw): MessageData[] {
    return decodedTx.body.messages.map((message) => {
      const value = this.registry.decode(message).msg;
      return {
        typeUrl: message.typeUrl,
        value: {
          delegatorAddress: value.delegatorAddress,
          validatorSrcAddress: value.validatorSrcAddress,
          validatorDstAddress: value.validatorDstAddress,
          amount: value.amount,
        },
      };
    });
  }

  /** @inheritdoc */
  getTransactionTypeFromTypeUrl(typeUrl: string): TransactionType | undefined {
    switch (typeUrl) {
      case constants.wrappedDelegateMsgTypeUrl:
        return TransactionType.StakingActivate;
      case constants.wrappedUndelegateMsgTypeUrl:
        return TransactionType.StakingDeactivate;
      case constants.wrappedBeginRedelegateTypeUrl:
        return TransactionType.StakingRedelegate;
      default:
        return super.getTransactionTypeFromTypeUrl(typeUrl);
    }
  }

  /** @inheritdoc */
  getSendMessagesForEncodingTx(
    cosmosLikeTransaction: Parameters<CosmosUtils['getSendMessagesForEncodingTx']>[0]
  ): Any[] {
    return cosmosLikeTransaction.sendMessages.map(({ typeUrl, value }) => ({
      typeUrl,
      value: this.wrappedMsgTypeUrls.has(typeUrl) ? { msg: value } : value,
    })) as unknown as Any[];
  }

  /** @inheritdoc */
  isValidAddress(address: string): boolean {
    return this.isValidCosmosLikeAddressWithMemoId(address, constants.accountAddressRegex);
  }

  /** @inheritdoc */
  isValidValidatorAddress(address: string): boolean {
    return this.isValidBech32AddressMatchingRegex(address, constants.validatorAddressRegex);
  }

  /** @inheritdoc */
  isValidContractAddress(address: string): boolean {
    return this.isValidBech32AddressMatchingRegex(address, constants.contractAddressRegex);
  }

  /** @inheritdoc */
  validateAmount(amount: Coin): void {
    const amountBig = BigNumber(amount.amount);
    if (amountBig.isLessThanOrEqualTo(0)) {
      throw new InvalidTransactionError('transactionBuilder: validateAmount: Invalid amount: ' + amount.amount);
    }
    if (!constants.validDenoms.find((denom) => denom === amount.denom)) {
      throw new InvalidTransactionError('transactionBuilder: validateAmount: Invalid denom: ' + amount.denom);
    }
  }
}

const utils = new Utils();

export default utils;
