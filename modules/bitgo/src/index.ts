//
// index.js - Module definition for BitGoJS
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//
import common = require('./common');
const bitgo: any = {};
bitgo.BitGo = require('./bitgo');

// Expose bitcoin and sjcl
bitgo.bitcoin = require('./bitcoin');
bitgo.sjcl = require('./vendor/sjcl.min.js');
bitgo.bs58 = require('bs58');
bitgo.Buffer = Buffer;

// Expose environments
const _ = require('lodash');
bitgo.Environments = _.cloneDeep(common.Environments);

/**
 * Set the network, i.e. either "bitcoin" for production with real bitcoin, or
 * "testnet" for development with testnet bitcoin.
 */
bitgo.setNetwork = function(network) {
  common.setNetwork(network);
};

/*
 * Get the network. Returns either "bitcoin" or "testnet".
 */
bitgo.getNetwork = function() {
  return common.getNetwork();
};

bitgo.getNetworkObj = function() {
  return bitgo.bitcoin.getNetwork();
};

bitgo.setNetwork('testnet');

export = bitgo;
