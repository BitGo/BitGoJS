export class PayGoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ErrorNoPayGoProof extends PayGoError {
  constructor(public outputIndex: number) {
    super(`There is no paygo address proof encoded in the PSBT at output ${outputIndex}.`);
  }
}

export class ErrorMultiplePayGoProof extends PayGoError {
  constructor() {
    super('There are multiple paygo address proofs encoded in the PSBT. Something went wrong.');
  }
}

export class ErrorPayGoAddressProofFailedVerification extends PayGoError {
  constructor() {
    super('Cannot verify the paygo address signature with the provided pubkey.');
  }
}

export class ErrorOutputIndexOutOfBounds extends PayGoError {
  constructor(public outputIndex: number) {
    super(`Output index ${outputIndex} is out of bounds for PSBT outputs.`);
  }
}

export class ErrorMultiplePayGoProofAtPsbtIndex extends PayGoError {
  constructor(public outputIndex: number) {
    super(`There are multiple PayGo addresses in the PSBT output ${outputIndex}.`);
  }
}
