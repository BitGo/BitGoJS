// Descriptive error types for common issues which may arise
// during the operation of BitGoJS or BitGoExpress

// Each subclass needs the explicit Object.setPrototypeOf() so that instanceof will work correctly.
// See https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work

class BitGoJsError extends Error {
  public constructor(message) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, BitGoJsError.prototype);
  }
}

class TlsConfigurationError extends BitGoJsError {
  public constructor(message?) {
    super(message || 'TLS is configuration is invalid');
    Object.setPrototypeOf(this, TlsConfigurationError.prototype);
  }
}

class NodeEnvironmentError extends BitGoJsError {
  public constructor(message?) {
    super(message || 'NODE_ENV is invalid for the current bitgo environment');
    Object.setPrototypeOf(this, NodeEnvironmentError.prototype);
  }
}

class UnsupportedCoinError extends BitGoJsError {
  public constructor(coin) {
    super(`Coin or token type ${coin} not supported or not compiled`);
    Object.setPrototypeOf(this, UnsupportedCoinError.prototype);
  }
}

class P2wshUnsupportedError extends BitGoJsError {
  public constructor(message?) {
    super(message || 'p2wsh not supported by this coin');
    Object.setPrototypeOf(this, P2wshUnsupportedError.prototype);
  }
}

class UnsupportedAddressTypeError extends BitGoJsError {
  public constructor(message?) {
    super(message || 'invalid address type');
    Object.setPrototypeOf(this, UnsupportedAddressTypeError.prototype);
  }
}

class InvalidAddressError extends BitGoJsError {
  public constructor(message?) {
    super(message || 'invalid address');
    Object.setPrototypeOf(this, InvalidAddressError.prototype);
  }
}

class InvalidAddressVerificationObjectPropertyError extends BitGoJsError {
  public constructor(message?) {
    super(message || 'address validation failure');
    Object.setPrototypeOf(this, InvalidAddressVerificationObjectPropertyError.prototype);
  }
}

class UnexpectedAddressError extends BitGoJsError {
  public constructor(message?) {
    super(message || 'address validation failure');
    Object.setPrototypeOf(this, UnexpectedAddressError.prototype);
  }
}

class InvalidAddressDerivationPropertyError extends BitGoJsError {
  public constructor(message?) {
    super(message || 'address chain and/or index are invalid');
    Object.setPrototypeOf(this, InvalidAddressDerivationPropertyError.prototype);
  }
}

class WalletRecoveryUnsupported extends Error {
  public constructor(message?) {
    super(message || 'wallet recovery is not supported by this coin');
    Object.setPrototypeOf(this, WalletRecoveryUnsupported.prototype);
  }
}


class MethodNotImplementedError extends BitGoJsError {
  public constructor(message?) {
    super(message || 'method not implemented');
    Object.setPrototypeOf(this, MethodNotImplementedError.prototype);
  }
}

export = {
  BitGoJsError,
  TlsConfigurationError,
  NodeEnvironmentError,
  WalletRecoveryUnsupported,
  P2wshUnsupportedError,
  UnsupportedAddressTypeError,
  InvalidAddressError,
  InvalidAddressVerificationObjectPropertyError,
  UnexpectedAddressError,
  InvalidAddressDerivationPropertyError,
  UnsupportedCoinError,
  MethodNotImplementedError
};

