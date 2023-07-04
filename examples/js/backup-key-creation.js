/**
 * Create a backup key offline.
 *
 * This tool's intended use is for a customer to create a backup key for their wallet
 * that doesn't have access to the full service offering. BitGo is not responsible
 * for lost backup keys using this process.
 *
 * Copyright 2020, BitGo, Inc.  All Rights Reserved.
 */

const BitGoJS = require('bitgo');

const Promise = require('bluebird');

// set this to 'test' environment for testing, etc.
const bitgo = new BitGoJS.BitGo({ env: 'prod' });

// TODO: set this to the wallet you want to create for
const coin = 'btc';

// Create the wallet
Promise.coroutine(function* () {
  // this function takes one parameter - seed - if you want to create from your own entropy (recommended)
  const backupKey = bitgo.coin(coin).keychains().create();

  console.log('BACK THIS UP: ');
  console.log(`Pub - this is what you add in the browser under the I have a backup key option: ${backupKey.pub}`);

  // extremely sensitive material
  console.log(`Prv - SENSITIVE MATERIAL - this is what you need to save: ${backupKey.prv}`);
})();
