import { BuildTransactionError, InvalidKey } from '../baseCoin/errors';

export class InsufficientFeeError extends BuildTransactionError {
  constructor(providedFee: number, minimum: number) {
    super(
      `The provided fee of '${providedFee}' microalgos cannot be less than the ` +
        `minimum fee of '${minimum}' microalgos`,
    );
    this.name = InsufficientFeeError.name;
  }
}

export class AddressValidationError extends BuildTransactionError {
  constructor(malformedAddress: string) {
    super(`The address '${malformedAddress}' is not a well-formed algorand address`);
    this.name = AddressValidationError.name;
  }
}

export class KeyDilutionError extends BuildTransactionError {
  constructor(incorrectValue: number) {
    super(`The keyDilution value '${incorrectValue}' must be less than or equal to the square root of the voteKey validity range.`);
    this.name = KeyDilutionError.name;
  }
}

export class PublicKeyValidationError extends InvalidKey {
  constructor(incorrectKey: string) {
    super(`Invalid public key: '${incorrectKey}'`);
    this.name = PublicKeyValidationError.name;
  }
}

export class PrivateKeyValidationError extends InvalidKey {
  constructor(incorrectKey: string) {
    super(`Invalid private key: '${incorrectKey}'`);
    this.name = PrivateKeyValidationError.name;
  }
}

export class OddPrivateKeyValidationError extends InvalidKey {
  constructor() {
    super(`Invalid private key length. Must be a hex and multiple of 2`);
    this.name = OddPrivateKeyValidationError.name;
  }
}
