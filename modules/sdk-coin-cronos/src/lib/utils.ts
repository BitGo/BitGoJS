import { CosmosUtils } from '@bitgo/abstract-cosmos';
import { InvalidTransactionError } from '@bitgo/sdk-core';
import { Coin } from '@cosmjs/stargate';
import BigNumber from 'bignumber.js';
import * as constants from './constants';
import { NetworkType } from '@bitgo/statics';

export class Utils extends CosmosUtils {
  private networkType: NetworkType;
  constructor(networkType: NetworkType = NetworkType.MAINNET) {
    super();
    this.networkType = networkType;
  }

  /** @inheritdoc */
  isValidAddress(address: string): boolean {
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
  isValidContractAddress(address: string): boolean {
    if (this.networkType === NetworkType.TESTNET) {
      return this.isValidBech32AddressMatchingRegex(address, constants.testnetContractAddressRegex);
    }
    return this.isValidBech32AddressMatchingRegex(address, constants.mainnetContractAddressRegex);
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
