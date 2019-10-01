/**
 * @prettier
 */
//
// index.js - Module definition for BitGoJS
//
// Copyright 2019, BitGo, Inc.  All Rights Reserved.
//
import * as common from './common';

export * from './bitgo';

// Expose bitcoin and sjcl
import * as utxoLib from 'bitgo-utxo-lib';
import { hdPath, makeRandomKey } from './bitcoin';

// can't add types for these since they are part of bitgo-utxo-lib's default export
// see https://github.com/Microsoft/TypeScript/issues/14080
(utxoLib as any).hdPath = hdPath;
(utxoLib as any).makeRandomKey = makeRandomKey;

export const bitcoin = utxoLib;
export const sjcl = require('./vendor/sjcl.min.js');
export const bs58 = require('bs58');

export { Buffer } from 'buffer';

import * as _ from 'lodash';
import * as errors from './errors';
export const Environments = _.cloneDeep(common.Environments);
export const Errors = errors;
export { GlobalCoinFactory, CoinConstructor } from './v2/coinFactory';
export { V1Network, V1RmgNetwork } from './v2/types';
export { EnvironmentName } from './v2/environments';
export * from './v2';

/**
 * Set the network, i.e. either "bitcoin" for production with real bitcoin, or
 * "testnet" for development with testnet bitcoin.
 *
 * @deprecated
 */
export function setNetwork(network) {
  common.setNetwork(network);
}

/**
 * Get the network. Returns either "bitcoin" or "testnet".
 *
 * @deprecated
 */
export function getNetwork() {
  return common.getNetwork();
}

/**
 * @deprecated
 */
export function getNetworkObj() {
  return bitcoin.networks[common.getNetwork()];
}

setNetwork('testnet');
