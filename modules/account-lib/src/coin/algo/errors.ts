import { BuildTransactionError } from '../baseCoin/errors';

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
