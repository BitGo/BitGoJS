import { InvalidTransactionError } from '@bitgo/sdk-core';
import { Coin } from '@cosmjs/stargate';
import BigNumber from 'bignumber.js';

import { CosmosUtils } from '@bitgo/abstract-cosmos';
import * as constants from './constants';

export class ZetaUtils extends CosmosUtils {
  /** @inheritdoc */
  isValidAddress(address: string): boolean {
    return constants.accountAddressRegex.test(address);
  }

  /** @inheritdoc */
  isValidValidatorAddress(address: string): boolean {
    return constants.validatorAddressRegex.test(address);
  }

  /** @inheritdoc */
  isValidContractAddress(address: string): boolean {
    return constants.contractAddressRegex.test(address);
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

const zetaUtils: CosmosUtils = new ZetaUtils();

export default zetaUtils;
