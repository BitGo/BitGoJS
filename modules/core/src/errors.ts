// Descriptive error types for common issues which may arise
// during the operation of BitGoJS or BitGoExpress

// Each subclass needs the explicit Object.setPrototypeOf() so that instanceof will work correctly.
// See https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work

export class BitGoJsError extends Error {
  public constructor(message?: string) {
    super(message);
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this);
    }
    Object.setPrototypeOf(this, BitGoJsError.prototype);
  }
}

export class TlsConfigurationError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'TLS is configuration is invalid');
    Object.setPrototypeOf(this, TlsConfigurationError.prototype);
  }
}

export class NodeEnvironmentError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'NODE_ENV is invalid for the current bitgo environment');
    Object.setPrototypeOf(this, NodeEnvironmentError.prototype);
  }
}

export class UnsupportedCoinError extends BitGoJsError {
  public constructor(coin: string) {
    super(`Coin or token type ${coin} not supported or not compiled. Please be sure that you are using the latest version of BitGoJS.`);
    Object.setPrototypeOf(this, UnsupportedCoinError.prototype);
  }
}

export class AddressTypeChainMismatchError extends BitGoJsError {
  constructor(addressType: string, chain: number | string) {
    super(`address type ${addressType} does not correspond to chain ${chain}`);
    Object.setPrototypeOf(this, AddressTypeChainMismatchError.prototype);
  }
}

export class P2shP2wshUnsupportedError extends BitGoJsError {
  constructor(message?: string) {
    super(message || 'p2shP2wsh not supported by this coin');
    Object.setPrototypeOf(this, P2shP2wshUnsupportedError.prototype);
  }
}

export class P2wshUnsupportedError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'p2wsh not supported by this coin');
    Object.setPrototypeOf(this, P2wshUnsupportedError.prototype);
  }
}

export class UnsupportedAddressTypeError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'invalid address type');
    Object.setPrototypeOf(this, UnsupportedAddressTypeError.prototype);
  }
}

export class InvalidAddressError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'invalid address');
    Object.setPrototypeOf(this, InvalidAddressError.prototype);
  }
}

export class InvalidAddressVerificationObjectPropertyError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'address validation failure');
    Object.setPrototypeOf(this, InvalidAddressVerificationObjectPropertyError.prototype);
  }
}

export class UnexpectedAddressError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'address validation failure');
    Object.setPrototypeOf(this, UnexpectedAddressError.prototype);
  }
}

export class InvalidAddressDerivationPropertyError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'address chain and/or index are invalid');
    Object.setPrototypeOf(this, InvalidAddressDerivationPropertyError.prototype);
  }
}

export class WalletRecoveryUnsupported extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'wallet recovery is not supported by this coin');
    Object.setPrototypeOf(this, WalletRecoveryUnsupported.prototype);
  }
}

export class MethodNotImplementedError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'method not implemented');
    Object.setPrototypeOf(this, MethodNotImplementedError.prototype);
  }
}

export class BlockExplorerUnavailable extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'third-party blockexplorer not responding');
    Object.setPrototypeOf(this, BlockExplorerUnavailable.prototype);
  }
}

export class InvalidMemoIdError extends InvalidAddressError {
  public constructor(message?: string) {
    super(message || 'invalid memo id');
    Object.setPrototypeOf(this, InvalidMemoIdError.prototype);
  }
}

export class KeyRecoveryServiceError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'key recovery service encountered an error');
    Object.setPrototypeOf(this, KeyRecoveryServiceError.prototype);
  }
}

export class AddressGenerationError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'address generation failed');
    Object.setPrototypeOf(this, AddressGenerationError.prototype);
  }
}

export class EthereumLibraryUnavailableError extends BitGoJsError {
  public constructor(packageName: string) {
    super(`Ethereum library required for operation is not available. Please install "${(packageName)}".`);
    Object.setPrototypeOf(this, EthereumLibraryUnavailableError.prototype);
  }
}

export class StellarFederationUserNotFoundError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'account not found');
    Object.setPrototypeOf(this, StellarFederationUserNotFoundError.prototype);
  }
}

export class ErrorNoInputToRecover extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'No input to recover - aborting!');
    Object.setPrototypeOf(this, ErrorNoInputToRecover.prototype);
  }
}

export class InvalidKeyPathError extends BitGoJsError {
  public constructor(keyPath: string) {
    super(`invalid keypath: ${keyPath}`);
    Object.setPrototypeOf(this, InvalidKeyPathError.prototype);
  }
}

export class InvalidTransactionError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'Invalid transaction');
    Object.setPrototypeOf(this, InvalidTransactionError.prototype);
  }
}
