/**
 * Each subclass needs the explicit Object.setPrototypeOf() so that instanceof will work correctly.
 * See https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
 */
import { CoinFeature } from './base';

class BitGoStaticsError extends Error {
  public constructor(message: string) {
    super(message);
    this.stack = new Error(message).stack;
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

export class DuplicateCoinIdDefinitionError extends BitGoStaticsError {
  public constructor(id: string) {
    super(`coin with id '${id}' is already defined`);
    Object.setPrototypeOf(this, DuplicateCoinIdDefinitionError.prototype);
  }
}

export class DisallowedCoinFeatureError extends BitGoStaticsError {
  public constructor(coinName: string, feature: CoinFeature) {
    super(`coin feature '${feature}' is disallowed for coin ${coinName}.`);
    Object.setPrototypeOf(this, DisallowedCoinFeatureError.prototype);
  }
}

export class MissingRequiredCoinFeatureError extends BitGoStaticsError {
  public constructor(coinName: string, missingFeatures: CoinFeature[]) {
    super(`Required coin feature(s) '${missingFeatures.join(', ')}' were not found for coin ${coinName}.`);
    Object.setPrototypeOf(this, MissingRequiredCoinFeatureError.prototype);
  }
}

export class InvalidIdError extends BitGoStaticsError {
  public constructor(coinName: string, id: string) {
    super(`invalid uuid '${id}' for coin '${coinName}'`);
    Object.setPrototypeOf(this, InvalidIdError.prototype);
  }
}

export class InvalidContractAddressError extends BitGoStaticsError {
  public constructor(coinName: string, contractAddress: string) {
    super(`invalid contract address '${contractAddress}' for coin '${coinName}'`);
    Object.setPrototypeOf(this, InvalidContractAddressError.prototype);
  }
}

export class InvalidDomainError extends BitGoStaticsError {
  public constructor(coinName: string, domain: string) {
    super(`invalid domain '${domain}' for coin '${coinName}'`);
    Object.setPrototypeOf(this, InvalidDomainError.prototype);
  }
}

export class ConflictingCoinFeaturesError extends BitGoStaticsError {
  public constructor(coinName: string, conflictingFeatures: CoinFeature[]) {
    super(
      `coin feature(s) for coin '${coinName}' cannot be both required and disallowed: ${conflictingFeatures.join(', ')}`
    );
    Object.setPrototypeOf(this, ConflictingCoinFeaturesError.prototype);
  }
}
