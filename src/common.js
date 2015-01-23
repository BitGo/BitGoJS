var Address = require('./bitcoin/address');
var ECKey = require('./bitcoin/eckey');

exports.Environments = {
  prod: { uri: 'https://www.bitgo.com', network: 'prod' },
  staging: { uri: 'https://staging.bitgo.com', network: 'prod' },
  test: { uri: 'https://test.bitgo.com', network: 'testnet' },
  local: { uri: 'http://localhost:3000', network: 'testnet' }
};

var bitcoinNetwork;
exports.setNetwork = function(network) {
  if (network == 'prod') {
    bitcoinNetwork = 'prod';
    Address.pubKeyHashVersion = 0x00;
    Address.p2shVersion    = 0x5;
    ECKey.privateKeyPrefix = 0x80;
  } else {
    // test network
    bitcoinNetwork = 'testnet';
    Address.pubKeyHashVersion = 0x6f;
    Address.p2shVersion    = 0xc4;
    ECKey.privateKeyPrefix = 0xef;
  }
};

exports.getNetwork = function() {
  return bitcoinNetwork;
};

/**
 * Helper function to validate the input parameters to an SDK method.
 * Only validates for strings - if parameter is different, check that manually
 *
 * @param params {Object} dictionary of parameter key-value pairs
 * @param expectedParams {string[]} list of expected string parameters
 * @param optionalParams {string[]} list of optional string parameters
 * @param optionalCallback {Function} if callback provided, must be a function
 * @returns {boolean} true if validated, throws with reason otherwise
 */
exports.validateParams = function(params, expectedParams, optionalParams, optionalCallback) {
  if (typeof(params) != 'object') {
    throw new Error('Must pass in parameters dictionary');
  }

  expectedParams = expectedParams || [];

  expectedParams.forEach(function(expectedParam) {
    if (!params[expectedParam]) {
      throw new Error('Missing parameter: ' + expectedParam);
    }
    if (typeof(params[expectedParam]) != 'string') {
      throw new Error('Expecting parameter string: ' + expectedParam + ' but found ' + typeof(params[expectedParam]));
    }
  });

  optionalParams = optionalParams || [];
  optionalParams.forEach(function(expectedParam) {
    if (params[expectedParam] && typeof(params[expectedParam]) != 'string') {
      throw new Error('Expecting parameter string: ' + expectedParam + ' but found ' + typeof(params[expectedParam]));
    }
  });

  if (optionalCallback && typeof(optionalCallback) != 'function') {
    throw new Error('illegal callback argument');
  }

  return true;
};