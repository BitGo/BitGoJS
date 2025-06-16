export class ErrorNoPayGoProof extends Error {
  constructor(public outputIndex: number) {
    super(`There is no paygo address proof encoded in the PSBT at output ${outputIndex}.`);
  }
}

export class ErrorMultiplePayGoProof extends Error {
  constructor() {
    super('There are multiple paygo address proofs encoded in the PSBT. Something went wrong.');
  }
}

export class ErrorPayGoAddressProofFailedVerification extends Error {
  constructor() {
    super('Cannot verify the paygo address signature with the provided pubkey.');
  }
}

export class ErrorOutputIndexOutOfBounds extends Error {
  constructor(public outputIndex: number) {
    super(`Output index ${outputIndex} is out of bounds for PSBT outputs.`);
  }
}

export class ErrorMultiplePayGoProofAtPsbtIndex extends Error {
  constructor(public outputIndex: number) {
    super(`There are multiple PayGo addresses in the PSBT output ${outputIndex}.`);
  }
}
