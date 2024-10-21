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
const { MsgSend } = require('../../resources/MsgCompiled').types;

export class RuneUtils extends CosmosUtils {
  private networkType: NetworkType;
  constructor(networkType: NetworkType = NetworkType.MAINNET) {
    super();
    this.networkType = networkType;
    this.registry.register('/types.MsgSend', MsgSend);
  }

  getSendMessageDataFromDecodedTx(decodedTx: DecodedTxRaw): MessageData[] {
    return decodedTx.body.messages.map((message) => {
      const value = this.registry.decode(message);
      return {
        value: {
          fromAddress:
            this.networkType === NetworkType.TESTNET
              ? bech32.encode(TESTNET_ADDRESS_PREFIX, value.fromAddress)
              : bech32.encode(MAINNET_ADDRESS_PREFIX, value.fromAddress),
          toAddress:
            this.networkType === NetworkType.TESTNET
              ? bech32.encode(TESTNET_ADDRESS_PREFIX, value.toAddress)
              : bech32.encode(MAINNET_ADDRESS_PREFIX, value.toAddress),
          amount: value.amount,
        },
        typeUrl: message.typeUrl,
      };
    });
  }

  /** @inheritdoc */
  isValidAddress(address: string | Buffer): boolean {
    if (address === undefined) {
      return false;
    }
    if (typeof address !== 'string') {
      const encodedAddress =
        this.networkType === NetworkType.TESTNET
          ? bech32.encode(TESTNET_ADDRESS_PREFIX, address)
          : bech32.encode(MAINNET_ADDRESS_PREFIX, address);
      if (this.networkType === NetworkType.TESTNET) {
        return this.isValidCosmosLikeAddressWithMemoId(encodedAddress, constants.testnetAccountAddressRegex);
      }
      return this.isValidCosmosLikeAddressWithMemoId(encodedAddress, constants.mainnetAccountAddressRegex);
    } else {
      if (this.networkType === NetworkType.TESTNET) {
        return this.isValidCosmosLikeAddressWithMemoId(address, constants.testnetAccountAddressRegex);
      }
      return this.isValidCosmosLikeAddressWithMemoId(address, constants.mainnetAccountAddressRegex);
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

  convertMessageAddressToBuffer(messages: MessageData[]): MessageData[] {
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
    messages = this.convertMessageAddressToBuffer(messages);
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
