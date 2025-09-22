import { InvalidTransactionError } from '@bitgo-beta/sdk-core';
import { Coin } from '@cosmjs/stargate';
import BigNumber from 'bignumber.js';

import { CosmosUtils } from '@bitgo-beta/abstract-cosmos';
import * as constants from './constants';
import { NetworkType } from '@bitgo-beta/statics';

export class CoreumUtils extends CosmosUtils {
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

const coreumUtils = new CoreumUtils();

export default coreumUtils;
