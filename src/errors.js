// Descriptive error types for common issues which may arise
// during the operation of BitGoJS or BitGoExpress

class BitGoJsError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class TlsConfigurationError extends BitGoJsError {
  constructor(message) {
    super(message || 'TLS is configuration is invalid');
  }
}

class NodeEnvironmentError extends BitGoJsError {
  constructor(message) {
    super(message || 'NODE_ENV is invalid for the current bitgo environment');
  }
}

module.exports = {
  BitGoJsError,
  TlsConfigurationError,
  NodeEnvironmentError
};
