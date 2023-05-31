import { Coin } from '@cosmjs/stargate';
import { InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';

import BigNumber from 'bignumber.js';
import { TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import * as crypto from 'crypto';

import * as constants from './constants';
import {
  CosmosLikeTransaction,
  DelegateOrUndelegeteMessage,
  FeeData,
  MessageData,
  SendMessage,
  WithdrawDelegatorRewardsMessage,
  CosmosConstants,
  CosmosLikeUtils,
} from '@bitgo/abstract-cosmos';

export class OsmoUtils extends CosmosLikeUtils {
  /**
   * Validates if the address matches with regex @see accountAddressRegex
   *
   * @param {string} address
   * @returns {boolean} - the validation result
   */
  isValidAddress(address: string): boolean {
    return constants.accountAddressRegex.test(address);
  }

  /**
   * Validates if the address matches with regex @see accountAddressRegex
   *
   * @param {string} address
   * @returns {boolean} - the validation result
   */
  isValidValidatorAddress(address: string): boolean {
    return constants.validatorAddressRegex.test(address);
  }

  validateWithdrawRewardsMessage(withdrawRewardsMessage: WithdrawDelegatorRewardsMessage) {
    if (
      !withdrawRewardsMessage.validatorAddress ||
      !this.isValidValidatorAddress(withdrawRewardsMessage.validatorAddress)
    ) {
      throw new InvalidTransactionError(
        `Invalid WithdrawDelegatorRewardsMessage validatorAddress: ` + withdrawRewardsMessage.validatorAddress
      );
    }
    if (!withdrawRewardsMessage.delegatorAddress || !this.isValidAddress(withdrawRewardsMessage.delegatorAddress)) {
      throw new InvalidTransactionError(
        `Invalid WithdrawDelegatorRewardsMessage delegatorAddress: ` + withdrawRewardsMessage.delegatorAddress
      );
    }
  }

  validateAmount(amount: Coin): void {
    const amountBig = BigNumber(amount.amount);
    if (amountBig.isLessThanOrEqualTo(0)) {
      throw new InvalidTransactionError('transactionBuilder: validateAmount: Invalid amount: ' + amount.amount);
    }
    if (!constants.validDenoms.find((denom) => denom === amount.denom)) {
      throw new InvalidTransactionError('transactionBuilder: validateAmount: Invalid denom: ' + amount.denom);
    }
  }

  validateDelegateOrUndelegateMessage(delegateMessage: DelegateOrUndelegeteMessage) {
    if (!delegateMessage.validatorAddress || !osmoUtils.isValidValidatorAddress(delegateMessage.validatorAddress)) {
      throw new InvalidTransactionError(
        `Invalid DelegateOrUndelegeteMessage validatorAddress: ` + delegateMessage.validatorAddress
      );
    }
    if (!delegateMessage.delegatorAddress || !osmoUtils.isValidAddress(delegateMessage.delegatorAddress)) {
      throw new InvalidTransactionError(
        `Invalid DelegateOrUndelegeteMessage delegatorAddress: ` + delegateMessage.delegatorAddress
      );
    }
    this.validateAmount(delegateMessage.amount);
  }

  validateMessageData(messageData: MessageData): void {
    if (messageData == null) {
      throw new InvalidTransactionError(`Invalid MessageData: undefined`);
    }
    if (messageData.typeUrl == null || super.getTransactionTypeFromTypeUrl(messageData.typeUrl) == null) {
      throw new InvalidTransactionError(`Invalid MessageData typeurl: ` + messageData.typeUrl);
    }
    const type = super.getTransactionTypeFromTypeUrl(messageData.typeUrl);
    if (type === TransactionType.Send) {
      const value = messageData.value as SendMessage;
      if (value.toAddress == null) {
        throw new InvalidTransactionError(`Invalid MessageData value.toAddress: ` + value.toAddress);
      }
      if (value.fromAddress == null) {
        throw new InvalidTransactionError(`Invalid MessageData value.fromAddress: ` + value.fromAddress);
      }
    } else if (type === TransactionType.StakingActivate || type === TransactionType.StakingDeactivate) {
      const value = messageData.value as DelegateOrUndelegeteMessage;
      if (value.validatorAddress == null) {
        throw new InvalidTransactionError(`Invalid MessageData value.validatorAddress: ` + value.validatorAddress);
      }
      if (value.delegatorAddress == null) {
        throw new InvalidTransactionError(`Invalid MessageData value.delegatorAddress: ` + value.delegatorAddress);
      }
      this.validateAmount((messageData.value as DelegateOrUndelegeteMessage).amount);
    } else if (type === TransactionType.StakingWithdraw) {
      const value = messageData.value as WithdrawDelegatorRewardsMessage;
      if (value.validatorAddress == null) {
        throw new InvalidTransactionError(`Invalid MessageData value.validatorAddress: ` + value.validatorAddress);
      }
      if (value.delegatorAddress == null) {
        throw new InvalidTransactionError(`Invalid MessageData value.delegatorAddress: ` + value.delegatorAddress);
      }
    } else {
      throw new InvalidTransactionError(`Invalid MessageData TypeUrl is not supported: ` + messageData.typeUrl);
    }
    if (type !== TransactionType.StakingWithdraw) {
    }
  }

  validateOsmoTransaction(tx: CosmosLikeTransaction): void {
    super.validateSequence(tx.sequence);
    this.validateGasBudget(tx.gasBudget);
    super.validatePublicKey(tx.publicKey);
    if (tx.sendMessages === undefined || tx.sendMessages.length === 0) {
      throw new InvalidTransactionError('Invalid transaction: messages is required');
    } else {
      tx.sendMessages.forEach((message) => this.validateMessageData(message));
    }
  }

  createOsmoTransaction(
    sequence: number,
    messages: MessageData[],
    gasBudget: FeeData,
    publicKey?: string,
    memo?: string
  ): CosmosLikeTransaction {
    const cosmosLikeTxn = {
      sequence: sequence,
      sendMessages: messages,
      gasBudget: gasBudget,
      publicKey: publicKey,
      memo: memo,
    };
    this.validateOsmoTransaction(cosmosLikeTxn);
    return cosmosLikeTxn;
  }

  createOsmoTransactionWithHash(
    sequence: number,
    messages: MessageData[],
    gasBudget: FeeData,
    publicKey?: string,
    signature?: Buffer,
    memo?: string
  ): CosmosLikeTransaction {
    const cosmosLikeTxn = this.createOsmoTransaction(sequence, messages, gasBudget, publicKey, memo);
    let hash = CosmosConstants.UNAVAILABLE_TEXT;
    if (signature !== undefined) {
      const unsignedTx = super.createTxRawFromCosmosLikeTransaction(cosmosLikeTxn);
      const signedTx = TxRaw.fromPartial({
        bodyBytes: unsignedTx.bodyBytes,
        authInfoBytes: unsignedTx.authInfoBytes,
        signatures: [signature],
      });
      hash = crypto
        .createHash('sha256')
        .update(TxRaw.encode(signedTx).finish())
        .digest()
        .toString('hex')
        .toLocaleUpperCase('en-US');
      return { ...cosmosLikeTxn, hash: hash, signature: signature };
    }
    return { ...cosmosLikeTxn, hash: hash };
  }

  /**
   * Deserializes base64 enocded raw transaction string into @see CosmosLikeTransaction
   * @param {string} rawTx base64 enocded raw transaction string
   * @returns {CosmosLikeTransaction} Deserialized cosmosLikeTransaction
   */
  deserializeOsmoTransaction(rawTx: string): CosmosLikeTransaction {
    const decodedTx = super.getDecodedTxFromRawBase64(rawTx);
    const typeUrl = super.getTypeUrlFromDecodedTx(decodedTx);
    const type: TransactionType | undefined = super.getTransactionTypeFromTypeUrl(typeUrl);
    let sendMessageData: MessageData[];
    if (type === TransactionType.Send) {
      sendMessageData = super.getSendMessageDataFromDecodedTx(decodedTx);
    } else if (type === TransactionType.StakingActivate || type === TransactionType.StakingDeactivate) {
      sendMessageData = super.getDelegateOrUndelegateMessageDataFromDecodedTx(decodedTx);
    } else if (type === TransactionType.StakingWithdraw) {
      sendMessageData = super.getWithdrawRewardsMessageDataFromDecodedTx(decodedTx);
    } else {
      throw new Error('Transaction type not supported: ' + typeUrl);
    }
    const sequence = super.getSequenceFromDecodedTx(decodedTx);
    const gasBudget = super.getGasBudgetFromDecodedTx(decodedTx);
    const publicKey = super.getPublicKeyFromDecodedTx(decodedTx);
    const signature = decodedTx.signatures?.[0] !== undefined ? Buffer.from(decodedTx.signatures[0]) : undefined;
    return this.createOsmoTransactionWithHash(
      sequence,
      sendMessageData,
      gasBudget,
      publicKey,
      signature,
      decodedTx.body?.memo
    );
  }

  validateAmountData(amountArray: Coin[]): void {
    amountArray.forEach((coinAmount) => {
      this.validateAmount(coinAmount);
    });
  }

  validateGasBudget(gasBudget: FeeData): void {
    if (gasBudget.gasLimit <= 0) {
      throw new InvalidTransactionError('Invalid gas limit ' + gasBudget.gasLimit);
    }
    this.validateAmountData(gasBudget.amount);
  }

  validateSendMessage(sendMessage: SendMessage) {
    if (!sendMessage.toAddress || !osmoUtils.isValidAddress(sendMessage.toAddress)) {
      throw new InvalidTransactionError(`Invalid SendMessage toAddress: ` + sendMessage.toAddress);
    }
    if (!sendMessage.fromAddress || !osmoUtils.isValidAddress(sendMessage.fromAddress)) {
      throw new InvalidTransactionError(`Invalid SendMessage fromAddress: ` + sendMessage.fromAddress);
    }
    this.validateAmountData(sendMessage.amount);
  }
}

const osmoUtils = new OsmoUtils();

export default osmoUtils;
