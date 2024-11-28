import { InvalidTransactionError } from '@bitgo/sdk-core';
import { Coin } from '@cosmjs/stargate';
import BigNumber from 'bignumber.js';

import { CosmosLikeTransaction, CosmosUtils, FeeData } from '@bitgo/abstract-cosmos';
import { MessageData } from './iface';
import * as constants from './constants';
import { NetworkType } from '@bitgo/statics';
import { DecodedTxRaw } from '@cosmjs/proto-signing';
import { MAINNET_ADDRESS_PREFIX, TESTNET_ADDRESS_PREFIX } from './constants';
const bech32 = require('bech32-buffer');

export class RuneUtils extends CosmosUtils {
  private networkType: NetworkType;
  constructor(networkType: NetworkType = NetworkType.MAINNET) {
    super();
    this.networkType = networkType;
  }

  getSendMessageDataFromDecodedTx(decodedTx: DecodedTxRaw): MessageData[] {
    return decodedTx.body.messages.map((message) => {
      const value = this.registry.decode(message);
      return {
        value: {
          fromAddress: this.getEncodedAddress(value.fromAddress),
          toAddress: this.getEncodedAddress(value.toAddress),
          amount: value.amount,
        },
        typeUrl: message.typeUrl,
      };
    });
  }

  /** @inheritdoc */
  isValidAddress(address: string | Uint8Array): boolean {
    if (address === undefined || address === null) {
      return false;
    }
    if (address instanceof Uint8Array) {
      return this.isValidDecodedAddress(address);
    }
    if (typeof address === 'string') {
      return this.isValidEncodedAddress(address);
    }
    return false;
  }

  /**
   * Validates a decoded address in `Uint8Array` form by encoding it and
   * checking if the encoded version is valid
   *
   * @param address - The decoded address as a `Uint8Array`.
   * @returns `true` if the encoded address is valid, `false` otherwise.
   */
  private isValidDecodedAddress(address: Uint8Array): boolean {
    const encodedAddress = this.getEncodedAddress(address);
    return this.isValidEncodedAddress(encodedAddress);
  }

  /**
   * Validates an encoded address string against network-specific criteria.
   *
   * @param address - The encoded address as a `string`.
   * @returns `true` if the address meets network-specific validation criteria, `false` otherwise.
   */
  private isValidEncodedAddress(address: string): boolean {
    if (this.networkType === NetworkType.TESTNET) {
      return this.isValidCosmosLikeAddressWithMemoId(address, constants.testnetAccountAddressRegex);
    }
    return this.isValidCosmosLikeAddressWithMemoId(address, constants.mainnetAccountAddressRegex);
  }

  /**
   * Encodes a given address `Uint8Array` into a bech32 string format, based on the current network type.
   * Primarily serves as a utility to convert a `Uint8Array`-type address to a bech32 encoded string
   *
   * @param address - The address to be encoded, provided as a `Uint8Array`.
   * @returns A bech32-encoded string representing the address.
   * @throws Error - Throws an error if encoding fails
   */
  getEncodedAddress(address: Uint8Array): string {
    try {
      return this.networkType === NetworkType.TESTNET
        ? bech32.encode(TESTNET_ADDRESS_PREFIX, address)
        : bech32.encode(MAINNET_ADDRESS_PREFIX, address);
    } catch (error) {
      throw new Error(`Failed to encode address: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Decodes a bech32-encoded address string back into a `Uint8Array`.
   * Primarily serves as a utility to convert a string-type address into its binary representation,
   *
   * @param address - The bech32-encoded address as a `string`.
   * @returns The decoded address as a `Uint8Array`.
   * @throws Error - Throws an error if decoding fails
   */
  getDecodedAddress(address: string): Uint8Array {
    try {
      return bech32.decode(address).data;
    } catch (error) {
      throw new Error(`Failed to decode address: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /** @inheritdoc */
  isValidValidatorAddress(address: string): boolean {
    if (this.networkType === NetworkType.TESTNET) {
      return this.isValidBech32AddressMatchingRegex(address, constants.testnetValidatorAddressRegex);
    }
    return this.isValidBech32AddressMatchingRegex(address, constants.mainnetValidatorAddressRegex);
  }

  /** @inheritdoc */
  validateAmount(amount: Coin): void {
    const amountBig = BigNumber(amount.amount);
    if (amountBig.isLessThanOrEqualTo(0)) {
      throw new InvalidTransactionError('transactionBuilder: validateAmount: Invalid amount: ' + amount.amount);
    }
    if (
      (this.networkType === NetworkType.TESTNET &&
        !constants.testnetValidDenoms.find((denom) => denom === amount.denom)) ||
      (this.networkType === NetworkType.MAINNET &&
        !constants.mainnetValidDenoms.find((denom) => denom === amount.denom))
    ) {
      throw new InvalidTransactionError('transactionBuilder: validateAmount: Invalid denom: ' + amount.denom);
    }
  }

  convertMessageAddressToUint8Array(messages: MessageData[]): MessageData[] {
    return messages.map((message) => {
      if ('fromAddress' in message.value && 'toAddress' in message.value) {
        const sendMessage = message.value;

        const decodedFrom =
          typeof sendMessage.fromAddress === 'string'
            ? bech32.decode(sendMessage.fromAddress).data
            : sendMessage.fromAddress;
        const decodedTo =
          typeof sendMessage.toAddress === 'string' ? bech32.decode(sendMessage.toAddress).data : sendMessage.toAddress;

        return {
          ...message,
          value: {
            ...sendMessage,
            fromAddress: decodedFrom,
            toAddress: decodedTo,
          },
        };
      }

      return message;
    });
  }

  createTransaction(
    sequence: number,
    messages: MessageData[],
    gasBudget: FeeData,
    publicKey?: string,
    memo?: string
  ): CosmosLikeTransaction {
    messages = this.convertMessageAddressToUint8Array(messages);
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

  getNetworkPrefix() {
    return this.networkType === NetworkType.TESTNET ? TESTNET_ADDRESS_PREFIX : MAINNET_ADDRESS_PREFIX;
  }
}

const runeUtils = new RuneUtils();

export default runeUtils;
