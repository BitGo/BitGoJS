//
// index.js - Module definition for BitGoJS
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//
const common = require('./common');
const bitgo = module.exports;
bitgo.BitGo = require('./bitgo.js');

// Expose bitcoin and sjcl
bitgo.bitcoin = require('./bitcoin');
bitgo.sjcl = require('./sjcl.min');
bitgo.bs58 = require('bs58');
bitgo.Buffer = Buffer;

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
