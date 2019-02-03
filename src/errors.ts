// Descriptive error types for common issues which may arise
// during the operation of BitGoJS or BitGoExpress

class BitGoJsError extends Error {
  public constructor(message) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

class TlsConfigurationError extends BitGoJsError {
  public constructor(message) {
    super(message || 'TLS is configuration is invalid');
  }
}

class NodeEnvironmentError extends BitGoJsError {
  public constructor(message) {
    super(message || 'NODE_ENV is invalid for the current bitgo environment');
  }
}

class UnsupportedCoinError extends BitGoJsError {
  public constructor(coin) {
    super(`Coin or token type ${coin} not supported or not compiled`);
  }
}

class P2wshUnsupportedError extends BitGoJsError {
  public constructor(message) {
    super(message || 'p2wsh not supported by this coin');
  }
}

class UnsupportedAddressTypeError extends BitGoJsError {
  public constructor(message) {
    super(message || 'invalid address type');
  }
}

class InvalidAddressError extends BitGoJsError {
  public constructor(message) {
    super(message || 'invalid address');
  }
}

class InvalidAddressVerificationObjectPropertyError extends BitGoJsError {
  public constructor(message) {
    super(message || 'address validation failure');
  }
}

class UnexpectedAddressError extends BitGoJsError {
  public constructor(message) {
    super(message || 'address validation failure');
  }
}

class InvalidAddressDerivationPropertyError extends BitGoJsError {
  public constructor(message) {
    super(message || 'address chain and/or index are invalid');
  }
}

class WalletRecoveryUnsupported extends Error {
  public constructor(message) {
    super(message || 'wallet recovery is not supported by this coin');
  }
}


class MethodNotImplementedError extends BitGoJsError {
  public constructor(message) {
    super(message || 'method not implemented');
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

