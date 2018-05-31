class Bech32UnsupportedError extends Error {
  constructor(message) {
    super(message || 'bech32 not supported by this coin');
  }
}

class SegwitRequiredError extends Error {
  constructor(message) {
    super(message || 'bech32 requires that segwit be enabled');
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
  Bech32UnsupportedError,
  SegwitRequiredError,
  InvalidAddressError,
  InvalidAddressVerificationObjectPropertyError,
  UnexpectedAddressError
};
