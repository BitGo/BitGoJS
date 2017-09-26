//
// Fetch the current bitcoin market price using the BitGo API
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

const BitGoJS = require('../src/index.js');

const bitgo = new BitGoJS.BitGo();
let market = null;
let yesterday = null;

// Get latest market data
bitgo.market({}, function(err, res) {
  if (err) {
    throw err;
  }
  market = res;

  // Get yesterday's data
  bitgo.yesterday({}, function(err, res) {
    if (err) {
      throw err;
    }
    yesterday = res;

    // Now print out some market information
    let changeSinceYesterday = (market.latest.currencies.USD.last - yesterday.currencies.USD.last).toFixed(2);
    const direction = changeSinceYesterday > 0 ? 'up' : 'down';
    changeSinceYesterday = Math.abs(changeSinceYesterday);
    console.log(
      'Market Price (USD): $' + market.latest.currencies.USD.last +
    ' (' + direction + ' $' + changeSinceYesterday + ' from yesterday)');
  });
});
