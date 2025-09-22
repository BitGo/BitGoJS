import { CosmosUtils } from '@bitgo-beta/abstract-cosmos';
import { CosmosNetwork } from '@bitgo-beta/statics';
import { Coin } from '@cosmjs/stargate';
import { InvalidTransactionError } from '@bitgo-beta/sdk-core';
import BigNumber from 'bignumber.js';

/**
 * Cosmos utilities implementation using the shared Cosmos SDK
 */
export class Utils extends CosmosUtils {
  private readonly _network: CosmosNetwork;

  constructor(network: CosmosNetwork) {
    super();
    this._network = network;
  }

  /** @inheritdoc */
  isValidAddress(address: string): boolean {
    return this.isValidCosmosLikeAddressWithMemoId(
      address,
      new RegExp(`^${this._network.addressPrefix}1['qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38}$`)
    );
  }

  /** @inheritdoc */
  isValidValidatorAddress(address: string): boolean {
    return this.isValidBech32AddressMatchingRegex(
      address,
      new RegExp(`^${this._network.validatorPrefix}1['qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38}$`)
    );
  }

  /** @inheritdoc */
  isValidContractAddress(address: string): boolean {
    return this.isValidBech32AddressMatchingRegex(
      address,
      new RegExp(`^${this._network.addressPrefix}1['qpzry9x8gf2tvdw0s3jn54khce6mua7l]+$`)
    );
  }

  /** @inheritdoc */
  validateAmount(amount: Coin): void {
    if (!amount?.denom) {
      throw new InvalidTransactionError('Invalid amount: missing denom');
    }
    if (!this._network.validDenoms.includes(amount.denom)) {
      throw new InvalidTransactionError(`Invalid amount: denom '${amount.denom}' is not a valid denomination`);
    }
    if (!amount?.amount) {
      throw new InvalidTransactionError('Invalid amount: missing amount');
    }

    const amountBN = new BigNumber(amount.amount);
    if (!amountBN.isFinite() || !amountBN.isInteger() || amountBN.isLessThanOrEqualTo(0)) {
      throw new InvalidTransactionError(`Invalid amount: '${amount.amount}' is not a valid positive integer`);
    }
  }
}
