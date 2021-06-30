import { BuildTransactionError } from '../baseCoin/errors';

export class AddressValidationError extends BuildTransactionError {
  constructor(malformedAddress: string) {
    super(`The address '${malformedAddress}' is not a well-formed eos address`);
    this.name = AddressValidationError.name;
  }
}
