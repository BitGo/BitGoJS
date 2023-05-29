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

import * as constants from './constants';
import { CosmosLikeTransaction, FeeData, MessageData } from './iface';
import { KeyPair } from './keyPair';

export class CosmosLikeUtils implements BaseUtils {
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
   * Creates a txRaw from an cosmos like transaction @see CosmosLikeTransaction
   * @Precondition cosmosLikeTransaction.publicKey must be defined
   * @param {CosmosLikeTransaction} cosmosLikeTransaction
   * @returns {TxRaw} Unsigned raw transaction
   */
  createTxRawFromCosmosLikeTransaction(cosmosLikeTransaction: CosmosLikeTransaction): TxRaw {
    if (!cosmosLikeTransaction.publicKey) {
      throw new Error('publicKey is required to create a txRaw');
    }
    const encodedPublicKey: Any = encodePubkey(encodeSecp256k1Pubkey(fromHex(cosmosLikeTransaction.publicKey)));
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
   * Validates if the address matches with regex @see accountAddressRegex
   *
   * @param {string} address
   * @returns {boolean} - the validation result
   */
  isValidAddress(address: string): boolean {
    throw new NotImplementedError('isValidAddress not implemented');
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
    const txRaw = utils.createTxRawFromCosmosLikeTransaction(cosmosLikeTransaction);
    return makeSignDoc(txRaw.bodyBytes, txRaw.authInfoBytes, chainId, accountNumber);
  }

  isValidHexString(hexString: string): boolean {
    return /^[0-9A-Fa-f]*$/.test(hexString);
  }
}

const utils = new CosmosLikeUtils();

export default utils;
