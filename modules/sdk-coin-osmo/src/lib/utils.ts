import {
  BaseUtils,
  InvalidTransactionError,
  NotImplementedError,
  ParseTransactionError,
  TransactionType,
} from '@bitgo/sdk-core';
import { encodeSecp256k1Pubkey, encodeSecp256k1Signature } from '@cosmjs/amino';
import { fromBase64, fromHex, toHex } from '@cosmjs/encoding';
import {
  DecodedTxRaw,
  decodePubkey,
  decodeTxRaw,
  EncodeObject,
  encodePubkey,
  makeAuthInfoBytes,
  makeSignDoc,
  Registry,
} from '@cosmjs/proto-signing';
import { Coin, defaultRegistryTypes } from '@cosmjs/stargate';
import BigNumber from 'bignumber.js';
import { SignDoc, TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { Any } from 'cosmjs-types/google/protobuf/any';
import * as crypto from 'crypto';

import * as constants from './constants';
import {
  OsmoTransaction,
  DelegateOrUndelegeteMessage,
  FeeData,
  MessageData,
  SendMessage,
  WithdrawDelegatorRewardsMessage,
} from './iface';
import { KeyPair } from './keyPair';

export class Utils implements BaseUtils {
  private registry = new Registry([...defaultRegistryTypes]);

  /** @inheritdoc */
  isValidBlockId(hash: string): boolean {
    return this.validateBlake2b(hash);
  }

  /** @inheritdoc */
  isValidPrivateKey(key: string): boolean {
    try {
      new KeyPair({ prv: key });
      return true;
    } catch {
      return false;
    }
  }

  /** @inheritdoc */
  isValidPublicKey(key: string): boolean {
    try {
      new KeyPair({ pub: key });
      return true;
    } catch {
      return false;
    }
  }

  /** @inheritdoc */
  isValidSignature(signature: string): boolean {
    throw new NotImplementedError('isValidSignature not implemented');
  }

  /** @inheritdoc */
  isValidTransactionId(txId: string): boolean {
    return this.validateBlake2b(txId);
  }

  /**
   * Checks if transaction hash is in valid black2b format
   */
  validateBlake2b(hash: string): boolean {
    if (hash?.length !== 64) {
      return false;
    }
    return hash.match(/^[a-zA-Z0-9]+$/) !== null;
  }

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

  /**
   * Validates whether amounts are in range
   *
   * @param {number[]} amounts - the amounts to validate
   * @returns {boolean} - the validation result
   */
  isValidAmounts(amounts: number[]): boolean {
    for (const amount of amounts) {
      if (!this.isValidAmount(amount)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Validates whether amount is in range
   * @param {number} amount
   * @returns {boolean} the validation result
   */
  isValidAmount(amount: number): boolean {
    const bigNumberAmount = new BigNumber(amount);
    if (!bigNumberAmount.isInteger() || bigNumberAmount.isLessThanOrEqualTo(0)) {
      return false;
    }
    return true;
  }

  /**
   * Decodes raw tx data into messages, signing info, and fee data
   * @param {string} txHex - raw base64 tx
   * @returns {DecodedTxRaw} Decoded transaction
   */
  getDecodedTxFromRawBase64(txRaw: string): DecodedTxRaw {
    try {
      return decodeTxRaw(fromBase64(txRaw));
    } catch (e) {
      throw new ParseTransactionError('Error decoding TxRaw base64 encoded string: ' + e.message);
    }
  }

  /**
   * Returns the array of messages in the body of the decoded transaction
   * @param {DecodedTxRaw} decodedTx
   * @returns {EncodeObject[]} messages along with type url
   */
  private getEncodedMessagesFromDecodedTx(decodedTx: DecodedTxRaw): EncodeObject[] {
    return decodedTx.body.messages;
  }

  /**
   * Pulls the sequence number from a DecodedTxRaw AuthInfo property
   * @param {DecodedTxRaw} decodedTx
   * @returns {number} sequence
   */
  getSequenceFromDecodedTx(decodedTx: DecodedTxRaw): number {
    return Number(decodedTx.authInfo.signerInfos[0].sequence);
  }

  /**
   * Pulls the typeUrl from the encoded message of a DecodedTxRaw
   * @param {DecodedTxRaw} decodedTx
   * @returns {string} osmosis proto type url
   */
  getTypeUrlFromDecodedTx(decodedTx: DecodedTxRaw): string {
    const encodedMessage = this.getEncodedMessagesFromDecodedTx(decodedTx)[0];
    return encodedMessage.typeUrl;
  }

  /**
   * Returns the fee data from the decoded transaction
   * @param {DecodedTxRaw} decodedTx
   * @returns {FeeData} fee data
   */
  getGasBudgetFromDecodedTx(decodedTx: DecodedTxRaw): FeeData {
    return {
      amount: decodedTx.authInfo.fee?.amount as Coin[],
      gasLimit: Number(decodedTx.authInfo.fee?.gasLimit),
    };
  }

  /**
   * Returns the publicKey from the decoded transaction
   * @param {DecodedTxRaw} decodedTx
   * @returns {string | undefined} publicKey in hex format if it exists, undefined otherwise
   */
  getPublicKeyFromDecodedTx(decodedTx: DecodedTxRaw): string | undefined {
    const publicKeyUInt8Array = decodedTx.authInfo.signerInfos?.[0].publicKey?.value;
    if (publicKeyUInt8Array) {
      return toHex(fromBase64(decodePubkey(decodedTx.authInfo.signerInfos?.[0].publicKey)?.value));
    }
    return undefined;
  }

  /**
   * Returns the array of MessageData[] from the decoded transaction
   * @param {DecodedTxRaw} decodedTx
   * @returns {MessageData[]} Send transaction message data
   */
  getSendMessageDataFromDecodedTx(decodedTx: DecodedTxRaw): MessageData[] {
    return decodedTx.body.messages.map((message) => {
      const value = this.registry.decode(message);
      return {
        value: {
          fromAddress: value.fromAddress,
          toAddress: value.toAddress,
          amount: value.amount,
        },
        typeUrl: message.typeUrl,
      };
    });
  }

  /**
   * Returns the array of MessageData[] from the decoded transaction
   * @param {DecodedTxRaw} decodedTx
   * @returns {MessageData[]} Delegate of undelegate transaction message data
   */
  getDelegateOrUndelegateMessageDataFromDecodedTx(decodedTx: DecodedTxRaw): MessageData[] {
    return decodedTx.body.messages.map((message) => {
      const value = this.registry.decode(message);
      return {
        value: {
          delegatorAddress: value.delegatorAddress,
          validatorAddress: value.validatorAddress,
          amount: value.amount,
        },
        typeUrl: message.typeUrl,
      };
    });
  }

  /**
   * Returns the array of MessageData[] from the decoded transaction
   * @param {DecodedTxRaw} decodedTx
   * @returns {MessageData[]} WithdrawDelegatorRewards transaction message data
   */
  getWithdrawRewardsMessageDataFromDecodedTx(decodedTx: DecodedTxRaw): MessageData[] {
    return decodedTx.body.messages.map((message) => {
      const value = this.registry.decode(message);
      return {
        value: {
          delegatorAddress: value.delegatorAddress,
          validatorAddress: value.validatorAddress,
        },
        typeUrl: message.typeUrl,
      };
    });
  }

  /**
   * Returns the array of MessageData[] from the decoded transaction
   * @param {DecodedTxRaw} decodedTx
   * @returns {MessageData[]} Delegate of undelegate transaction message data
   */
  getWithdrawDelegatorRewardsMessageDataFromDecodedTx(decodedTx: DecodedTxRaw): MessageData[] {
    return decodedTx.body.messages.map((message) => {
      const value = this.registry.decode(message);
      return {
        value: {
          delegatorAddress: value.delegatorAddress,
          validatorAddress: value.validatorAddress,
        },
        typeUrl: message.typeUrl,
      };
    });
  }

  /**
   * Determines bitgo transaction type based on osmosis proto type url
   * @param {string} typeUrl
   * @returns {TransactionType | undefined} TransactionType if url is supported else undefined
   */
  getTransactionTypeFromTypeUrl(typeUrl: string): TransactionType | undefined {
    switch (typeUrl) {
      case constants.sendMsgTypeUrl:
        return TransactionType.Send;
      case constants.delegateMsgTypeUrl:
        return TransactionType.StakingActivate;
      case constants.undelegateMsgTypeUrl:
        return TransactionType.StakingDeactivate;
      case constants.withdrawDelegatorRewardMsgTypeUrl:
        return TransactionType.StakingWithdraw;
      default:
        return undefined;
    }
  }

  /**
   * Creates a txRaw from an osmo transaction @see OsmoTransaction
   * @Precondition osmoTransaction.publicKey must be defined
   * @param {OsmoTransaction} osmoTransaction
   * @returns {TxRaw} Unsigned raw transaction
   */
  createTxRawFromOsmoTransaction(osmoTransaction: OsmoTransaction): TxRaw {
    if (!osmoTransaction.publicKey) {
      throw new Error('publicKey is required to create a txRaw');
    }
    const encodedPublicKey: Any = encodePubkey(encodeSecp256k1Pubkey(fromHex(osmoTransaction.publicKey)));
    const messages = osmoTransaction.sendMessages as unknown as Any[];
    let txBodyValue;
    if (osmoTransaction.memo) {
      txBodyValue = {
        memo: osmoTransaction.memo,
        messages: messages,
      };
    } else {
      txBodyValue = {
        messages: messages,
      };
    }

    const txBodyBytes = this.registry.encodeTxBody(txBodyValue);
    const sequence = osmoTransaction.sequence;
    const authInfoBytes = makeAuthInfoBytes(
      [{ pubkey: encodedPublicKey, sequence }],
      osmoTransaction.gasBudget.amount,
      osmoTransaction.gasBudget.gasLimit,
      undefined,
      undefined,
      undefined
    );
    return TxRaw.fromPartial({
      bodyBytes: txBodyBytes,
      authInfoBytes: authInfoBytes,
    });
  }

  /**
   * Encodes a signature into a txRaw
   * @param {string} publicKeyHex publicKey in hex encoded string format
   * @param {string} signatureHex signature in hex encoded string format
   * @param {TxRaw} unsignedTx raw transaction
   * @returns {TxRaw} Signed raw transaction
   */
  createSignedTxRaw(
    publicKeyHex: string,
    signatureHex: string,
    unsignedTx: { bodyBytes: Uint8Array; authInfoBytes: Uint8Array }
  ): TxRaw {
    const stdSignature = encodeSecp256k1Signature(fromHex(publicKeyHex), fromHex(signatureHex));
    return TxRaw.fromPartial({
      bodyBytes: unsignedTx.bodyBytes,
      authInfoBytes: unsignedTx.authInfoBytes,
      signatures: [fromBase64(stdSignature.signature)],
    });
  }

  /**
   * Decodes a raw transaction into a DecodedTxRaw and checks if it has non empty signatures
   * @param {string} rawTransaction
   * @returns {boolean} true if transaction is signed else false
   */
  isSignedRawTx(rawTransaction: string): boolean {
    const decodedTx = this.getDecodedTxFromRawBase64(rawTransaction);
    if (decodedTx.signatures.length > 0) {
      return true;
    }
    return false;
  }

  /**
   * Deserializes base64 enocded raw transaction string into @see OsmoTransaction
   * @param {string} rawTx base64 enocded raw transaction string
   * @returns {OsmoTransaction} Deserialized osmoTransaction
   */
  deserializeOsmoTransaction(rawTx: string): OsmoTransaction {
    const decodedTx = utils.getDecodedTxFromRawBase64(rawTx);
    const typeUrl = utils.getTypeUrlFromDecodedTx(decodedTx);
    const type: TransactionType | undefined = utils.getTransactionTypeFromTypeUrl(typeUrl);
    let sendMessageData: MessageData[];
    if (type === TransactionType.Send) {
      sendMessageData = utils.getSendMessageDataFromDecodedTx(decodedTx);
    } else if (type === TransactionType.StakingActivate || type === TransactionType.StakingDeactivate) {
      sendMessageData = utils.getDelegateOrUndelegateMessageDataFromDecodedTx(decodedTx);
    } else if (type === TransactionType.StakingWithdraw) {
      sendMessageData = utils.getWithdrawRewardsMessageDataFromDecodedTx(decodedTx);
    } else {
      throw new Error('Transaction type not supported: ' + typeUrl);
    }
    const sequence = utils.getSequenceFromDecodedTx(decodedTx);
    const gasBudget = utils.getGasBudgetFromDecodedTx(decodedTx);
    const publicKey = utils.getPublicKeyFromDecodedTx(decodedTx);
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

  createOsmoTransaction(
    sequence: number,
    messages: MessageData[],
    gasBudget: FeeData,
    publicKey?: string,
    memo?: string
  ): OsmoTransaction {
    const osmoTxn = {
      sequence: sequence,
      sendMessages: messages,
      gasBudget: gasBudget,
      publicKey: publicKey,
      memo: memo,
    };
    this.validateOsmoTransaction(osmoTxn);
    return osmoTxn;
  }

  createOsmoTransactionWithHash(
    sequence: number,
    messages: MessageData[],
    gasBudget: FeeData,
    publicKey?: string,
    signature?: Buffer,
    memo?: string
  ): OsmoTransaction {
    const osmoTxn = this.createOsmoTransaction(sequence, messages, gasBudget, publicKey, memo);
    let hash = constants.UNAVAILABLE_TEXT;
    if (signature !== undefined) {
      const unsignedTx = this.createTxRawFromOsmoTransaction(osmoTxn);
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
      return { ...osmoTxn, hash: hash, signature: signature };
    }
    return { ...osmoTxn, hash: hash };
  }

  validateOsmoTransaction(tx: OsmoTransaction): void {
    this.validateSequence(tx.sequence);
    this.validateGasBudget(tx.gasBudget);
    this.validatePublicKey(tx.publicKey);
    if (tx.sendMessages === undefined || tx.sendMessages.length === 0) {
      throw new InvalidTransactionError('Invalid transaction: messages is required');
    } else {
      tx.sendMessages.forEach((message) => this.validateMessageData(message));
    }
  }

  validateMessageData(messageData: MessageData): void {
    if (messageData == null) {
      throw new InvalidTransactionError(`Invalid MessageData: undefined`);
    }
    if (messageData.typeUrl == null || utils.getTransactionTypeFromTypeUrl(messageData.typeUrl) == null) {
      throw new InvalidTransactionError(`Invalid MessageData typeurl: ` + messageData.typeUrl);
    }
    const type = utils.getTransactionTypeFromTypeUrl(messageData.typeUrl);
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

  validateAmountData(amountArray: Coin[]): void {
    amountArray.forEach((coinAmount) => {
      this.validateAmount(coinAmount);
    });
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

  validateGasBudget(gasBudget: FeeData): void {
    if (gasBudget.gasLimit <= 0) {
      throw new InvalidTransactionError('Invalid gas limit ' + gasBudget.gasLimit);
    }
    this.validateAmountData(gasBudget.amount);
  }

  validateSequence(sequence: number) {
    if (sequence < 0) {
      throw new InvalidTransactionError('Invalid sequence: less than zero');
    }
  }

  validatePublicKey(publicKey: string | undefined) {
    if (publicKey !== undefined) {
      try {
        new KeyPair({ pub: publicKey });
      } catch {
        throw new InvalidTransactionError(`Key validation failed`);
      }
    }
  }

  /**
   * Creates a sign doc from an osmo transaction @see OsmoTransaction
   * @Precondition osmoTransaction.accountNumber and osmoTransaction.chainId must be defined
   * @param {OsmoTransaction} osmoTransaction
   * @returns {SignDoc} sign doc
   */
  createSignDoc(
    osmoTransaction: OsmoTransaction,
    accountNumber: number | undefined,
    chainId: string | undefined
  ): SignDoc {
    if (!accountNumber) {
      throw new Error('accountNumber is required to create a sign doc');
    }
    if (!chainId) {
      throw new Error('chainId is required to create a sign doc');
    }
    if (!osmoTransaction) {
      throw new Error('osmoTransaction is required to create a sign doc');
    }
    const txRaw = utils.createTxRawFromOsmoTransaction(osmoTransaction);
    return makeSignDoc(txRaw.bodyBytes, txRaw.authInfoBytes, chainId, accountNumber);
  }

  validateDelegateOrUndelegateMessage(delegateMessage: DelegateOrUndelegeteMessage) {
    if (!delegateMessage.validatorAddress || !utils.isValidValidatorAddress(delegateMessage.validatorAddress)) {
      throw new InvalidTransactionError(
        `Invalid DelegateOrUndelegeteMessage validatorAddress: ` + delegateMessage.validatorAddress
      );
    }
    if (!delegateMessage.delegatorAddress || !utils.isValidAddress(delegateMessage.delegatorAddress)) {
      throw new InvalidTransactionError(
        `Invalid DelegateOrUndelegeteMessage delegatorAddress: ` + delegateMessage.delegatorAddress
      );
    }
    this.validateAmount(delegateMessage.amount);
  }

  validateWithdrawRewardsMessage(withdrawRewardsMessage: WithdrawDelegatorRewardsMessage) {
    if (
      !withdrawRewardsMessage.validatorAddress ||
      !utils.isValidValidatorAddress(withdrawRewardsMessage.validatorAddress)
    ) {
      throw new InvalidTransactionError(
        `Invalid WithdrawDelegatorRewardsMessage validatorAddress: ` + withdrawRewardsMessage.validatorAddress
      );
    }
    if (!withdrawRewardsMessage.delegatorAddress || !utils.isValidAddress(withdrawRewardsMessage.delegatorAddress)) {
      throw new InvalidTransactionError(
        `Invalid WithdrawDelegatorRewardsMessage delegatorAddress: ` + withdrawRewardsMessage.delegatorAddress
      );
    }
  }

  validateSendMessage(sendMessage: SendMessage) {
    if (!sendMessage.toAddress || !utils.isValidAddress(sendMessage.toAddress)) {
      throw new InvalidTransactionError(`Invalid SendMessage toAddress: ` + sendMessage.toAddress);
    }
    if (!sendMessage.fromAddress || !utils.isValidAddress(sendMessage.fromAddress)) {
      throw new InvalidTransactionError(`Invalid SendMessage fromAddress: ` + sendMessage.fromAddress);
    }
    this.validateAmountData(sendMessage.amount);
  }

  isValidHexString(hexString: string): boolean {
    return /^[0-9A-Fa-f]*$/.test(hexString);
  }
}

const utils = new Utils();

export default utils;
