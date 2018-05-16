class Bech32UnsupportedError extends Error {}
class SegwitRequiredError extends Error {}

module.exports = {
  Bech32UnsupportedError,
  SegwitRequiredError
};
