import { BuildTransactionError } from '../baseCoin/errors';

export class AddressValidationError extends BuildTransactionError {
  constructor(malformedAddress: string) {
    super(`The address '${malformedAddress}' is not a well-formed eos address`);
    this.name = AddressValidationError.name;
  }
}

export class NameValidationError extends BuildTransactionError {
  constructor() {
    super(
      `'Name should be less than 13 characters, or less than 14 if last character is between 1-5 or a-j, and only contain the following symbols .12345abcdefghijklmnopqrstuvwxyz',`,
    );
    this.name = NameValidationError.name;
  }
}

export class PermissionAuthValidationError extends BuildTransactionError {
  constructor(message: string) {
    super(message);
    this.name = PermissionAuthValidationError.name;
  }
}
