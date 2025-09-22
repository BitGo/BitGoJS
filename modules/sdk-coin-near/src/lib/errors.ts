import { BuildTransactionError } from '@bitgo-beta/sdk-core';

export class AddressValidationError extends BuildTransactionError {
  constructor(malformedAddress: string) {
    super(`The address '${malformedAddress}' is not a well-formed near address`);
    this.name = AddressValidationError.name;
  }
}
