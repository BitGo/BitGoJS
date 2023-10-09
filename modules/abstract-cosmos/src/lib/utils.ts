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
  EncodeObject,
  Registry,
  decodePubkey,
  decodeTxRaw,
  encodePubkey,
  makeAuthInfoBytes,
  makeSignDoc,
} from '@cosmjs/proto-signing';
import { Coin, defaultRegistryTypes } from '@cosmjs/stargate';
import BigNumber from 'bignumber.js';
import { SignDoc, TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { Any } from 'cosmjs-types/google/protobuf/any';
import { MsgExecuteContract } from 'cosmjs-types/cosmwasm/wasm/v1/tx';

import { Hash, createHash } from 'crypto';
import * as constants from './constants';
import {
  CosmosLikeTransaction,
  DelegateOrUndelegeteMessage,
  ExecuteContractMessage,
  FeeData,
  MessageData,
  SendMessage,
  WithdrawDelegatorRewardsMessage,
} from './iface';
import { CosmosKeyPair as KeyPair } from './keyPair';

export class CosmosUtils implements BaseUtils {
  private registry;

  constructor() {
    this.registry = new Registry([...defaultRegistryTypes]);
    this.registry.register(constants.executeContractMsgTypeUrl, MsgExecuteContract);
  }

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
   * Checks the txn sequence is valid or not
   * @param {number} sequence
   */
  validateSequence(sequence: number) {
    if (sequence < 0) {
      throw new InvalidTransactionError('Invalid sequence: less than zero');
    }
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
   * @returns {string} cosmos proto type url
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
  protected getSendMessageDataFromDecodedTx(decodedTx: DecodedTxRaw): MessageData[] {
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
   * Returns the array of MessageData[] from the decoded transaction
   * @param {DecodedTxRaw} decodedTx
   * @returns {MessageData[]} Execute contract transaction message data
   */
  getExecuteContractMessageDataFromDecodedTx(decodedTx: DecodedTxRaw): MessageData[] {
    return decodedTx.body.messages.map((message) => {
      const value = this.registry.decode(message);
      return {
        value: {
          sender: value.sender,
          contract: value.contract,
          msg: value.msg,
          funds: value.funds,
        },
        typeUrl: message.typeUrl,
      };
    });
  }

  /**
   * Determines bitgo transaction type based on cosmos proto type url
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
      case constants.executeContractMsgTypeUrl:
        return TransactionType.ContractCall;
      default:
        return undefined;
    }
  }

  /**
   * Takes a hex encoded pubkey, converts it to the Amino JSON representation (type/value wrapper)
   * and returns it as protobuf `Any`
   * @param {string} pubkey hex encoded compressed secp256k1 public key
   * @returns {Any} pubkey encoded as protobuf `Any`
   */
  getEncodedPubkey(pubkey: string): Any {
    return encodePubkey(encodeSecp256k1Pubkey(fromHex(pubkey)));
  }

  /**
   * Creates a txRaw from an cosmos like transaction @see CosmosLikeTransaction
   * @Precondition cosmosLikeTransaction.publicKey must be defined
   * @param {CosmosLikeTransaction} cosmosLikeTransaction
   * @returns {TxRaw} Unsigned raw transaction
   */
  createTxRawFromCosmosLikeTransaction(cosmosLikeTransaction: CosmosLikeTransaction): TxRaw {
    if (!cosmosLikeTransaction.publicKey) {
      throw new Error('publicKey is required to create a txRaw');
    }
    const encodedPublicKey: Any = this.getEncodedPubkey(cosmosLikeTransaction.publicKey);
    const messages = cosmosLikeTransaction.sendMessages as unknown as Any[];
    let txBodyValue;
    if (cosmosLikeTransaction.memo) {
      txBodyValue = {
        memo: cosmosLikeTransaction.memo,
        messages: messages,
      };
    } else {
      txBodyValue = {
        messages: messages,
      };
    }

    const txBodyBytes = this.registry.encodeTxBody(txBodyValue);
    const sequence = cosmosLikeTransaction.sequence;
    const authInfoBytes = makeAuthInfoBytes(
      [{ pubkey: encodedPublicKey, sequence }],
      cosmosLikeTransaction.gasBudget.amount,
      cosmosLikeTransaction.gasBudget.gasLimit,
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
   * Returns whether or not the string is a valid protocol public key
   * @param {string | undefined} publicKey - the  public key to be validated
   */
  validatePublicKey(publicKey: string | undefined) {
    if (publicKey !== undefined) {
      try {
        new KeyPair({ pub: publicKey });
      } catch {
        throw new InvalidTransactionError(`Invalid Public Key`);
      }
    }
  }

  /**
   * Creates a sign doc from an cosmos like transaction @see CosmosLikeTransaction
   * @Precondition cosmosLikeTransaction.accountNumber and cosmosLikeTransaction.chainId must be defined
   * @param {CosmosLikeTransaction} cosmosLikeTransaction
   * @returns {SignDoc} sign doc
   */
  createSignDoc(
    cosmosLikeTransaction: CosmosLikeTransaction,
    accountNumber: number | undefined,
    chainId: string | undefined
  ): SignDoc {
    if (!accountNumber) {
      throw new Error('accountNumber is required to create a sign doc');
    }
    if (!chainId) {
      throw new Error('chainId is required to create a sign doc');
    }
    if (!cosmosLikeTransaction) {
      throw new Error('cosmosLikeTransaction is required to create a sign doc');
    }
    const txRaw = this.createTxRawFromCosmosLikeTransaction(cosmosLikeTransaction);
    return makeSignDoc(txRaw.bodyBytes, txRaw.authInfoBytes, chainId, accountNumber);
  }

  /**
   * Returns whether or not the string is a valid hex
   * @param hexString - hex string format
   * @returns {boolean} true if string is hex else false
   */
  isValidHexString(hexString: string): boolean {
    return /^[0-9A-Fa-f]*$/.test(hexString);
  }

  /**
   * Validates the WithdrawDelegatorRewardsMessage
   * @param {WithdrawDelegatorRewardsMessage} withdrawRewardsMessage - The WithdrawDelegatorRewardsMessage to validate.
   * @throws {InvalidTransactionError} Throws an error if the validatorAddress or delegatorAddress is invalid or missing.
   */
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

  /**
   * Helper method to check if the specified properties in an object are missing or null.
   * @param {Object} obj - The object to check.
   * @param {string[]} keys - An array of property keys to check.
   * @throws {Error} Throws an error if any of the specified properties are missing or null.
   */
  isObjPropertyNull(obj: { [key: string]: any }, keys: Array<string>) {
    for (const key of keys) {
      if (obj[key] == null) {
        throw new Error(`Missing or null value for property ${key}`);
      }
    }
  }

  /**
   * Validates the DelegateOrUndelegeteMessage
   * @param {DelegateOrUndelegeteMessage} delegateMessage - The DelegateOrUndelegeteMessage to validate.
   * @throws {InvalidTransactionError} Throws an error if the validatorAddress, delegatorAddress, or amount is invalid or missing.
   */
  validateDelegateOrUndelegateMessage(delegateMessage: DelegateOrUndelegeteMessage) {
    this.isObjPropertyNull(delegateMessage, ['validatorAddress', 'delegatorAddress']);

    if (!this.isValidValidatorAddress(delegateMessage.validatorAddress)) {
      throw new InvalidTransactionError(
        `Invalid DelegateOrUndelegeteMessage validatorAddress: ` + delegateMessage.validatorAddress
      );
    }
    if (!this.isValidAddress(delegateMessage.delegatorAddress)) {
      throw new InvalidTransactionError(
        `Invalid DelegateOrUndelegeteMessage delegatorAddress: ` + delegateMessage.delegatorAddress
      );
    }
    this.validateAmount(delegateMessage.amount);
  }

  /**
   * Validates the MessageData
   * @param {MessageData} messageData - The MessageData to validate.
   * @throws {InvalidTransactionError} Throws an error if the messageData is invalid or missing required fields.
   */
  validateMessageData(messageData: MessageData): void {
    if (messageData == null) {
      throw new InvalidTransactionError(`Invalid MessageData: undefined`);
    }
    if (messageData.typeUrl == null || this.getTransactionTypeFromTypeUrl(messageData.typeUrl) == null) {
      throw new InvalidTransactionError(`Invalid MessageData typeurl: ` + messageData.typeUrl);
    }

    const type = this.getTransactionTypeFromTypeUrl(messageData.typeUrl);
    switch (type) {
      case TransactionType.Send: {
        const value = messageData.value as SendMessage;
        this.validateSendMessage(value);
        break;
      }
      case TransactionType.StakingActivate:
      case TransactionType.StakingDeactivate: {
        const value = messageData.value as DelegateOrUndelegeteMessage;
        this.validateDelegateOrUndelegateMessage(value);
        break;
      }
      case TransactionType.StakingWithdraw: {
        const value = messageData.value as WithdrawDelegatorRewardsMessage;
        this.validateWithdrawRewardsMessage(value);
        break;
      }
      case TransactionType.ContractCall: {
        const value = messageData.value as ExecuteContractMessage;
        this.validateExecuteContractMessage(value, TransactionType.ContractCall);
        break;
      }
      default:
        throw new InvalidTransactionError(`Invalid MessageData TypeUrl is not supported: ` + messageData.typeUrl);
    }
  }

  /**
   * Validates the Cosmos-like transaction.
   * @param {CosmosLikeTransaction} tx - The transaction to validate.
   * @throws {InvalidTransactionError} Throws an error if the transaction is invalid or missing required fields.
   */
  validateTransaction(tx: CosmosLikeTransaction): void {
    this.validateSequence(tx.sequence);
    this.validateGasBudget(tx.gasBudget);
    this.validatePublicKey(tx.publicKey);
    if (tx.sendMessages === undefined || tx.sendMessages.length === 0) {
      throw new InvalidTransactionError('Invalid transaction: messages is required');
    } else {
      tx.sendMessages.forEach((message) => this.validateMessageData(message));
    }
  }

  /**
   * Creates a Cosmos-like transaction.
   * @param {number} sequence - The sender address sequence number for the transaction.
   * @param {MessageData[]} messages - The array of message data for the transaction.
   * @param {FeeData} gasBudget - The fee data for the transaction.
   * @param {string} [publicKey] - The public key associated with the sender.
   * @param {string} [memo] - The memo for the transaction.
   * @returns {CosmosLikeTransaction} Returns the created Cosmos-like transaction.
   * @throws {InvalidTransactionError} Throws an error if the created transaction is invalid.
   */
  createTransaction(
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
    this.validateTransaction(cosmosLikeTxn);
    return cosmosLikeTxn;
  }

  /**
   * Creates a Cosmos-like transaction with a hash.
   * @param {number} sequence - The sender address sequence number for the transaction.
   * @param {MessageData[]} messages - The array of message data for the transaction.
   * @param {FeeData} gasBudget - The fee data for the transaction.
   * @param {string} [publicKey] - The public key associated with the transaction.
   * @param {Buffer} [signature] - The signature for the transaction.
   * @param {string} [memo] - The memo for the transaction.
   * @returns {CosmosLikeTransaction} Returns the created Cosmos-like transaction with the hash and signature if provided.
   */
  createTransactionWithHash(
    sequence: number,
    messages: MessageData[],
    gasBudget: FeeData,
    publicKey?: string,
    signature?: Buffer,
    memo?: string
  ): CosmosLikeTransaction {
    const cosmosLikeTxn = this.createTransaction(sequence, messages, gasBudget, publicKey, memo);
    let hash = constants.UNAVAILABLE_TEXT;
    if (signature !== undefined) {
      const unsignedTx = this.createTxRawFromCosmosLikeTransaction(cosmosLikeTxn);
      const signedTx = TxRaw.fromPartial({
        bodyBytes: unsignedTx.bodyBytes,
        authInfoBytes: unsignedTx.authInfoBytes,
        signatures: [signature],
      });
      hash = createHash('sha256')
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
  deserializeTransaction(rawTx: string): CosmosLikeTransaction {
    const decodedTx = this.getDecodedTxFromRawBase64(rawTx);
    const typeUrl = this.getTypeUrlFromDecodedTx(decodedTx);
    const type: TransactionType | undefined = this.getTransactionTypeFromTypeUrl(typeUrl);
    let sendMessageData: MessageData[];
    if (type === TransactionType.Send) {
      sendMessageData = this.getSendMessageDataFromDecodedTx(decodedTx);
    } else if (type === TransactionType.StakingActivate || type === TransactionType.StakingDeactivate) {
      sendMessageData = this.getDelegateOrUndelegateMessageDataFromDecodedTx(decodedTx);
    } else if (type === TransactionType.StakingWithdraw) {
      sendMessageData = this.getWithdrawRewardsMessageDataFromDecodedTx(decodedTx);
    } else if (type === TransactionType.ContractCall) {
      sendMessageData = this.getExecuteContractMessageDataFromDecodedTx(decodedTx);
    } else {
      throw new Error('Transaction type not supported: ' + typeUrl);
    }
    const sequence = this.getSequenceFromDecodedTx(decodedTx);
    const gasBudget = this.getGasBudgetFromDecodedTx(decodedTx);
    const publicKey = this.getPublicKeyFromDecodedTx(decodedTx);
    const signature = decodedTx.signatures?.[0] !== undefined ? Buffer.from(decodedTx.signatures[0]) : undefined;
    return this.createTransactionWithHash(
      sequence,
      sendMessageData,
      gasBudget,
      publicKey,
      signature,
      decodedTx.body?.memo
    );
  }

  /**
   * Validates an array of coin amounts.
   * @param {Coin[]} amountArray - The array of coin amounts to validate.
   * @param {TransactionType} transactionType - optional field for transaction type
   */
  validateAmountData(amountArray: Coin[], transactionType?: TransactionType): void {
    amountArray.forEach((coinAmount) => {
      this.validateAmount(coinAmount, transactionType);
    });
  }

  /**
   * Validates the gas limit and gas amount for a transaction.
   * @param {FeeData} gasBudget - The gas budget to validate.
   * @throws {InvalidTransactionError} Throws an error if the gas budget is invalid.
   */
  validateGasBudget(gasBudget: FeeData): void {
    if (gasBudget.gasLimit <= 0) {
      throw new InvalidTransactionError('Invalid gas limit ' + gasBudget.gasLimit);
    }
    this.validateAmountData(gasBudget.amount);
  }

  /**
   * Validates a send message for a transaction.
   * @param {SendMessage} sendMessage - The send message to validate.
   * @throws {InvalidTransactionError} Throws an error if the send message is invalid.
   */
  validateSendMessage(sendMessage: SendMessage) {
    if (!sendMessage.toAddress || !this.isValidAddress(sendMessage.toAddress)) {
      throw new InvalidTransactionError(`Invalid SendMessage toAddress: ` + sendMessage.toAddress);
    }
    if (!sendMessage.fromAddress || !this.isValidAddress(sendMessage.fromAddress)) {
      throw new InvalidTransactionError(`Invalid SendMessage fromAddress: ` + sendMessage.fromAddress);
    }
    this.validateAmountData(sendMessage.amount);
  }

  /**
   * Validates a coin amount.
   * @param {Coin} amount - The coin amount to validate.
   * @param {TransactionType} transactionType - optional field for transaction type
   * @throws {InvalidTransactionError} Throws an error if the coin amount is invalid.
   */
  validateAmount(amount: Coin, transactionType?: TransactionType): void {
    throw new NotImplementedError('validateAmount not implemented');
  }

  /**
   * Validates if the address matches with regex @see accountAddressRegex
   * @param {string} address
   * @returns {boolean} - the validation result
   */
  isValidValidatorAddress(address: string): boolean {
    throw new NotImplementedError('isValidValidatorAddress not implemented');
  }

  /**
   * Validates if the address matches with regex @see accountAddressRegex
   * @param {string} address
   * @returns {boolean} - the validation result
   */
  isValidAddress(address: string): boolean {
    throw new NotImplementedError('isValidAddress not implemented');
  }

  /**
   * Validates if the address matches with regex @see contractAddressRegex
   * @param {string} address
   * @returns {boolean} - the validation result
   */
  isValidContractAddress(address: string): boolean {
    throw new NotImplementedError('isValidContractAddress not implemented');
  }

  /**
   * Validates a execute contract message
   * @param {ExecuteContractMessage} message - The execute contract message to validate
   * @param {TransactionType} transactionType - optional field for transaction type
   * @throws {InvalidTransactionError} Throws an error if the message is invalid
   */
  validateExecuteContractMessage(message: ExecuteContractMessage, transactionType?: TransactionType) {
    if (!message.contract || !this.isValidContractAddress(message.contract)) {
      throw new InvalidTransactionError(`Invalid ExecuteContractMessage contract address: ` + message.contract);
    }
    if (!message.sender || !this.isValidAddress(message.sender)) {
      throw new InvalidTransactionError(`Invalid ExecuteContractMessage sender address: ` + message.sender);
    }
    if (!message.msg) {
      throw new InvalidTransactionError(`Invalid ExecuteContractMessage msg: ` + message.msg);
    }
    if (message.funds) {
      this.validateAmountData(message.funds, transactionType);
    }
  }

  /**
   * Get coin specific hash function
   * @returns {Hash} The hash function
   */
  getHashFunction(): Hash {
    return createHash('sha256');
  }
}

const utils = new CosmosUtils();

export default utils;
