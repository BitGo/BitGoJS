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
export const bitcoin = require('./bitcoin');
export const sjcl = require('./vendor/sjcl.min.js');
export const bs58 = require('bs58');
export const Buffer = global.Buffer;

// Expose environments
import * as _ from 'lodash';
export const Environments = _.cloneDeep(common.Environments);
export const Errors = require('./errors');

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
