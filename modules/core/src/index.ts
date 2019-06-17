/**
 * @prettier
 */
//
// index.js - Module definition for BitGoJS
//
// Copyright 2019, BitGo, Inc.  All Rights Reserved.
//
import * as common from './common';

export const BitGo = require('./bitgo');

// Expose bitcoin and sjcl
import * as utxoLib from 'bitgo-utxo-lib';
import { hdPath, makeRandomKey } from './bitcoin';

utxoLib.hdPath = hdPath;
utxoLib.makeRandomKey = makeRandomKey;

export const bitcoin = utxoLib;
export const sjcl = require('./vendor/sjcl.min.js');
export const bs58 = require('bs58');

export { Buffer } from 'buffer';

import * as _ from 'lodash';
import * as errors from './errors';
export const Environments = _.cloneDeep(common.Environments);
export const Errors = errors;
export { GlobalCoinFactory, CoinConstructor } from './v2/coinFactory';

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
