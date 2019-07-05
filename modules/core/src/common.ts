/**
 * @prettier
 */
import * as _ from 'lodash';
import { NodeCallback, V1Network, V1RmgNetwork } from './v2/types';

// re-export from here for backwards compatibility reasons
export { Environments } from './v2/environments';

let bitcoinNetwork: V1Network;
let rmgNetwork: V1RmgNetwork;

/**
 * Set the global Bitcoin network. Used for v1 only.
 *
 * @deprecated
 */
export function setNetwork(network: V1Network): void {
  if (network === 'bitcoin') {
    bitcoinNetwork = 'bitcoin';
  } else {
    // test network
    bitcoinNetwork = 'testnet';
  }
}

/**
 * Get the global Bitcoin network. Used for v1 only.
 *
 * @deprecated
 */
export function getNetwork(): string {
  return bitcoinNetwork;
}

/**
 * Get the global RMG network. Used for v1 only.
 *
 * @deprecated
 */
export function getRmgNetwork(): V1RmgNetwork {
  return rmgNetwork;
}

/**
 * Set the global RMG network. Used for v1 only.
 *
 * @deprecated
 */
export function setRmgNetwork(network: V1RmgNetwork): void {
  rmgNetwork = network;
}

/**
 * Helper function to validate the input parameters to an SDK method.
 * Only validates for strings - if parameter is different, check that manually
 *
 * @deprecated
 * @param params dictionary of parameter key-value pairs
 * @param expectedParams list of expected string parameters
 * @param optionalParams list of optional string parameters
 * @param optionalCallback if callback provided, must be a function
 * @returns true if validated, throws with reason otherwise
 */
export function validateParams(
  params: object,
  expectedParams: string[],
  optionalParams: string[] = [],
  optionalCallback: NodeCallback<any> = undefined
): boolean {
  if (!_.isObject(params)) {
    throw new Error('Must pass in parameters dictionary');
  }

  expectedParams = expectedParams || [];

  expectedParams.forEach(function(expectedParam) {
    if (!params[expectedParam]) {
      throw new Error('Missing parameter: ' + expectedParam);
    }
    if (!_.isString(params[expectedParam])) {
      throw new Error('Expecting parameter string: ' + expectedParam + ' but found ' + typeof params[expectedParam]);
    }
  });

  optionalParams.forEach(function(optionalParam) {
    if (params[optionalParam] && !_.isString(params[optionalParam])) {
      throw new Error('Expecting parameter string: ' + optionalParam + ' but found ' + typeof params[optionalParam]);
    }
  });

  if (optionalCallback && !_.isFunction(optionalCallback)) {
    throw new Error('illegal callback argument');
  }

  return true;
}
