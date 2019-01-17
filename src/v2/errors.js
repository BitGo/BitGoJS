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

class InvalidAddressDerivationPropertyError extends Error {
  constructor(message) {
    super(message || 'address chain and/or index are invalid');
  }
}

class WalletRecoveryUnsupported extends Error {
  constructor(message) {
    super(message || 'wallet wecovery is not supported by this coin');
  }
}

module.exports = {
  P2wshUnsupportedError,
  UnsupportedAddressTypeError,
  InvalidAddressError,
  InvalidAddressVerificationObjectPropertyError,
  UnexpectedAddressError,
  InvalidAddressDerivationPropertyError,
  WalletRecoveryUnsupported
};
