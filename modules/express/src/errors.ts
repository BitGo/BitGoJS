// Descriptive error types for common issues which may arise
// during the operation of BitGoJS or BitGoExpress

// Each subclass needs the explicit Object.setPrototypeOf() so that instanceof will work correctly.
// See https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work

import { Errors } from 'bitgo';

export class TlsConfigurationError extends Errors.BitGoJsError {
  public constructor(message?) {
    super(message || 'TLS is configuration is invalid');
    Object.setPrototypeOf(this, TlsConfigurationError.prototype);
  }
}

export class NodeEnvironmentError extends Errors.BitGoJsError {
  public constructor(message?) {
    super(message || 'NODE_ENV is invalid for the current bitgo environment');
    Object.setPrototypeOf(this, NodeEnvironmentError.prototype);
  }
}

export class ApiResponseError extends Errors.BitGoJsError {
  public readonly status: number;
  public readonly result: any;
  public constructor(message: string | undefined, status: number, result?: any) {
    super(message);
    Object.setPrototypeOf(this, ApiResponseError.prototype);
    this.status = status;
    this.result = result;
  }
}

