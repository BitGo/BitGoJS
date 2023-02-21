// Descriptive error types for common issues which may arise
// during the operation of BitGoJS or BitGoExpress
import { BitGoJsError } from '../bitgojsError';

// re-export for backwards compat
export { BitGoJsError };

export class TlsConfigurationError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'TLS is configuration is invalid');
  }
}

export class NodeEnvironmentError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'NODE_ENV is invalid for the current bitgo environment');
  }
}

export class UnsupportedCoinError extends BitGoJsError {
  public constructor(coin: string) {
    super(
      `Coin or token type ${coin} not supported or not compiled. Please be sure that you are using the latest version of BitGoJS. If using @bitgo/sdk-api, please confirm you have registered ${coin} first.`
    );
  }
}

export class AddressTypeChainMismatchError extends BitGoJsError {
  constructor(addressType: string, chain: number | string) {
    super(`address type ${addressType} does not correspond to chain ${chain}`);
  }
}

export class P2shP2wshUnsupportedError extends BitGoJsError {
  constructor(message?: string) {
    super(message || 'p2shP2wsh not supported by this coin');
  }
}

export class P2wshUnsupportedError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'p2wsh not supported by this coin');
  }
}

export class P2trUnsupportedError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'p2tr not supported by this coin');
  }
}

export class P2trMusig2UnsupportedError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'p2trMusig2 not supported by this coin');
  }
}

export class UnsupportedAddressTypeError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'invalid address type');
  }
}

export class InvalidAddressError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'invalid address');
  }
}

export class InvalidAddressVerificationObjectPropertyError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'address validation failure');
  }
}

export class UnexpectedAddressError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'address validation failure');
  }
}

export class InvalidAddressDerivationPropertyError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'address chain and/or index are invalid');
  }
}

export class WalletRecoveryUnsupported extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'wallet recovery is not supported by this coin');
  }
}

export class MethodNotImplementedError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'method not implemented');
  }
}

export class BlockExplorerUnavailable extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'third-party blockexplorer not responding');
  }
}

export class InvalidMemoIdError extends InvalidAddressError {
  public constructor(message?: string) {
    super(message || 'invalid memo id');
  }
}

export class InvalidPaymentIdError extends InvalidAddressError {
  public constructor(message?: string) {
    super(message || 'invalid payment id');
  }
}

export class KeyRecoveryServiceError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'key recovery service encountered an error');
  }
}

export class AddressGenerationError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'address generation failed');
  }
}

export class EthereumLibraryUnavailableError extends BitGoJsError {
  public constructor(packageName: string) {
    super(`Ethereum library required for operation is not available. Please install "${packageName}".`);
  }
}

export class StellarFederationUserNotFoundError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'account not found');
  }
}

export class ErrorNoInputToRecover extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'No input to recover - aborting!');
  }
}

export class InvalidKeyPathError extends BitGoJsError {
  public constructor(keyPath: string) {
    super(`invalid keypath: ${keyPath}`);
  }
}

export class InvalidTransactionError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'Invalid transaction');
  }
}

export class ApiResponseError<ResponseBodyType = any> extends BitGoJsError {
  message: string;
  status: number;
  result?: ResponseBodyType;
  invalidToken?: boolean;
  needsOTP?: boolean;

  public constructor(
    message: string,
    status: number,
    result?: ResponseBodyType,
    invalidToken?: boolean,
    needsOTP?: boolean
  ) {
    super(message);
    this.message = message;
    this.status = status;
    this.result = result;
    this.invalidToken = invalidToken;
    this.needsOTP = needsOTP;
  }
}
