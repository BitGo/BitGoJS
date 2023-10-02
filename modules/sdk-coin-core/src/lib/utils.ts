import { InvalidTransactionError } from '@bitgo/sdk-core';
import { Coin } from '@cosmjs/stargate';
import BigNumber from 'bignumber.js';

import { CosmosUtils } from '@bitgo/abstract-cosmos';
import * as constants from './constants';
import { NetworkType } from '@bitgo/statics';

export class CoreUtils extends CosmosUtils {
  private networkType: NetworkType;
  constructor(networkType: NetworkType = NetworkType.MAINNET) {
    super();
    this.networkType = networkType;
  }

  /** @inheritdoc */
  isValidAddress(address: string): boolean {
    if (this.networkType === NetworkType.TESTNET) {
      return constants.testnetAccountAddressRegex.test(address);
    }
    return constants.mainnetAccountAddressRegex.test(address);
  }

  /** @inheritdoc */
  isValidValidatorAddress(address: string): boolean {
    if (this.networkType === NetworkType.TESTNET) {
      return constants.testnetValidatorAddressRegex.test(address);
    }
    return constants.mainnetValidatorAddressRegex.test(address);
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

const coreUtils = new CoreUtils();

export default coreUtils;
