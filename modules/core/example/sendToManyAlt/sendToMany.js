//
//  An alternative to the sendToMany API call
//
//  Copyright 2015, BitGo, Inc.  All Rights Reserved.
//

const BitGoJS = require('../../src/index.js');

const config = require('./config.js');
let addresses = require('./addresses.js');
addresses = addresses.addresses;

const accessToken = config.accessToken;
const bitgo = new BitGoJS.BitGo({ env: 'test', accessToken: accessToken });

//
//    Loading Config Settings
//

const sendingAddress = config.sendingAddress;
const password = config.password;
const amountSatoshis = config.amountSatoshis;
const setInterval = config.setInterval;
let count = 0;

function setDestinationAddress() {
  console.log('\n-------- Queuing Transaction --------\n');
  const destinationAddress = addresses[count];
  if (destinationAddress === undefined) {
    return process.exit(-1);
  }
  console.log('DestinationAddress is: ' + destinationAddress);
  console.log('Proccessing Address: ' + count);
  count++;
  sendCoins(destinationAddress);
}

const sendCoins = function(destinationAddress) {
  bitgo.wallets().get({ id: sendingAddress }, function(err, wallet) {
    if (err) { console.log('Error getting wallet!'); console.dir(err); return process.exit(-1); }
    console.log('Balance is: ' + (wallet.balance() / 1e8).toFixed(4));
    wallet.sendCoins({ address: destinationAddress, amount: amountSatoshis, walletPassphrase: password }, function(err, result) {
      if (err) { console.log('Error sending coins!'); console.dir(err); return process.exit(-1); }
      console.log(result);
    });
  });
};

function init() {
  setTimeout(init, setInterval);
  setTimeout(setDestinationAddress, setInterval);
}

init();
