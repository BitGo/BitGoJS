import { InvalidTransactionError } from '@bitgo/sdk-core';
import { Coin } from '@cosmjs/stargate';
import BigNumber from 'bignumber.js';

import { CosmosUtils } from '@bitgo/abstract-cosmos';
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
  isValidAddress(address: string): boolean {
    // address = bech32.encode('sthor', address); // thorchain transactions have encoded addresses
    // console.log(address);
    if (this.networkType === NetworkType.TESTNET) {
      return this.isValidCosmosLikeAddressWithMemoId(address, constants.testnetAccountAddressRegex);
    }
    return this.isValidCosmosLikeAddressWithMemoId(address, constants.mainnetAccountAddressRegex);
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
}

const runeUtils = new RuneUtils();

export default runeUtils;
