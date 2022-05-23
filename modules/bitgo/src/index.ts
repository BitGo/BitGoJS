/**
 * @prettier
 */
//
// index.js - Module definition for BitGoJS
//
// Copyright 2022, BitGo, Inc.  All Rights Reserved.
//
import * as _ from 'lodash';
import { common, CustomSigningFunction, SignedTransaction } from '@bitgo/sdk-core';
export * from '@bitgo/sdk-api';
import * as utxolib from '@bitgo/utxo-lib';

export * from './bitgo';

export * as Errors from './errors';

// Expose legacy "bitcoin" API (mostly HDNode)
/** @deprecated */
export * as bitcoin from './legacyBitcoin';
/** @deprecated */
export const sjcl = require('@bitgo/sjcl');

export { Buffer } from 'buffer';

// TODO - remove this once sdk-core is published. Express relies on this coming from bitgo
export { CustomSigningFunction, SignedTransaction };

export const Environments = _.cloneDeep(common.Environments);
export { GlobalCoinFactory, CoinConstructor } from './v2/coinFactory';
export { EnvironmentName, V1Network } from '@bitgo/sdk-core';
export * from './v2';
export * as tss from './tss';

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
