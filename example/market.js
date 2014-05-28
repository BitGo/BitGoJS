//
// Fetch the current bitcoin market price using the BitGo API
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var BitGoJS = require('../src/index.js');

var bitgo = new BitGoJS.BitGo();
bitgo.market(function(err, market) {
  if (err) {
    throw err;
  }
  var changeSinceYesterday = (market.last - market.yesterday.last).toFixed(2);
  var direction = changeSinceYesterday > 0 ? "up" : "down";
  changeSinceYesterday = Math.abs(changeSinceYesterday);
  console.log(
    "Market Price: $" + market.last +
    " (" + direction + " $" + changeSinceYesterday + " from yesterday)");
});
