//
//  An alternative to the sendToMany API call
// 
//  Copyright 2015, BitGo, Inc.  All Rights Reserved.
//

var BitGoJS = require('../../src/index.js');

var config = require('./config.js');
var addresses = require('./addresses.js');
addresses = addresses.addresses;

var accessToken = config.accessToken;
var bitgo = new BitGoJS.BitGo({env: 'test', accessToken: accessToken});

//
//    Loading Config Settings 
//

var sendingAddress = config.sendingAddress;
var password = config.password;
var amountSatoshis = config.amountSatoshis;
var setInterval = config.setInterval;
var count = 0;

function setDestinationAddress () {
  console.log('\n-------- Queuing Transaction --------\n');
  var destinationAddress = addresses[count];
    if (destinationAddress === undefined) {
      return process.exit(-1);
    }
    console.log('DestinationAddress is: ' + destinationAddress);
    console.log('Proccessing Address: ' + count);
    count++;
    sendCoins(destinationAddress);
}

var sendCoins = function(destinationAddress) {
  bitgo.wallets().get({id: sendingAddress}, function(err, wallet) {
    if (err) { console.log("Error getting wallet!"); console.dir(err); return process.exit(-1); }
      console.log("Balance is: " + (wallet.balance() / 1e8).toFixed(4));
        wallet.sendCoins({ address: destinationAddress, amount: amountSatoshis, walletPassphrase: password }, function(err, result) {
          if (err) { console.log("Error sending coins!"); console.dir(err); return process.exit(-1); }
            console.log(result);
          });
       });
};

function init() {
  setTimeout(init, setInterval);
  setTimeout(setDestinationAddress, setInterval);
}

init();