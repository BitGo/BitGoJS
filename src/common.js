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