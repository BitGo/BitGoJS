
/**
 * This base class ensures that our stack trace is captured properly but also that we have classes of errors
 * that can be found in a switch.
 */
export class ExtendableError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = (new Error(message)).stack;
    }
  }
}

export class ParseTransactionError extends ExtendableError {
  constructor(message: string) {
    super(message);
  }
}

export class SigningError extends ExtendableError {
  constructor(message: string) {
    super(message);
  }
}

export class AddressValidationError extends ExtendableError {
  constructor(message: string) {
    super(message);
  }
}

export class BuildTransactionError extends ExtendableError {
  constructor(message: string) {
    super(message);
  }
}

export class UtilsError extends ExtendableError {
  constructor(message: string) {
    super(message);
  }
}

export class ExtendTransactionError extends ExtendableError {
  constructor(message: string) {
    super(message);
  }
}

