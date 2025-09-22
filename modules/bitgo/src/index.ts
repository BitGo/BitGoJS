/**
 * @prettier
 */
//
// index.js - Module definition for BitGoJS
//
// Copyright 2022, BitGo, Inc.  All Rights Reserved.
//
import * as _ from 'lodash';
import { common } from '@bitgo-beta/sdk-core';
export * from '@bitgo-beta/sdk-api';
import * as utxolib from '@bitgo-beta/utxo-lib';
import { GlobalCoinFactory } from './v2/coinFactory';

export * from './bitgo';

// Expose legacy "bitcoin" API (mostly HDNode)
/** @deprecated */
export { bitcoin } from '@bitgo-beta/sdk-core';

/** @deprecated */
export const sjcl = require('@bitgo-beta/sjcl');

export { Buffer } from 'buffer';

export const Environments = _.cloneDeep(common.Environments);
export * from '@bitgo-beta/sdk-core';
export { GlobalCoinFactory };
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
  return utxolib.networks[common.getNetwork()];
}

setNetwork('testnet');
