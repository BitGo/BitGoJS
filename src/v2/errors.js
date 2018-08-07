class P2wshUnsupportedError extends Error {
  constructor(message) {
    super(message || 'p2wsh not supported by this coin');
  }
}

class UnsupportedAddressTypeError extends Error {
  constructor(message) {
    super(message || 'invalid address type');
  }
}

class InvalidAddressError extends Error {
  constructor(message) {
    super(message || 'invalid address');
  }
}

class InvalidAddressVerificationObjectPropertyError extends Error {
  constructor(message) {
    super(message || 'address validation failure');
  }
}

class UnexpectedAddressError extends Error {
  constructor(message) {
    super(message || 'address validation failure');
  }
}

module.exports = {
  P2wshUnsupportedError,
  UnsupportedAddressTypeError,
  InvalidAddressError,
  InvalidAddressVerificationObjectPropertyError,
  UnexpectedAddressError
};
