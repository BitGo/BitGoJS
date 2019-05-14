/**
 * Each subclass needs the explicit Object.setPrototypeOf() so that instanceof will work correctly.
 * See https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
 */
import { ContractAddress } from './account';
import { CoinFeature } from './base';

class BitGoStaticsError extends Error {
  public constructor(message: string) {
    super(message);
    this.stack = new Error().stack;
    Object.setPrototypeOf(this, BitGoStaticsError.prototype);
  }
}

export class CoinNotDefinedError extends BitGoStaticsError {
  public constructor(coinName: string) {
    super(`coin '${coinName}' is not defined`);
    Object.setPrototypeOf(this, CoinNotDefinedError.prototype);
  }
}

export class DuplicateCoinDefinitionError extends BitGoStaticsError {
  public constructor(coinName: string) {
    super(`coin '${coinName}' is already defined`);
    Object.setPrototypeOf(this, DuplicateCoinDefinitionError.prototype);
  }
}

export class ModificationError extends BitGoStaticsError {
  public constructor(objectName: string) {
    super(`${objectName} cannot be modified`);
    Object.setPrototypeOf(this, ModificationError.prototype);
  }
}

export class ConflictingCoinFeatureError extends BitGoStaticsError {
  public constructor(feature: CoinFeature, conflictingFeature: CoinFeature) {
    super(
      `coin feature '${feature}' conflicts with another coin feature '${conflictingFeature}'. These features are mutually exclusive.`
    );
    Object.setPrototypeOf(this, ConflictingCoinFeatureError.prototype);
  }
}

export class InvalidContractAddress extends BitGoStaticsError {
  public constructor(coinName: string, contractAddress: string) {
    super(`invalid contract address '${contractAddress}' for coin '${coinName}'`);
    Object.setPrototypeOf(this, InvalidContractAddress.prototype);
  }
}
