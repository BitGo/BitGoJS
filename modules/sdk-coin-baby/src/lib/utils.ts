import { epochingtx, btcstakingtx, incentivetx } from '@babylonlabs-io/babylon-proto-ts';
import { DecodedTxRaw } from '@cosmjs/proto-signing';
import { Coin } from '@cosmjs/stargate';
import BigNumber from 'bignumber.js';
import { Any } from 'cosmjs-types/google/protobuf/any';
import {
  BabylonSpecificMessageKind,
  BabylonSpecificMessages,
  CreateBtcDelegationMessage,
  WithdrawRewardMessage,
} from './iface';
import { CosmosUtils, MessageData } from '@bitgo/abstract-cosmos';
import { InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import * as constants from './constants';

export class Utils extends CosmosUtils<BabylonSpecificMessages> {
  public babylonMessageKindToTypeUrl: Record<BabylonSpecificMessageKind, string> = {
    CreateBtcDelegation: constants.createBTCDelegationMsgTypeUrl,
    WithdrawReward: constants.withdrawRewardMsgTypeUrl,
  };
  public babylonMessageTypeUrlToKind = Object.fromEntries(
    Object.entries(this.babylonMessageKindToTypeUrl).map(([key, value]) => [value, key])
  ) as Record<string, BabylonSpecificMessageKind>;

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
    this.registry.register(constants.withdrawRewardMsgTypeUrl, incentivetx.MsgWithdrawReward);
  }

  /** @inheritdoc */
  getDelegateOrUndelegateMessageDataFromDecodedTx(decodedTx: DecodedTxRaw): MessageData<BabylonSpecificMessages>[] {
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
  getRedelegateMessageDataFromDecodedTx(decodedTx: DecodedTxRaw): MessageData<BabylonSpecificMessages>[] {
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
  getCustomMessageDataFromDecodedTx(decodedTx: DecodedTxRaw): MessageData<BabylonSpecificMessages>[] {
    return decodedTx.body.messages.map((message) => {
      const value = this.registry.decode(message);
      return {
        typeUrl: message.typeUrl,
        value: {
          _kind: this.babylonMessageTypeUrlToKind[message.typeUrl],
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
      case constants.withdrawRewardMsgTypeUrl:
        return TransactionType.CustomTx;
      default:
        return super.getTransactionTypeFromTypeUrl(typeUrl);
    }
  }

  /** @inheritdoc */
  getSendMessagesForEncodingTx(
    cosmosLikeTransaction: Parameters<CosmosUtils<BabylonSpecificMessages>['getSendMessagesForEncodingTx']>[0]
  ): Any[] {
    return cosmosLikeTransaction.sendMessages.map(({ typeUrl, value }) => {
      let valueToEncode: unknown = value;
      if (this.wrappedMsgTypeUrls.has(typeUrl)) {
        valueToEncode = { msg: value };
      } else if (this.customMsgTypeUrls.has(typeUrl)) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _kind, ...rest } = value as BabylonSpecificMessages;
        valueToEncode = rest;
      }
      return { typeUrl, value: valueToEncode };
    }) as unknown as Any[];
  }

  /** @inheritdoc */
  validateCustomMessage(customMessage: BabylonSpecificMessages): void {
    switch (customMessage._kind) {
      case 'CreateBtcDelegation':
        this.validateCreateBtcDelegationMessage(customMessage);
        break;
      case 'WithdrawReward':
        this.validateWithdrawRewardMessage(customMessage);
        break;
      default:
        throw new InvalidTransactionError(`Unsupported BabylonSpecificMessages message`);
    }
  }

  validateCreateBtcDelegationMessage(createBtcDelegationMessage: CreateBtcDelegationMessage): void {
    if (createBtcDelegationMessage._kind !== 'CreateBtcDelegation') {
      throw new InvalidTransactionError(`Invalid CreateBtcDelegationMessage kind: ${createBtcDelegationMessage._kind}`);
    }

    // TODO: check the other fields more thoroughly
    this.isObjPropertyNull(createBtcDelegationMessage, [
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

    if (createBtcDelegationMessage.pop) {
      this.isObjPropertyNull(createBtcDelegationMessage.pop, ['btcSigType', 'btcSig']);
    }

    if (createBtcDelegationMessage.stakingTxInclusionProof) {
      this.isObjPropertyNull(createBtcDelegationMessage.stakingTxInclusionProof, ['key', 'proof']);

      if (createBtcDelegationMessage.stakingTxInclusionProof.key) {
        this.isObjPropertyNull(createBtcDelegationMessage.stakingTxInclusionProof.key, ['index', 'hash']);
      }
    }

    if (!this.isValidAddress(createBtcDelegationMessage.stakerAddr)) {
      throw new InvalidTransactionError(
        `Invalid CreateBtcDelegationMessage stakerAddr: ${createBtcDelegationMessage.stakerAddr}`
      );
    }
  }

  validateWithdrawRewardMessage(withdrawRewardMessage: WithdrawRewardMessage): void {
    if (withdrawRewardMessage._kind !== 'WithdrawReward') {
      throw new InvalidTransactionError(`Invalid WithdrawRewardMessage kind: ${withdrawRewardMessage._kind}`);
    }

    this.isObjPropertyNull(withdrawRewardMessage, ['type', 'address']);

    if (!['finality_provider', 'btc_staker'].includes(withdrawRewardMessage.type)) {
      throw new InvalidTransactionError(`Invalid WithdrawRewardMessage type: ${withdrawRewardMessage.type}`);
    }

    if (!this.isValidAddress(withdrawRewardMessage.address)) {
      throw new InvalidTransactionError(`Invalid WithdrawRewardMessage address: ${withdrawRewardMessage.address}`);
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
