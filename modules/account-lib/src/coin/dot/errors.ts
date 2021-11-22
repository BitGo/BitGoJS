import { BuildTransactionError } from '../baseCoin/errors';

export class AddressValidationError extends BuildTransactionError {
  constructor(malformedAddress: string) {
    super(`The address '${malformedAddress}' is not a well-formed dot address`);
    this.name = AddressValidationError.name;
  }
}

export class InvalidFeeError extends BuildTransactionError {
  constructor(type?: string) {
    super(`The specified type: "${type}" is not valid. Please provide the type: "tip"`);
    this.name = InvalidFeeError.name;
  }
}
