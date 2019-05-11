// Descriptive error types for common issues which may arise
// during the operation of BitGoJS or BitGoExpress

// Each subclass needs the explicit Object.setPrototypeOf() so that instanceof will work correctly.
// See https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work

export class BitGoExpressError extends Error {
  public constructor(message) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, BitGoExpressError.prototype);
  }
}

export class TlsConfigurationError extends BitGoExpressError {
  public constructor(message?) {
    super(message || 'TLS is configuration is invalid');
    Object.setPrototypeOf(this, TlsConfigurationError.prototype);
  }
}

export class NodeEnvironmentError extends BitGoExpressError {
  public constructor(message?) {
    super(message || 'NODE_ENV is invalid for the current bitgo environment');
    Object.setPrototypeOf(this, NodeEnvironmentError.prototype);
  }
}
