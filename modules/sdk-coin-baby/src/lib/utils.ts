import { CosmosUtils, MessageData } from '@bitgo/abstract-cosmos';
import { InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { Coin } from '@cosmjs/stargate';
import BigNumber from 'bignumber.js';
import * as constants from './constants';
import { epochingtx, btcstakingtx } from '@babylonlabs-io/babylon-proto-ts';
import { DecodedTxRaw } from '@cosmjs/proto-signing';
import { Any } from 'cosmjs-types/google/protobuf/any';
import { CustomTxMessage } from './iface';

export class Utils extends CosmosUtils<CustomTxMessage> {
  protected wrappedMsgTypeUrls = new Set<string>([
    constants.wrappedDelegateMsgTypeUrl,
    constants.wrappedUndelegateMsgTypeUrl,
    constants.wrappedBeginRedelegateTypeUrl,
  ]);
  protected customMsgTypeUrls = new Set<string>([constants.createBTCDelegationMsgTypeUrl]);

  constructor() {
    super();
    this.registry.register(constants.wrappedDelegateMsgTypeUrl, epochingtx.MsgWrappedDelegate);
    this.registry.register(constants.wrappedUndelegateMsgTypeUrl, epochingtx.MsgWrappedUndelegate);
    this.registry.register(constants.wrappedBeginRedelegateTypeUrl, epochingtx.MsgWrappedBeginRedelegate);
    this.registry.register(constants.createBTCDelegationMsgTypeUrl, btcstakingtx.MsgCreateBTCDelegation);
  }

  /** @inheritdoc */
  getDelegateOrUndelegateMessageDataFromDecodedTx(decodedTx: DecodedTxRaw): MessageData<CustomTxMessage>[] {
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
  getRedelegateMessageDataFromDecodedTx(decodedTx: DecodedTxRaw): MessageData<CustomTxMessage>[] {
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
  getCustomMessageDataFromDecodedTx(decodedTx: DecodedTxRaw): MessageData<CustomTxMessage>[] {
    return decodedTx.body.messages.map((message) => {
      const value = this.registry.decode(message);
      return {
        typeUrl: message.typeUrl,
        value: {
          kind: 'CreateBtcDelegation',
          ...value,
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
      case constants.createBTCDelegationMsgTypeUrl:
        return TransactionType.CustomTx;
      default:
        return super.getTransactionTypeFromTypeUrl(typeUrl);
    }
  }

  /** @inheritdoc */
  getSendMessagesForEncodingTx(
    cosmosLikeTransaction: Parameters<CosmosUtils<CustomTxMessage>['getSendMessagesForEncodingTx']>[0]
  ): Any[] {
    return cosmosLikeTransaction.sendMessages.map(({ typeUrl, value }) => {
      let valueToEncode: unknown = value;
      if (this.wrappedMsgTypeUrls.has(typeUrl)) {
        valueToEncode = { msg: value };
      } else if (this.customMsgTypeUrls.has(typeUrl)) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { kind, ...rest } = value as CustomTxMessage;
        valueToEncode = rest;
      }
      return { typeUrl, value: valueToEncode };
    }) as unknown as Any[];
  }

  /** @inheritdoc */
  validateCustomMessage(customMessage: CustomTxMessage) {
    // TODO: check the other fields more thoroughly
    this.isObjPropertyNull(customMessage, [
      'stakerAddr',
      // 'pop',
      'btcPk',
      'fpBtcPkList',
      'stakingTime',
      'stakingValue',
      'stakingTx',
      // 'stakingTxInclusionProof',
      'slashingTx',
      'delegatorSlashingSig',
      'unbondingTime',
      'unbondingTx',
      'unbondingValue',
      'unbondingSlashingTx',
      'delegatorUnbondingSlashingSig',
    ]);

    if (customMessage.pop) {
      this.isObjPropertyNull(customMessage.pop, ['btcSigType', 'btcSig']);
    }

    if (customMessage.stakingTxInclusionProof) {
      this.isObjPropertyNull(customMessage.stakingTxInclusionProof, ['key', 'proof']);

      if (customMessage.stakingTxInclusionProof.key) {
        this.isObjPropertyNull(customMessage.stakingTxInclusionProof.key, ['index', 'hash']);
      }
    }

    if (!this.isValidAddress(customMessage.stakerAddr)) {
      throw new InvalidTransactionError(`Invalid CreateBtcDelegationMessage stakerAddr: ` + customMessage.stakerAddr);
    }
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
